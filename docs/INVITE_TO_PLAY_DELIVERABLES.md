# Invite-to-Play — Deliverables

## 1) Files changed + minimal summary

| File | Summary |
|------|--------|
| **srcs/services/frontend/srcs/public/scripts/ts/modules/WebsocketManager.ts** | Added `setPendingGameInvite(friendId, message, toUsername?)`, `getPendingGameInvite`, `clearPendingGameInvite` so invite is sent after `new-game` UUID is received. Pending includes optional `toUsername` for the waiting overlay. **Invites reçues (persistance):** `pendingReceivedGameInvites` Map, `addPendingReceivedGameInvite(payload)`, `getPendingReceivedGameInvites()`, `removePendingReceivedGameInvite(inviteId)` pour que les notifications survivent à la navigation. |
| **srcs/services/frontend/srcs/public/scripts/ts/pages/LiveChatPage.ts** | `handleInviteFriend`: set pending invite (with friend’s `username` for overlay), navigate to game-online, emit `request-game-uid` (invite is sent from app when `new-game` arrives). Guard on `friendId == null`. Optional `[INVITE_SEND]` debug log. |
| **srcs/services/frontend/srcs/public/scripts/ts/app.ts** | Router listener now stores `currentRouteData`. On `new-game` for game-online: if pending invite exists, emit `game-invite`, then call `gamePageOnline.setWaitingForInviteResponse(pending.friendId, pending.toUsername)` so A sees “Waiting for [username]…”, then clear pending. `game-online` render passes `currentRouteData` to page. |
| **srcs/services/frontend/srcs/public/scripts/ts/modules/RouterManager.ts** | No change (already had `navigateTo(page, data?)` and listener `(page, data?)`). |
| **srcs/services/frontend/srcs/public/scripts/ts/modules/SocialManager.ts** | `pendingGameInvites` Map. Case `game-invite`: `wsManager.addPendingReceivedGameInvite(data)` then `addGameInviteNotification(data)` (banner Accept/Decline; Accept/Decline call `removePendingReceivedGameInvite`). Case `game-invite-accepted`: `removePendingReceivedGameInvite`; if B navigate with `{ joinGameUUID }`, if A toast. Case `game-invite-declined`: toast for A + custom event. **Persistance:** `restorePendingGameInvites(container)` appelé après le rendu avec le nœud `notifications-container` (pas `getElementById`, car le wrapper peut ne pas être encore dans le document sur MenuPage/LiveChatPage). `addGameInviteNotificationToContainer(data, container)` pour réafficher les invites au retour sur menu ou Live Chat. Helpers: `removeGameInviteNotification`, `showToast`, `handleGameInviteAccepted`, `handleGameInviteDeclined`. Optional `DEBUG_INVITE` logs. |
| **srcs/services/frontend/srcs/public/scripts/ts/pages/GameRemotePage.ts** | `render(user?, routeData?)`. If `routeData?.joinGameUUID` call `joinGameByInvite(gameUUID)`: create GameManager with UUID, setup listeners, emit `join-game` on game socket, show "Joining game...". Optional `[INVITE_JOIN]` debug log. Import `RouteData`. **Waiting/decline:** `setWaitingForInviteResponse(friendId, username?)` replaces lobby overlay with “WAITING FOR OPPONENT” + “Waiting for [username] to accept...” + Cancel; subscribes to custom event `game-invite-declined`. `showInviteDeclined()` shows “INVITE DECLINED” + “Your invite was declined.” + “PLAY AGAINST RANDOM PLAYER”. Listener cleared in `requestNewGame`, `handleOpponentFound`, and when showing declined. **Lobby:** “PLAY AGAINST A FRIEND” button removed; invite is only from Live Chat. **Avatar:** `resolveAvatarSrc` handles empty string, trim, and avoids double extension. In `handleOpponentFound`, for player 2 use `data.yourAvatar` / `data.yourUsername` for the left side so B sees their avatar. |
| **srcs/services/realtime-sockets/app/server.js** | In-memory `gameInvites` Map. `socket.on('game-invite')`: validate, store invite, publish to Redis `notifications` for `toUserId` with payload `type: 'game-invite'`. `socket.on('game-invite-accept')`: validate receiver, set Redis `game-invite:<gameUUID>` = toUserId (TTL 60s), publish `game-invite-accepted` to both users. `socket.on('game-invite-decline')`: publish `game-invite-declined` to sender. `DEBUG_INVITE` env logs. |
| **srcs/services/remote-players/app/server.js** | `join-game` handler: after join room + emit joined-game, check Redis `game-invite:<gameUUID>`. If value equals socket.userId and game exists (remote, no player2), then addPlayer2, delete key, set up listener, emit `opponent-found` to both (same shape as matchmaking). Optional `DEBUG_INVITE` log. **Avatar:** In invite flow and matchmaking, when sending `opponent-found` to player 2, include `yourUsername` and `yourAvatar` (so B sees their own avatar on the left). Fallback avatar `'default'` when auth returns null/empty or fetch fails; catch block also sends `yourUsername`/`yourAvatar` with `'default'`. |

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

