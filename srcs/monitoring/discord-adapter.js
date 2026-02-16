import Fastify from 'fastify';
import axios from 'axios';

const fastify = Fastify({ logger: true });

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// Webhook endpoint for Alertmanager
fastify.post('/webhook/:type', async (request, reply) => {
  const { type } = request.params; // 'critical' or 'warning'
  const payload = request.body;

  const webhookUrl = type === 'critical'
    ? process.env.DISCORD_WEBHOOK_CRITICAL
    : process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl.includes('YOUR_WEBHOOK')) {
    fastify.log.warn('Discord webhook not configured');
    return { status: 'warning', message: 'Discord webhook not configured' };
  }

  try {
    // Convert Alertmanager payload to Discord format
    const discordMessages = convertToDiscord(payload, type);

    // Send each Discord message
    for (const message of discordMessages) {
      await axios.post(webhookUrl, message);
      await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit prevention
    }

    return { status: 'success', alerts: payload.alerts?.length || 0 };
  } catch (error) {
    fastify.log.error('Failed to send Discord webhook:', error);
    return reply.code(500).send({ status: 'error', message: error.message });
  }
});

function convertToDiscord(payload, type) {
  const messages = [];
  const alerts = payload.alerts || [];

  if (alerts.length === 0) return messages;

  // Group alerts by status (firing/resolved)
  const firingAlerts = alerts.filter(a => a.status === 'firing');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

  if (firingAlerts.length > 0) {
    const emoji = type === 'critical' ? '🚨' : '⚠️';
    const color = type === 'critical' ? 0xFF0000 : 0xFFA500; // Red or Orange

    const embeds = firingAlerts.slice(0, 10).map(alert => ({
      title: `${emoji} ${alert.labels.alertname}`,
      description: alert.annotations.description || 'No description',
      color: color,
      fields: [
        {
          name: 'Summary',
          value: alert.annotations.summary || 'N/A',
          inline: false
        },
        {
          name: 'Severity',
          value: alert.labels.severity || 'unknown',
          inline: true
        },
        {
          name: 'Service',
          value: alert.labels.job || alert.labels.service || 'N/A',
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    }));

    messages.push({ embeds });
  }

  if (resolvedAlerts.length > 0) {
    const embeds = resolvedAlerts.slice(0, 10).map(alert => ({
      title: `✅ Resolved: ${alert.labels.alertname}`,
      description: alert.annotations.description || 'Alert resolved',
      color: 0x00FF00, // Green
      fields: [
        {
          name: 'Service',
          value: alert.labels.job || alert.labels.service || 'N/A',
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    }));

    messages.push({ embeds });
  }

  return messages;
}

const start = async () => {
  try {
    await fastify.listen({ port: 9094, host: '0.0.0.0' });
    fastify.log.info('Discord webhook adapter listening on port 9094');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
