# Invite-to-Play — Deliverables

## 1) Files changed + minimal summary

| File | Summary |
|------|--------|
| **srcs/services/frontend/srcs/public/scripts/ts/modules/WebsocketManager.ts** | Added `setPendingGameInvite`, `getPendingGameInvite`, `clearPendingGameInvite` so invite is sent after `new-game` UUID is received. |
| **srcs/services/frontend/srcs/public/scripts/ts/pages/LiveChatPage.ts** | `handleInviteFriend`: set pending invite, navigate to game-online, emit `request-game-uid` (invite is sent from app when `new-game` arrives). Guard on `friendId == null`. Optional `[INVITE_SEND]` debug log. |
| **srcs/services/frontend/srcs/public/scripts/ts/app.ts** | Router listener now stores `currentRouteData`. On `new-game` for game-online: if pending invite exists, emit `game-invite` with friendId, gameUUID, inviteId, message then clear pending. `game-online` render passes `currentRouteData` to page. |
| **srcs/services/frontend/srcs/public/scripts/ts/modules/RouterManager.ts** | No change (already had `navigateTo(page, data?)` and listener `(page, data?)`). |
| **srcs/services/frontend/srcs/public/scripts/ts/modules/SocialManager.ts** | `pendingGameInvites` Map. Case `game-invite`: call `addGameInviteNotification(data)` (banner with Accept/Decline; on Accept emit `game-invite-accept`, on Decline emit `game-invite-decline`). Case `game-invite-accepted`: if receiver is B navigate to game-online with `{ joinGameUUID }`, if A show toast. Case `game-invite-declined`: toast for A. Helpers: `removeGameInviteNotification`, `showToast`, `handleGameInviteAccepted`, `handleGameInviteDeclined`. Optional `DEBUG_INVITE` logs. |
| **srcs/services/frontend/srcs/public/scripts/ts/pages/GameRemotePage.ts** | `render(user?, routeData?)`. If `routeData?.joinGameUUID` call `joinGameByInvite(gameUUID)`: create GameManager with UUID, setup listeners, emit `join-game` on game socket, show "Joining game...". Optional `[INVITE_JOIN]` debug log. Import `RouteData`. |
| **srcs/services/realtime-sockets/app/server.js** | In-memory `gameInvites` Map. `socket.on('game-invite')`: validate, store invite, publish to Redis `notifications` for `toUserId` with payload `type: 'game-invite'`. `socket.on('game-invite-accept')`: validate receiver, set Redis `game-invite:<gameUUID>` = toUserId (TTL 60s), publish `game-invite-accepted` to both users. `socket.on('game-invite-decline')`: publish `game-invite-declined` to sender. `DEBUG_INVITE` env logs. |
| **srcs/services/remote-players/app/server.js** | `join-game` handler: after join room + emit joined-game, check Redis `game-invite:<gameUUID>`. If value equals socket.userId and game exists (remote, no player2), then addPlayer2, delete key, set up listener, emit `opponent-found` to both (same shape as matchmaking). Optional `DEBUG_INVITE` log. |

---

## 2) Event payload schemas (General socket / notifications)

All delivered via existing pattern: Redis channel `notifications` → realtime-sockets emits `event: 'notifications'` with `payload`; frontend uses `payload.type`.

- **type: `game-invite`** (to invitee)  
  `inviteId`, `fromUserId`, `toUserId`, `gameUUID`, `fromUsername?`, `createdAt`, `message?`

- **type: `game-invite-accepted`** (to both)  
  `inviteId`, `fromUserId`, `toUserId`, `gameUUID`

- **type: `game-invite-declined`** (to sender)  
  `inviteId`, `fromUserId`, `toUserId`, `gameUUID`

Client → realtime-sockets (General socket):

- **`game-invite`** (create): `friendId`, `gameUUID`, `inviteId`, `message`
- **`game-invite-accept`**: `inviteId`
- **`game-invite-decline`**: `inviteId`

Game socket (remote-players):

- **`join-game`**: `{ UUID: string }` — if Redis `game-invite:<UUID>` = this user, server adds player2 and emits `opponent-found` to both.

---

## 3) Manual test plan

1. **A invites B, B accepts → both in same match**
   - A: open Live Chat, select B, click INVITE.
   - A: should land on game-online (lobby); shortly after, B receives a notification.
   - B: notification shows “X invited you to play” with [Accept] [Decline].
   - B: click Accept.
   - B: should navigate to game-online and see “Joining game...” then opponent-found (ready screen).
   - A: should see opponent-found (ready screen). Both click READY → game starts.

2. **Decline**
   - A invites B.
   - B: click Decline.
   - A: toast “Invite declined.” No game starts.

3. **Timeout (optional)**
   - Redis key `game-invite:<gameUUID>` has TTL 60s. If B does not accept within that window, B’s join would not be allowed. Document: “If invite expires (~60s), A can see no feedback unless we add a timeout event; current behaviour: no game starts.”

4. **Refresh**
   - After accept, if B refreshes: they are already in the game (player2); reconnection flow applies if implemented. Invite state is in-memory on realtime-sockets; refresh on A or B does not resend invites. Pending invites in SocialManager are per-session; acceptable.

---

## 4) Debug logs (behind flag)

- **Frontend:** Set `window.DEBUG_INVITE = true` in console to enable:
  - `[INVITE_SEND]` (LiveChatPage)
  - `[INVITE_RECV]`, `[INVITE_ACCEPT]`, `[INVITE_DECLINE]` (SocialManager, when `SocialManager.DEBUG_INVITE` is true — currently false)
  - `[INVITE_JOIN]` (GameRemotePage when joining by invite)
- **Backend:** Set env `DEBUG_INVITE=1` or `DEBUG_INVITE=true`:
  - realtime-sockets: `[INVITE_SEND]`, `[INVITE_ACCEPT]`, `[INVITE_DECLINE]`
  - remote-players: `[INVITE_OPPONENT_FOUND]`
