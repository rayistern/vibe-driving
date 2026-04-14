import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  define: {
    // VITE_PERF_PROBE: build-time flag so perfProbe.ts is tree-shaken in prod
    // Set env var VITE_PERF_PROBE=true to enable performance probing
    'import.meta.env.VITE_PERF_PROBE': JSON.stringify(process.env['VITE_PERF_PROBE'] ?? 'false'),
  },
});
