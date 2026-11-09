import { defineConfig, type Plugin, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import type { VercelRequest, VercelResponse } from './api/_redis.ts'

/** Fills in the site URL for share tags and preloads the display font. */
function siteMeta(): Plugin {
  const raw =
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
  const site = raw.replace(/\/$/, '')
  return {
    name: 'site-meta',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const out = html.replace(/__SITE_URL__/g, site)
        if (!ctx.bundle) return out
        const fonts = Object.keys(ctx.bundle).filter((f) => /fraunces-latin-full-normal.*\.woff2$/.test(f))
        const tags = fonts
          .map((f) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="/${f}" />`)
          .join('\n    ')
        return out.replace('</head>', `    ${tags}\n  </head>`)
      },
    },
  }
}

/** Dev server middleware to run /api/ serverless functions locally with live Upstash Redis */
function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next()
        }

        const url = new URL(req.url, 'http://localhost')
        const route = url.pathname.replace(/^\/api\//, '')

        // Load .env dynamically so file edits take effect immediately
        try {
          const { readFileSync } = await import('node:fs')
          if (readFileSync) {
            const raw = readFileSync('.env', 'utf-8')
            for (const line of raw.split('\n')) {
              const trimmed = line.trim()
              if (trimmed && !trimmed.startsWith('#')) {
                const eq = trimmed.indexOf('=')
                if (eq > 0) {
                  const key = trimmed.slice(0, eq).trim()
                  const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
                  process.env[key] = val
                }
              }
            }
          }
        } catch {
          // fallback defaults
        }

        process.env.UPSTASH_REDIS_REST_URL =
          process.env.UPSTASH_REDIS_REST_URL || 'https://enabled-cheetah-218415.upstash.io'
        process.env.UPSTASH_REDIS_REST_TOKEN =
          process.env.UPSTASH_REDIS_REST_TOKEN ||
          'gQAAAAAAA1UvAAIgcDE5NDM3MWQxZjgzYjc0OTExODMxYmU5YTY4ODQ0ZjE0NA'
        process.env.NAZ_KEY = process.env.NAZ_KEY || 'mine'
        process.env.OWNER_KEY = process.env.OWNER_KEY || 'yours'

        const vReq = req as unknown as VercelRequest
        const vRes = res as unknown as VercelResponse

        // Parse query params
        const queryParams: Record<string, string> = {}
        url.searchParams.forEach((val, key) => {
          queryParams[key] = val
        })
        vReq.query = queryParams

        // Buffer body if present
        const hasBody =
          Boolean(req.headers['content-length'] && parseInt(req.headers['content-length'] as string, 10) > 0) ||
          req.headers['transfer-encoding'] === 'chunked'

        if (hasBody) {
          try {
            const rawBody = await new Promise<string>((resolve) => {
              let text = ''
              req.on('data', (chunk) => {
                text += chunk
              })
              req.on('end', () => resolve(text))
              req.on('error', () => resolve(''))
              setTimeout(() => resolve(text), 2000)
            })
            if (rawBody.trim()) {
              vReq.body = JSON.parse(rawBody)
            }
          } catch {
            vReq.body = {}
          }
        }

        try {
          if (route === 'capsule') {
            const { default: handler } = await import('./api/capsule.ts')
            await handler(vReq, vRes)
            return
          }
        } catch (err) {
          console.error('API middleware error:', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: String(err) }))
          return
        }

        next()
      })
    },
  }
}

export default defineConfig(async () => {
  const plugins: PluginOption[] = [react(), siteMeta(), apiDevMiddleware()]
  try {
    await import('sharp')
    const { ViteImageOptimizer } = await import('vite-plugin-image-optimizer')
    plugins.push(
      ViteImageOptimizer({
        test: /\.(jpe?g|png|webp|avif)$/i,
        includePublic: true,
        logStats: false,
        jpeg: { quality: 82 },
        png: { quality: 85 },
        webp: { quality: 82 },
        avif: { quality: 60 },
      }),
    )
  } catch {
    console.warn('image optimizer skipped (sharp not available). photos will ship as they are.')
  }
  return {
    plugins,
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            motion: ['framer-motion'],
          },
        },
      },
    },
  }
})
