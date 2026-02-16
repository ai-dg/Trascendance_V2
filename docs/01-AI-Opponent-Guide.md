# AI Opponent - Evaluation Guide

## Overview

The AI opponent uses a **3-service microservices architecture** communicating via **Redis pub/sub**. The game engine runs physics at 60 FPS and publishes state to Redis. A dedicated AI service subscribes, calculates paddle movement using **ball trajectory prediction**, and publishes the move back. Three difficulty levels (EASY, MEDIUM, HARD) control reaction time, prediction accuracy, and update frequency.

---

## Architecture Diagram

```
+-------------------+        Socket.IO         +------------------------+
|   Frontend        | <======================> |  realtime-sockets      |
|   (GameAiPage.ts) |                          |  (port 3003)           |
|                   |  "request-game-uid"       |                        |
|  - Difficulty UI  |  { type: "ai",           |  Routes to game-engine |
|  - Canvas render  |    difficulty: "easy" }   |                        |
|  - W/S key input  |                          +----------+-------------+
+-------------------+                                     |
       ^                                                  v
       |  game-update (state)              +------------------------+
       |                                   |  Game Engine            |
       +-----------------------------------|  (port 3007)           |
                                           |                        |
                                           |  Game.js: 60 FPS loop  |
                                           |  Ball.js, Paddle.js    |
                                           |  Score.js, Data.js     |
                                           |                        |
                                           |  Publishes:            |
                                           |  game:{uuid}:state     |
                                           +----------+-------------+
                                                      |
                                              Redis Pub/Sub
                                                      |
                                           +----------v-------------+
                                           |  Backend AI             |
                                           |  (port 3004)           |
                                           |                        |
                                           |  Ai.js: trajectory     |
                                           |  prediction algorithm  |
                                           |                        |
                                           |  Publishes:            |
                                           |  game:{uuid}:ai-input  |
                                           |  { paddle2Dir: -1|0|1 }|
                                           +------------------------+
```

---

## Complete Flow: Difficulty Click to Game Running

### Step 1: User Selects Difficulty
- User clicks EASY, MEDIUM, or HARD on `GameAiPage.ts`
- `selectDifficulty(difficulty)` stores the choice and calls `GameManager.requestGameID("ai", { difficulty })`
- Frontend emits `"request-game-uid"` with `{ type: "ai", difficulty: "easy|medium|hard" }`

**Code**: `GameAiPage.ts:201-209`, `GameManager.ts:438-462`

### Step 2: Game Creation (Game Engine)
- The `realtime-sockets` service receives the request and routes to the game engine
- `Game.js` constructor detects `data.type === 'ai'` and stores the difficulty
- `setupAiSubscription()` subscribes to `game:{uuid}:ai-input` via Redis

**Code**: `Game.js:15-74`

### Step 3: Auto-Ready
- For AI games, `setPlayerReady()` auto-readies both players (`player: 3`)
- The 3-2-1 countdown starts immediately
- After countdown, `startGame()` begins the 60 FPS server loop

**Code**: `Game.js:344-369`

### Step 4: Game Loop (Every 16.67ms)
Each frame on the server:
1. `applyPlayerMoves()` - applies paddle1 input from player + paddle2 input from AI
2. `ball.update()` - moves ball by velocity
3. `ball.checkWallCollision()` - bounces off top/bottom
4. `paddle.checkCollisionWithBall()` - bounces off paddles, adds Y variation
5. `ball.checkOutOfBounds()` - scores point if ball passes left/right edge
6. `publishGameStateToAi()` - sends `{ ball, paddle2, difficulty }` to Redis
7. `emitGameUpdate()` - sends full gameState to frontend via Socket.IO

**Code**: `Game.js:525-650`

### Step 5: AI Calculates Move
The AI service (`backend-ai/server.js`) subscribes to `game:*:state`:
1. Parses incoming game state
2. Gets or creates an `Ai` instance with the correct difficulty
3. Calls `ai.calculateMove(ball, paddle2)`
4. Publishes result to `game:{uuid}:ai-input` with `{ paddle2Dir: -1|0|1 }`

**Code**: `backend-ai/server.js:49-93`

### Step 6: AI Move Applied
- Game engine receives `paddle2Dir` via Redis subscription
- Updates `playerInputs.paddle2Dir`
- Next frame applies the move in `applyPlayerMoves()`
- Frontend ignores keyboard input for paddle2 during AI games

**Code**: `Game.js:319-341`, `GameManager.ts:713-759`

---

## AI Algorithm Deep Dive

### File: `srcs/services/backend-ai/app/srcs/Ai.js` (153 lines)

### Difficulty Configurations

| Parameter | EASY | MEDIUM | HARD | Purpose |
|-----------|------|--------|------|---------|
| `reactionTime` | 30 frames (0.5s) | 15 frames | 5 frames | Delay before AI starts moving |
| `maxError` | 80 px | 50 px | 20 px | Random offset from prediction |
| `updateFrequency` | 20 frames | 10 frames | 5 frames | How often prediction recalculates |
| `deadZone` | 30 px | 20 px | 10 px | Distance threshold to stop moving |

### Decision Logic (`calculateMove`, lines 42-64)

