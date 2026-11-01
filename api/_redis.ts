import { Redis } from '@upstash/redis'
import crypto from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

export type VercelRequest = IncomingMessage & {
  body?: unknown
  query?: Record<string, string | string[]>
  headers: Record<string, string | string[] | undefined>
}

export type VercelResponse = ServerResponse & {
  status: (code: number) => VercelResponse
  json: (data: unknown) => void
  send: (body: unknown) => void
}

/** Upstash Redis instance (if configured) */
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

// In-memory fallback for local development or unconfigured deployments
const memoryStore = new Map<string, unknown>()

export const store = {
  async get<T>(key: string): Promise<T | null> {
    if (redis) {
      try {
        return await redis.get<T>(key)
      } catch (err) {
        console.warn('Redis read failed, falling back to memory store:', err)
      }
    }
    const val = memoryStore.get(key)
    return val !== undefined ? (JSON.parse(JSON.stringify(val)) as T) : null
  },

  async set(key: string, value: unknown): Promise<void> {
    if (redis) {
      try {
        await redis.set(key, value)
      } catch (err) {
        console.warn('Redis write failed, falling back to memory store:', err)
      }
    }
    memoryStore.set(key, value)
  },

  async exists(key: string): Promise<boolean> {
    if (redis) {
      try {
        const count = await redis.exists(key)
        return count > 0
      } catch {
        // fallback
      }
    }
    return memoryStore.has(key)
  },

  async del(key: string): Promise<void> {
    if (redis) {
      try {
        await redis.del(key)
      } catch (err) {
        console.warn('Redis del failed:', err)
      }
    }
    memoryStore.delete(key)
  },
}

/** Constant-time comparison for auth secret keys */
export function timingSafeCompare(a?: string | string[], b?: string): boolean {
  if (!a || !b) return false
  let strA = Array.isArray(a) ? a[0] : a
  if (!strA) return false
  // Clean potential quotes or Bearer prefix
  strA = strA.trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim()
  const strB = b.trim().replace(/^["']|["']$/g, '').trim()
  if (strA.length !== strB.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(strA), Buffer.from(strB))
  } catch {
    return false
  }
}

/** Check if Naz is authenticated */
export function isNazAuthenticated(req: VercelRequest): boolean {
  const expected = process.env.NAZ_KEY
  if (!expected) return true // If not configured, allow graceful testing
  const provided = req.headers['x-naz-key'] ?? req.headers['authorization']
  return timingSafeCompare(provided, expected)
}

/** Check if Owner (Mr. Naz) is authenticated */
export function isOwnerAuthenticated(req: VercelRequest): boolean {
  const expected = process.env.OWNER_KEY
  if (!expected) return true // If not configured, allow graceful testing
  const provided = req.headers['x-owner-key'] ?? req.headers['authorization']
  return timingSafeCompare(provided, expected)
}

/** Send standardized JSON response with no-store header */
export function sendJson(res: VercelResponse, statusCode: number, data: unknown) {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-naz-key, x-owner-key, authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE')
    res.setHeader('Content-Type', 'application/json')
  } catch {
    // headers already sent
  }

  const jsonPayload = JSON.stringify(data)

  // Vercel serverless has both res.status() and res.json()
  if (
    typeof res.status === 'function' &&
    typeof (res as unknown as Record<string, unknown>).json === 'function'
  ) {
    try {
      res.status(statusCode).json(data)
      return
    } catch {
      // fallback to native http response
    }
  }

  // Node http / Connect / Vite server response
  res.statusCode = statusCode
  res.end(jsonPayload)
}

/** Parse JSON request body safely */
export async function parseBody(req: VercelRequest): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object') {
    return req.body as Record<string, unknown>
  }
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk: Buffer | string) => {
      raw += chunk.toString()
      if (raw.length > 50000) {
        // 50KB limit protection
        raw = ''
      }
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw) as Record<string, unknown>)
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

/** Get client IP for basic rate limiting */
export function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  if (Array.isArray(forwarded) && forwarded[0]) return forwarded[0].trim()
  return req.socket?.remoteAddress || '127.0.0.1'
}

/** Simple in-memory / redis IP rate limit (max N requests per minute) */
const ipHits = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(ip: string, limit = 60): boolean {
  const now = Date.now()
  const record = ipHits.get(ip)
  if (!record || now > record.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + 60000 })
    return true
  }
  if (record.count >= limit) return false
  record.count += 1
  return true
}
