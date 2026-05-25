import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConversionProgressPayload } from '@imify/core/types';
import { IMAGE_UPSCALER_MODELS } from './models';

export interface UseImageUpscalerOptions {
  modelId?: string;
  variantId?: string;
  scaleFactor?: number;
  processingMode?: 'fast' | 'safe';
  onSuccess?: (result: ImageData) => void;
  onError?: (error: string) => void;
  unloadAfterSuccess?: boolean;
}

export function useImageUpscaler(options: UseImageUpscalerOptions = {}) {
  const { 
    modelId = 'onnx-community/SwinIR-Light', 
    variantId = 'fp16',
    scaleFactor = 2,
    processingMode = 'safe',
    onSuccess, 
    onError, 
    unloadAfterSuccess = false 
  } = options;
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPayload, setProgressPayload] = useState<ConversionProgressPayload | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;
  const workerRef = useRef<Worker | null>(null);

  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    const { action, payload } = event.data;

    switch (action) {
      case 'download-progress':
        if (payload.status === 'initiate') {
          setProgressPayload({
            id: 'image-upscaler-task',
            fileName: 'Image Upscaling',
            status: 'processing',
            percent: 0,
            message: `Initializing ${payload.file}...`
          });
        } else if (payload.status === 'progress') {
          setProgressPayload({
            id: 'image-upscaler-task',
            fileName: 'Image Upscaling',
            status: 'processing',
            percent: payload.progress,
            message: `Downloading model: ${Math.round(payload.progress)}%`
          });
        } else if (payload.status === 'done') {
          setProgressPayload({
            id: 'image-upscaler-task',
            fileName: 'Image Upscaling',
            status: 'processing',
            percent: 100,
            message: `Loaded ${payload.file}`
          });
        } else if (payload.status === 'ready') {
          setProgressPayload({
            id: 'image-upscaler-task',
            fileName: 'Image Upscaling',
            status: 'processing',
            percent: 100,
            message: 'AI Model Ready'
          });
        }
        break;

      case 'processing-progress':
        setProgressPayload({
          id: 'image-upscaler-task',
          fileName: 'Image Upscaling',
          status: 'processing',
          percent: payload.percent,
          message: payload.message
        });
        break;

      case 'upscale-result': {
        setIsProcessing(false);
        setProgressPayload({
          id: 'image-upscaler-task',
          fileName: 'Image Upscaling',
          status: 'success',
          percent: 100,
          message: 'Image upscaled successfully'
        });
        // Clear success toast after 3s
        setTimeout(() => setProgressPayload(null), 3000);

        const { data, width, height } = payload;
        const resultImageData = new ImageData(
          new Uint8ClampedArray(data),
          width,
          height
        );
        
        optionsRef.current.onSuccess?.(resultImageData);
        
        if (optionsRef.current.unloadAfterSuccess) {
          terminateWorker();
        }
        break;
      }

      case 'error':
        setIsProcessing(false);
        setProgressPayload({
          id: 'image-upscaler-task',
          fileName: 'Image Upscaling',
          status: 'error',
          percent: 100,
          message: payload.message
        });
        optionsRef.current.onError?.(payload.message);
        // Auto clear error toast after 10s
        setTimeout(() => setProgressPayload(null), 10000);
        break;
    }
  }, [terminateWorker]);

  const initWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    
    const worker = new Worker(new URL('./image-upscaler.worker.ts', import.meta.url), { type: 'module' });
    worker.addEventListener('message', handleMessage);
    worker.onerror = (e) => {
      console.error('[Upscaler Worker Error]', e);
      setIsProcessing(false);
      setProgressPayload({
        id: 'image-upscaler-task',
        fileName: 'Image Upscaling',
        status: 'error',
        percent: 100,
        message: 'AI Worker failed. Please refresh.'
      });
    };
    workerRef.current = worker;
    return worker;
  }, [handleMessage]);

  useEffect(() => {
    return () => terminateWorker();
  }, [terminateWorker]);

  const upscaleImage = useCallback((image: string | ArrayBuffer | Uint8Array) => {
    const worker = initWorker();

    setIsProcessing(true);
    setProgressPayload({
      id: 'image-upscaler-task',
      fileName: 'Image Upscaling',
      status: 'processing',
      percent: 0,
      message: 'Preparing AI pipeline...'
    });

    const modelMeta = IMAGE_UPSCALER_MODELS.find(m => m.id === modelId);
    const variantMeta = modelMeta?.variants.find(v => v.id === variantId) || modelMeta?.variants[0];

    worker.postMessage({
      action: 'upscale',
      payload: {
        image,
        options: {
          modelId,
          scaleFactor,
          processingMode,
          dtype: variantMeta?.dtype,
          quantized: variantMeta?.quantized
        }
      }
    });
  }, [modelId, variantId, scaleFactor, processingMode, initWorker]);

  return {
    upscaleImage,
    isProcessing,
    progressPayload,
  };
}