**`opponent-found`** (emitted on game UUID, to both players):

- Common: `type`, `playerNumber`, `opponentId`, `opponentUsername`, `opponentAvatar`.
- For **player 2** only: `yourUsername`, `yourAvatar` (so the invited/random player 2 can display their own avatar on the left even when `this.user` is not set). Used by frontend in `handleOpponentFound` when `data.playerNumber === 2`.

---

## 3) Manual test plan

1. **A invites B, B accepts → both in same match**
   - A: open Live Chat, select B, click INVITE.
   - A: lands on game-online; after `new-game`, overlay shows **“WAITING FOR OPPONENT”** and **“Waiting for [B’s username] to accept...”** with [CANCEL]. B receives a notification.
   - B: notification shows “X invited you to play” with [Accept] [Decline].
   - B: click Accept.
   - B: navigates to game-online, sees “Joining game...” then opponent-found (ready screen).
   - A: sees opponent-found (ready screen). Both click READY → game starts.

2. **Decline**
   - A invites B; A sees “Waiting for [B]...” overlay.
   - B: click Decline.
   - A: toast “Invite declined.” + overlay switches to **“INVITE DECLINED”** / “Your invite was declined.” with button **“PLAY AGAINST RANDOM PLAYER”**. A can click it to start random matchmaking.

3. **Timeout (optional)**
   - Redis key `game-invite:<gameUUID>` has TTL 60s. If B does not accept within that window, B’s join would not be allowed. Document: “If invite expires (~60s), A can see no feedback unless we add a timeout event; current behaviour: no game starts.”

4. **Refresh**
   - After accept, if B refreshes: they are already in the game (player2); reconnection flow applies if implemented. Invite state is in-memory on realtime-sockets; refresh on A or B does not resend invites. Pending invites in SocialManager are per-session; acceptable.

5. **Notifications persistantes (B navigue puis revient)**
   - A invite B ; B reçoit la notification avec Accept/Decline.
   - B quitte le Live Chat (ou le menu) et va sur un autre écran (ex. Settings, ou Menu si B était en Live Chat).
   - B revient sur le menu (ou le Live Chat).
   - La notification d’invite doit réapparaître avec Accept/Decline. B peut accepter ou décliner après être revenu.

---

## 4) Debug logs (behind flag)

- **Frontend:** Set `window.DEBUG_INVITE = true` in console to enable:
  - `[INVITE_SEND]` (LiveChatPage)
  - `[INVITE_RECV]`, `[INVITE_ACCEPT]`, `[INVITE_DECLINE]` (SocialManager, when `SocialManager.DEBUG_INVITE` is true — currently false)
  - `[INVITE_JOIN]` (GameRemotePage when joining by invite)
- **Backend:** Set env `DEBUG_INVITE=1` or `DEBUG_INVITE=true`:
  - realtime-sockets: `[INVITE_SEND]`, `[INVITE_ACCEPT]`, `[INVITE_DECLINE]`
  - remote-players: `[INVITE_OPPONENT_FOUND]`

---

## 5) Avatar display (post-implementation fixes)

