# Step 1 — Trace map: Live Chat INVITE to Play

## A) Chat / notifications: General socket — send & receive

### Send (frontend → backend)
- **File:** `srcs/services/frontend/srcs/public/scripts/ts/modules/WebsocketManager.ts`
  - `emitGeneral(event: string, data: any)` → `this.generalSocket.emit(event, data)` (line 146-148).
- **Path:** `/realtime-sockets/socket.io/` (General socket).
- **Current invite:** `LiveChatPage.handleInviteFriend()` (line 471-496) calls:
  - `this.wsManager?.emitGeneral('game-invite', { friendId: this.currentSelectedFriend.nbrId, message: '...' })`.
  - Then immediately `this.routerManager.navigateTo('game-online')` (no wait for ack).

### Receive (backend → frontend)
- **Backend:** `srcs/services/realtime-sockets/app/server.js`
  - **No handler for client-emitted events.** The server only:
    - Registers connections in `generalConnections` by `socket.userId` (line 138-151).
    - Subscribes to Redis channel `'notifications'` (line 75-83): on message `{ targetUserId, event, payload }` it does `userSockets.forEach(socket => socket.emit(event, payload))`.
  - So **`game-invite` emitted by the client is never handled** — it is not listened to and is not relayed to the target user.
- **Who pushes to users:** Other services (e.g. **live-chat**) publish to Redis `'notifications'` with `targetUserId`, `event`, `payload`. realtime-sockets then emits `event` with `payload` to that user’s sockets.
- **Frontend listener:** `srcs/services/frontend/srcs/public/scripts/ts/modules/SocialManager.ts`
  - `this.wsManager.onGeneral('notifications', async (data) => { ... switch (data.type) ... })` (line 357-448).
  - For `data.type === 'game-invite'` (line 433-434): only `console.log("Game invite notification for user:", data.friendId)` — **no UI (no Accept/Decline)**.
  - Other types: `friend-request`, `new-message`, `message-read`, `friend-blocked`, `typing`, etc., are handled with UI/state updates.

**Event naming / routing:**
- **Pattern:** Notifications are delivered by publishing to Redis `'notifications'` with `{ targetUserId, event, payload }`. The **event** is what the client receives (e.g. `'notifications'` for most live-chat events; then client branches on `payload.type`). Routing is **by userId**: realtime-sockets looks up `generalConnections.get(targetUserId)` and emits to those sockets.

---

## B) INVITE: current behaviour

### UI handler
- **File:** `srcs/services/frontend/srcs/public/scripts/ts/pages/LiveChatPage.ts`
  - Button: `#invite-friend-btn` created in `createProfileColumn()` (line 150-152), wired in `setupFriendActionButtons()` (line 439-448) → `handleInviteFriend()`.
  - **`handleInviteFriend()` (470-496):**
    - Sends **WS only:** `this.wsManager?.emitGeneral('game-invite', { friendId: this.currentSelectedFriend.nbrId, message: '...' })`.
    - No REST call (commented-out POST to `/live-chat/game-invite`).
    - Then **navigates A to game-online** regardless of response.

### Backend
- **realtime-sockets:** No `socket.on('game-invite', ...)` — the event is **never handled**; nothing is stored and nothing is pushed to the target.
- **live-chat:** No route or handler for game invite (no `/game-invite` in use; frontend uses WS only).

So: **INVITE currently only emits a WS event that no backend listens to; the invited user never receives a notification; there is no Accept/Decline flow.**

---

## C) Game socket: join / create

### Service
- **Path:** `srcs/services/remote-players/app/server.js`, path `/remote-players/socket.io/`.

### Create game
- **Event:** `request-game-uid` (line 203-204) → `requestGameUID(socket, data)`.
- **Payload:** `data.type` in `"local" | "ai" | "remote"`. For `"remote"` a `Game` is created with one player (player 1), stored in `runningGames` and `userGames`, and the client gets `new-game` with `{ UUID, type }` (line 392, 410, 427).
- **Fields:** `UUID` (game id), `type`; optional `settings`, `difficulty` for AI.

### Join game (current)
- **Event:** `join-game` (line 207-211).
- **Payload:** `data.UUID` (game id).
- **Behaviour:** `socket.join(\`game-${data.UUID}\`)` and `socket.emit("joined-game", { UUID: data.UUID })`. **It does not call `game.addPlayer2()`** — it only joins the Socket.IO room. Adding player 2 is done **only in matchmaking** in `onMatchFound()` (line 434-498): `game.addPlayer2(player2Socket, player2UserId)`, then both players get `opponent-found` (with `gameUUID` for player 2).

