import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const wpAdminCssOutDir = process.env.WP_ADMIN_CSS_OUT_DIR?.trim() || '../../abcnorio-func/build';

export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: path.resolve(rootDir, wpAdminCssOutDir),
    rollupOptions: {
      input: path.resolve(rootDir, 'src/styles/wp-admin.scss'),
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'deploy-dashboard.css';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
});
