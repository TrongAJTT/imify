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
}

export const IMAGE_UPSCALER_MODELS: AIModelMetadata[] = [
  {
    id: 'onnx-community/SwinIR-Light', // Heliosoph/swinir-onnx or similar standard path
    name: 'SwinIR Light',
    description: 'State-of-the-art restoration model for realistic photo upscaling and denoising.',
    source: 'Hugging Face / ONNX Community',
    license: 'Apache 2.0',
    licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
    termsUrl: 'https://huggingface.co/onnx-community/SwinIR-Light',
    author: 'Jingyun Liang',
    authorUrl: 'https://github.com/JingyunLiang/SwinIR',
    defaultVariantId: 'fp16',
    usecase: 'Photo Restoration',
    suitableFor: 'Real-world photos, portraits, and detailed natural textures.',
    variants: [
      {
        id: 'fp16',
        label: 'FP16 (High Quality)',
        description: 'Original high precision. Best balance of quality and speed.',
        sizeBytes: 46 * 1024 * 1024,
        dtype: 'fp16'
      },
      {
        id: 'quantized',
        label: 'Quantized (Memory Saving)',
        description: '4-bit integer weights. Uses less RAM, optimized for low memory devices.',
        sizeBytes: 12 * 1024 * 1024,
        quantized: true
      }
    ]
  },
  {
    id: 'onnx-community/RealESRGAN-anime', // FuryTMP/RealESR_Animex4_fp16 or similar
    name: 'Real-ESRGAN Anime',
    description: 'Optimized Real-ESRGAN model designed specifically for 2D illustration and anime upscaling.',
    source: 'Hugging Face / ONNX Community',
    license: 'BSD-3-Clause',
    licenseUrl: 'https://opensource.org/licenses/BSD-3-Clause',
    termsUrl: 'https://huggingface.co/onnx-community/RealESRGAN-anime',
    author: 'Xintao Wang',
    authorUrl: 'https://github.com/xinntao/Real-ESRGAN',
    defaultVariantId: 'fp16',
    usecase: 'Illustration & Anime',
    suitableFor: '2D illustrations, cartoon graphics, and digital artwork with sharp edges.',
    variants: [
      {
        id: 'fp16',
        label: 'FP16 (Recommended)',
        description: 'Standard precision. Fastest execution and cleanest edge upscaling.',
        sizeBytes: 64 * 1024 * 1024,
        dtype: 'fp16'
      },
      {
        id: 'quantized',
        label: 'Quantized (Low RAM)',
        description: '4-bit weights to minimize browser tab crash on older machines.',
        sizeBytes: 16 * 1024 * 1024,
        quantized: true
      }
    ]
  }
];
