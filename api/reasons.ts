import {
  checkRateLimit,
  getClientIp,
  isOwnerAuthenticated,
  parseBody,
  sendJson,
  store,
  type VercelRequest,
  type VercelResponse,
} from './_redis.ts'

interface ReasonRecord {
  id: string
  text: string
  unlockAt: string // ISO date
  createdAt: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true })
  }

  const ip = getClientIp(req)
  if (!checkRateLimit(ip, 60)) {
    return sendJson(res, 429, { error: 'too many requests' })
  }

  // GET: Return unlocked reasons and count/dates for locked reasons
  if (req.method === 'GET') {
    const list = (await store.get<ReasonRecord[]>('custom_reasons')) || []
    const now = new Date()

    const unlocked: Array<{ id: string; text: string; unlockAt: string }> = []
    const lockedDates: string[] = []

    for (const item of list) {
      const unlockDate = new Date(item.unlockAt)
      if (now >= unlockDate) {
        unlocked.push({
          id: item.id,
          text: item.text,
          unlockAt: item.unlockAt,
        })
      } else {
        lockedDates.push(item.unlockAt)
      }
    }

    return sendJson(res, 200, {
      unlocked,
      lockedCount: lockedDates.length,
      upcomingDates: lockedDates,
    })
  }

  // POST: Owner adds a new reason
  if (req.method === 'POST') {
    if (!isOwnerAuthenticated(req)) {
      return sendJson(res, 401, { error: 'unauthorized: owner key required' })
    }

    const body = await parseBody(req)
    const rawText = typeof body.text === 'string' ? body.text : ''
    // Strip control characters without regex
    const cleanText = rawText
      .split('')
      .filter((c) => c.charCodeAt(0) >= 32 || c === '\n' || c === '\r' || c === '\t')
      .join('')
      .trim()
    const unlockAt = typeof body.unlockAt === 'string' ? body.unlockAt : ''

    if (!cleanText || cleanText.length < 3) {
      return sendJson(res, 400, { error: 'reason must be at least 3 characters' })
    }
    if (isNaN(Date.parse(unlockAt))) {
      return sendJson(res, 400, { error: 'valid ISO unlockAt timestamp required' })
    }

    const currentList = (await store.get<ReasonRecord[]>('custom_reasons')) || []
    const newReason: ReasonRecord = {
      id: `custom-reason-${Date.now()}`,
      text: cleanText,
      unlockAt,
      createdAt: new Date().toISOString(),
    }

    currentList.push(newReason)
    await store.set('custom_reasons', currentList)

    return sendJson(res, 200, {
      success: true,
      reason: newReason,
    })
  }

  return sendJson(res, 405, { error: 'method not allowed' })
}
