*This project has been created as part of the 42 curriculum by calbor-p, dagudelo, mmiilpal, nleoni, rbalazs*

## DESCRIPTION 

This project implements a complete web platform with account management for playing Pong with 3 different modes : AI with choice of difficulty, Local with game customization (Paddle and ball speed), and Multiplayer. A live chat is implemented to permit the communications between players.

## INSTRUCTIONS

■ Prerequisites

- Docker and Docker Compose, Node.js (for local development), Git

■ Installation

1. Configure environment variables

Create a `.env` file at the root with the necessary variables, for example:

FORTYTWO_CLIENT_ID=your_client_id 
FORTYTWO_CLIENT_SECRET=your_client_secret
FORTYTWO_REDIRECT_URI=https://localhost/auth/callback
JWT_SECRET=your_jwt_secret
DATABASE_URL=sqlite:./data/database.db
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://rabbitmq:5672

2. Launch services with Docker with make or docker-compose -f srcs/docker-compose.yml up -d

3. Open your browser and go to: `https://localhost`

■ Main Commands
make
make d - Create logs in a folder
make down
make logs
make rebuild

## RESOURCES

- Docker : https://docs.docker.com/
- Fastify : https://www.fastify.io/
- Tailwind CSS : https://tailwindcss.com/
- ModSecurity : https://modsecurity.org/
- Avalanche : https://docs.avax.network/
- HashiCorp Vault : https://www.vaultproject.io/
- Microservices Architecture - Martin Fowler : https://martinfowler.com/articles/microservices.html
- WebSocket API - MDN : https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- OAuth 2.0 Specification : https://oauth.net/2/
- Redis : https://redis.io/docs/latest/develop/pubsub/


## TEAM INFORMATION

■ Product Owner : calbor-p
Christophe was the most coherent choice for us to validate the work's team by his experience in web

■ Project Manager / Scrum Masters : dagudelo

■ Technical Lead / Architect / Developer : nleoni

■ Developers : mmiilpal, rbalazs
Mari Nathalia and Ralph communicated together to find the solutions 


## PROJECT MANAGEMENT

We coordinated using a Discord and weekly in-person meetings, and additional calls if needed. When a feature was completed, we announced it to the team; 
when bugs appeared, we helped each other to investigate and fix them. Tasks were assigned based on each member’s strengths, Diego and Christophe gived
hints from their experience, Nathalia had experience in web, Mari had skills related to web from a personal project and Ralph had skills in graphism before 42


## TECHNICAL STACK

The project is organized into independent microservices:

| Service | Description | Technologies |
|---------|-------------|--------------|
| **Frontend** | User interface, design | TypeScript, Tailwind CSS, EJS |
| **Gateway** | Entry point and routing | Nginx |
| **Auth** | Authentication and user management | Node.js, SQLite, Fastify | 
| **Realtime Sockets** | Realtime socket management | Node.js, Fastify |
| **Backend AI** | AI backend system for the game with difficulties | Node.js, Fastify |
| **Live Chat** | Real-time chat | Node.js, Fastify, SQLite |
| **Game Engine** | Core of the game for each mode (Local, AI, Remote) | Node.js, Fastify |
| **Language Manager** | Language management for each page | Node.js, Fastify, SQLite |
| **Mail** | Email sending | Node.js, Fastify |
| **Server Rendering** | Server-side rendering | Node.js, Fastify |
| **Security** | WAF and security | ModSecurity, Nginx, HashiCorp Vault |

■ Inter-Service Communication

Services communicate via:
- **Message Broker** (RabbitMQ)
- **Redis** for cache and sessions
- **REST API** for synchronous communications


■ Technology Stack
- **Database** : SQLite
- **Message Broker** : RabbitMQ
- **Cache** : Redis
- **Blockchain** : Avalanche (Solidity)
- **Security** : ModSecurity, HashiCorp Vault
- **Containerization** : Docker, Docker Compose
- **Web Server** : Nginx

## DATABASE SCHEMA

This project uses one SQLite database per service (mounted under `/data` in Docker). There are no explicit cross-service foreign keys; relationships are handled at the application level via a shared `user_id`.

■ Auth service (`/data/auth.sqlite`)

**Table: `users`**
- `user_id` (INTEGER, PK, AUTOINCREMENT)
- `user_mail` (TEXT, UNIQUE, NOT NULL)
- `pseudo` (TEXT, UNIQUE, NOT NULL)
- `user_password` (TEXT, NOT NULL)
- `avatar` (TEXT, nullable)
- `created_at` (DATETIME, default: CURRENT_TIMESTAMP)
- `auth_provider` (TEXT)

■ Live Chat service (`/data/live-chat.sqlite`)

**Table: `friendships`**
- `user_id` (INTEGER, NOT NULL)
- `friend_id` (INTEGER, NOT NULL)
- `requester_id` (INTEGER, NOT NULL)
- `status` (TEXT, default: `pending`)
- `created_at` (DATETIME, default: CURRENT_TIMESTAMP)
- Constraint: UNIQUE(`user_id`, `friend_id`)

