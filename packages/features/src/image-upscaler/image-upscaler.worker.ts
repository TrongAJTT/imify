import { pipeline, env, RawImage } from '@huggingface/transformers';

// Configure transformers.js environment
env.allowLocalModels = true;
env.useBrowserCache = true;

// Default wasm paths if not configured elsewhere
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

class ImageUpscalingPipeline {
    static task = 'image-to-image';
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

    if (action === 'upscale' || action === 'warm-up') {
        try {
            const { image, options } = payload;
            const modelId = options?.modelId || 'onnx-community/SwinIR-Light';
            const scaleFactor = options?.scaleFactor || 2;
            const processingMode = options?.processingMode || 'safe';
            
            const preferredDtype = options?.dtype;
            const useQuantized = options?.quantized ?? false;

            const upscaler = await ImageUpscalingPipeline.getInstance(modelId, {
                dtype: preferredDtype,
                quantized: useQuantized,
                progress_callback: (progress) => {
                    self.postMessage({
                        action: 'download-progress',
                        payload: progress
                    });
                }
            });

            if (action === 'warm-up') {
                self.postMessage({ action: 'warm-up-complete', payload: { modelId } });
                return;
            }

            console.log('[Worker] Starting upscale image decoding...');
            
            // Decodes the input image via RawImage.read
            // In the worker, the input is passed as an ArrayBuffer from FileReader.
            const rawInputBlob = new Blob([image]);
            const inputImage = await RawImage.read(rawInputBlob);
            
            const W = inputImage.width;
            const H = inputImage.height;
            console.log(`[Worker] Image loaded: ${W}x${H}`);

            // Pre-calculate final upscaled dimensions
            const targetW = W * scaleFactor;
            const targetH = H * scaleFactor;
            const finalData = new Uint8ClampedArray(targetW * targetH * 4);

            // Tiling Configuration
            const tileSize = 256;
            const overlap = 16;
            const stride = tileSize - 2 * overlap;

            const cols = processingMode === 'safe' ? Math.ceil(W / stride) : 1;
            const rows = processingMode === 'safe' ? Math.ceil(H / stride) : 1;
            const totalTiles = rows * cols;
            let processedTiles = 0;

            console.log(`[Worker] Starting processing. Mode: ${processingMode}. Tiles: ${totalTiles}`);

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    let x0 = 0, y0 = 0, x1 = W, y1 = H;
                    
                    if (processingMode === 'safe') {
                        x0 = Math.max(0, col * stride - overlap);
                        y0 = Math.max(0, row * stride - overlap);
                        x1 = Math.min(W, (col + 1) * stride + overlap);
                        y1 = Math.min(H, (row + 1) * stride + overlap);
                    }

                    const tileW = x1 - x0;
                    const tileH = y1 - y0;

                    // Extract input tile pixels
                    const tileInputData = new Uint8ClampedArray(tileW * tileH * 4);
                    const originalData = inputImage.data;

                    for (let y = y0; y < y1; y++) {
                        const tileY = y - y0;
                        const origRowOffset = y * W * 4;
                        const tileRowOffset = tileY * tileW * 4;
                        for (let x = x0; x < x1; x++) {
                            const tileX = x - x0;
                            const origIdx = origRowOffset + x * 4;
                            const tileIdx = tileRowOffset + tileX * 4;
                            
                            tileInputData[tileIdx] = originalData[origIdx];
                            tileInputData[tileIdx + 1] = originalData[origIdx + 1];
                            tileInputData[tileIdx + 2] = originalData[origIdx + 2];
                            tileInputData[tileIdx + 3] = originalData[origIdx + 3] ?? 255;
                        }
                    }

                    // Create RawImage for this tile
                    const tileRawImage = new RawImage(tileInputData, tileW, tileH, 4);

                    // Process tile via transformers.js model
                    console.log(`[Worker] Slicing tile ${processedTiles + 1}/${totalTiles} of size ${tileW}x${tileH}...`);
                    const output = await upscaler(tileRawImage);
                    const upscaledTile = Array.isArray(output) ? output[0] : output;
                    const upscaledTileData = upscaledTile.data;

                    // Copy tile back to final buffer, discarding the overlap bounds
                    let targetX0 = 0, targetY0 = 0, targetX1 = W, targetY1 = H;
                    if (processingMode === 'safe') {
                        targetX0 = col * stride;
                        targetY0 = row * stride;
                        targetX1 = Math.min(W, (col + 1) * stride);
                        targetY1 = Math.min(H, (row + 1) * stride);
                    }

                    const upscaledTargetX0 = targetX0 * scaleFactor;
                    const upscaledTargetY0 = targetY0 * scaleFactor;
                    const upscaledTargetX1 = targetX1 * scaleFactor;
                    const upscaledTargetY1 = targetY1 * scaleFactor;

                    for (let y = upscaledTargetY0; y < upscaledTargetY1; y++) {
                        const tileY = y - y0 * scaleFactor;
                        const finalRowOffset = y * targetW * 4;
                        const tileRowOffset = tileY * (tileW * scaleFactor) * 4;
                        for (let x = upscaledTargetX0; x < upscaledTargetX1; x++) {
                            const tileX = x - x0 * scaleFactor;
                            const finalIdx = finalRowOffset + x * 4;
                            const tileIdx = tileRowOffset + tileX * 4;

                            finalData[finalIdx] = upscaledTileData[tileIdx];
                            finalData[finalIdx + 1] = upscaledTileData[tileIdx + 1];
                            finalData[finalIdx + 2] = upscaledTileData[tileIdx + 2];
                            finalData[finalIdx + 3] = upscaledTileData[tileIdx + 3] ?? 255;
                        }
                    }

                    processedTiles++;
                    self.postMessage({
                        action: 'processing-progress',
                        payload: {
                            percent: Math.round((processedTiles / totalTiles) * 100),
                            message: `Upscaling tiles: ${processedTiles}/${totalTiles} (${Math.round((processedTiles / totalTiles) * 100)}%)`
                        }
                    });
                }
            }

            console.log('[Worker] Upscaling complete.');

            // Send resulting pixels and size back to main thread
            (self as any).postMessage({
                action: 'upscale-result',
                payload: {
                    data: finalData.buffer,
                    width: targetW,
                    height: targetH
                }
            }, [finalData.buffer]);

        } catch (error: any) {
            console.error('[Worker] Error during image upscaling:', error);
            self.postMessage({
                action: 'error',
                payload: {
                    message: error.message || 'Image upscaling failed',
                }
            });
        }
    }
});
