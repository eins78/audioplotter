/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string
  readonly VITE_APP_TITLE?: string
  // Add more custom Vite env vars as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
