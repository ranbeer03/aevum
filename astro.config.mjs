import { defineConfig } from 'astro/config';
import { camWriter } from './dev/cam-writer.mjs';

export default defineConfig({
  site: 'https://aevumfze.com',
  devToolbar: { enabled: false },
  vite: {
    // apply: 'serve', so the stop writer exists under `astro dev` only
    plugins: [camWriter()],
    // These loaders locate their Draco/Basis decoders with
    // `new URL('../libs/...', import.meta.url)`. If Vite pre-bundles them,
    // import.meta.url points into node_modules/.vite/deps and the decoder
    // URLs 404. Excluding them keeps the real paths, so Vite's asset
    // pipeline emits the decoders correctly in dev and in the build.
    optimizeDeps: {
      exclude: [
        'three/examples/jsm/loaders/GLTFLoader.js',
        'three/examples/jsm/loaders/DRACOLoader.js',
        'three/examples/jsm/loaders/KTX2Loader.js',
        'three/examples/jsm/libs/meshopt_decoder.module.js',
      ],
    },
  },
  trailingSlash: 'never',
  build: { format: 'file' },
});