- **Côté A (invitant)** : l’avatar de B (adversaire) est envoyé via `opponentAvatar` dans `opponent-found` ; si l’auth ne renvoie rien, le backend envoie `'default'` pour afficher au moins `public/avatars/default.png`.
- **Côté B (invité)** : le serveur envoie `yourAvatar` et `yourUsername` dans `opponent-found` au joueur 2. Le frontend utilise ces champs dans `handleOpponentFound` pour la colonne de gauche (avatar et pseudo du joueur courant), afin que B voie son propre avatar même si `this.user` n’est pas renpli.
- **Frontend** : `resolveAvatarSrc` gère les chaînes vides, le trim, et évite le double `.png` (ex. `default.png` → `public/avatars/default.png`).
- **Matchmaking** : le même schéma `yourUsername` / `yourAvatar` est envoyé au joueur 2 pour cohérence.

---

## 6) Waiting overlay & invite declined (post-implementation)

- **Côté A après l’invite** : dès que l’invite est envoyée (après `new-game`), l’overlay du lobby est remplacé par **“WAITING FOR OPPONENT”** et **“Waiting for [username] to accept...”** avec un bouton **CANCEL** (retour au lobby “CHOOSE YOUR OPPONENT” + “PLAY AGAINST RANDOM PLAYER”). Le prénom affiché vient du pending invite (`toUsername`).
- **Si B decline** : SocialManager reçoit `game-invite-declined`, affiche le toast puis fait `window.dispatchEvent(new CustomEvent('game-invite-declined'))`. GameRemotePage, s’il est en attente d’invite, écoute cet event et appelle `showInviteDeclined()` : l’overlay devient **“INVITE DECLINED”** / “Your invite was declined.” avec le bouton **“PLAY AGAINST RANDOM PLAYER”** (lance le matchmaking aléatoire).
- **Nettoyage** : le listener sur `game-invite-declined` est retiré dans `clearWaitingForInviteListener()`, appelé à l’annulation (CANCEL), à la réception de `opponent-found`, et avant d’afficher l’écran declined.
- **Lobby game-online** : le bouton **“PLAY AGAINST A FRIEND”** a été supprimé ; l’invitation se fait uniquement depuis le Live Chat (bouton INVITE sur le profil d’un ami).

---

## 7) Notifications persistantes (invites reçues)

- **Problème** : la notification « You have been invited to a game by [username] » avec Accept/Decline disparaissait quand le joueur B quittait le Live Chat ou le menu (ex. aller dans un autre écran puis revenir), car le panneau social est recréé à chaque rendu et le conteneur n’était pas encore dans le document au moment de la restauration.
- **WebsocketManager** : store persistant des invites **reçues** (survit à la navigation) :
  - `pendingReceivedGameInvites` : Map `inviteId` → payload (inviteId, fromUserId, toUserId, gameUUID, fromUsername?, message?).
  - `addPendingReceivedGameInvite(payload)` : appelé à la réception de `game-invite`.
  - `getPendingReceivedGameInvites()` : utilisé au rendu pour réafficher les cartes.
  - `removePendingReceivedGameInvite(inviteId)` : appelé au clic Accept/Decline et à la réception de `game-invite-accepted`.
- **SocialManager** :
  - À la réception de `game-invite` : `wsManager.addPendingReceivedGameInvite(data)` avant d’afficher la carte.
  - Au clic Accept ou Decline : `wsManager.removePendingReceivedGameInvite(inviteId)`.
  - À la réception de `game-invite-accepted` : `wsManager.removePendingReceivedGameInvite(data.inviteId)`.
  - Après construction du DOM dans `render()` : `restorePendingGameInvites(notificationsContainer)` en passant le **nœud** du conteneur (et non `getElementById('notifications-container')`), car sur MenuPage et LiveChatPage le wrapper est ajouté au document **après** `render()` ; avec `getElementById` le conteneur n’était pas trouvé et les invites n’étaient pas réaffichées.
  - `addGameInviteNotificationToContainer(data, container)` : ajoute la carte Accept/Decline dans le conteneur fourni (utilisé par la restauration et par `addGameInviteNotification` qui résout le conteneur via `getElementById` pour les invites en direct).
- **Résultat** : si B navigue (menu → autre page → menu, ou Live Chat → menu → Live Chat), la notification d’invite réapparaît tant qu’elle n’a pas été acceptée ou déclinée.
