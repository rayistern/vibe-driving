/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PERF_PROBE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
