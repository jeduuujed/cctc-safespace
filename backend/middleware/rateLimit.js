const windows = new Map();

function rateLimit({ windowMs = 60000, max = 60, keyPrefix = 'rl' }) {
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const uid = req.user?.uid || 'anon';
    const key = `${keyPrefix}:${ip}:${uid}`;
    const now = Date.now();
    const entry = windows.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    windows.set(key, entry);

    if (entry.count > max) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    next();
  };
}

module.exports = { rateLimit };
