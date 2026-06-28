export function sendJson(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers
  });
  response.end(JSON.stringify(payload, null, 2));
}

export function sendServerEvent(response, event, payload) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function openEventStream(response) {
  response.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-store, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no'
  });
}

export function readJsonBody(request, { maxBodyBytes = 65_536, destroyOnLimit = true } = {}) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let raw = '';
    let settled = false;

    function fail(error) {
      if (settled) return;
      settled = true;
      reject(error);
    }

    request.on('data', chunk => {
      if (settled) return;
      size += chunk.length;

      if (size > maxBodyBytes) {
        fail(Object.assign(new Error('Payload muito grande.'), { statusCode: 413 }));
        if (destroyOnLimit && typeof request.destroy === 'function') request.destroy();
        return;
      }

      raw += chunk;
    });

    request.on('end', () => {
      if (settled) return;
      settled = true;

      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(Object.assign(new Error('JSON inválido.'), { statusCode: 400 }));
      }
    });

    request.on('error', error => {
      if (settled && error?.code === 'ERR_STREAM_PREMATURE_CLOSE') return;
      fail(error);
    });
  });
}
