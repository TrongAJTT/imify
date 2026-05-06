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
    id: 'briaai/RMBG-1.4',
    name: 'RMBG v1.4',
    description: 'A state-of-the-art background removal model optimized for speed and accuracy.',
    size: '176 MB', // Total size of all files usually involved, but RMBG-1.4 quantized is smaller. 
    // Wait, the spec said 40MB. Let's use 40MB for the quantized version.
    sizeBytes: 40 * 1024 * 1024,
    source: 'Hugging Face / BRIA AI',
    license: 'Creative Commons BY-NC-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    termsUrl: 'https://huggingface.co/briaai/RMBG-1.4',
    author: 'BRIA AI',
    authorUrl: 'https://bria.ai/'
  }
];
