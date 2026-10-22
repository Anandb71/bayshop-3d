import { defineConfig } from 'vite';
import { resolve } from 'node:path';

function cleanUrls() {
  const rewrite = (req, _res, next) => {
    const url = req.url?.split('?')[0];
    if (url === '/about') req.url = req.url.replace('/about', '/about.html');
    if (url === '/signup') req.url = req.url.replace('/signup', '/signup.html');
    next();
  };

  return {
    name: 'clean-urls',
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

export default defineConfig({
  appType: 'mpa',
  plugins: [cleanUrls()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        signup: resolve(__dirname, 'signup.html'),
      },
    },
  },
});
