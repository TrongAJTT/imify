import { pipeline, env, type Pipeline, type ImageSegmentationPipeline } from '@xenova/transformers';

// Skip local model check since we are in the browser
env.allowLocalModels = false;

// Enable browser cache for models
env.useBrowserCache = true;

class BackgroundRemovalPipeline {
    static task = 'image-segmentation';
    static model = 'briaai/RMBG-1.4';
    static instance: Promise<Pipeline> | null = null;

    static async getInstance(progress_callback?: (progress: any) => void) {
        if (this.instance === null) {
            this.instance = pipeline(this.task as any, this.model, {
                progress_callback,
                // Attempt to use WebGPU if available, fallback to WASM
                device: 'webgpu',
            } as any).catch(async (error: any) => {
                console.error('WebGPU failed, falling back to WASM:', error);
                // Fallback to WASM
                this.instance = pipeline(this.task as any, this.model, {
                    progress_callback,
                    device: 'wasm',
                } as any);
                return this.instance;
            });
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
                // Forward download progress to main thread
                if (progress.status === 'progress') {
                    self.postMessage({
                        action: 'download-progress',
                        payload: {
                            file: progress.file,
                            progress: progress.progress,
                            loaded: progress.loaded,
                            total: progress.total,
                        }
                    });
                }
            })) as unknown as ImageSegmentationPipeline;

            // Perform segmentation
            // Transformers.js image-segmentation pipeline returns an array of masks
            const output = await segmenter(image);

            // Send result back
            self.postMessage({
                action: 'segmentation-result',
                payload: {
                    output,
                }
            });
        } catch (error: any) {
            self.postMessage({
                action: 'error',
                payload: {
                    message: error.message || 'Background removal failed',
                }
            });
        }
    }
});
