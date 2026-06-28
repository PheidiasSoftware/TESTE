import assert from 'node:assert/strict';
import test from 'node:test';

import { createFixedWindowRateLimiter, getClientIdFromRequest } from '../src/rate-limit.js';

test('createFixedWindowRateLimiter permite até o limite e bloqueia excedente', () => {
  let currentTime = 1_700_000_000_000;
  const limiter = createFixedWindowRateLimiter({
    windowMs: 1_000,
    maxRequests: 2,
    now: () => currentTime
  });

  const first = limiter.check('cliente-local');
  const second = limiter.check('cliente-local');
  const third = limiter.check('cliente-local');

  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 1);
  assert.equal(second.allowed, true);
  assert.equal(second.remaining, 0);
  assert.equal(third.allowed, false);
  assert.equal(third.statusCode, 429);
  assert.equal(third.retryAfterMs, 1_000);
  assert.equal(limiter.getStatus().blocked, 1);

  currentTime += 1_001;
  const afterWindow = limiter.check('cliente-local');
  assert.equal(afterWindow.allowed, true);
  assert.equal(afterWindow.remaining, 1);
});

test('createFixedWindowRateLimiter mantém clientes separados', () => {
  const limiter = createFixedWindowRateLimiter({
    windowMs: 60_000,
    maxRequests: 1,
    now: () => 1_700_000_000_000
  });

  assert.equal(limiter.check('cliente-a').allowed, true);
  assert.equal(limiter.check('cliente-a').allowed, false);
  assert.equal(limiter.check('cliente-b').allowed, true);
});

test('createFixedWindowRateLimiter pode ser desativado por configuração', () => {
  const limiter = createFixedWindowRateLimiter({
    enabled: false,
    maxRequests: 1
  });

  assert.equal(limiter.check('cliente').allowed, true);
  assert.equal(limiter.check('cliente').allowed, true);
  assert.equal(limiter.getStatus().enabled, false);
  assert.equal(limiter.getStatus().blocked, 0);
});

test('createFixedWindowRateLimiter poda clientes expirados para limitar memória', () => {
  let currentTime = 1_700_000_000_000;
  const limiter = createFixedWindowRateLimiter({
    windowMs: 100,
    maxRequests: 10,
    maxClients: 2,
    now: () => currentTime
  });

  limiter.check('cliente-a');
  limiter.check('cliente-b');
  assert.equal(limiter.getStatus().activeClients, 2);

  currentTime += 101;
  const removed = limiter.pruneExpired();

  assert.equal(removed, 2);
  assert.equal(limiter.getStatus().activeClients, 0);
  assert.equal(limiter.getStatus().prunedClients, 2);
});

test('getClientIdFromRequest usa socket por padrão e proxy apenas quando habilitado', () => {
  const request = {
    headers: {
      'x-forwarded-for': 'cliente-proxy, gateway-local'
    },
    socket: {
      remoteAddress: 'cliente-socket'
    }
  };

  assert.equal(getClientIdFromRequest(request), 'cliente-socket');
  assert.equal(getClientIdFromRequest(request, { trustProxy: true }), 'cliente-proxy');
  assert.equal(getClientIdFromRequest(null), 'local');
});
