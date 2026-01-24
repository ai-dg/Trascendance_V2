# AI Refactor to Redis Pub/Sub - Implementation Plan

**Date:** 16 January 2026
**Author:** Mari
**Status:** Planning Phase - NOT YET IMPLEMENTED

---

## 🎯 Why This Refactor is Needed

### Current Architecture Issues:
- ❌ AI logic is in `realtime-sockets` container (should be in `backend-ai`)
- ❌ No Redis pub/sub implemented anywhere in codebase
- ❌ Game state lives in memory, can't be shared with other services
- ❌ Ralph can't implement remote-players without shared game state
- ❌ Violates microservices architecture (tight coupling)

### Teammate's Request:
> "In every case we'll need to change data with redis sub/pub, it's the link I send you. So if you start code think about that! And try to share any ideas you have about how to improve this, what kind of data we'll need and everything related. You'll have to share the same data between containers, Mari for AI and Ralph for remote players so it's better if we work all together"

### Project Requirements (from README):
- ✅ Subject requires separate containers (backend-ai_app already defined)
- ✅ Ralph needs this for remote-players service
- ✅ Listed as collaborative requirement: "Backend as microservices"
- ✅ Current architecture prevents horizontal scaling

---

## 📁 Files to CREATE

### 1. backend-ai service (Your AI container)
```
srcs/services/backend-ai/app/
├── server.js                    (REPLACE existing empty one)
├── package.json                 (already exists, has redis)
└── srcs/
    ├── Ai.js                   (MOVE from realtime-sockets/app/srcs/Ai.js)
    ├── AiService.js            (NEW - Redis pub/sub handler)
    ├── Data.js                 (COPY from realtime-sockets - shared constants)
    └── RedisClient.js          (NEW - pub/sub wrapper utility)
```

**Purpose:**
- `AiService.js` - Subscribes to game state, calculates AI moves, publishes moves
- `RedisClient.js` - Handles Redis pub/sub connection and error handling

### 2. Shared data contracts (for you + Ralph)
```
srcs/services/realtime-sockets/app/srcs/contracts/
└── GameStateContract.js        (NEW - TypeScript-style JSDoc types)
```

**Purpose:** Define the exact data structure for Redis messages so Mari and Ralph use same format

### 3. Redis utilities in realtime-sockets
```
srcs/services/realtime-sockets/app/srcs/
└── RedisClient.js              (NEW - pub/sub wrapper, same as backend-ai)
```

---

## 📝 Files to MODIFY

### realtime-sockets service:
```
srcs/services/realtime-sockets/app/
├── server.js                    (MODIFY - add Redis subscriber setup)
└── srcs/
    ├── Game.js                 (MODIFY - publish state, subscribe to AI/player moves)
    └── Ai.js                   (DELETE - moved to backend-ai)
```

