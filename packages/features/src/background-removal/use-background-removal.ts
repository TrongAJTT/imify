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
          if (payload.status === 'initiate') {
            setProgressPayload({
              id: 'bg-remover-task',
              fileName: 'Background Removal',
              status: 'processing',
              percent: 0,
              message: `Initializing ${payload.file}...`
            });
          } else if (payload.status === 'progress') {
            setProgressPayload({
              id: 'bg-remover-task',
              fileName: 'Background Removal',
              status: 'processing',
              percent: payload.progress,
              message: `Downloading model: ${Math.round(payload.progress)}%`
            });
          } else if (payload.status === 'done') {
            setProgressPayload({
              id: 'bg-remover-task',
              fileName: 'Background Removal',
              status: 'processing',
              percent: 100,
              message: `Loaded ${payload.file}`
            });
          } else if (payload.status === 'ready') {
            setProgressPayload({
              id: 'bg-remover-task',
              fileName: 'Background Removal',
              status: 'processing',
              percent: 100,
              message: 'AI Model Ready'
            });
          }
          break;

        case 'segmentation-result':
          setIsProcessing(false);
          setProgressPayload({
            id: 'bg-remover-task',
            fileName: 'Background Removal',
            status: 'success',
            percent: 100,
            message: 'Background removed successfully'
          });
          // Clear success toast after 3s
          setTimeout(() => setProgressPayload(null), 3000);
          onSuccess?.(payload.output);
          break;

        case 'error':
          setIsProcessing(false);
          setProgressPayload({
            id: 'bg-remover-task',
            fileName: 'Background Removal',
            status: 'error',
            percent: 100,
            message: payload.message
          });
          onError?.(payload.message);
          // Auto clear error toast after 10s
          setTimeout(() => setProgressPayload(null), 10000);
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
      id: 'bg-remover-task',
      fileName: 'Background Removal',
      status: 'processing',
      percent: 0,
      message: 'Preparing AI pipeline...'
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
