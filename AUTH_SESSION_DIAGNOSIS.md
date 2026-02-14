# Diagnostic: refresh déconnecte (session non persistée)

## Step A — Mécanisme d’auth actuel (frontend)

- **Où la réponse login est traitée**  
  `AuthPage` → `handleLogin` (app.ts) → `authManager.login()` ; si succès sans OTP ou après OTP → `handleOtpVerificationComplete` qui appelle `authManager.getConnectedUser()` et met à jour `this.currentUser`.

- **Stockage token/session**  
  - **Cookie** : le backend auth définit `token` (JWT) + `sessionId` (httpOnly, sameSite: 'none', secure: true, path: '/'). Le frontend ne lit pas le cookie en JS.  
  - **localStorage** : clé `arcade_user` utilisée par `AuthManager.loadUserFromStorage()` / `saveUserToStorage()`. **Problème** : après login/OTP, seul `App.currentUser` est mis à jour en mémoire ; **aucun code n’écrit l’utilisateur dans `arcade_user`** après un auth réussi.  
  - **sessionStorage** : `not_authenticated` (flag pour éviter de refaire des checks après logout).  
  - **Mémoire** : `App.currentUser` et `AuthManager.currentUser` (AuthManager est rechargé depuis localStorage au constructeur, mais localStorage n’est jamais rempli côté login).

- **Réhydratation au chargement**  
  - `App` : dans `initialize()`, appelle **uniquement** `this.getConnectedUser()` (fetch `auth/me` avec `credentials: 'include'`).  
  - Si la réponse est ok → `this.currentUser = user` et navigation menu.  
  - Si 401, timeout ou erreur → `getConnectedUser()` retourne `null` → `this.currentUser` reste `null` → `render()` affiche la page auth (pas de fallback sur localStorage).  
  - **AuthManager** : `loadUserFromStorage()` au constructeur remplit `this.currentUser` depuis `arcade_user`, mais comme cette clé n’est jamais mise à jour après login, elle est vide (sauf après un ancien logout qui a clear).

- **Auth des requêtes API**  
  - `credentials: 'include'` sur les fetch (auth/me, login, etc.) pour envoyer les cookies.  
  - Pas de header `Authorization` pour le JWT (tout repose sur le cookie).

- **Auth WebSocket**  
  - `WebsocketManager.init(origin)` : connexion Socket.IO avec `withCredentials: true`.  
  - Pas de token en query ni en message initial ; l’auth se fait côté serveur via les cookies de la main.

**Résumé**  
- **Auth Storage** : cookie (backend, clé `token`) + localStorage `arcade_user` (prévu mais jamais écrit après login).  
- **Rehydration** : au boot, uniquement `getConnectedUser()` (auth/me) ; pas de lecture de `arcade_user`.  
- **API Auth** : `credentials: 'include'` sur les fetch.  
- **WS Auth** : cookies via `withCredentials: true`.

---

## Step B — Hypothèses classées

1. **Token / état gardé seulement en mémoire (App.currentUser), pas persisté**  
   Après login on met à jour `App.currentUser` (et éventuellement AuthManager via OTP) mais on n’écrit jamais dans `arcade_user`. Au refresh, on ne fait que auth/me ; si ça échoue (401, timeout, réseau), on reste avec `currentUser = null`. **Très plausible.**

2. **Cookie non envoyé (SameSite / Secure / Domain / Path)**  
   Le backend met déjà sameSite: 'none', secure: true. Si l’app est servie en HTTPS et les appels auth passent par le même domaine (ex. gateway), les cookies devraient partir. Possible si domaine ou chemin diffère. **Plausible.**

3. **sessionStorage effacé au refresh**  
   sessionStorage survit au refresh ; il n’y a pas de clear au mount qui expliquerait une déconnexion. **Peu plausible.**

4. **Logout déclenché au load à cause d’un échec auth/me (401 ou erreur)**  
   Si auth/me renvoie 401 ou si le fetch throw (timeout 5s, réseau), `getConnectedUser()` retourne `null` et on n’a aucun fallback : on affiche la page auth. C’est exactement le scénario “refresh = déconnecté”. **Très plausible.**

5. **WebSocket reconnect marque l’utilisateur non authentifié**  
   Pas de logique dans le code qui fait un “global logout” sur échec WS. **Peu plausible.**

6. **Routing SPA / guard avant rehydration**  
   La première navigation dépend du résultat de `initialize()` ; il n’y a pas de redirect explicite “auth” avant d’avoir la réponse de getConnectedUser. **Peu plausible.**

**Conclusion** : Les causes les plus probables sont (1) et (4) : pas de persistance de l’utilisateur côté front après login, et aucun fallback sur localStorage quand auth/me échoue au boot.

---

## Step C — Instrumentation (temporaire, amovible)

- **`[AUTH_BOOT]`** au démarrage dans `initialize()` : indique qu’on appelle auth/me, puis selon le cas « auth/me ok », « rehydrating from localStorage » ou « no user ».
- **`[AUTH_LOGIN]`** après boot avec user (persist) et après OTP (user set + persist).
- **`[AUTH_API_401]`** dans `getConnectedUser()` quand `res.status === 401` ou quand le fetch throw (timeout/réseau).
- **`[AUTH_CLEAR]`** dans `AuthManager.logoutHandler()` quand on fait logout.
- **`[WS_AUTH]`** dans `WebsocketManager.init()` avant `io(origin, ...)` : credentials utilisées (cookies).

---

## Step D — Cause racine

**« Refresh logs out because the app never persists the authenticated user to localStorage after login/OTP, and on boot it only trusts auth/me; when auth/me returns null (401, timeout, or network error) at app.ts getConnectedUser(), there is no fallback, so currentUser stays null and the auth page is shown. »**

- **Fichier/ligne** : comportement introduit par l’absence de persistance après login (aucune écriture dans `arcade_user`) et par l’absence de rehydration depuis localStorage dans `app.ts` `initialize()` quand `getConnectedUser()` retourne `null`.

---

## Step E — Correctif minimal appliqué

1. **AuthManager**  
   - Nouvelle méthode publique `setUserAndPersist(user: User | null)` : met à jour `currentUser` et appelle `saveUserToStorage()`.

2. **App.initialize()**  
   - Quand `getConnectedUser()` retourne un user : appeler `this.authManager.setUserAndPersist(user)`.  
   - Quand `getConnectedUser()` retourne `null` : lire `this.authManager.getCurrentUser()` (localStorage) ; si présent, faire `this.currentUser = stored` (rehydration). Le reste du flux (WS, navigation menu si page auth) est inchangé et s’applique aussi au user rehydraté.

3. **handleOtpVerificationComplete**  
   - Après avoir mis à jour `this.currentUser` avec le résultat de `getConnectedUser()`, appeler `this.authManager.setUserAndPersist(this.currentUser)`.

Aucun changement de contrat API, pas de modification du schéma ou du backend. On ne clear pas le localStorage sur 401 (uniquement au logout explicite).

---

## Step F — Vérification

- Login → refresh → l’utilisateur reste connecté (menu affiché).
- Nouvel onglet (même origine) → toujours connecté si attendu.
- WS reconnect après refresh : init WS avec le même user.
- Pas de redirect en boucle ni de flicker auth (rehydration avant premier render si besoin).
- Après logout explicite : localStorage vidé, flag session, redirection ; au refresh suivant on voit la page auth.
