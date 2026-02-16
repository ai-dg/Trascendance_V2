# Remote Player (Online Multiplayer) - Evaluation Guide

## Overview

The remote player system allows two users on different machines to play Pong in real time. It uses a **dedicated `remote-players` microservice** (port 3004) for game socket connections, a **Redis-backed matchmaking queue** (FIFO), and a **server-authoritative game engine** (port 3007) running at 60 FPS. The system includes reconnection handling (2-minute timeout), score mirroring per player, and private game invites via Redis keys.

---

## Architecture Diagram

```
+------------------+                                      +------------------+
|   Player 1       |          Socket.IO (/general)        |   Player 2       |
|   (Browser)      |  <================================>  |   (Browser)      |
|                  |                                      |                  |
| GameRemotePage   |       +------------------------+     | GameRemotePage   |
| GameManager      |       |  remote-players        |     | GameManager      |
|                  |       |  (port 3004)           |     |                  |
| W/S -> paddle1   |------>|                        |<----| W/S -> paddle2   |
|                  |       |  - Matchmaking queue   |     |                  |
| Sees NORMAL      |<------|  - Game routing        |---->| Sees MIRRORED    |
| game state       |       |  - Reconnection mgmt  |     | game state       |
+------------------+       +----------+-------------+     +------------------+
                                      |
                           +----------v-------------+
                           |  Game Engine            |
                           |  (port 3007)           |
                           |                        |
                           |  - 60 FPS game loop    |
                           |  - Ball physics        |
                           |  - Collision detection  |
                           |  - Score tracking       |
                           |  - State mirroring      |
                           +------------------------+
```

---

## Complete Flow: Click "Play" to Game Over

### Phase 1: Connection & Authentication

1. Frontend connects to Socket.IO at `/remote-players/socket.io/`
2. Transport: `['websocket', 'polling']` with auto-reconnection (5 attempts)
3. Server `socketAuthMiddleware` validates:
   - JWT token extracted from cookies
   - Signature verified with `JWT_SECRET`
   - Session checked against Redis: `redis.get(jwt:${jti})`
   - `socket.userId` and `socket.user` set for tracking
4. Guest connections supported with localStorage-based guest IDs

**Code**: `remote-players/server.js:137-186`, `app.ts:300+`

### Phase 2: Game Creation

1. User clicks **"PLAY AGAINST RANDOM PLAYER"**
2. `playAgainstRandomPlayer()` calls `GameManager.requestGameID("remote")`
3. Frontend emits `"request-game-uid"` with `{ type: "remote" }`
4. Server generates UUID, creates `Game` instance, tracks `player1Id`
5. Server emits `"new-game" { UUID, type }` back to client
6. Frontend creates `GameManager` with the UUID

**Code**: `GameRemotePage.ts:449-514`, `remote-players/server.js:480-496`

### Phase 3: Matchmaking

The matchmaking uses a **Redis FIFO queue** (`matchmaking:random`):

1. Frontend emits `{ action: "play-against-random-player" }` on the game UUID
2. Server calls `handleMatchmaking()` in `matchmaking.js`
3. **If queue is empty**: player added to Redis list via `rPush()`
   - Also tracked in memory: `searchingPlayers` Map
   - Shows "WAITING FOR AN OPPONENT..." overlay
4. **If queue has a waiting player**: `lPop()` removes oldest entry
   - Verifies waiting player's socket is still connected
   - Handles self-match edge case (same user in 2 tabs)
   - Calls `createMatch()` to pair both players

**Code**: `matchmaking.js:37-170`

### Phase 4: Match Found

`onMatchFound()` callback executes:

1. Player 2's socket is added to Player 1's game via `game.addPlayer2()`
2. Both players' user info fetched from auth service (`fetchAuthUserById()`)
3. **Player 1** receives `opponent-found` on their UUID:
   ```json
   { "type": "opponent-found", "playerNumber": 1,
     "opponentUsername": "...", "opponentAvatar": "..." }
   ```
4. **Player 2** receives `opponent-found` on their OLD UUID with the CORRECT game UUID:
   ```json
   { "type": "opponent-found", "playerNumber": 2,
     "gameUUID": "<player1-uuid>", "opponentUsername": "..." }
   ```
5. **Critical**: Player 2 must switch socket listeners to Player 1's game UUID
6. UI updates: opponent avatar, username, "OPPONENT FOUND!" overlay, READY button

**Code**: `remote-players/server.js:502-575`, `GameManager.ts:219-253`

### Phase 5: Ready & Countdown