```
1. Check ball direction:
   - If ball.velocityX < 0 (moving away): return to center
   - If ball.velocityX > 0 (approaching): calculate prediction

2. Update prediction (every updateFrequency frames):
   - EASY: simply track ball's current Y + random error
   - MEDIUM/HARD: simulate full trajectory with wall bounces

3. Wait for reactionTime frames before moving

4. Move toward predicted position:
   - If within deadZone: stop (return 0)
   - If prediction above paddle: move up (return -1)
   - If prediction below paddle: move down (return 1)
```

### EASY Prediction (lines 80-89)
- Takes the ball's current Y position
- Adds random error: `Math.random() * maxError * 2 - maxError`
- No trajectory simulation - cheap and inaccurate

### MEDIUM/HARD Prediction (lines 92-129)
- Simulates ball path step-by-step until it reaches paddle X
- Handles wall bounces (top/bottom reflection)
- Adds **distance-based error**: closer = more error
  ```javascript
  const closeness = Math.max(0, Math.min(1, distanceToPaddle / CANVAS_WIDTH));
  const randomError = (Math.random() - 0.5) * 2 * maxError * closeness;
  ```
- Clamps result to valid paddle range

### Human-Like Behavior
1. **Reaction delay**: AI doesn't react instantly - waits `reactionTime` frames
2. **Prediction error**: Random offset makes AI miss sometimes
3. **Dead zone**: AI doesn't micro-adjust when close enough
4. **Center return**: When ball moves away, AI drifts to center (natural behavior)
5. **Update frequency**: AI doesn't recalculate every frame (slower "thinking")

---

## Game Physics

### Ball (`Ball.js`, 66 lines)
- Position updated by `velocityX/velocityY` each frame
- Wall collision: reverse Y velocity, clamp to bounds
- Paddle collision: reverse X velocity, add random Y variation (up to +/-1), cap Y velocity at [-8, 8]
- Out of bounds: `x < 0` = player2 scores, `x > CANVAS_WIDTH` = player1 scores

### Paddle (`Paddle.js`, 38 lines)
- Moves by `speed` pixels per frame (default: 8)
- Bounds checked: clamped to [0, CANVAS_HEIGHT - PADDLE_HEIGHT]
- AABB collision with ball

### Score (`Score.js`, 51 lines)
- Tracks player1Score and player2Score
- Game over when either reaches `winningScore` (default: 10)

### Constants (`Data.js`, 47 lines)
- Canvas: 800 x 400
- Ball speed: 6, Paddle speed: 8
- Paddle: 10 x 80, Ball size: 8
- Winning score: 10

---

## Key Files

| File | Lines | Role |
|------|-------|------|
| `frontend/.../ts/pages/GameAiPage.ts` | 387 | UI: difficulty buttons, score display, overlays |
| `frontend/.../ts/modules/GameManager.ts` | 863 | Client: rendering, input capture, socket comms |
| `game-engine/app/srcs/js/Game.js` | 700 | Server: game loop, physics, Redis pub/sub |
| `game-engine/app/srcs/js/Ball.js` | 66 | Ball physics and collision |
| `game-engine/app/srcs/js/Paddle.js` | 38 | Paddle movement and collision |
| `game-engine/app/srcs/js/Score.js` | 51 | Score tracking and win detection |
| `game-engine/app/srcs/js/Data.js` | 47 | Game constants |
| `backend-ai/app/srcs/Ai.js` | 153 | AI prediction algorithm |
| `backend-ai/app/server.js` | 122 | AI service: Redis sub/pub, instance management |

---

## Redis Pub/Sub Channels

| Channel | Direction | Payload |
|---------|-----------|---------|
| `game:{uuid}:state` | Game Engine -> AI | `{ ball, paddle2, difficulty }` |
| `game:{uuid}:ai-input` | AI -> Game Engine | `{ paddle2Dir: -1\|0\|1 }` |
| `game:{uuid}:end` | Game Engine -> AI | Game ended (cleanup) |

---

## Evaluation Talking Points

1. **Microservice architecture**: The AI runs as a separate service (`backend-ai` on port 3004), communicating with the game engine via Redis pub/sub. This means the AI can be scaled independently and doesn't block the game loop.

2. **Redis pub/sub for real-time communication**: The game engine publishes state every frame (60 FPS) and the AI responds with paddle direction. Redis pub/sub provides sub-millisecond latency for this loop.

3. **Trajectory prediction**: The MEDIUM/HARD AI doesn't just track the ball - it simulates the full trajectory with wall bounces to predict where the ball will arrive at the paddle. This is computationally more expensive but produces smarter play.

4. **Human-like behavior**: Five mechanisms create realistic play - reaction delay, prediction error, dead zones, center drift, and limited update frequency. An EASY AI genuinely misses the ball sometimes.

5. **Server-authoritative**: All physics run on the game engine. The AI only sends direction (-1, 0, 1). The frontend only renders and sends player input. No game logic runs on the client.

6. **Difficulty scaling**: The three levels create genuinely different experiences - EASY has 0.5s reaction time and 80px error (misses often), HARD has 83ms reaction and 20px error (rarely misses).

7. **Instance management**: The AI service maintains one `Ai` instance per active game, with a 10-minute TTL cleanup for stale instances and game-end event cleanup.
