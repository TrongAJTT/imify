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
  suitableFor: string; // Current selection detail field
  scaleFactor: number;
}

export const IMAGE_UPSCALER_MODELS: AIModelMetadata[] = [
  {
    id: 'swin2sr_lightweight',
    name: 'Swin2SR Lightweight 2x',
    description: 'Optimized, ultra-fast lightweight version of Swin2SR designed specifically for highly efficient 2x upscaling and denoising directly in the browser.',
    source: 'Hugging Face / Xenova',
    license: 'Apache 2.0',
    licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
    termsUrl: 'https://huggingface.co/Xenova/swin2SR-lightweight-x2-64',
    author: 'Computer Vision Lab Würzburg',
    authorUrl: 'https://github.com/caidas/swin2SR',
    defaultVariantId: 'quantized',
    usecase: 'Fast 2x Restoration',
    suitableFor: 'Quick restorations, lightweight 2x upscaling, low-resolution photos, and performance-constrained devices.',
    scaleFactor: 2,
    variants: [
      {
        id: 'fp32',
        label: 'FP32 (Full Precision)',
        description: 'Original precision weights. High visual preservation with clean boundaries.',
        sizeBytes: 8 * 1024 * 1024,
        dtype: 'fp32'
      },
      {
        id: 'quantized',
        label: 'Quantized (Memory Saving)',
        description: '4-bit integer weights. Low memory usage, highly recommended for instant processing.',
        sizeBytes: 7 * 1024 * 1024,
        quantized: true
      }
    ]
  },
  {
    id: 'swin2sr_realworld',
    name: 'Swin2SR Realworld 4x',
    description: 'Advanced 4x super-resolution model utilizing Swin Transformer v2 layers for high-quality restoration and blind artifact removal.',
    source: 'Hugging Face / ONNX Community',
    license: 'Apache 2.0',
    licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
    termsUrl: 'https://huggingface.co/onnx-community/swin2SR-realworld-sr-x4-64-bsrgan-psnr-ONNX',
    author: 'ONNX Community',
    authorUrl: 'https://huggingface.co/onnx-community',
    defaultVariantId: 'quantized',
    usecase: 'High-Quality 4x Restoration',
    suitableFor: 'Real-world photos, detailed portraits, landscape captures, and heavy compression artifact removal.',
    scaleFactor: 4,
    variants: [
      {
        id: 'fp32',
        label: 'FP32 (Full Precision)',
        description: 'Original precision weights. Best visual restoration quality.',
        sizeBytes: 54 * 1024 * 1024,
        dtype: 'fp32'
      },
      {
        id: 'quantized',
        label: 'Quantized (Memory Saving)',
        description: '4-bit integer weights. Low memory usage, recommended to prevent browser OOM crashes.',
        sizeBytes: 19 * 1024 * 1024,
        quantized: true
      }
    ]
  },
  {
    id: 'apisr_anime',
    name: 'APISR Anime 4x',
    description: 'State-of-the-art super-resolution model designed specifically for 2D illustration, webcomics, and anime artwork.',
    source: 'Hugging Face / Xenova',
    license: 'Apache 2.0',
    licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
    termsUrl: 'https://huggingface.co/Xenova/4x_APISR_GRL_GAN_generator-onnx',
    author: 'APISR Contributors',
    authorUrl: 'https://github.com/Kiteretsu77/APISR',
    defaultVariantId: 'fp32',
    usecase: 'Anime & Illustration 4x',
    suitableFor: '2D illustrations, manga/cartoon graphics, webcomics, and digital artwork with sharp edges.',
    scaleFactor: 4,
    variants: [
      {
        id: 'fp32',
        label: 'FP32 (Full Precision)',
        description: 'Full precision weights. Delivers maximum edge-preservation and color clarity.',
        sizeBytes: 6.5 * 1024 * 1024,
        dtype: 'fp32'
      },
      {
        id: 'quantized',
        label: 'Quantized (Memory Saving)',
        description: 'Quantized weights. Fast processing and lower memory usage.',
        sizeBytes: 4.7 * 1024 * 1024,
        quantized: true
      }
    ]
  },
  {
    id: 'apisr_anime_2x',
    name: 'APISR Anime 2x',
    description: 'Highly-optimized super-resolution model designed specifically for efficient 2x upscaling of 2D illustrations and anime artwork.',
    source: 'Hugging Face / Xenova',
    license: 'Apache 2.0',
    licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
    termsUrl: 'https://huggingface.co/Xenova/2x_APISR_RRDB_GAN_generator-onnx',
    author: 'APISR Contributors',
    authorUrl: 'https://github.com/Kiteretsu77/APISR',
    defaultVariantId: 'fp32',
    usecase: 'Anime & Illustration 2x',
    suitableFor: '2D illustrations, manga/cartoon graphics, webcomics, and digital artwork with sharp edges.',
    scaleFactor: 2,
    variants: [
      {
        id: 'fp32',
        label: 'FP32 (Full Precision)',
        description: 'Full precision weights. Delivers maximum edge-preservation and color clarity.',
        sizeBytes: 18 * 1024 * 1024,
        dtype: 'fp32'
      },
      {
        id: 'quantized',
        label: 'Quantized (Memory Saving)',
        description: 'Quantized weights. Fast processing and lower memory usage.',
        sizeBytes: 4.72 * 1024 * 1024,
        quantized: true
      }
    ]
  }
];

/**
 * Resolves the actual Hugging Face model repository path based on chosen model.
 */
export function resolveHuggingFaceRepoId(modelId: string): string {
  if (modelId === 'apisr_anime') {
    return 'Xenova/4x_APISR_GRL_GAN_generator-onnx';
  }
  if (modelId === 'apisr_anime_2x') {
    return 'Xenova/2x_APISR_RRDB_GAN_generator-onnx';
  }
  if (modelId === 'swin2sr_lightweight') {
    return 'Xenova/swin2SR-lightweight-x2-64';
  }
  // Default/Fallback: swin2sr_realworld
  return 'onnx-community/swin2SR-realworld-sr-x4-64-bsrgan-psnr-ONNX';
}
