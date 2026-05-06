import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConversionProgressPayload } from '@imify/core/types';
import { BACKGROUND_REMOVAL_MODELS } from './models';

export interface UseBackgroundRemovalOptions {
  modelId?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export function useBackgroundRemoval(options: UseBackgroundRemovalOptions = {}) {
  const { modelId = 'briaai/RMBG-1.4', onSuccess, onError } = options;
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPayload, setProgressPayload] = useState<ConversionProgressPayload | null>(null);
  
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize worker
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    const handleMessage = (event: MessageEvent) => {
      const { action, payload } = event.data;

      switch (action) {
        case 'download-progress':
          setProgressPayload({
            id: 'bg-remover-model-download',
            fileName: `Downloading AI Model (${payload.file})`,
            targetFormat: 'png', // Placeholder
            status: 'processing',
            percent: payload.progress,
            message: `Loading model... ${Math.round(payload.progress)}%`
          });
          break;

        case 'segmentation-result':
          setIsProcessing(false);
          setProgressPayload(null);
          onSuccess?.(payload.output);
          break;

        case 'error':
          setIsProcessing(false);
          setProgressPayload({
            id: 'bg-remover-error',
            fileName: 'Background Removal',
            targetFormat: 'png',
            status: 'error',
            percent: 100,
            message: payload.message
          });
          onError?.(payload.message);
          // Auto clear error toast after 5s
          setTimeout(() => setProgressPayload(null), 5000);
          break;
      }
    };

    worker.addEventListener('message', handleMessage);

    return () => {
      worker.terminate();
    };
  }, [onSuccess, onError]);

  const removeBackground = useCallback((image: string | ArrayBuffer | Uint8Array) => {
    if (!workerRef.current) return;

    setIsProcessing(true);
    setProgressPayload({
      id: 'bg-remover-processing',
      fileName: 'Background Removal',
      targetFormat: 'png',
      status: 'processing',
      percent: 0,
      message: 'Analyzing subject...'
    });

    workerRef.current.postMessage({
      action: 'remove-background',
      payload: {
        image,
        options: {
          modelId,
        }
      }
    });
  }, [modelId]);

  return {
    removeBackground,
    isProcessing,
    progressPayload,
  };
}
