import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://getbible.net',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
