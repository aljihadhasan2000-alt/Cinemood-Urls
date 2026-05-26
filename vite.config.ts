import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import url from 'url';

function parseBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
  });
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'local-api-routing-middleware',
        configureServer(server) {
          server.middlewares.use(async (req: any, res: any, next) => {
            const parsedUrl = url.parse(req.url || '', true);
            const pathname = parsedUrl.pathname || '';

            if (pathname.startsWith('/api/')) {
              // Decorate response with helper methods matching Vercel/Express signature
              res.status = (code: number) => {
                res.statusCode = code;
                return res;
              };
              res.json = (data: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
                return res;
              };

              req.query = parsedUrl.query || {};
              if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
                req.body = await parseBody(req);
              }

              try {
                if (pathname === '/api/create') {
                  const { default: handler } = await server.ssrLoadModule('/api/create.ts');
                  return handler(req, res);
                }
                if (pathname === '/api/trending') {
                  const { default: handler } = await server.ssrLoadModule('/api/trending.ts');
                  return handler(req, res);
                }

                const getMatch = pathname.match(/^\/api\/get\/([^/]+)$/);
                if (getMatch) {
                  req.query.slug = getMatch[1];
                  const { default: handler } = await server.ssrLoadModule('/api/get.ts');
                  return handler(req, res);
                }

                const deleteMatch = pathname.match(/^\/api\/delete\/([^/]+)$/);
                if (deleteMatch) {
                  req.query.slug = deleteMatch[1];
                  const { default: handler } = await server.ssrLoadModule('/api/delete.ts');
                  return handler(req, res);
                }

                const verifyPasswordMatch = pathname.match(/^\/api\/collections\/([^/]+)\/verify-password$/);
                if (verifyPasswordMatch) {
                  req.query.slug = verifyPasswordMatch[1];
                  const { default: handler } = await server.ssrLoadModule('/api/verify-password.ts');
                  return handler(req, res);
                }

                const clickMatch = pathname.match(/^\/api\/collections\/([^/]+)\/links\/([^/]+)\/click$/);
                if (clickMatch) {
                  req.query.slug = clickMatch[1];
                  req.query.linkId = clickMatch[2];
                  const { default: handler } = await server.ssrLoadModule('/api/click.ts');
                  return handler(req, res);
                }

                const collectionsMatch = pathname.match(/^\/api\/collections\/([^/]+)$/);
                if (collectionsMatch) {
                  req.query.slug = collectionsMatch[1];
                  const { default: handler } = await server.ssrLoadModule('/api/get.ts');
                  return handler(req, res);
                }

                return res.status(404).json({ success: false, error: 'Endpoint not found locally.' });

              } catch (err: any) {
                console.error('Local API Dev Server Error:', err);
                return res.status(500).json({ success: false, error: err.message || 'Local API Dev failure.' });
              }
            } else {
              next();
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
