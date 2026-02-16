# Monitoring System - Evaluation Guide

## Overview

The monitoring stack provides full observability across the microservices architecture using **4 layers**: **Prometheus + Grafana** for metrics and dashboards, **ELK Stack** (Elasticsearch, Logstash, Kibana) for centralized log management, **AlertManager + Discord** for real-time alerting, and **ModSecurity WAF** for security monitoring. The system includes 22 alert rules, 4 Grafana dashboards, 8+ Kibana visualizations, and scrapes metrics from 11 targets.

---

## Architecture Diagram

```
                    Application Services
                    (auth, game-engine, chat, etc.)
                           |
              +------------+------------+
              |                         |
         /metrics endpoints        stdout/stderr logs
              |                         |
    +---------v---------+    +----------v----------+
    |   Prometheus       |    |  Docker Logs         |
    |   (port 9090)      |    |  (log-finder.sh)     |
    |   15s scrape       |    +----------+----------+
    |   11 targets       |               |
    +---------+----------+    +----------v----------+
              |               |  Logstash            |
    +---------v----------+    |  (port 5000)         |
    |   AlertManager      |    |  JSON/grok parsing   |
    |   (port 9093)       |    +----------+----------+
    |   Route by severity |               |
    +---------+----------+    +----------v----------+
              |               |  Elasticsearch       |
    +---------v----------+    |  (port 9200)         |
    |   Discord Adapter   |    |  index: infra-logs   |
    |   (port 9094)       |    +----------+----------+
    |   Webhook to Discord|               |
    +--------------------+    +----------v----------+
                              |  Kibana              |
    +---------+----------+    |  (port 5601)         |
    |   Grafana           |    |  8 visualization     |
    |   (/grafana/)       |    |  panels              |
    |   4 dashboards      |    +---------------------+
    +--------------------+
                              +---------------------+
    +--------------------+    |  cAdvisor            |
    |   Redis Exporter    |    |  (port 8081)         |
    |   (port 9121)       |    |  Container metrics   |
    +--------------------+    +---------------------+
```

---

## 1. Prometheus (Metrics Collection)

### Configuration: `srcs/monitoring/prometheus.yml`

**Scrape interval**: 15 seconds
**Evaluation interval**: 15 seconds

### 11 Scrape Targets

| Job | Target | What It Scrapes |
|-----|--------|----------------|
| `prometheus` | `localhost:9090` | Prometheus self-monitoring |
| `redis` | `redis-exporter:9121` | Redis memory, connections, commands |
| `cadvisor` | `cadvisor:8080` | Container CPU, memory, network I/O |
| `auth` | `auth_app:3000` | HTTP request duration, count, errors |
| `live-chat` | `live-chat_app:3002` | Same |
| `realtime-sockets` | `realtime-sockets_app:3003` | Same |
| `remote-players` | `remote-players_app:3004` | Same |
| `backend-ai` | `backend-ai_app:3004` | Same |
| `game-engine` | `game-engine_app:3007` | Same |
| `server-rendering` | `server-rendering_app:3005` | Same |
| `mail` | `mail:3300` | Same |

All application services scraped via HTTPS with `insecure_skip_verify: true` (self-signed certs).

### Custom Metrics Exported (`srcs/monitoring/metrics.js`)

Each service exposes `GET /metrics` with:

| Metric | Type | Labels | Purpose |
|--------|------|--------|---------|
| `http_request_duration_seconds` | Histogram | method, route, status_code | Request latency distribution |
| `http_requests_total` | Counter | method, route, status_code | Total request count |
| Default Node.js metrics | Various | | Heap memory, event loop lag, GC |

Buckets for histogram: `[0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]` seconds

**Code**: `srcs/monitoring/metrics.js:17-53`

---

## 2. Alert Rules (22 Rules in 6 Groups)

### File: `srcs/monitoring/alert_rules.yml`

### Group A: Service Alerts
| Alert | Trigger | Duration | Severity |
|-------|---------|----------|----------|
| **ServiceDown** | `up == 0` | 1 min | CRITICAL |
| HighErrorRate | HTTP 5xx > 10% in 5min | 2 min | WARNING |
| HighRequestLatency | p95 > 2 seconds | 3 min | WARNING |

### Group B: Infrastructure Alerts
| Alert | Trigger | Duration | Severity |
|-------|---------|----------|----------|
| **RedisDown** | `redis_up == 0` | 1 min | CRITICAL |
| HighContainerMemory | > 512MB | 5 min | WARNING |
| HighContainerCPU | > 80% | 5 min | WARNING |
| RedisHighMemory | > 80% max | 5 min | WARNING |
| ContainerRestarting | restart rate > 0 in 5min | 1 min | WARNING |
| RedisConnectionPoolExhaustion | > 80% max connections | 2 min | WARNING |

