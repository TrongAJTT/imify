export interface AIModelMetadata {
  id: string;
  name: string;
  description: string;
  size: string; // Human readable size, e.g. "40 MB"
  sizeBytes: number;
  source: string;
  license: string;
  licenseUrl: string;
  termsUrl: string;
  author: string;
  authorUrl: string;
}

export const BACKGROUND_REMOVAL_MODELS: AIModelMetadata[] = [
  {
    id: 'onnx-community/BiRefNet_lite-ONNX',
    name: 'BiRefNet Lite',
    description: 'High-quality Swin-Transformer model. Best for complex details (115MB).',
    size: '115 MB',
    sizeBytes: 115 * 1024 * 1024,
    source: 'Hugging Face / ONNX Community',
    license: 'MIT',
    licenseUrl: 'https://opensource.org/licenses/MIT',
    termsUrl: 'https://huggingface.co/onnx-community/BiRefNet_lite-ONNX',
    author: 'ZhengPeng7',
    authorUrl: 'https://huggingface.co/onnx-community'
  },
  {
    id: 'onnx-community/ormbg-ONNX',
    name: 'ORMBG v1.0',
    description: 'Verified community version of Open RMBG. Balanced speed and quality (44MB).',
    size: '44 MB',
    sizeBytes: 44 * 1024 * 1024,
    source: 'Hugging Face / ONNX Community',
    license: 'MIT',
    licenseUrl: 'https://opensource.org/licenses/MIT',
    termsUrl: 'https://huggingface.co/onnx-community/ormbg-ONNX',
    author: 'ONNX Community',
    authorUrl: 'https://huggingface.co/onnx-community'
  },
  {
    id: 'onnx-community/modnet-webnn',
    name: 'MODNet',
    description: 'Fast and optimized for web browsers. Great for moderate hardware (6.6MB).',
    size: '6.6 MB',
    sizeBytes: 6.6 * 1024 * 1024,
    source: 'Hugging Face / ONNX Community',
    license: 'Apache 2.0',
    licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
    termsUrl: 'https://huggingface.co/onnx-community/modnet-webnn',
    author: 'ONNX Community',
    authorUrl: 'https://huggingface.co/onnx-community'
  },
  {
    id: 'onnx-community/mediapipe_selfie_segmentation',
    name: 'Selfie Segmenter',
    description: 'Google MediaPipe model for ultra-fast portrait segmentation (0.5MB).',
    size: '0.5 MB',
    sizeBytes: 0.5 * 1024 * 1024,
    source: 'Hugging Face / ONNX Community',
    license: 'Apache 2.0',
    licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
    termsUrl: 'https://huggingface.co/onnx-community/mediapipe_selfie_segmentation',
    author: 'Google / ONNX Community',
    authorUrl: 'https://huggingface.co/onnx-community'
  }
];
