# Trascendance 🏓

![Status](https://img.shields.io/badge/Status-In%20Development-yellow)

**A real-time multiplayer Pong game website with microservices architecture**

> Complete web platform allowing you to play Pong against other players, with tournament system, authentication, live chat, and much more.

---

## ▌Module and Task Attribution

This section details the distribution of modules and tasks among team members.

### ■ calbor-p

**Modules and responsibilities:**
- Minor: Implement a complete 2FA (Two-Factor Authentication) system for the users.
- Major: Implement WAF/ModSecurity (hardened) + HashiCorp Vault for secrets.
- Major: Store tournament scores on the Blockchain.

### ■ dagudelo

**Modules and responsibilities:**
- Major: Infrastructure for log management using ELK (Elasticsearch, Logstash, Kibana).

### ■ nleoni

**Modules and responsibilities:**
- Major: Allow users to interact with other users.
- Minor: A complete notification system for all creation, update, and deletion actions.
- Minor: Support for multiple languages (at least 3 languages)
- Major: Standard user management and authentication.
- Minor: Implement remote authentication with OAuth 2.0 (Google, GitHub, 42, etc.).
- Minor: Advanced chat features (enhances the basic chat from "User interaction" module).

### ■ rbalazs

**Modules and responsibilities:**
- Minor: Server-Side Rendering (SSR) for improved performance and SEO.
- Major: Introduce an AI Opponent for games.
- Major: Implement a complete web-based game where users can play against each other.
- Major: Remote players — Enable two players on separate computers to play the same game in real-time.
- Major: Multiplayer game (more than two players).
- Minor: Implement a tournament system..
- Minor: Game customization options.

### ■ mmiilpal

**Modules and responsibilities:**
- Minor: Server-Side Rendering (SSR) for improved performance and SEO.
- Major: Introduce an AI Opponent for games.
- Major: Implement a complete web-based game where users can play against each other.
- Major: Remote players — Enable two players on separate computers to play the same game in real-time.
- Major: Multiplayer game (more than two players).
- Minor: Implement a tournament system.
- Minor: Game customization options.

### ■ Collaborative Work

**Modules developed collaboratively:**
- Minor: Use a backend framework (Express, Fastify, NestJS, Django, etc.).
- Major: Implement real-time features using WebSockets or similar technology.
- Major: Backend as microservices.

**A confirmer et a voir (pas inclus dans la somme)**
- Minor: Progressive Web App (PWA) with offline support and installability.
-  Minor: Custom-made design system with reusable components, including a proper color palette, typography, and icons (minimum: 10 reusable components).
- Minor: Support for additional browsers.
- Minor: Game statistics and match history (requires a game module).
- Minor: Use a frontend framework (React, Vue, Angular, Svelte, etc.).


**TOTAL MAJOR MODULES** = 11 = 22 points    
**TOTAL MINOR MODULES** = 9 = 9 points  
**TOTAL POINTS** = 31 points    


## ▌Project Overview

This project implements a **complete web platform** for playing multiplayer Pong.\

The system uses a **microservices architecture** to ensure scalability and maintainability.\

It offers several advanced features:

- **Multiplayer Pong game** in real-time
- **Tournament system** with matchmaking
- **Authentication** with OAuth 2.0 (42)
- **Live chat** between players
- **AI** to play against artificial opponents
- **Blockchain** to securely store scores
- **Security** with WAF/ModSecurity and HashiCorp Vault

📘 Academic project: **you will implement a complete microservices architecture with Docker**.

### ■ Project Objectives

[Example: Create a multiplayer Pong game platform with microservices architecture, integrating advanced features like blockchain, AI, and security...]

### ■ Main Technologies

[Example: Node.js, TypeScript, Docker, SQLite, RabbitMQ, Redis, Avalanche...]

---

## ▌Features

✔️ **Microservices Architecture** : Backend divided into independent and scalable services\

✔️ **Multiplayer Pong Game** : Real-time game with remote players\

✔️ **Tournament System** : Automatic match organization with matchmaking\

✔️ **Authentication** : User management with OAuth 2.0 (42)\

✔️ **Live Chat** : Real-time communication between players\

✔️ **AI Opponent** : Artificial intelligence to play against the computer\

✔️ **Blockchain** : Secure score storage on Avalanche\

✔️ **Security** : WAF/ModSecurity and secrets management with HashiCorp Vault\

✔️ **Multi-language** : Support for multiple languages (FR, EN, PT)\

✔️ **Server-Side Rendering** : Server-side rendering to improve performance\

✔️ **Modern Interface** : Frontend with TypeScript and Tailwind CSS

---

## ▌Services Architecture

### ■ Main Services

The project is organized into independent microservices:

| Service | Description | Technologies |
|---------|-------------|--------------|
| **Frontend** | User interface | TypeScript, Tailwind CSS, EJS |
| **Gateway** | Entry point and routing | Nginx |
| **Auth** | Authentication and user management | Node.js, SQLite |
| **Remote Players** | Remote player management | Node.js |
| **Match Maker** | Matchmaking system | Node.js |
| **Live Chat** | Real-time chat | Node.js, SQLite |
| **Blockchain** | Score storage | Solidity, Avalanche |
| **Canvas AI** | Artificial intelligence | Node.js |
| **Language Manager** | Language management | Node.js, SQLite |
| **Mail** | Email sending | Node.js |
| **Server Rendering** | Server-side rendering | Node.js |
| **Security** | WAF and security | ModSecurity, Nginx |

### ■ Inter-Service Communication

Services communicate via:
- **Message Broker** (RabbitMQ)
- **Redis** for cache and sessions
- **REST API** for synchronous communications

---

## ▌How It Works

### ■ General Architecture

1. **Frontend** : User interface developed in TypeScript with Tailwind CSS
2. **Gateway** : Nginx routes requests to appropriate services
3. **Microservices** : Each service manages a specific functionality
4. **Database** : SQLite for each service requiring storage
5. **Security** : ModSecurity protects against web attacks

### ■ Game Flow

1. **Authentication** : User logs in via OAuth 2.0 (42)
2. **Matchmaking** : Match Maker service finds an opponent
3. **Connection** : Players connect via Remote Players
4. **Game** : Pong game takes place in real-time
5. **Score** : Results are stored in the blockchain
6. **Chat** : Players can communicate via Live Chat

### ■ Security

- **HTTPS/WSS** : All communications are encrypted
- **WAF** : ModSecurity protects against SQL injections and XSS
- **HashiCorp Vault** : Secure secrets management
- **JWT** : Tokens for authentication
- **2FA** : Two-factor authentication available

---

## ▌Getting Started

### ■ Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- Git

### ■ Installation

1. Clone the repository

```bash
git clone <repository-url>
cd Trascendance_V2
```

2. Configure environment variables

Create a `.env` file at the root with the necessary variables:

```bash
# Example environment variables
FORTYTWO_CLIENT_ID=your_client_id
FORTYTWO_CLIENT_SECRET=your_client_secret
FORTYTWO_REDIRECT_URI=https://localhost/auth/callback
JWT_SECRET=your_jwt_secret
DATABASE_URL=sqlite:./data/database.db
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://rabbitmq:5672
# ... (to be completed according to your needs)
```

3. Launch services with Docker

```bash
make
# or
docker-compose -f srcs/docker-compose.yml up -d
```

4. Access the application

Open your browser and go to: `https://localhost`

**Note**: [Example: For local development, you may need to accept the self-signed certificate in your browser...]

---

## ▌Usage Instructions

### ■ Main Commands

```bash
# Start all services
make

# Stop all services
make down

# View logs
make logs

# Rebuild images
make rebuild
```

### ■ Application Usage

#### 1. Sign up / Log in

- Use OAuth 2.0 with your 42 account
- Or create a local account with email/password

#### 2. Play a game

- Click "Play" to find an opponent
- The matchmaking system will find you a partner
- Play Pong in real-time

#### 3. Participate in a tournament

- Join an existing tournament or create a new one
- The system will automatically organize matches
- Track your progress in the rankings

#### 4. Use chat

- Open the live chat
- Send messages to other players
- Invite players to play

---

## ▌Example Output

### Service Startup

```bash
$ make
Creating network "trascendance_v2_default" ...
Creating container "auth" ...
Creating container "gateway" ...
Creating container "frontend" ...
...
All services are running!
```

### Authentication Logs

```bash
$ docker logs auth
Server running on port 3001
OAuth 2.0 endpoint ready
Database initialized
```

---

## ▌Project Structure

```
Trascendance_V2/
├── srcs/
│   ├── docker-compose.yml      # Docker Compose configuration
│   ├── services/               # Microservices
│   │   ├── auth/               # Authentication service
│   │   ├── blockchain/         # Blockchain service
│   │   ├── canvas-ai/          # AI service
│   │   ├── frontend/           # User interface
│   │   ├── gateway/            # Entry point
│   │   ├── language-manager/   # Language management
│   │   ├── live-chat/          # Live chat
│   │   ├── mail/               # Email service
│   │   ├── match-maker/        # Matchmaking system
│   │   ├── remote-players/     # Remote player management
│   │   ├── security/           # WAF and security
│   │   └── server-rendering/   # Server-side rendering
│   ├── scripts/                # Utility scripts
│   └── logs/                   # Log files
├── Makefile                    # Build commands
├── README.md                   # This file
└── DOC.md                      # Technical documentation
```

---

## ▌Technical Details

### Technology Stack

- **Backend** : Node.js with Fastify
- **Frontend** : TypeScript, Tailwind CSS
- **Database** : SQLite
- **Message Broker** : RabbitMQ
- **Cache** : Redis
- **Blockchain** : Avalanche (Solidity)
- **Security** : ModSecurity, HashiCorp Vault
- **Containerization** : Docker, Docker Compose
- **Web Server** : Nginx

**Versions used:**
[Example:]
- Node.js : v20.x
- TypeScript : v5.x
- Docker : v24.x
- Fastify : v4.x
- Tailwind CSS : v3.x
- *To be completed with exact versions...*

### Microservices Architecture

Each service is:
- **Independent** : Can be deployed separately
- **Scalable** : Can be replicated as needed
- **Isolated** : Has its own database if necessary
- **Communicative** : Communicates via REST APIs or message broker

### Security

- **HTTPS/WSS** : All communications are encrypted
- **WAF** : ModSecurity with custom rules
- **Secrets** : HashiCorp Vault for secrets management
- **Authentication** : JWT with 2FA support
- **Validation** : Server-side validation of all user inputs

### Code Quality

- Respect for coding standards
- Modular and maintainable architecture
- Complete error handling
- Inline documentation
- Tests (to be implemented)

**Applied standards:**
[Example:]
- ESLint for JavaScript/TypeScript linting
- Prettier for code formatting
- Naming convention: camelCase for variables, PascalCase for classes
- *To be completed with your actual standards...*

---

## ▌Performance Results

### ■ Metrics

[Example of measured metrics:]
- **Response time** : < 100ms for most requests
- **Game latency** : < 50ms for real-time interactions
- **Availability** : 99.9% uptime
- **Scalability** : Support for hundreds of simultaneous players

*Note: These metrics are examples. To be completed with your actual measurements.*

### ■ Optimizations

- **Redis Cache** : Reduction of database queries
- **CDN** : Distribution of static assets
- **Load Balancing** : Load distribution via Nginx
- **Compression** : Gzip for HTTP responses

---

## ▌Theoretical Background

### Microservices Architecture

Microservices architecture divides the application into small independent services that communicate via well-defined APIs. This approach offers:

- **Scalability** : Each service can be scaled independently
- **Maintainability** : Code easier to understand and maintain
- **Flexibility** : Different technologies for each service
- **Resilience** : Failure of one service does not affect others

### Web Application Firewall (WAF)

ModSecurity is an open-source WAF that protects against:
- **SQL Injection** : Blocks injection attempts
- **XSS** : Prevents cross-site scripting attacks
- **CSRF** : Protection against forged requests
- **DDoS** : Rate limiting

### Blockchain for Scores

Using blockchain (Avalanche) ensures:
- **Immutability** : Scores cannot be modified
- **Transparency** : All scores are verifiable
- **Decentralization** : No single point of failure
- **Trust** : Players can verify score integrity

---

## ▌References

- **Project subject** : ft_transcendence (42 School)
- **Docker** : [Documentation](https://docs.docker.com/)
- **Fastify** : [Documentation](https://www.fastify.io/)
- **Tailwind CSS** : [Documentation](https://tailwindcss.com/)
- **ModSecurity** : [Documentation](https://modsecurity.org/)
- **Avalanche** : [Documentation](https://docs.avax.network/)
- **HashiCorp Vault** : [Documentation](https://www.vaultproject.io/)

**Additional resources:**
[Example:]
- [Microservices Architecture - Martin Fowler](https://martinfowler.com/articles/microservices.html)
- [WebSocket API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- *To be completed with your references...*

---

## 📜 License

This project was completed as part of an **academic curriculum**.\

It is intended for **educational purposes** and demonstrates the implementation of a complete microservices architecture with Docker.

If you wish to use or study this code, please ensure it complies with your **institution's policies**.

---

## ▌Implemented Modules

### Major Modules

- ✅ **Web** : Backend framework (Fastify) and frontend (Tailwind CSS)
- ✅ **User Management** : Standard user management and remote authentication (OAuth 2.0)
- ✅ **Gameplay** : Remote players, multiplayer, live chat
- ✅ **AI-Algo** : AI opponent
- ✅ **Cybersecurity** : WAF/ModSecurity and HashiCorp Vault
- ✅ **Devops** : Microservices infrastructure
- ✅ **Server-Side Pong** : Server-side Pong with API

### Minor Modules

- ✅ **Database** : SQLite usage
- ✅ **Accessibility** : Multi-language support (FR, EN, PT)
- ✅ **Server-Side Rendering** : Server-side rendering

---

## ▌Contributors

This project was completed by the following team:

- **calbor-p**
- **Diego Agudelo**
- **harmonie** (harmoos)

---

*Thank you to all contributors for their work on this project!*

---


### ■ Distribution by Category

| Category | Main Responsible | Collaborators |
|----------|------------------|---------------|
| **Backend Framework** | [Example: calbor-p] | [Example: Diego Agudelo] |
| **Frontend** | [Example: Diego Agudelo] | [Example: harmonie] |
| **Authentication** | [Example: calbor-p] | [To be completed] |
| **Blockchain** | [Example: calbor-p] | [To be completed] |
| **AI** | [Example: harmonie] | [To be completed] |
| **Security** | [Example: harmonie] | [To be completed] |
| **DevOps** | [Example: calbor-p] | [Example: Diego Agudelo, harmonie] |
| **Chat** | [Example: harmonie] | [To be completed] |
| **Matchmaking** | [Example: harmonie] | [To be completed] |
| **Server-Side Rendering** | [Example: Diego Agudelo] | [To be completed] |
| **Multi-language** | [Example: harmonie] | [To be completed] |

*Note: This distribution is indicative. To be completed with your actual project details.*

---

## ▌Project Status

🚧 **In Development** - The project is currently under active development.

### ■ Progress

[Example:]
- ✅ Microservices architecture : 100%
- ✅ Base services : 90%
- ⏳ Tests : 60%
- ⏳ Documentation : 70%
- ⏳ Deployment : 50%

*To be completed with your actual progress.*

---