1. Each player clicks READY -> `setReady(true)` (remote mode)
2. Each player only marks **themselves** ready (player 1 or player 2)
3. Server tracks readiness and broadcasts `"ready-status"` to both
4. When both ready: 3-2-1 countdown with `"countdown"` events
5. All overlays are force-hidden when countdown starts

**Code**: `GameRemotePage.ts:527-530`, `Game.js:344-426`

### Phase 6: Game Running

Every frame (60 FPS):
1. **Each client**: captures W/S input, sends ONLY their own paddle direction
   - Player 1 sends `{ paddle1: direction, paddle2: 0 }`
   - Player 2 sends `{ paddle1: 0, paddle2: direction }`
2. **Server validates**: checks `socketId` to ensure each player only controls their own paddle
3. **Game engine**: updates physics (ball, collisions, scoring)
4. **Server sends different state to each player** (mirroring - see below)

**Code**: `GameManager.ts:713-759`, `Game.js:557-579`

### Phase 7: Game Over

1. First to 10 points wins (`Score.isGameOver()`)
2. Frontend shows "YOU WIN!" or "YOU LOSE!" (based on mirrored scores)
3. "RETURN TO LOBBY" button calls `requestNewGame()`
4. Game instance cleaned up on server

---

## Score Mirroring

The server sends **different game states** to each player:

### Player 1 receives normal state:
```json
{ "paddle1": { "x": 20, "y": 160 }, "paddle2": { "x": 770, "y": 160 },
  "ball": { "x": 400, "velocityX": 6 },
  "player1Score": 3, "player2Score": 5 }
```

### Player 2 receives mirrored state:
```json
{ "paddle1": { "x": 20, "y": 160 },    // <-- actually paddle2 (their paddle)
  "paddle2": { "x": 770, "y": 160 },    // <-- actually paddle1 (opponent)
  "ball": { "x": 400, "velocityX": -6 }, // <-- reversed direction
  "player1Score": 5, "player2Score": 3 }  // <-- swapped scores
```

**Result**: Both players always see themselves on the left side of the screen with their score on the left. The game feels symmetric.

**Code**: `Game.js:252-317` (`mirrorGameState()`)

---

## Disconnect & Reconnection System

### When a Player Disconnects

1. Server detects socket disconnect
2. If it's a remote game with 2 players:
   - Game **pauses** (stops loop)
   - Both players' ready states reset
   - Remaining player notified: `"opponent-disconnected"`
   - **2-minute timeout** starts (`setTimeout(120000)`)
3. Game is NOT destroyed - kept alive for reconnection

**Code**: `Game.js:102-170`, `remote-players/server.js:292-332`

### Reconnection Flow

1. Returning player loads the game page
2. Frontend calls `check-reconnection` on socket
3. Server checks `runningGames` for any game waiting for this user
4. If found: emits `"reconnection-available"` with game state and score
5. Player sees "ONGOING GAME FOUND" with RECONNECT / START NEW GAME buttons
6. On RECONNECT:
   - Server calls `game.reconnectPlayer(userId, socket)`
   - Both players notified: `"opponent-reconnected"`
   - Both must click READY again to resume
   - Game resumes from where it left off (scores preserved)

**Code**: `remote-players/server.js:334-421`, `GameRemotePage.ts:157-278`

### Timeout & Abandon

- **Timeout** (2 min): `"reconnection-timeout"` - game destroyed, remaining player returns to lobby
- **Abandon**: If disconnected player starts a new game instead of reconnecting, `"opponent-abandoned"` sent to remaining player
- **Reject**: Player can click "START NEW GAME" which emits `"reject-reconnection"`, notifying the other player

---

## Private Game (Friend Invite)

### Invite Flow

1. Player A sends invite via chat: `"game-invite"` event with `{ friendId, gameUUID }`
2. Server stores invite in memory and publishes notification via Redis
3. Player B receives notification and clicks accept
4. `"game-invite-accept"` stores acceptance in Redis: `game-invite:{gameUUID}` with 60s TTL
5. Player B navigates to game page and emits `"join-game"` with the UUID
6. Server checks Redis key, verifies user ID matches acceptor
7. If valid: adds Player B to game, emits `opponent-found` to both

**Code**: `realtime-sockets/server.js:161-215`, `remote-players/server.js:213-278`

---

## Socket.IO Protocol Reference

### Client -> Server

