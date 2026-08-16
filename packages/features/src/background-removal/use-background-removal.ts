import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConversionProgressPayload } from '@imify/core/types';
import { toast } from '@imify/stores';
import { BACKGROUND_REMOVAL_MODELS } from './models';
import {
  FEATURE_MEDIA_ASSET_PATHS,
  resolveFeatureMediaAssetUrl
} from '../shared/media-assets';

export interface UseBackgroundRemovalOptions {
  modelId?: string;
  variantId?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  unloadAfterSuccess?: boolean;
}

export function useBackgroundRemoval(options: UseBackgroundRemovalOptions = {}) {
  const { 
    modelId = 'onnx-community/ormbg-ONNX', 
    variantId = 'fp16',
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
          const p: ConversionProgressPayload = {
            id: 'bg-remover-task',
            fileName: 'Background Removal',
            status: 'processing',
            percent: 0,
            message: `Initializing ${payload.file}...`
          };
          setProgressPayload(p);
          toast.progress(p);
        } else if (payload.status === 'progress') {
          const p: ConversionProgressPayload = {
            id: 'bg-remover-task',
            fileName: 'Background Removal',
            status: 'processing',
            percent: payload.progress,
            message: `Downloading model: ${Math.round(payload.progress)}%`
          };
          setProgressPayload(p);
          toast.progress(p);
        } else if (payload.status === 'done') {
          const p: ConversionProgressPayload = {
            id: 'bg-remover-task',
            fileName: 'Background Removal',
            status: 'processing',
            percent: 100,
            message: `Loaded ${payload.file}`
          };
          setProgressPayload(p);
          toast.progress(p);
        } else if (payload.status === 'ready') {
          const p: ConversionProgressPayload = {
            id: 'bg-remover-task',
            fileName: 'Background Removal',
            status: 'processing',
            percent: 100,
            message: 'AI Model Ready'
          };
          setProgressPayload(p);
          toast.progress(p);
        }
        break;

      case 'segmentation-result': {
        setIsProcessing(false);
        const p: ConversionProgressPayload = {
          id: 'bg-remover-task',
          fileName: 'Background Removal',
          status: 'success',
          percent: 100,
          message: 'Background removed successfully'
        };
        setProgressPayload(p);
        toast.progress(p);
        optionsRef.current.onSuccess?.(payload.output);
        
        if (optionsRef.current.unloadAfterSuccess) {
          terminateWorker();
        }
        break;
      }

      case 'error': {
        setIsProcessing(false);
        const p: ConversionProgressPayload = {
          id: 'bg-remover-task',
          fileName: 'Background Removal',
          status: 'error',
          percent: 100,
          message: payload.message
        };
        setProgressPayload(p);
        toast.progress(p);
        optionsRef.current.onError?.(payload.message);
        break;
      }
    }
  }, [terminateWorker]);

  const initWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    
    const worker = new Worker(new URL('./background-removal.worker.ts', import.meta.url), { type: 'module' });
    worker.addEventListener('message', handleMessage);
    worker.onerror = (e) => {
      console.error('[Worker Error]', e);
      setIsProcessing(false);
      setProgressPayload({
        id: 'bg-remover-task',
        fileName: 'Background Removal',
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

  const removeBackground = useCallback((image: string | ArrayBuffer | Uint8Array) => {
    const worker = initWorker();

    setIsProcessing(true);
    setProgressPayload({
      id: 'bg-remover-task',
      fileName: 'Background Removal',
      status: 'processing',
      percent: 0,
      message: 'Preparing AI pipeline...'
    });

    const modelMeta = BACKGROUND_REMOVAL_MODELS.find(m => m.id === modelId);
    const variantMeta = modelMeta?.variants.find(v => v.id === variantId) || modelMeta?.variants[0];
    const wasmPaths = {
      'ort-wasm-simd-threaded.wasm': resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.ai.onnxWasm),
      'ort-wasm-simd-threaded.mjs': resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.ai.onnxMjs),
      'ort-wasm-simd-threaded.asyncify.wasm': resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.ai.onnxWasmAsyncify),
      'ort-wasm-simd-threaded.asyncify.mjs': resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSET_PATHS.ai.onnxMjsAsyncify)
    };

    worker.postMessage({
      action: 'remove-background',
      payload: {
        image,
        options: {
          modelId,
          dtype: variantMeta?.dtype,
          quantized: variantMeta?.quantized,
          wasmPaths
        }
      }
    });
  }, [modelId, variantId, initWorker]);

  return {
    removeBackground,
    isProcessing,
    progressPayload,
  };
}
