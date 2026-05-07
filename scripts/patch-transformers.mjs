import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const filesToPatch = [
  'node_modules/@huggingface/transformers/dist/transformers.js',
  'node_modules/@huggingface/transformers/dist/transformers.min.js',
  'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs',
  'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.mjs',
  'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs',
  'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jspi.mjs'
];

filesToPatch.forEach(relPath => {
  const filePath = join(process.cwd(), relPath);
  try {
    if (!readFileSync(filePath)) return; // Check if exists
    let content = readFileSync(filePath, 'utf8');
    console.log(`[Patch] Patching ${relPath}...`);

    // Patch 1: Neutralize await import in ONNX glue code
    content = content.replace(
      /if\(isNode\)isPthread=\(await import\("worker_threads"\)\)\.workerData==="em-pthread";/g,
      'if(false){}'
    );
    
    // Patch 2: Obfuscate engine filenames to prevent Parcel resolution errors
    const engineFiles = [
      'ort-wasm-simd-threaded.wasm',
      'ort-wasm-simd-threaded.mjs',
      'ort-wasm-simd-threaded.asyncify.wasm',
      'ort-wasm-simd-threaded.asyncify.mjs'
    ];

    engineFiles.forEach(file => {
      const parts = file.split('.');
      const patched = `['${parts.slice(0, -1).join('.')}','${parts.slice(-1)}'].join('.')`;
      content = content.replaceAll(`"${file}"`, patched);
      content = content.replaceAll(`'${file}'`, patched);
    });

    writeFileSync(filePath, content);
    console.log(`[Patch] Successfully patched ${relPath}!`);
  } catch (err) {
    console.error(`[Patch] Failed to patch ${relPath}: ${err.message}`);
  }
});
