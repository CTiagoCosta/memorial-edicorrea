interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Best-effort only: this map lives in one server instance's memory and
// resets on cold start or across instances, so it does not stop a
// distributed attack — it only raises the cost of brute-forcing the shared
// family password from a single source. Pair with a long passphrase.
export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (bucket.count >= maxAttempts) {
    return false
  }

  bucket.count += 1
  return true
}