**Table: `messages`**
- `message_id` (INTEGER, PK, AUTOINCREMENT)
- `sender_id` (INTEGER, NOT NULL)
- `receiver_id` (INTEGER, NOT NULL)
- `content` (TEXT, NOT NULL)
- `is_read` (BOOLEAN)
- `sent_at` (DATETIME, default: CURRENT_TIMESTAMP)
- Index: `idx_messages_participants` on (`sender_id`, `receiver_id`)

■ Language Manager service (`/data/lang.sqlite`)

**Table: `user_lang`**
- `user_id` (INTEGER, PK)
- `lang` (TEXT, NOT NULL, default: `en`)


## FEATURES LIST

- **Multiplayer Pong (real-time)**: 1v1 matches with live state sync and reconnect handling.
- **Matchmaking**: queue-based opponent pairing.
- **User accounts**: OAuth2 (42) login, JWT/session handling, profile update (username/avatar/email).
- **Chat & Social**: friends, friend requests, blocking/removal, direct messages.
- **Notifications**: real-time notifications for social/chat events.
- **Email workflows**: OTP / email validation via RabbitMQ + mail service (Mailpit in dev).
- **Game customization**: basic settings (ball/paddle speed, score goal).
- **SSR**: server-side rendering service for improved performance/SEO.
- **Internationalization**: multi-language support.
- **Security**: HTTPS/WSS, CSRF protection, WAF (ModSecurity), secrets management (Vault).
- **Blockchain**: score storage on Avalanche.
- **AI opponent / tournaments**: present as a service/module (integration status may vary).
- **Monitoring system with Prometheus and Grafana**

## INDIVIDUAL CONTRIBUTIONS

■ calbor-p
Security WAF, Authentification, Docker, Blockchain (Not implemented), local player logic (front and back)
Difficulties to compile modsecurity with sources, the solutions were to read documentation from official sources and stackoverflow and GPT

■ dagudelo
Game implementation, ELK. Difficulty identifying frontend bugs and inconsistencies during merges and during overlaps between different phases of the website's Docker-based infrastructure.


■ nleoni
Live chat features, Authentification, Langage Manager. Difficulties integrating the different backend and frontend components, particularly in coordinating the live chat, remote gameplay features, and real-time socket communication.


■ rbalazs
Frontend design, help to solve bugs in livechat, game implementation with Diego, game customization.
My principal difficulties was to understand the multiple notions to help to solve bugs and the communication with other teammates helped me a lot.

■ mmiilpal
AI opponent, Remote player, Monitoring
Merging difficulties because we did not merge as often so it took time to assemble


## MODULES AND COLLABORATIVE CONTRIBUTIONS

■  Major Modules

- **Implement WAF/ModSecurity (hardened) + HashiCorp Vault for secrets.** — *calbor-p*
- **Infrastructure for log management using ELK (Elasticsearch, Logstash, Kibana).** — *dagudelo*
- **Implement a complete web-based game where users can play against each other.** — *dagudelo*, *rbalazs*, *mmiilpal*
- **Multiplayer game (more than two players).** — *rbalazs*, *mmiilpal*
- **Remote players — Enable two players on separate computers to play the same game in real-time.** — *mmiilpal*
- **Introduce an AI Opponent for games.** — *mmiilpal*
- **Allow users to interact with other users.** — *nleoni*
- **Standard user management and authentication.** — *nleoni*
- **Implement real-time features using WebSockets or similar technology.** — *calbor-p*, *dagudelo*, *mmiilpal*, *nleoni*, *rbalazs*
- **Backend as microservices.** — *calbor-p*, *dagudelo*, *mmiilpal*, *nleoni*, *rbalazs*
- **Monitoring system with Prometheus and Grafana.** — *mmiilpal*

■  Minor Modules

- **Implement a complete 2FA (Two-Factor Authentication) system for the users.** — *calbor-p*
- **Server-Side Rendering (SSR) for improved performance and SEO.** — *rbalazs*, *mmiilpal*
- **Game customization options.** — *rbalazs*
- **Custom-made design system with reusable components, including a proper color palette, typography, and icons (minimum: 10 reusable components).** — *rbalazs*
- **A complete notification system for all creation, update, and deletion actions.** — *nleoni*
- **Support for multiple languages (at least 3 languages)** — *nleoni*
- **Implement remote authentication with OAuth 2.0 (Google, GitHub, 42, etc.).** — *nleoni*
- **Advanced chat features (enhances the basic chat from "User interaction" module).** — *nleoni*
- **Use a backend framework (Express, Fastify, NestJS, Django, etc.).** — *calbor-p*, *dagudelo*, *mmiilpal*, *nleoni*, *rbalazs*
- **Support for additional browsers.** — *calbor-p*, *dagudelo*, *mmiilpal*, *nleoni*, *rbalazs*


**TOTAL MAJOR MODULES** = 10 Modules \
**TOTAL MINOR MODULES** = 10 Modules \
**TOTAL POINTS** = 30 Points