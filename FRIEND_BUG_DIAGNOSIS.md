# Diagnostic bug ami (self-friend) — Step 1 & 2

## Step 1 — Trace map (flux ajout d'ami de bout en bout)

### Envoi de la demande (add friend)
- **UI** : `SocialManager.ts` — clic sur "Send" (l.107–121) → `addFriend(username)` (l.214).
- **Payload** : `addFriend()` (l.226–242) : `senderId = this.currentUser.id`, `receiverId = await this.getIdByUsername(username)` → `body: JSON.stringify({ senderId, receiverId })`.
- **HTTP** : `fetch(POST /live-chat/friend-request`, body) — pas d’émission WebSocket pour l’envoi de la demande.
- **Backend** : `controlers.js` `friend_request_route` (l.24–99) : lit `receiverId` du body, `userId` du JWT, INSERT `(userId, receiverId, 'pending', userId)`, publie Redis `targetUserId: receiverId`, `payload: { type: 'friend-request', userId, message }`.

### Réception temps réel (WebSocket)
- **Redis → Socket** : `realtime-sockets/app/server.js` (l.76–83) : subscribe `notifications` → `socket.emit(event, payload)` vers les sockets de `targetUserId`.
- **Frontend WS** : `SocialManager.ts` `setupSocketListeners()` (l.324–328) : `wsManager.onGeneral('notifications', callback)` → switch sur `data.type`.
- **friend-request** : `addFriendRequestNotification(data.userId, data.message)` (l.355–359) — `data.userId` = l’expéditeur de la demande.
- **friend-request-accepted** : `loadFriendsList()` (l.362–365) — pas d’usage du payload pour construire la liste.

### Mise à jour de la liste d’amis
- **State** : pas de store global ; la liste est recréée à chaque fois via `loadFriendsList()` → `fetch(GET /live-chat/get-friends)` (l.708–714).
- **Backend** : `get_friends_route` (l.179–251) : JWT → `userId`, SQL `CASE WHEN user_id=? THEN friend_id ELSE user_id END` sur les lignes `(user_id, friend_id)` où `user_id=? OR friend_id=?` et `status='accepted'`.
- **Render** : `displayFriends(data.friends)` (l.722, 744–778) : pour chaque `friend`, `friendId = Number(friend.id)` (l.764), affichage.

### Schéma résumé
```
UI (Send) → addFriend(username)
  → senderId = currentUser.id, receiverId = getIdByUsername(username)
  → POST /live-chat/friend-request { senderId, receiverId }
  → Backend: INSERT (userId JWT, receiverId), Redis → targetUserId: receiverId

[Receveur] WS 'notifications' payload { type, userId, message }
  → addFriendRequestNotification(data.userId)  // userId = requester

[Accepter] POST /friend-request-response { senderId, action: 'accept' }
  → Backend: UPDATE (senderId, userId JWT), Redis → targetUserId: senderId (requester)

[Requester] WS 'notifications' { type: 'friend-request-accepted', userId (accepter) }
  → loadFriendsList() → GET /get-friends → displayFriends(data.friends)
```

---

## Step 2 — Hypothèses classées (sans changement de code)

1. **Payload envoyé avec `receiverId` = `currentUser.id`** (inversion ou typo)  
   Le body contient `receiverId` égal à l’utilisateur connecté → INSERT (B, B). Très plausible si une variable est mal utilisée (ex. `receiverId: senderId` ou confusion dans le nom).

2. **Backend utilise `senderId` au lieu de `receiverId` pour l’INSERT**  
   Si le contrôleur lisait `request.body.senderId` pour la cible, on aurait (userId, userId). Peu plausible : le code ne lit que `receiverId` (l.34–35).

3. **`getIdByUsername(username)` renvoie l’id du current user**  
   Pour un autre pseudo, l’auth renverrait quand même l’id du JWT. Peu plausible vu l’API auth (404 si non trouvé, pas de fallback sur le user courant).

4. **Handler WS `friend-request-accepted` utilise le mauvais champ pour “l’autre user”**  
   Actuellement on ne fait que `loadFriendsList()` sans utiliser le payload ; la liste vient de GET /get-friends. Donc peu plausible pour une “auto-ajout” côté affichage.

