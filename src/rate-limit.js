const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 30;
const DEFAULT_MAX_CLIENTS = 500;

function normalizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function createFixedWindowRateLimiter({
  enabled = true,
  windowMs = DEFAULT_WINDOW_MS,
  maxRequests = DEFAULT_MAX_REQUESTS,
  maxClients = DEFAULT_MAX_CLIENTS,
  now = () => Date.now()
} = {}) {
  const clients = new Map();
  const config = {
    enabled: enabled !== false,
    windowMs: normalizePositiveInteger(windowMs, DEFAULT_WINDOW_MS),
    maxRequests: normalizePositiveInteger(maxRequests, DEFAULT_MAX_REQUESTS),
    maxClients: normalizePositiveInteger(maxClients, DEFAULT_MAX_CLIENTS)
  };

  const metrics = {
    allowed: 0,
    blocked: 0,
    prunedClients: 0
  };

  function pruneExpired(referenceTime = now()) {
    let removed = 0;

    for (const [clientId, entry] of clients.entries()) {
      if (entry.resetAt <= referenceTime) {
        clients.delete(clientId);
        removed += 1;
      }
    }

    metrics.prunedClients += removed;
    return removed;
  }

  function pruneOverflow() {
    let removed = 0;

    while (clients.size > config.maxClients) {
      const oldestClientId = clients.keys().next().value;
      clients.delete(oldestClientId);
      removed += 1;
    }

    metrics.prunedClients += removed;
    return removed;
  }

  function check(clientId = 'local') {
    if (!config.enabled) {
      metrics.allowed += 1;
      return {
        allowed: true,
        enabled: false,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        retryAfterMs: 0,
        resetAt: null
      };
    }

    const safeClientId = String(clientId || 'local').slice(0, 120);
    const currentTime = now();
    let entry = clients.get(safeClientId);

    if (!entry || entry.resetAt <= currentTime) {
      entry = {
        count: 0,
        resetAt: currentTime + config.windowMs
      };
      clients.set(safeClientId, entry);
    }

    entry.count += 1;

    if (clients.size > config.maxClients) {
      pruneExpired(currentTime);
      pruneOverflow();
    }

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const retryAfterMs = Math.max(0, entry.resetAt - currentTime);

    if (entry.count > config.maxRequests) {
      metrics.blocked += 1;
      return {
        allowed: false,
        enabled: true,
        statusCode: 429,
        limit: config.maxRequests,
        remaining: 0,
        retryAfterMs,
        resetAt: new Date(entry.resetAt).toISOString()
      };
    }

    metrics.allowed += 1;
    return {
      allowed: true,
      enabled: true,
      limit: config.maxRequests,
      remaining,
      retryAfterMs,
      resetAt: new Date(entry.resetAt).toISOString()
    };
  }

  function getStatus() {
    const trackedClients = clients.size;

    return {
      enabled: config.enabled,
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      maxClients: config.maxClients,
      trackedClients,
      activeClients: trackedClients,
      allowed: metrics.allowed,
      blocked: metrics.blocked,
      prunedClients: metrics.prunedClients
    };
  }

  function reset() {
    clients.clear();
    metrics.allowed = 0;
    metrics.blocked = 0;
    metrics.prunedClients = 0;
  }

  return {
    check,
    pruneExpired,
    getStatus,
    reset
  };
}

export function getClientIdFromRequest(request, { trustProxy = false } = {}) {
  if (!request) {
    return 'local';
  }

  if (trustProxy) {
    const forwardedFor = request.headers?.['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return forwardedFor.split(',')[0].trim().slice(0, 120);
    }
  }

  return request.socket?.remoteAddress || request.connection?.remoteAddress || 'local';
}