**Changes in Game.js:**
- Remove `this.ai` and AI imports
- Add Redis publisher for game state (60fps broadcast)
- Add Redis subscriber for AI moves
- Add Redis subscriber for player moves (for Ralph's remote-players)
- Handle move messages from Redis instead of local AI

---

## 🔌 Redis Pub/Sub Architecture

### Channels to Implement:

#### 1. `game:{uuid}:state`
**Publisher:** realtime-sockets
**Subscribers:** backend-ai, remote-players (Ralph)
**Frequency:** 60 fps (every ~16ms)
**Data Structure:**
```javascript
{
  uuid: "game-uuid-here",
  timestamp: 1736977123456,
  ball: {
    x: 400,
    y: 200,
    velocityX: 5,
    velocityY: 3,
    size: 10
  },
  paddle1: {
    x: 20,
    y: 160,
    width: 10,
    height: 80
  },
  paddle2: {
    x: 770,
    y: 160,
    width: 10,
    height: 80
  },
  score: {
    player1: 5,
    player2: 3
  },
  gameRunning: true
}
```

#### 2. `game:{uuid}:ai-move`
**Publisher:** backend-ai
**Subscribers:** realtime-sockets
**Frequency:** On-demand (when AI calculates move)
**Data Structure:**
```javascript
{
  uuid: "game-uuid-here",
  timestamp: 1736977123456,
  direction: -1,  // -1 = up, 0 = stay, 1 = down
  difficulty: "medium"
}
```

#### 3. `game:{uuid}:player-move`
**Publisher:** remote-players (Ralph's service)
**Subscribers:** realtime-sockets
**Frequency:** On player input
**Data Structure:**
```javascript
{
  uuid: "game-uuid-here",
  timestamp: 1736977123456,
  playerId: "user-42",
  paddle: 2,  // 1 or 2
  direction: 1  // -1 = up, 0 = stop, 1 = down
}
```

#### 4. `game:{uuid}:events`
**Publisher:** realtime-sockets
**Subscribers:** backend-ai, remote-players, frontend
**Frequency:** On game events
**Data Structure:**
```javascript
{
  uuid: "game-uuid-here",
  timestamp: 1736977123456,
  type: "score" | "game-over" | "pause" | "resume",
  data: {
    // event-specific data
  }
}
```

---

## 🔨 Implementation Steps

### Phase 1: Prepare backend-ai service (1-2 hours)

1. **Create RedisClient.js utility** (both services)
```javascript
// Handles pub/sub connection
// Error handling and reconnection
// Subscribe/publish helper methods
```

2. **Create GameStateContract.js**
```javascript
// JSDoc types for all message structures
// Validation functions
// Serialization/deserialization helpers
```

3. **Create AiService.js in backend-ai**
```javascript
// Subscribe to game:{uuid}:state
// Run AI calculation (using Ai.js)
// Publish to game:{uuid}:ai-move
// Handle multiple games simultaneously
```

4. **Move Ai.js to backend-ai**
```bash
mv srcs/services/realtime-sockets/app/srcs/Ai.js \
   srcs/services/backend-ai/app/srcs/Ai.js
```

5. **Update backend-ai/server.js**
```javascript
// Import AiService
// Initialize Redis connection
// Start listening for game state updates
// Handle graceful shutdown
```

### Phase 2: Modify realtime-sockets service (2-3 hours)

1. **Update Game.js**
   - Remove AI import and initialization
   - Add Redis publisher for game state
   - Add Redis subscriber for AI moves
   - Add Redis subscriber for player moves
   - Modify `update()` to publish state every frame
   - Modify `applyPlayerMoves()` to use Redis move data

2. **Update server.js**
   - Setup Redis subscriber
   - Subscribe to move channels when game starts
   - Pass move data to Game instance

3. **Delete Ai.js** from realtime-sockets

### Phase 3: Testing & Documentation (1 hour)

1. **Test AI mode**
   - Start both containers
   - Create AI game
   - Verify Redis messages flow correctly
   - Check AI responds to game state

2. **Create REDIS_ARCHITECTURE.md**
   - Document all channels for Ralph
   - Include example messages
   - Add troubleshooting tips

3. **Update README.md**
   - Add Redis pub/sub architecture section
   - Document service responsibilities

---

## 🛠️ Code Snippets for Implementation

### Example: RedisClient.js (Utility)
```javascript
import { createClient } from 'redis';

export class RedisClient {
  constructor() {
    this.publisher = null;
    this.subscriber = null;
  }

  async connect() {
    // Create two connections (Redis requirement for pub/sub)
    this.publisher = createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      },
      password: process.env.REDIS_PASSWORD
    });

    this.subscriber = this.publisher.duplicate();

    await Promise.all([
      this.publisher.connect(),
      this.subscriber.connect()
    ]);

    console.log('✅ Redis pub/sub connected');
  }

  async publish(channel, data) {
    await this.publisher.publish(channel, JSON.stringify(data));
  }

  async subscribe(channel, callback) {
    await this.subscriber.subscribe(channel, (message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (err) {
        console.error(`Error parsing message from ${channel}:`, err);
      }
    });
  }

  async unsubscribe(channel) {
    await this.subscriber.unsubscribe(channel);
  }

  async disconnect() {
    await Promise.all([
      this.publisher.quit(),
      this.subscriber.quit()
    ]);
  }
}
```

### Example: AiService.js (backend-ai)
```javascript
import { RedisClient } from './RedisClient.js';
import { Ai } from './Ai.js';

export class AiService {
  constructor() {
    this.redis = new RedisClient();
    this.activeGames = new Map(); // uuid -> {ai, gameState}
  }

  async start() {
    await this.redis.connect();

    // Subscribe to all game state updates
    await this.redis.subscribe('game:*:state', (data) => {
      this.handleGameState(data);
    });

    console.log('✅ AI Service listening for games');
  }

  handleGameState(gameState) {
    const uuid = gameState.uuid;

    // Get or create AI for this game
    if (!this.activeGames.has(uuid)) {
      const difficulty = gameState.difficulty || 'medium';
      this.activeGames.set(uuid, {
        ai: new Ai(difficulty),
        gameState: null
      });
      console.log(`🤖 New AI game: ${uuid} (${difficulty})`);
    }

    const game = this.activeGames.get(uuid);
    game.gameState = gameState;

    // Calculate AI move
    const direction = game.ai.calculateMove(
      gameState.ball,
      gameState.paddle2
    );

    // Publish AI move
    this.redis.publish(`game:${uuid}:ai-move`, {
      uuid,
      timestamp: Date.now(),
      direction
    });
  }

  cleanupGame(uuid) {
    if (this.activeGames.has(uuid)) {
      this.activeGames.delete(uuid);
      console.log(`🧹 Cleaned up AI game: ${uuid}`);
    }
  }
}
```

### Example: Game.js modifications (realtime-sockets)
```javascript
// In constructor:
constructor(socket, data, settings, redisClient) {
  // ... existing code ...
  this.redis = redisClient;
  this.isAiGame = data.type === 'ai';
  this.difficulty = data.difficulty;

  // Remove this.ai = new Ai() - AI is now in separate service

  // Subscribe to moves
  if (this.isAiGame) {
    this.redis.subscribe(`game:${this.uuid}:ai-move`, (data) => {
      this.aiMoveBuffer = data.direction;
    });
  } else {
    this.redis.subscribe(`game:${this.uuid}:player-move`, (data) => {
      if (data.paddle === 2) {
        this.playerInputs.paddle2Dir = data.direction;
      }
    });
  }
}

// In update():
update() {
  // Apply moves
  this.applyPlayerMoves();

  // Update physics
  this.ball.update();
  this.ball.checkWallCollision();

  // Check collisions
  // ... existing collision code ...

  // Publish game state to Redis
  this.redis.publish(`game:${this.uuid}:state`, {
    uuid: this.uuid,
    timestamp: Date.now(),
    ball: this.ball.getState(),
    paddle1: this.paddle1.getState(),
    paddle2: this.paddle2.getState(),
    score: {
      player1: this.score.player1Score,
      player2: this.score.player2Score
    },
    gameRunning: this.gameRunning,
    difficulty: this.difficulty
  });

  // Also send to Socket.IO (for frontend)
  this.socket.emit(this.uuid, {
    type: "game-update",
    state: this.getGameState()
  });
}

// In applyPlayerMoves():
applyPlayerMoves() {
  const speed = this.settings.paddleSpeed;

  // Player 1 (always local)
  this.paddle1.move(this.playerInputs.paddle1Dir, speed);

  // Player 2 (AI or remote)
  if (this.isAiGame) {
    // Use buffered AI move from Redis
    this.paddle2.move(this.aiMoveBuffer || 0, speed);
  } else {
    // Use player input from Redis
    this.paddle2.move(this.playerInputs.paddle2Dir, speed);
  }
}
```

---

## 📊 Service Responsibilities Summary

### realtime-sockets (Game Master)
- ✅ Receives player inputs via Socket.IO
- ✅ Publishes game state to Redis (60fps)
- ✅ Subscribes to AI moves from backend-ai
- ✅ Subscribes to player moves from remote-players
- ✅ Updates game physics (ball, collision detection)
- ✅ Broadcasts to frontend via Socket.IO
- ✅ Manages game lifecycle (start, pause, reset)

### backend-ai (AI Calculations)
- ✅ Subscribes to game state from realtime-sockets
- ✅ Runs AI algorithm (Jake Gordon's approach)
- ✅ Publishes paddle movements back to realtime-sockets
- ✅ Manages multiple games simultaneously
- ✅ No direct Socket.IO connection

### remote-players (Ralph's Service - Future)
- ⏳ Manages player connections via Socket.IO
- ⏳ Handles matchmaking
- ⏳ Subscribes to game state from realtime-sockets
- ⏳ Publishes player2 inputs to realtime-sockets
- ⏳ Manages player sessions

---

## 🚨 Important Notes

### Performance Considerations:
- **60fps Redis pub** = ~60 messages/second per game
- Need to monitor Redis memory usage
- Consider message compression if needed
- Implement game cleanup on disconnect

### Error Handling:
- Redis connection failures (reconnect logic)
- Message parsing errors (try/catch)
- Stale game state (timestamp validation)
- AI service crashes (game should continue with default behavior)

### Data Contract Coordination with Ralph:
- ✅ Share `GameStateContract.js` structure
- ✅ Document exact message formats
- ✅ Version the contract (add version field to messages)
- ✅ Test with sample messages before integration

### Docker Considerations:
- backend-ai_app already defined in docker-compose ✅
- Has Redis environment variables ✅
- Needs nodemon for development (add to Dockerfile)
- Add logging volume for debugging

---

## 📝 TODO Before Implementation

- [ ] Discuss with Ralph: timeline for remote-players
- [ ] Agree on exact message format with Ralph
- [ ] Test Redis pub/sub locally (simple example)
- [ ] Create feature branch: `feature/redis-pubsub-ai`
- [ ] Ensure Docker volumes are backed up
- [ ] Plan testing strategy

---

## 🤝 Collaboration Points with Ralph

### Questions to Ask Ralph:
1. When do you plan to start remote-players service?
2. Do you prefer TypeScript or JavaScript for contracts?
3. Should we add player authentication to Redis messages?
4. How to handle players disconnecting mid-game?
5. Do we need a matchmaking queue in Redis?

### Things to Share with Ralph:
1. This architecture document
2. `GameStateContract.js` file
3. Redis channel naming convention
4. Example messages for testing
5. Error handling approach

---

## 🎓 Learning Resources

- Redis Pub/Sub: https://redis.io/docs/manual/pubsub/
- Node.js Redis Client: https://github.com/redis/node-redis
- Microservices patterns: Message-driven architecture
- Jake Gordon's Pong AI: https://jakesgordon.com/writing/javascript-pong/part5/

---

## ⏱️ Time Estimate

- **Phase 1 (backend-ai):** 1-2 hours
- **Phase 2 (realtime-sockets):** 2-3 hours
- **Phase 3 (testing/docs):** 1 hour
- **Total:** 4-6 hours of focused work

---

## ✅ Benefits After Refactor

1. ✅ **Proper microservices architecture** (each service has single responsibility)
2. ✅ **Ralph can implement remote-players** (shared game state via Redis)
3. ✅ **Horizontal scaling possible** (multiple realtime-sockets instances)
4. ✅ **Better separation of concerns** (AI logic isolated)
5. ✅ **Easier testing** (can test AI independently)
6. ✅ **Matches project requirements** (subject + README)
7. ✅ **Future-proof** (can add more game features via pub/sub)

---

**Next Step:** Discuss with Ralph, then start Phase 1 when ready!