5. **État / closure : `currentUser` obsolète au moment du clic**  
   Si `currentUser` est mis à jour entre le rendu et le clic (ex. autre onglet), `senderId` pourrait être celui d’un autre user. Possible mais moins direct que (1).

6. **GET /get-friends renvoie le `userId` courant dans la liste**  
   Nécessiterait une ligne (B, B) en base ; la cause serait alors l’INSERT (hypothèse 1 ou 2), pas la requête GET en elle-même.

**Les 2–3 plus probables à vérifier par instrumentation :**
- (1) Contenu du payload juste avant l’envoi : `me.id`, `receiverId`, et body complet.
- (2) Backend : confirmer qu’on n’utilise jamais `senderId` pour l’INSERT (déjà vérifié en lecture).
- (3) Réponse GET /get-friends et ids passés à `displayFriends` (liste d’ids affichée).

---

## Step 3 — Instrumentation (minimale, amovible)

- **SocialManager.ts**  
  - Avant l’envoi : `console.log('[ADD_FRIEND_SEND] me.id=', senderId, 'target(receiverId)=', receiverId, 'full payload=', payload)`.  
  - Dans le handler WS `notifications` : si `data.type === 'friend-request' || data.type === 'friend-request-accepted'` → `console.log('[ADD_FRIEND_RECV] event=', data.type, 'payload=', data)`.  
  - Dans `loadFriendsList()` après `data.friends` : `console.log('[ADD_FRIEND_STATE] about to display friends, ids=', friendIds, 'me.id=', this.currentUser?.id)`.

- **controlers.js (live-chat)**  
  - Au début de `friend_request_route` : `console.log('[ADD_FRIEND_SEND] backend received body.senderId=', bodySenderId, 'body.receiverId=', receiverId, 'jwt.userId=', userId)`.

---

## Step 4 — Où l’id devient faux (cause racine)

**Conclusion :** Le mauvais id (soi-même comme ami) est **autorisé** à être enregistré parce que dans `controlers.js` (friend_request_route) il n’y a **aucune vérification** que `receiverId !== userId` avant l’INSERT (l.52–56). Dès que le client envoie `receiverId` égal à l’id du demandeur (saisie de son propre pseudo, ou bug front envoyant `senderId` à la place de `receiverId`), la ligne `(userId, userId)` est insérée.

**Phrase de cause racine :**  
*« The wrong id is introduced at **controlers.js** (friend_request_route) because the backend never validates that receiverId !== userId before the INSERT (lines 52–56), so when the client sends receiverId equal to the requester’s id, the row (userId, userId) is stored. »*

---

## Step 5 — Correctif minimal appliqué

1. **Backend** (`srcs/services/live-chat/app/srcs/controlers/controlers.js`)  
   - Juste après extraction de `receiverId` et `userId` : rejet 400 si `receiverId == null` ou `Number(receiverId) === Number(userId)` avec le message « You cannot add yourself as a friend ».  
   - Aucun changement de contrat API ni de schéma DB.

2. **Frontend** (`srcs/services/frontend/srcs/public/scripts/ts/modules/SocialManager.ts`)  
   - Dans `addFriend()`, après `if (!receiverId)` : garde `if (Number(receiverId) === Number(this.currentUser.id))` → message d’erreur et return.  
   - Dans `displayFriends()` : ne jamais afficher un ami dont `friend.id === currentUser.id` (guard + `console.error` si on en reçoit un).

---

## Step 6 — Vérification manuelle

1. **A ajoute B, puis B ajoute A**  
   - A envoie une demande à B, B accepte → les deux listes doivent contenir l’autre, pas soi.  
   - B envoie une demande à A, A accepte → idem.

2. **Rafraîchir les deux clients**  
   - Vérifier que les listes restent correctes après rechargement.

3. **Sens inverse**  
   - B ajoute A en premier, puis A ajoute B → même comportement attendu.

4. **Auto-ajout bloqué**  
   - Taper son propre pseudo dans « Add friend » → message « You cannot add yourself as a friend », pas d’entrée en base.

5. **Console**  
   - Après vérification, retirer les logs `[ADD_FRIEND_SEND]`, `[ADD_FRIEND_RECV]`, `[ADD_FRIEND_STATE]` et le log backend `[ADD_FRIEND_SEND]` si vous ne voulez plus d’instrumentation.