So for **invite flow**, we need either:
- A new event (e.g. `join-game-invite` or extended `join-game`) so that when the invited user joins by UUID, the server adds them as player 2 (and emits `opponent-found` to both), **or**
- A way for realtime-sockets/backend to tell remote-players to attach a given user’s game socket to an existing game (e.g. via Redis + existing game socket connection).

### Matchmaking (reference)
- Player 1: `request-game-uid` type `"remote"` → gets UUID; then emits action `"play-against-random-player"` on that UUID → matchmaking queue.
- When a second player is found, `onMatchFound` adds player 2 to the game and emits `opponent-found` to both (player 2 gets `gameUUID`).
- Player 2’s client switches to that `gameUUID` and sends `player-2-joined` on the game channel.

---

## D) Short trace map (target flow)

```
MenuPage / Live Chat UI
  → User A selects B, clicks INVITE (#invite-friend-btn)
  → LiveChatPage.handleInviteFriend()
  → wsManager.emitGeneral('game-invite', { friendId: B.nbrId, message })
  → General socket (realtime-sockets)  [CURRENT: no handler; event dropped]

TARGET:
  → realtime-sockets: socket.on('game_invite:create', ...)
       - validate A authenticated, B exists/online
       - create invite (in-memory/Redis): inviteId, fromUserId, toUserId, gameUUID?, status, createdAt
       - publish Redis 'notifications' → targetUserId B: event 'game_invite:received', payload { inviteId, fromUserId, toUserId, fromUsername?, mode?, createdAt }
  → Frontend B: onGeneral('game_invite:received') or onGeneral('notifications') with type
  → Show notification: "<A> invited you to play" [ACCEPT] [DECLINE]

  On ACCEPT (B):
  → emitGeneral('game_invite:accept', { inviteId })
  → realtime-sockets: mark accepted, get gameUUID from invite
       - publish to A: 'game_invite:accepted' { inviteId, matchId: gameUUID }
       - publish to B: 'game_invite:accepted' { inviteId, matchId: gameUUID }
  → A: already on game page with gameUUID (or navigate + join); show "Invite accepted"
  → B: navigate to game-online, then Game socket: emit('join-game', { UUID: gameUUID })
  → remote-players: join-game — must add B as player 2 when game exists and invite is for B (e.g. Redis game-invite:gameUUID = toUserId), then emit opponent-found to both

  On DECLINE (B):
  → emitGeneral('game_invite:decline', { inviteId })
  → realtime-sockets: mark declined, publish to A: 'game_invite:declined' { inviteId }
  → A: toast "Declined" / "Timeout"
```

**Required pieces:**
1. **realtime-sockets:** Handle `game_invite:create` (validate, store invite, push to B); handle `game_invite:accept` / `game_invite:decline`; optionally timeout; publish acks/result events to A and B. If A sends `gameUUID` in create, store it for accept.
2. **Frontend A:** When creating invite, must supply `gameUUID` (so A must have requested a game first — e.g. navigate to game-online, request-game-uid(remote), then send invite with UUID). On `game_invite:accepted`, stay on game and wait for `opponent-found`.
3. **Frontend B:** On `game_invite:received`, show Accept/Decline UI. On accept, send accept; on `game_invite:accepted`, navigate to game and emit `join-game({ UUID: matchId })`.
4. **remote-players:** On `join-game`, if Redis has `game-invite:${UUID}` = B’s userId, treat as invite join: add B as player 2, remove key, emit `opponent-found` to both (same as matchmaking).

---

## Files reference

| Role | File |
|------|------|
| General socket init / emit | `srcs/services/frontend/.../WebsocketManager.ts` |
| Chat UI, INVITE button, handleInviteFriend | `srcs/services/frontend/.../LiveChatPage.ts` |
| Notifications listener (game-invite branch) | `srcs/services/frontend/.../SocialManager.ts` |
| General socket server, Redis relay | `srcs/services/realtime-sockets/app/server.js` |
| Live-chat Redis publish pattern | `srcs/services/live-chat/app/srcs/controlers/controlers.js`, `messageControlers.js` |
| Game socket: request-game-uid, join-game, new-game | `srcs/services/remote-players/app/server.js` |
| Matchmaking, onMatchFound | `srcs/services/remote-players/app/server.js`, `matchmaking.js` |
| Game.addPlayer2 | `srcs/services/game-engine/app/srcs/js/Game.js` |
| Frontend game: request-game-uid, new-game, opponent-found | `srcs/services/frontend/.../GameManager.ts`, `app.ts`, `GameRemotePage.ts` |
