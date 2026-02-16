import { createRequire } from 'module';
const require = createRequire('/data/package.json');
const client = require('prom-client');

/**
 * Setup Prometheus metrics for a Fastify service.
 * @param {import('fastify').FastifyInstance} app - Fastify instance
 * @param {string} serviceName - Name label for metrics
 */
export function setupMetrics(app, serviceName) {
  const register = new client.Registry();

  register.setDefaultLabels({ service: serviceName });

  client.collectDefaultMetrics({ register });

  const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
    registers: [register],
  });

  const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
  });

  app.addHook('onRequest', (request, reply, done) => {
    request.metricsStart = process.hrtime.bigint();
    done();
  });

  app.addHook('onResponse', (request, reply, done) => {
    if (request.url === '/metrics') {
      done();
      return;
    }
    const durationNs = Number(process.hrtime.bigint() - request.metricsStart);
    const durationSec = durationNs / 1e9;
    const route = request.routeOptions?.url || request.url;
    const labels = {
      method: request.method,
      route: route,
      status_code: reply.statusCode,
    };
    httpRequestDuration.observe(labels, durationSec);
    httpRequestsTotal.inc(labels);
    done();
  });

  app.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });
}