### Group C: Authentication Alerts
| Alert | Trigger | Duration | Severity |
|-------|---------|----------|----------|
| HighFailedLogins | > 10/sec | 2 min | WARNING |
| AuthServiceSlowResponse | p95 > 1 second | 3 min | WARNING |
| **SuspiciousAuthActivity** | > 50 login attempts/sec | 30 sec | CRITICAL |

### Group D: Realtime/WebSocket Alerts
| Alert | Trigger | Duration | Severity |
|-------|---------|----------|----------|
| HighWebSocketDisconnections | > 5/sec | 2 min | WARNING |
| **WebSocketConnectionSaturation** | > 90% capacity | 2 min | CRITICAL |
| RealtimeServiceLatency | p95 > 500ms | 3 min | WARNING |

### Group E: Game Alerts
| Alert | Trigger | Duration | Severity |
|-------|---------|----------|----------|
| HighMatchmakingQueueTime | p95 > 30 seconds | 3 min | WARNING |
| **HighGameSessionFailures** | > 10% failure rate | 2 min | CRITICAL |
| HighPlayerDisconnectionRate | > 20% | 3 min | WARNING |

### Group F: Security Alerts
| Alert | Trigger | Duration | Severity |
|-------|---------|----------|----------|
| HighRateLimitTriggers | > 10/sec | 2 min | WARNING |
| High401Responses | > 10/sec | 3 min | WARNING |
| **ModSecurityViolations** | > 1/sec | 2 min | CRITICAL |
| **CSRFAttemptsDetected** | > 5/sec | 2 min | CRITICAL |

---

## 3. AlertManager + Discord Integration

### AlertManager Config: `srcs/monitoring/alertmanager.yml`

**Routing**:
- **CRITICAL** alerts -> `discord-critical` receiver (repeat every 30 min)
- **WARNING** alerts -> `discord` receiver (repeat every 2 hours)
- Group by: `alertname`, `severity`
- Group wait: 10 seconds

**Inhibition**: If a service is DOWN (critical), suppress its error/latency warnings (prevents alert spam).

### Discord Adapter: `srcs/monitoring/discord-adapter.js`

A Fastify server (port 9094) that converts AlertManager webhooks to Discord embeds:

| Alert State | Color | Emoji |
|-------------|-------|-------|
| CRITICAL firing | Red (0xFF0000) | alert |
| WARNING firing | Orange (0xFFA500) | warning |
| Resolved | Green (0x00FF00) | checkmark |

Features:
- Rate limiting: 100ms delay between messages (prevents Discord throttle)
- Max 10 alerts per batch
- Separate webhook URLs for critical vs warning channels
- Health endpoint: `GET /health`

**Code**: `srcs/monitoring/discord-adapter.js:42-102`

---

## 4. Grafana Dashboards

### Access: `https://localhost/grafana/` (admin / `GRAFANA_ADMIN_PASSWORD` from .env)

### Dashboard A: Container Metrics (`containers.json`)
| Panel | Query | Purpose |
|-------|-------|---------|
| Container CPU Usage (%) | `rate(container_cpu_usage_seconds_total)` | Per-container CPU |
| Container Memory Usage | `container_memory_usage_bytes` | Per-container RAM |
| Network Receive (bytes/sec) | `rate(container_network_receive_bytes_total)` | Inbound traffic |
| Network Transmit (bytes/sec) | `rate(container_network_transmit_bytes_total)` | Outbound traffic |
| Current CPU (Bar gauge) | Same, instant | Color-coded current CPU |
| Current Memory (Bar gauge) | Same, instant | Green <256MB, yellow <512MB, red >512MB |

### Dashboard B: Prometheus Overview (`prometheus.json`)
| Panel | Purpose |
|-------|---------|
| Prometheus Status | UP/DOWN indicator |
| Redis Exporter Status | UP/DOWN indicator |
| Total Time Series | Count of active series |
| Targets Monitored | Count of scrape targets |
| Samples Ingested/sec | Prometheus ingestion rate |
| Storage Size | Prometheus disk usage |
| All Targets Status | Table of all jobs with UP/DOWN |

