/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Dominio base para los links de cliente por subdominio (ej. "potenciapp.com").
   * Si está vacío, los links usan la forma por path: /c/<slug>.
   */
  readonly VITE_CLIENT_BASE_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
