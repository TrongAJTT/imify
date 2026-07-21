import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConversionProgressPayload } from '@imify/core/types';
import { IMAGE_UPSCALER_MODELS, resolveHuggingFaceRepoId } from './models';
import {
  FEATURE_MEDIA_ASSET_PATHS,
  resolveFeatureMediaAssetUrl
} from '../shared/media-assets';

export interface UseImageUpscalerOptions {
  modelId?: string;
  variantId?: string;
  scaleFactor?: number;
  denoiseLevel?: number;
  processingMode?: 'fast' | 'safe';
  onSuccess?: (result: ImageData) => void;
  onError?: (error: string) => void;
  unloadAfterSuccess?: boolean;
}

import { useTranslation } from '@imify/i18n';

export function useImageUpscaler(options: UseImageUpscalerOptions = {}) {
  const { t } = useTranslation("upscaler");
  const { 
    modelId = 'swin2sr_lightweight', 
    variantId = 'quantized',
    scaleFactor = 2,
    denoiseLevel = 0,
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
            fileName: t('progress.taskName'),
            status: 'processing',
            percent: 0,
            message: t('progress.initializing', { file: payload.file })
          });
        } else if (payload.status === 'progress') {
          setProgressPayload({
            id: 'image-upscaler-task',
            fileName: t('progress.taskName'),
            status: 'processing',
            percent: payload.progress,
            message: t('progress.downloading', { progress: Math.round(payload.progress) })
          });
        } else if (payload.status === 'done') {
          setProgressPayload({
            id: 'image-upscaler-task',
            fileName: t('progress.taskName'),
            status: 'processing',
            percent: 100,
            message: t('progress.loaded', { file: payload.file })
          });
        } else if (payload.status === 'ready') {
          setProgressPayload({
            id: 'image-upscaler-task',
            fileName: t('progress.taskName'),
            status: 'processing',
            percent: 100,
            message: t('progress.modelReady')
          });
        }
        break;

      case 'processing-progress':
        setProgressPayload({
          id: 'image-upscaler-task',
          fileName: t('progress.taskName'),
          status: 'processing',
          percent: payload.percent,
          message: payload.message
        });
        break;

      case 'upscale-result': {
        setIsProcessing(false);
        setProgressPayload({
          id: 'image-upscaler-task',
          fileName: t('progress.taskName'),
          status: 'success',
          percent: 100,
          message: t('progress.upscaledSuccess')
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
          fileName: t('progress.taskName'),
          status: 'error',
          percent: 100,
          message: payload.message
        });
        optionsRef.current.onError?.(payload.message);
        // Auto clear error toast after 10s
        setTimeout(() => setProgressPayload(null), 10000);
        break;
    }
  }, [terminateWorker, t]);

  const initWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    
    const worker = new Worker(new URL('./image-upscaler.worker.ts', import.meta.url), { type: 'module' });
    worker.addEventListener('message', handleMessage);
    worker.onerror = (e) => {
      console.error('[Upscaler Worker Error]', e);
      setIsProcessing(false);
      setProgressPayload({
        id: 'image-upscaler-task',
        fileName: t('progress.taskName'),
        status: 'error',
        percent: 100,
        message: t('progress.workerFailed')
      });
    };
    workerRef.current = worker;
    return worker;
  }, [handleMessage, t]);

  useEffect(() => {
    return () => terminateWorker();
  }, [terminateWorker]);

  const upscaleImage = useCallback((image: string | ArrayBuffer | Uint8Array) => {
    const worker = initWorker();

    setIsProcessing(true);
    setProgressPayload({
      id: 'image-upscaler-task',
      fileName: t('progress.taskName'),
      status: 'processing',
      percent: 0,
      message: t('progress.preparingPipeline')
    });

    const modelMeta = IMAGE_UPSCALER_MODELS.find(m => m.id === modelId);
    const variantMeta = modelMeta?.variants.find(v => v.id === variantId) || modelMeta?.variants[0];

    const resolvedRepoId = resolveHuggingFaceRepoId(modelId);
    const wasmPaths = {
      'ort-wasm-simd-threaded.wasm': resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.ai.onnxWasm),
      'ort-wasm-simd-threaded.mjs': resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.ai.onnxMjs),
      'ort-wasm-simd-threaded.asyncify.wasm': resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.ai.onnxWasmAsyncify),
      'ort-wasm-simd-threaded.asyncify.mjs': resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.ai.onnxMjsAsyncify)
    };

    worker.postMessage({
      action: 'upscale',
      payload: {
        image,
        options: {
          modelId: resolvedRepoId,
          scaleFactor,
          denoiseLevel,
          processingMode,
          dtype: variantMeta?.dtype,
          quantized: variantMeta?.quantized,
          wasmPaths
        }
      }
    });
  }, [modelId, variantId, scaleFactor, denoiseLevel, processingMode, initWorker]);

  return {
    upscaleImage,
    isProcessing,
    progressPayload,
  };
}