### Dashboard C: Redis Metrics (`redis.json`)
| Panel | Purpose |
|-------|---------|
| Memory Usage % | Gauge with thresholds (green <70%, yellow <90%, red >90%) |
| Memory Used (bytes) | Current RSS |
| Connected Clients | Active connections |
| Redis Status | UP/DOWN |
| Commands/sec | Operations throughput |
| Memory Over Time | Memory trend |
| Clients Over Time | Connection trend |
| Total Keys (db0) | Database size |

### Dashboard D: Services (`services.json`)
| Panel | Purpose |
|-------|---------|
| Service Status | UP/DOWN for all 8 app services |
| HTTP Request Rate | req/sec per service |
| HTTP Request Duration | p50/p95/p99 latency |
| HTTP Error Rate | 4xx/5xx percentage per service |
| Node.js Heap Memory | Memory per service |

---

## 5. ELK Stack (Log Management)

### Architecture

```
Docker container logs -> log-finder.sh -> ./srcs/logs/*.log
                                                 |
                                          Logstash (reads files)
                                                 |
                                          Parse (JSON / grok / PostgreSQL)
                                                 |
                                          Elasticsearch (index: infra-logs)
                                                 |
                                          Kibana (dashboard + filters)
```

### Logstash Pipeline: `srcs/services/elk/logstash/conf/logstash.conf` (132 lines)

**Input**: Reads `*.log` files from mounted volume

**Filters**:
1. **Service name extraction**: parsed from filename (e.g., `auth_app.log` -> `auth_app`)
2. **JSON parsing**: tries JSON first (for structured logs like nginx)
3. **Grok fallback**: regex extraction for ISO8601 timestamps and log levels
4. **PostgreSQL pattern**: `YYYY-MM-DD HH:MM:SS UTC [PID] LEVEL: message`
5. **Level normalization**: standardizes to uppercase (DEBUG, INFO, WARN, ERROR, CRITICAL)
6. **Cleanup**: removes raw fields, keeps only `parsed_log` structure

**Output**: Elasticsearch at `http://elasticsearch:9200`, index `infra-logs`

### Kibana Dashboard (8 Panels)

| Panel | Type | Description |
|-------|------|-------------|
| Filters | Dropdown | Filter by level, service name, file origin |
| Count of Messages | Data table | Top 1000 entries sorted by count |
| Count of Logs in Time | Line chart | 1-minute intervals, split by service |
| Number of Logs per Service | Table | Sum totals per service |
| Logs by Service | Pie chart | Distribution |
| Count by Origin | Table | Top 10 source files |
| Logs by Level | Pie chart | Color-coded by severity |
| Logs per Level | Table | Split by levelname |

### Import Scripts

```bash
# Wait for Kibana to be ready (polls every 5s, up to 120s)
srcs/scripts/elk/patience_kibana.sh

# Import index pattern + dashboard
srcs/scripts/elk/import_dashboard.sh
```

### Docker Compose (prod profile)

ELK services use `profiles: ["prod"]` - they only start with `docker compose --profile prod`:
- **Elasticsearch**: 2GB memory limit, xpack security enabled, healthcheck
- **Kibana**: depends on elasticsearch, port from `PORT_KIBANA` env var
- **Logstash**: privileged mode, mounts Docker container logs + ./logs directory

---

## 6. ModSecurity WAF

### Mode: `DetectionOnly` (monitors but doesn't block)

### OWASP Core Rule Set Active

| Category | Rules |
|----------|-------|
| SQL Injection | REQUEST-942-APPLICATION-ATTACK-SQLI |
| XSS | REQUEST-941-APPLICATION-ATTACK-XSS |
| Local File Inclusion | REQUEST-930-APPLICATION-ATTACK-LFI |
| Remote File Inclusion | REQUEST-931-APPLICATION-ATTACK-RFI |
| Remote Code Execution | REQUEST-932-APPLICATION-ATTACK-RCE |
| Session Fixation | REQUEST-943-APPLICATION-ATTACK-SESSION-FIXATION |
| Java Attacks | REQUEST-944-APPLICATION-ATTACK-JAVA |
| Scanner Detection | REQUEST-913-SCANNER-DETECTION |
| Protocol Enforcement | REQUEST-920-PROTOCOL-ENFORCEMENT |
| Data Leakage | RESPONSE-950/951/952/953/954-DATA-LEAKAGES |
| Web Shells | RESPONSE-955-WEB-SHELLS |

**libinjection** included for advanced SQL injection and XSS detection using lexical analysis.

Request limits: 13.1 MB max body, 128 KB non-file, 1000 max arguments, PCRE match limit 1000.