| Event | Payload | Purpose |
|-------|---------|---------|
| `request-game-uid` | `{ type: "remote" }` | Create new game |
| `<UUID>` `{ action: "play-against-random-player" }` | | Start matchmaking |
| `<UUID>` `{ action: "player-ready", player: 1\|2 }` | | Mark ready |
| `<UUID>` `{ state: { paddle1, paddle2 } }` | | Paddle input (each frame) |
| `<UUID>` `{ action: "pause-game" }` | | Pause |
| `<UUID>` `{ action: "resume-game" }` | | Resume |
| `<UUID>` `{ action: "cancel-matchmaking" }` | | Cancel search |
| `<UUID>` `{ action: "player-left" }` | | Leave (keep game for reconnect) |
| `<UUID>` `{ action: "destroy-game" }` | | Destroy permanently |
| `<UUID>` `{ action: "player-2-joined" }` | | P2 confirms UUID switch |
| `<UUID>` `{ action: "reject-reconnection" }` | | Reject reconnect offer |
| `check-reconnection` | | Check for waiting game |
| `reconnect-to-game` | `{ gameUUID }` | Attempt reconnect |
| `join-game` | `{ UUID }` | Join private game |

### Server -> Client

| Event | Payload | Purpose |
|-------|---------|---------|
| `new-game` | `{ UUID, type }` | Game created |
| `opponent-found` | `{ playerNumber, opponentUsername, opponentAvatar, gameUUID }` | Match made |
| `ready-status` | `{ player1Ready, player2Ready }` | Readiness update |
| `countdown` | `{ count: 3\|2\|1\|0 }` | Countdown tick |
| `game-start` | `{}` | Game begins |
| `game-update` | `{ state: { paddle1, paddle2, ball, scores, gameRunning } }` | State (60 FPS) |
| `game-paused` | `{ state }` | Game paused |
| `opponent-disconnected` | `{ message, waitingForReconnection, gameState }` | Opponent left |
| `opponent-reconnected` | `{ message, opponentUsername, gameState }` | Opponent returned |
| `reconnection-timeout` | `{ message }` | 2min expired |
| `opponent-abandoned` | `{ message }` | Opponent started new game |
| `reconnection-available` | `{ gameUUID, gameState, message }` | Game waiting |
| `reconnection-success` | `{ gameUUID, gameState, playerNumber, opponentUsername }` | Reconnected |
| `matchmaking-error` | `{ error, message }` | Queue error |

---

## Key Files

| File | Lines | Role |
|------|-------|------|
| `remote-players/app/server.js` | 689 | Socket.IO server, game routing, reconnection |
| `remote-players/app/matchmaking.js` | 234 | Redis FIFO matchmaking queue |
| `game-engine/app/srcs/js/Game.js` | 700 | Server-side game loop, mirroring, disconnect |
| `game-engine/app/srcs/js/Ball.js` | 67 | Ball physics |
| `game-engine/app/srcs/js/Paddle.js` | 39 | Paddle movement |
| `game-engine/app/srcs/js/Score.js` | 52 | Score tracking |
| `frontend/.../ts/pages/GameRemotePage.ts` | 1262 | Remote game UI, overlays, reconnection UI |
| `frontend/.../ts/modules/GameManager.ts` | 863 | Client: rendering, input, socket comms |
| `gateway/nginx/nginx.conf` | 195 | WebSocket routing to services |

---

## Evaluation Talking Points

1. **Server-authoritative architecture**: All physics run on the game engine. Each client can only send their OWN paddle direction. The server validates input by socket ID to prevent cheating.

2. **Redis-backed matchmaking**: FIFO queue in Redis ensures fair matching. Handles edge cases: stale entries (disconnected players still in queue), self-matching (same user in 2 tabs), and connected-check before creating matches.

3. **Score mirroring**: The `mirrorGameState()` function sends different states to each player - swapping paddles, reversing ball direction, and swapping scores. Both players see themselves on the left side. This is transparent to the frontend.

4. **Reconnection resilience**: If a player disconnects, the game pauses and waits 2 minutes. The returning player can reconnect, restore their player number, see the current score, and resume after both click READY. Three outcomes handled: reconnect, timeout, and abandon.

5. **Player 2 UUID switching**: When matched, Player 2 receives the correct game UUID in the `opponent-found` event and must switch their socket listener from their temporary UUID to the matched game's UUID. This is handled transparently in `GameManager.handleOpponentFound()`.

6. **Private game invites**: Uses Redis keys with 60-second TTL for invite acceptance. The accepting player's user ID is stored in Redis so the game server can verify the join request. This prevents unauthorized players from joining private games.

7. **Socket authentication**: Every connection validated with JWT + Redis. Ping every 5 seconds with 3-second timeout for fast disconnect detection. Supports both authenticated users and guest connections.

8. **Nginx WebSocket routing**: Long-lived connections with 3600s (1 hour) read/send timeouts. Separate routes for `/remote-players/` and `/realtime-sockets/` with proper Upgrade headers.
