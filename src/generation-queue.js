export function createGenerationQueue({ maxQueueSize = 4, generationConcurrency = 1 } = {}) {
  const safeMaxQueueSize = Math.max(0, Number.parseInt(maxQueueSize, 10) || 0);
  const safeGenerationConcurrency = Math.max(1, Number.parseInt(generationConcurrency, 10) || 1);
  const queue = [];
  const metrics = {
    activeGenerations: 0,
    completedGenerations: 0,
    failedGenerations: 0,
    rejectedGenerations: 0
  };

  function getStatus() {
    return {
      activeGenerations: metrics.activeGenerations,
      queuedGenerations: queue.length,
      maxQueueSize: safeMaxQueueSize,
      generationConcurrency: safeGenerationConcurrency,
      completedGenerations: metrics.completedGenerations,
      failedGenerations: metrics.failedGenerations,
      rejectedGenerations: metrics.rejectedGenerations
    };
  }

  function drain() {
    while (metrics.activeGenerations < safeGenerationConcurrency && queue.length > 0) {
      const item = queue.shift();
      metrics.activeGenerations += 1;

      Promise.resolve()
        .then(item.job)
        .then(result => {
          metrics.completedGenerations += 1;
          item.resolve(result);
        })
        .catch(error => {
          metrics.failedGenerations += 1;
          item.reject(error);
        })
        .finally(() => {
          metrics.activeGenerations -= 1;
          drain();
        });
    }
  }

  function run(job) {
    return new Promise((resolvePromise, reject) => {
      if (typeof job !== 'function') {
        reject(Object.assign(new Error('Job de geração inválido.'), { statusCode: 400 }));
        return;
      }

      if (queue.length >= safeMaxQueueSize) {
        metrics.rejectedGenerations += 1;
        reject(Object.assign(new Error('Fila de geração cheia. Tente novamente em alguns instantes.'), { statusCode: 429 }));
        return;
      }

      queue.push({ job, resolve: resolvePromise, reject });
      drain();
    });
  }

  return { run, getStatus };
}
