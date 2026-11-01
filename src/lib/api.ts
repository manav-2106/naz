/**
 * Client-side API client for Time Capsule, Constellation Stars, and Reasons Jar.
 * Includes graceful offline fallbacks, default keys for dev, and safe parsing.
 */

import type { ConstellationStar } from '../data/constellation'

const KEY_STORAGE = 'naz_auth_key'
const DEFAULT_NAZ_KEY = 'mine'

/** Extract secret key from URL fragment or query on load, store in localStorage, and remove from address bar. */
export function initAuthKey(): string {
  if (typeof window === 'undefined') return ''

  try {
    const url = new URL(window.location.href)
    // Check search params ?k=...
    let key = url.searchParams.get('k')
    if (key) {
      localStorage.setItem(KEY_STORAGE, key)
      url.searchParams.delete('k')
      window.history.replaceState({}, document.title, url.toString())
      return key
    }

    // Check hash fragment #k=...
    if (url.hash.startsWith('#k=')) {
      key = url.hash.slice(3)
      if (key) {
        localStorage.setItem(KEY_STORAGE, key)
        window.history.replaceState({}, document.title, url.pathname + url.search)
        return key
      }
    }

    return localStorage.getItem(KEY_STORAGE) || DEFAULT_NAZ_KEY
  } catch {
    return DEFAULT_NAZ_KEY
  }
}

export function getStoredAuthKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) || DEFAULT_NAZ_KEY
  } catch {
    return DEFAULT_NAZ_KEY
  }
}

async function safeJsonParse<T extends Record<string, unknown>>(
  res: Response,
): Promise<{ ok: boolean; data: T }> {
  try {
    const text = await res.text()
    if (!text || !text.trim()) {
      return { ok: res.ok, data: {} as T }
    }
    const data = JSON.parse(text) as T
    return { ok: res.ok, data }
  } catch (err: unknown) {
    return {
      ok: false,
      data: { error: err instanceof Error ? err.message : 'invalid server response' } as unknown as T,
    }
  }
}

export interface CapsuleStatus {
  author: 'naz' | 'mr. naz'
  sealedAt: string
  unlockAt: string
  locked: boolean
  text?: string
}

export const api = {
  /** Fetch capsule status */
  async getCapsule(): Promise<{ naz: CapsuleStatus | null; mrNaz: CapsuleStatus | null } | null> {
    try {
      const res = await fetch('/api/capsule', {
        headers: { 'Cache-Control': 'no-cache' },
      })
      const { ok, data } = await safeJsonParse<{
        capsules?: Record<string, CapsuleStatus>
        error?: string
      }>(res)
      if (!ok) return null
      return {
        naz: data.capsules?.['naz'] ?? null,
        mrNaz: data.capsules?.['mr. naz'] ?? null,
      }
    } catch {
      return null
    }
  },

  /** Seal a capsule message */
  async sealCapsule(
    author: 'naz' | 'mr. naz',
    text: string,
    customKey?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const key = customKey || getStoredAuthKey()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (author === 'naz' && key) headers['x-naz-key'] = key
      if (author === 'mr. naz' && key) headers['x-owner-key'] = key

      const res = await fetch('/api/capsule', {
        method: 'POST',
        headers,
        body: JSON.stringify({ author, text }),
      })

      const { ok, data } = await safeJsonParse<{ error?: string }>(res)
      if (!ok) {
        return { success: false, error: (data.error as string) || 'could not seal message' }
      }
      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'the post office is closed right now. try again in a bit'
      return { success: false, error: msg }
    }
  },

  /** Fetch live added stars */
  async getStars(): Promise<ConstellationStar[]> {
    try {
      const res = await fetch('/api/stars')
      const { ok, data } = await safeJsonParse<{ stars?: ConstellationStar[] }>(res)
      if (!ok) return []
      return data.stars || []
    } catch {
      return []
    }
  },

  /** Add a live star to the constellation */
  async addStar(
    author: 'naz' | 'mr. naz',
    text: string,
  ): Promise<{ success: boolean; star?: ConstellationStar; error?: string }> {
    try {
      const key = getStoredAuthKey()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (key) {
        headers['x-naz-key'] = key
        headers['x-owner-key'] = key
        headers['authorization'] = `Bearer ${key}`
      }

      const res = await fetch('/api/stars', {
        method: 'POST',
        headers,
        body: JSON.stringify({ author, text }),
      })

      const { ok, data } = await safeJsonParse<{ error?: string; star?: ConstellationStar }>(res)
      if (!ok) {
        return { success: false, error: (data.error as string) || 'could not add star' }
      }
      return { success: true, star: data.star }
    } catch {
      return { success: false, error: 'sky connection paused. try again in a bit.' }
    }
  },

  /** Fetch custom reasons */
  async getReasons(): Promise<{ unlocked: Array<{ id: string; text: string; unlockAt: string }>; lockedCount: number } | null> {
    try {
      const res = await fetch('/api/reasons')
      const { ok, data } = await safeJsonParse<{
        unlocked?: Array<{ id: string; text: string; unlockAt: string }>
        lockedCount?: number
      }>(res)
      if (!ok) return null
      return {
        unlocked: data.unlocked || [],
        lockedCount: data.lockedCount || 0,
      }
    } catch {
      return null
    }
  },

  /** Owner adds a reason */
  async addReason(
    text: string,
    unlockAt: string,
    ownerKey: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/reasons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-key': ownerKey,
        },
        body: JSON.stringify({ text, unlockAt }),
      })
      const { ok, data } = await safeJsonParse<{ error?: string }>(res)
      if (!ok) return { success: false, error: (data.error as string) || 'failed to add reason' }
      return { success: true }
    } catch {
      return { success: false, error: 'network error' }
    }
  },
}
