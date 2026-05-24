export interface AIModelVariant {
  id: string; // Unique ID for this variant, e.g. 'fp16', 'quantized'
  label: string; // Display label, e.g. "FP16 (High Quality)"
  description?: string;
  sizeBytes: number;
  dtype?: 'fp16' | 'fp32';
  quantized?: boolean;
}

export interface AIModelMetadata {
  id: string;
  name: string;
  description: string;
  source: string;
  license: string;
  licenseUrl: string;
  termsUrl: string;
  author: string;
  authorUrl: string;
  variants: AIModelVariant[];
  defaultVariantId: string;
  usecase: string;
}

export const BACKGROUND_REMOVAL_MODELS: AIModelMetadata[] = [
  {
    id: 'onnx-community/BiRefNet_lite-ONNX',
    name: 'BiRefNet Lite',
    description: 'State-of-the-art Swin-Transformer model for high-quality background removal.',
    source: 'Hugging Face / ONNX Community',
    license: 'MIT',
    licenseUrl: 'https://opensource.org/licenses/MIT',
    termsUrl: 'https://huggingface.co/onnx-community/BiRefNet_lite-ONNX',
    author: 'ZhengPeng7',
    authorUrl: 'https://huggingface.co/onnx-community',
    defaultVariantId: 'fp16',
    usecase: 'General',
    variants: [
      {
        id: 'fp16',
        label: 'FP16 (High Quality)',
        description: 'Original high precision. Best balance of quality and speed.',
        sizeBytes: 115 * 1024 * 1024,
        dtype: 'fp16'
      },
      {
        id: 'full',
        label: 'Full Precision',
        description: 'Standard 32-bit model. Largest size, maximum compatibility.',
        sizeBytes: 224 * 1024 * 1024,
        dtype: 'fp32'
      }
    ]
  },
  {
    id: 'onnx-community/ormbg-ONNX',
    name: 'ORMBG v1.0',
    description: 'Verified community version of Open RMBG. Highly reliable and balanced.',
    source: 'Hugging Face / ONNX Community',
    license: 'MIT',
    licenseUrl: 'https://opensource.org/licenses/MIT',
    termsUrl: 'https://huggingface.co/onnx-community/ormbg-ONNX',
    author: 'ONNX Community',
    authorUrl: 'https://huggingface.co/onnx-community',
    defaultVariantId: 'fp16',
    usecase: 'General',
    variants: [
      {
        id: 'fp16',
        label: 'FP16 (Recommended)',
        description: 'Original precision. Typically the fastest choice on most machines.',
        sizeBytes: 88 * 1024 * 1024,
        dtype: 'fp16'
      },
      {
        id: 'quantized',
        label: 'Quantized (Memory Saving)',
        description: '4-bit integer weights. Uses less RAM, but can be slightly slower.',
        sizeBytes: 44 * 1024 * 1024,
        quantized: true
      }
    ]
  },
  {
    id: 'onnx-community/modnet-webnn',
    name: 'MODNet',
    description: 'Fast and optimized for web browsers. Excellent for portrait segmentation.',
    source: 'Hugging Face / ONNX Community',
    license: 'Apache 2.0',
    licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
    termsUrl: 'https://huggingface.co/onnx-community/modnet-webnn',
    author: 'ONNX Community',
    authorUrl: 'https://huggingface.co/onnx-community',
    defaultVariantId: 'quantized',
    usecase: 'Portrait image',
    variants: [
      {
        id: 'quantized',
        label: 'Quantized (Web Optimized)',
        description: 'Ultra-lightweight version for mobile or extremely limited RAM.',
        sizeBytes: 6.6 * 1024 * 1024,
        quantized: true
      },
      {
        id: 'full',
        label: 'Full (High Quality)',
        description: 'Standard weights for best edge preservation.',
        sizeBytes: 26 * 1024 * 1024,
        dtype: 'fp32'
      }
    ]
  },
  {
    id: 'onnx-community/mediapipe_selfie_segmentation',
    name: 'Selfie Segmenter',
    description: 'Google MediaPipe model for ultra-fast portrait segmentation.',
    source: 'Hugging Face / ONNX Community',
    license: 'Apache 2.0',
    licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
    termsUrl: 'https://huggingface.co/onnx-community/mediapipe_selfie_segmentation',
    author: 'Google / ONNX Community',
    authorUrl: 'https://huggingface.co/onnx-community',
    defaultVariantId: 'standard',
    usecase: 'Portrait image',
    variants: [
      {
        id: 'standard',
        label: 'Standard',
        sizeBytes: 0.5 * 1024 * 1024,
        dtype: 'fp32'
      }
    ]
  }
];
