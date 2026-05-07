import { pipeline, env, type BackgroundRemovalPipeline as BackgroundRemovalPipelineType } from '@huggingface/transformers';
import { FEATURE_MEDIA_ASSET_PATHS, resolveFeatureMediaAssetUrl } from '@imify/features/shared/media-assets';

// Configure transformers.js environment
// We prioritize local assets to ensure 100% offline capability
env.allowLocalModels = true;
env.useBrowserCache = true; // Still useful for models, engines will be fetched from wasmPaths

// Use centralized asset resolution for ONNX engines
const onnxWasmUrl = resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.ai.onnxWasm);
// ONNX Runtime Web expects a directory path for wasmPaths (ending with /)
const wasmDirectory = onnxWasmUrl.substring(0, onnxWasmUrl.lastIndexOf('/') + 1);

// Optimization: Use multi-threading if SharedArrayBuffer is available
const isMultiThreadSupported = typeof SharedArrayBuffer !== 'undefined';
const numThreads = isMultiThreadSupported ? Math.min(navigator.hardwareConcurrency || 4, 8) : 1;

console.log(`[Worker] Multi-thread supported: ${isMultiThreadSupported}, using ${numThreads} threads.`);
console.log(`[Worker] Engine directory: ${wasmDirectory}`);

(env as any).backends.onnx.wasm.wasmPaths = wasmDirectory;
(env as any).backends.onnx.wasm.numThreads = numThreads;
// (env as any).backends.onnx.wasm.proxy = true; 

// BiRefNet_lite requires 17 storage buffers per shader stage.
// We query the GPU adapter limits before loading to pick the best backend
// without needing a warm-up inference run.
async function detectBestDevice(): Promise<{ device: 'webgpu' | 'wasm'; dtype: 'fp16' | 'fp32' }> {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
        return { device: 'wasm', dtype: 'fp32' };
    }
    try {
        const adapter = await (navigator as any).gpu.requestAdapter();
        if (!adapter) return { device: 'wasm', dtype: 'fp32' };

        const maxBuffers: number = adapter.limits.maxStorageBuffersPerShaderStage;
        console.log(`[Worker] WebGPU maxStorageBuffersPerShaderStage: ${maxBuffers}`);

        if (maxBuffers >= 17) {
            return { device: 'webgpu', dtype: 'fp16' }; // model_fp16.onnx — 115 MB
        } else {
            console.warn(`[Worker] WebGPU limit too low (${maxBuffers} < 17 required), using WASM.`);
            return { device: 'wasm', dtype: 'fp32' };   // model.onnx — 224 MB
        }
    } catch {
        return { device: 'wasm', dtype: 'fp32' };
    }
}

class BackgroundRemovalPipeline {
    static task = 'image-segmentation';
    static currentModelId: string | null = null;
    static instance: Promise<any> | null = null;

    static async getInstance(modelId: string, progress_callback?: (progress: any) => void) {
        // If model changed, dispose old instance (in a real app we'd call terminate/dispose, 
        // here we at least clear the reference for GC)
        if (this.currentModelId !== modelId) {
            this.instance = null;
            this.currentModelId = modelId;
        }

        if (this.instance !== null) return this.instance;

        const { device, dtype } = await detectBestDevice();
        console.log(`[Worker] Loading pipeline: ${modelId} on ${device} (${dtype})...`);

        this.instance = pipeline(this.task as any, modelId, {
            progress_callback,
            device: device as any,
            dtype,
        } as any);

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
            
            const segmenter = (await BackgroundRemovalPipeline.getInstance(modelId, (progress) => {
                // Forward all status updates to main thread
                self.postMessage({
                    action: 'download-progress',
                    payload: progress
                });
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
