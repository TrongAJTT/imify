import { pipeline, env, type BackgroundRemovalPipeline as BackgroundRemovalPipelineType } from '@huggingface/transformers';

// Configure transformers.js environment
env.allowLocalModels = true;
env.useBrowserCache = true;

// Default wasm paths if not configured elsewhere
// These can be overridden by the main thread if needed, but we provide a sensible default
(env as any).backends.onnx.wasm.wasmPaths = '/assets/onnx-engines/';

// Optimization: Use multi-threading if SharedArrayBuffer is available
const isMultiThreadSupported = typeof SharedArrayBuffer !== 'undefined';
const numThreads = isMultiThreadSupported ? Math.min(navigator.hardwareConcurrency || 4, 8) : 1;
(env as any).backends.onnx.wasm.numThreads = numThreads;

async function detectBestDevice(): Promise<{ device: 'webgpu' | 'wasm'; dtype: 'fp16' | 'fp32' }> {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
        return { device: 'wasm', dtype: 'fp32' };
    }
    try {
        const adapter = await (navigator as any).gpu.requestAdapter();
        if (!adapter) return { device: 'wasm', dtype: 'fp32' };

        const maxBuffers: number = adapter.limits.maxStorageBuffersPerShaderStage;
        if (maxBuffers >= 17) {
            return { device: 'webgpu', dtype: 'fp16' };
        } else {
            return { device: 'wasm', dtype: 'fp32' };
        }
    } catch {
        return { device: 'wasm', dtype: 'fp32' };
    }
}

class BackgroundRemovalPipeline {
    static task = 'image-segmentation';
    static currentModelId: string | null = null;
    static instance: Promise<any> | null = null;

    static async getInstance(modelId: string, options: { dtype?: 'fp16' | 'fp32'; quantized?: boolean; progress_callback?: (progress: any) => void } = {}) {
        const { quantized = false, progress_callback } = options;
        const { device, dtype: defaultDtype } = await detectBestDevice();
        
        const dtype = options.dtype || defaultDtype;
        const instanceKey = `${modelId}:${device}:${dtype}:${quantized}`;
        
        if (this.currentModelId !== instanceKey) {
            this.instance = null;
            this.currentModelId = instanceKey;
        }

        if (this.instance !== null) return this.instance;

        const pipelineOptions: any = {
            progress_callback,
            device: device as any,
            quantized,
        };

        if (!quantized) {
            pipelineOptions.dtype = dtype;
        }

        this.instance = pipeline(this.task as any, modelId, pipelineOptions);
        return this.instance;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
    const { action, payload } = event.data;

    if (action === 'remove-background' || action === 'warm-up') {
        try {
            const { image, options } = payload;
            const modelId = options?.modelId || 'onnx-community/ormbg-ONNX';
            
            // In this version, we trust the main thread to provide the correct flags
            const preferredDtype = options?.dtype;
            const useQuantized = options?.quantized ?? false;

            const segmenter = (await BackgroundRemovalPipeline.getInstance(modelId, {
                dtype: preferredDtype,
                quantized: useQuantized,
                progress_callback: (progress) => {
                    self.postMessage({
                        action: 'download-progress',
                        payload: progress
                    });
                }
            })) as BackgroundRemovalPipelineType;

            if (action === 'warm-up') {
                self.postMessage({ action: 'warm-up-complete', payload: { modelId } });
                return;
            }

            // @huggingface/transformers v3: RawImage.read() does not accept ArrayBuffer.
            // Wrap in Blob so the pipeline can decode it correctly.
            const imageInput = image instanceof ArrayBuffer ? new Blob([image]) : image;

            // Perform segmentation
            console.log('[Worker] Starting segmentation...');
            const output = await segmenter(imageInput as any);
            console.log('[Worker] Segmentation complete.');

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
