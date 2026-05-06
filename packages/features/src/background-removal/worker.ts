import { pipeline, env, type BackgroundRemovalPipeline as BackgroundRemovalPipelineType } from '@huggingface/transformers';

// Configure transformers.js environment
env.allowLocalModels = false;
env.useBrowserCache = true;

class BackgroundRemovalPipeline {
    static task = 'background-removal';
    static model = 'briaai/RMBG-1.4';
    static instance: Promise<any> | null = null;

    static async getInstance(progress_callback?: (progress: any) => void) {
        if (this.instance === null) {
            console.log('[Worker] Loading Background Removal Pipeline (WebGPU/WASM)...');
            this.instance = pipeline(this.task as any, this.model, {
                progress_callback,
                device: 'webgpu', // Try WebGPU first, will fallback automatically in v3+
            } as any);
        }
        return this.instance;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
    const { action, payload } = event.data;

    if (action === 'remove-background') {
        try {
            const { image, options } = payload;
            
            const segmenter = (await BackgroundRemovalPipeline.getInstance((progress) => {
                // Forward all status updates to main thread
                self.postMessage({
                    action: 'download-progress',
                    payload: progress
                });
            })) as BackgroundRemovalPipelineType;

            // Perform segmentation
            console.log('[Worker] Starting background removal...');
            const output = await segmenter(image);
            console.log('[Worker] Background removal complete.');

            // Send result back
            self.postMessage({
                action: 'segmentation-result',
                payload: {
                    output,
                }
            });
        } catch (error: any) {
            console.error('[Worker] Error during background removal:', error);
            self.postMessage({
                action: 'error',
                payload: {
                    message: error.message || 'Background removal failed',
                }
            });
        }
    }
});