---

## 7. Infrastructure Components

### Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| prometheus | prom/prometheus | 9090 | Metrics storage & querying |
| alertmanager | prom/alertmanager | 9093 | Alert routing |
| discord-adapter | Custom Node.js | 9094 | AlertManager -> Discord webhooks |
| grafana | grafana/grafana | /grafana/ | Dashboard UI |
| redis-exporter | oliver006/redis_exporter | 9121 | Redis metrics for Prometheus |
| cadvisor | gcr.io/cadvisor/cadvisor | 8081 | Container metrics |
| elasticsearch | elastic 7.17.10 | 9200 | Log storage (prod profile) |
| kibana | elastic 7.17.10 | 5601 | Log visualization (prod profile) |
| logstash | elastic 7.17.10 | 5000 | Log pipeline (prod profile) |

### Makefile Targets

```bash
make find-logs              # Start log collectors for all services
make kill-logs              # Stop all log collectors
make logs-all               # Tail all services in real-time
make logs-recent            # Show last 100 lines
make patience-kibana        # Wait for Kibana readiness
make import-dashboard-kibana # Import Kibana dashboards
```

### Log Finder Services Tracked (20+)

modsecurity, gateway, auth_app, live-chat_app, realtime-sockets_app, remote-players_app, game-engine_app, backend-ai_app, frontend_app, server-rendering_app, language-manager_app, gt_mailpit, mail, rabbit, redis, elasticsearch, kibana, logstash, prometheus, grafana, redis-exporter, cadvisor

---

## 8. Nginx Structured Logging

Both gateway and ModSecurity use JSON access logs:

```json
{
  "time_local": "15/Feb/2026:14:30:00 +0000",
  "remote_addr": "172.20.0.1",
  "request": "GET /auth/me HTTP/1.1",
  "status": "200",
  "body_bytes_sent": "342",
  "http_referer": "https://localhost/",
  "http_user_agent": "Mozilla/5.0...",
  "request_time": "0.005"
}
```

Output to stdout/stderr (12-factor compliant), captured by Docker, collected by log-finder.

---

## How to Access Monitoring UIs

| System | URL | Credentials |
|--------|-----|-------------|
| Prometheus | `http://localhost:9090` | None |
| AlertManager | `http://localhost:9093` | None |
| Grafana | `https://localhost/grafana/` | admin / `GRAFANA_ADMIN_PASSWORD` |
| Kibana | `http://localhost:${PORT_KIBANA}` | `ELASTIC_USERNAME` / `ELASTIC_PASSWORD` |
| cAdvisor | `http://localhost:8081` | None |
| RabbitMQ | `http://localhost:15672` | `RABBITMQ_DEFAULT_USER` / `PASS` |

---

## Evaluation Talking Points

1. **Full observability stack**: Metrics (Prometheus), logs (ELK), alerting (AlertManager + Discord), and container monitoring (cAdvisor) - covering all three pillars of observability.

2. **22 alert rules across 6 domains**: Service health, infrastructure, authentication, WebSocket, game mechanics, and security. CRITICAL alerts repeat every 30 minutes via Discord, WARNING every 2 hours. Inhibition rules prevent cascading alerts.

3. **4 pre-provisioned Grafana dashboards**: Container metrics (CPU/memory/network), Prometheus overview (targets and ingestion), Redis deep-dive (memory/connections/commands), and Services overview (request rate/latency/errors). All auto-provisioned on startup.

4. **Intelligent log parsing**: Logstash handles multiple formats - JSON (nginx), grok patterns (Node.js), PostgreSQL-specific patterns. Normalizes log levels to uppercase. Service names extracted from filenames automatically.

5. **Discord integration for ops**: Custom Node.js adapter converts AlertManager webhooks to color-coded Discord embeds. Rate-limited to prevent throttling. Separate channels for critical vs warning alerts.

6. **ModSecurity WAF**: OWASP Core Rule Set with 20+ rule categories including SQL injection, XSS, LFI/RFI, and web shell detection. libinjection provides lexical analysis beyond regex. Currently in DetectionOnly mode for safe monitoring.

7. **Custom Prometheus metrics**: Each service exposes `http_request_duration_seconds` (histogram with 7 buckets) and `http_requests_total` (counter) via prom-client. This enables per-route, per-method, per-status-code analysis.

8. **Production-ready architecture**: Persistent volumes for Prometheus and Grafana data. Health checks on Elasticsearch. Kibana wait script for reliable dashboard imports. cAdvisor runs privileged for full container visibility.
