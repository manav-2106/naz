import {
  checkRateLimit,
  getClientIp,
  isNazAuthenticated,
  isOwnerAuthenticated,
  parseBody,
  sendJson,
  store,
  type VercelRequest,
  type VercelResponse,
} from './_redis.ts'

const SERVER_UNLOCK_AT = '2027-11-13T00:00:00+05:30'

interface CapsuleRecord {
  author: 'naz' | 'mr. naz'
  text: string
  sealedAt: string
  unlockAt: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true })
  }

  const ip = getClientIp(req)
  if (!checkRateLimit(ip, 60)) {
    return sendJson(res, 429, { error: 'too many requests. take a breath.' })
  }

  // GET: Return sealed status or unlocked text
  if (req.method === 'GET') {
    const authors: Array<'naz' | 'mr. naz'> = ['naz', 'mr. naz']
    const result: Record<string, unknown> = {}

    const now = new Date()
    const isTestOverride = process.env.TEST_UNLOCK_OVERRIDE === 'true'

    for (const author of authors) {
      const record = await store.get<CapsuleRecord>(`capsule:${author}`)
      if (!record) {
        result[author] = null
        continue
      }

      const unlockDate = new Date(record.unlockAt || SERVER_UNLOCK_AT)
      const isUnlocked = isTestOverride || now >= unlockDate

      if (isUnlocked) {
        result[author] = {
          author: record.author,
          sealedAt: record.sealedAt,
          unlockAt: record.unlockAt,
          locked: false,
          text: record.text,
        }
      } else {
        // NEVER send text before unlock time!
        result[author] = {
          author: record.author,
          sealedAt: record.sealedAt,
          unlockAt: record.unlockAt,
          locked: true,
        }
      }
    }

    return sendJson(res, 200, { capsules: result })
  }

  // POST: Seal a message
  if (req.method === 'POST') {
    const body = await parseBody(req)
    const author: 'naz' | 'mr. naz' = body.author === 'mr. naz' ? 'mr. naz' : 'naz'

    // Auth check
    if (author === 'naz' && !isNazAuthenticated(req)) {
      return sendJson(res, 401, { error: 'invalid key' })
    }
    if (author === 'mr. naz' && !isOwnerAuthenticated(req)) {
      return sendJson(res, 401, { error: 'unauthorized' })
    }

    // Check if already sealed
    const existing = await store.get<CapsuleRecord>(`capsule:${author}`)
    if (existing) {
      return sendJson(res, 409, { error: 'already sealed. time capsule cannot be rewritten.' })
    }

    // Validation
    const rawText = typeof body.text === 'string' ? body.text : ''
    // Strip control characters without regex
    const cleanText = rawText
      .split('')
      .filter((c) => c.charCodeAt(0) >= 32 || c === '\n' || c === '\r' || c === '\t')
      .join('')
      .trim()

    if (!cleanText || cleanText.length < 1) {
      return sendJson(res, 400, { error: 'message cannot be empty' })
    }
    if (cleanText.length > 1000) {
      return sendJson(res, 400, { error: 'message exceeds 1000 character limit' })
    }

    const newRecord: CapsuleRecord = {
      author,
      text: cleanText,
      sealedAt: new Date().toISOString(),
      unlockAt: SERVER_UNLOCK_AT,
    }

    await store.set(`capsule:${author}`, newRecord)

    return sendJson(res, 200, {
      success: true,
      author,
      sealedAt: newRecord.sealedAt,
      unlockAt: newRecord.unlockAt,
      locked: true,
    })
  }

  // DELETE: Reset capsule (Owner only)
  if (req.method === 'DELETE') {
    if (!isOwnerAuthenticated(req)) {
      return sendJson(res, 401, { error: 'unauthorized' })
    }
    const body = await parseBody(req)
    const authorParam = (body.author as string) || (typeof req.query?.author === 'string' ? req.query.author : 'naz')
    const target = authorParam === 'mr. naz' ? 'mr. naz' : 'naz'
    await store.del(`capsule:${target}`)
    return sendJson(res, 200, { success: true, cleared: target })
  }

  return sendJson(res, 405, { error: 'method not allowed' })
}
