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

interface StarRecord {
  id: string
  author: 'naz' | 'mr. naz'
  text: string
  date: string
  index: number
}

function getTodayIST(): string {
  // Format current date in Asia/Kolkata (IST) YYYY-MM-DD
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return parts
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true })
  }

  const ip = getClientIp(req)
  if (!checkRateLimit(ip, 60)) {
    return sendJson(res, 429, { error: 'slow down a little, star gazer.' })
  }

  // GET: Fetch all added stars
  if (req.method === 'GET') {
    const stars = (await store.get<StarRecord[]>('constellation_stars')) || []
    return sendJson(res, 200, { stars })
  }

  // POST: Add a new star
  if (req.method === 'POST') {
    const body = await parseBody(req)
    const author: 'naz' | 'mr. naz' = body.author === 'mr. naz' ? 'mr. naz' : 'naz'

    // Auth verification: any valid member (Naz or Mr. Naz) can add a memory star to the sky
    const isAuthed = isNazAuthenticated(req) || isOwnerAuthenticated(req)
    if (!isAuthed) {
      return sendJson(res, 401, { error: 'unauthorized' })
    }

    // Rate limit: 1 star per author per day (IST)
    const today = getTodayIST()
    const dailyKey = `star_limit:${author}:${today}`
    const alreadyAddedToday = await store.exists(dailyKey)
    if (alreadyAddedToday) {
      return sendJson(res, 429, {
        error: 'one star a day. the sky needs time to breathe ♡',
      })
    }

    const rawText = typeof body.text === 'string' ? body.text : ''
    // Strip control characters without regex
    const cleanText = rawText
      .split('')
      .filter((c) => c.charCodeAt(0) >= 32)
      .join('')
      .trim()

    if (!cleanText || cleanText.length < 1) {
      return sendJson(res, 400, { error: 'star memory cannot be empty' })
    }
    if (cleanText.length > 90) {
      return sendJson(res, 400, { error: 'star text must be 90 characters or less' })
    }

    const currentStars = (await store.get<StarRecord[]>('constellation_stars')) || []
    const newStar: StarRecord = {
      id: `live-star-${Date.now()}`,
      author,
      text: cleanText,
      date: today,
      index: 6 + currentStars.length, // Starts after the 6 seed stars
    }

    currentStars.push(newStar)
    await store.set('constellation_stars', currentStars)
    await store.set(dailyKey, { addedAt: new Date().toISOString() })

    return sendJson(res, 200, {
      success: true,
      star: newStar,
    })
  }

  // DELETE: Reset or clear stars (Owner only)
  if (req.method === 'DELETE') {
    if (!isOwnerAuthenticated(req)) {
      return sendJson(res, 401, { error: 'unauthorized' })
    }
    await store.del('constellation_stars')
    const today = getTodayIST()
    await store.del(`star_limit:naz:${today}`)
    await store.del(`star_limit:mr. naz:${today}`)
    return sendJson(res, 200, { success: true, cleared: true })
  }

  return sendJson(res, 405, { error: 'method not allowed' })
}
