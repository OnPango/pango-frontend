import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    preview: {
      // Accept the platform domain and all tenant subdomains when served by Vite preview.
      allowedHosts: ['.onpango.com'],
    },
    server: {
      proxy: {
        // The session lives in `SameSite=Lax` cookies. In development the app is served from
        // `<org>.localhost:5173` and the API from `localhost:3000`, which browsers treat as different
        // sites, so they would not store or send the cookies. Going through this proxy makes every
        // call same-origin. The `Host` / `Origin` are kept (the API still sees the organization's
        // subdomain) and the cookies scoped to `/auth` (refresh) and `/auth/login` (the login waiting
        // for its emailed code) are moved under `/api`, where the browser now sends the requests; the
        // rewrite matches whole paths only. Production does not need it: the app and the API share
        // `onpango.com`.
        '/api': {
          target: env.VITE_DEV_API_TARGET || 'http://localhost:3000',
          rewrite: (path) => path.replace(/^\/api/, ''),
          cookiePathRewrite: { '/auth': '/api/auth', '/auth/login': '/api/auth/login' },
        },
      },
    },
  };
});
