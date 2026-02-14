# Auth session investigation — Step 1 & 2

## Step 1 — Auth sources of truth

### 1) Where `arcade_user` is written
- **AuthManager.ts:48** — `localStorage.setItem('arcade_user', JSON.stringify(this.currentUser))` inside `saveUserToStorage()` when `this.currentUser` is truthy.
- `saveUserToStorage()` is called from `setUserAndPersist(user)` (AuthManager.ts:57).
- `setUserAndPersist` is called from **app.ts** after auth/me 200, when keeping rehydrated user, or after login/OTP success; and from **AuthManager** after logout clears user (then saveUserToStorage removes the key).

### 2) Where `arcade_user` is cleared
- **AuthManager.ts:50** — `localStorage.removeItem('arcade_user')` inside `saveUserToStorage()` when `this.currentUser` is null.
- **AuthManager.ts:387–388** — Only path that sets `this.currentUser = null` then `saveUserToStorage()`: inside `logoutHandler()` **try** block after successful `auth/logout` fetch. So **only explicit successful logout** clears `arcade_user`.
- **logoutHandler() catch** block (391–397): does **not** set `currentUser = null` or call `saveUserToStorage()`; only sets sessionStorage and redirects. So on logout **failure**, `arcade_user` is **not** cleared.
- No code clears `arcade_user` on 401/404 or on WebSocket disconnect.

### 3) Intended persistence across refresh
- Yes. `arcade_user` is the rehydration source so session survives refresh (same origin). Comments in app.ts and AuthManager.ts state this.

### 4) How cookies are supposed to persist
- **Set by backend (auth):** controlers.js:400–402 (login_otp), 42auth.js:116 (42 callback) — `setCookie('token', ...)`, `setCookie('sessionId', ...)` with options from `getMainStyleCookieOptions` / `get42CallbackCookieOptions`.
- **Attributes:** path: '/', httpOnly: true, sameSite: 'lax' (or 'none' when isSecure), maxAge 3600; token has no `secure` in dev (controlers.js:419); sessionId has secure when isSecure (420).
- **Read:** Backend reads `request.cookies.token` and `request.cookies.sessionId`. Frontend cannot read them (httpOnly); uses `credentials: 'include'` on fetch so browser sends them.
- **Cleared:** controlers.js:474–476 (logout_route) — clearCookie for token, csrf, sessionId.

---

## Step 2 — Origin / URL usage

### window.location / getBaseUrl
- **RouterManager.ts:117** — `getBaseUrl()`: `document.querySelector("meta[name='api-base-url']")?.getAttribute('content')` or fallback `window.location.host`.
- **RouterManager.ts:123** — `getUrl(endpoint)` = `window.location.protocol + '//' + getBaseUrl() + endpoint`. So API/fetch origin = protocol + meta base_url (or current host).

### Where base_url (meta) is set
- **Frontend server.js:35** — `const host = request.headers['x-forwarded-host'] || request.headers.host || process.env.BASE_URL || "localhost"`; then `reply.view("index.ejs", { base_url: host })`.
- **index.ejs:5** — `<meta name="api-base-url" content="<%= base_url %>">`. So the **first request’s Host** (or X-Forwarded-Host) defines the API base URL for that page.

### Possible front URLs (user entry points)
- `https://localhost` (gateway 443)
- `https://localhost:443`
- `http://localhost:8080` (gateway 8080)
- `http://127.0.0.1:8080`
- `http://127.0.0.1`

### Backend / env
- **.env:64** — `FORTYTWO_REDIRECT_URI=https://localhost/auth/42/callback` (fixed).
- Auth CORS (auth/server.js:53–61) allows multiple origins (localhost, 127.0.0.1, various ports).

### Origin mismatch implication
- **localStorage** is per-origin. So `https://localhost` and `http://127.0.0.1:8080` have **different** storage.
- **Cookies** set without Domain are host-only. Cookie set on response from `https://localhost` is for host `localhost`; browser will **not** send it to `127.0.0.1` (different host).
- So if the user logs in on `https://localhost` then later opens or refreshes as `http://127.0.0.1:8080` (or vice versa), **both** `arcade_user` and auth cookies will be missing for that tab.

---

## Step 3 — Instrumentation (added)

- **[BOOT_ORIGIN]** — app.ts: `window.location.origin`, `host`, `protocol`
- **[BOOT_STORAGE]** — app.ts: presence + length of `localStorage.arcade_user`
- **[BOOT_COOKIES_CLIENT]** — app.ts: `document.cookie` + note that token/sessionId are HttpOnly
- **[AUTH_CLEAR]** — AuthManager: on `logoutHandler` and when `saveUserToStorage` removes `arcade_user`: `console.trace()` for caller stack
- **[API_AUTH_REQ]** — app.ts: auth/me request URL + sameOrigin + credentials=include
- **Backend** — auth controlers: `debug-cookies` and `/me` log request `Origin` (or Referer) and `Cookie` header length

---

## Step 4 — Root cause (with proof)

**Root cause is (A) origin mismatch → different localStorage and cookies not sent.**

Evidence:

1. **base_url is request-dependent (different entry URL → different origin):**  
   `srcs/services/frontend/srcs/config/server.js:35` — `const host = request.headers['x-forwarded-host'] || request.headers.host || process.env.BASE_URL || "localhost"`; then `base_url: host` is passed to the view. So the **first request’s Host** (e.g. `localhost` vs `127.0.0.1:8080`) defines the canonical base URL for that page.

2. **Frontend uses that base for all API calls:**  
   `srcs/services/frontend/srcs/views/index.ejs:5` — `<meta name="api-base-url" content="<%= base_url %>">`.  
   `srcs/services/frontend/srcs/public/scripts/ts/modules/RouterManager.ts:114-123` — `getBaseUrl()` reads that meta; `getUrl(endpoint)` returns `window.location.protocol + '//' + getBaseUrl() + endpoint`. So the app’s idea of “same origin” is **protocol + host (and port)** of the **page that was loaded**. If the user opens the app via `https://localhost` one time and via `http://127.0.0.1:8080` another, they get two different origins.

3. **localStorage and cookies are origin-bound:**  
   - `localStorage` is keyed by origin (scheme + host + port). So `https://localhost` and `http://127.0.0.1:8080` have **different** storage; one tab can have `arcade_user`, the other empty.  
   - Cookies set by the auth backend without an explicit `Domain` are host-only. A cookie set on a response from `https://localhost` is for host `localhost`; the browser does **not** send it to `127.0.0.1` (different host). So in a tab opened as `http://127.0.0.1:8080`, the server receives no auth cookies.

4. **No other root cause fits:**  
   - **(B)** All auth-related fetches (auth/me, debug-cookies, logout) use `credentials: 'include'` (app.ts, AuthManager.ts). So (B) is ruled out.  
   - **(C)** Cookie attributes (path, sameSite, etc.) are correct for same-origin; the issue appears when the **request origin** differs from the origin that set the cookie, which is (A).  
   - **(D)** `arcade_user` is only removed in `AuthManager.logoutHandler()` try block (currentUser = null then saveUserToStorage). No clear on 401/404 or WebSocket disconnect. So (D) is ruled out.

**Conclusion:** When both `arcade_user` and auth cookies are missing on a “refresh”, the request is coming from an **origin different** from the one where the user logged in (e.g. different host or port: localhost vs 127.0.0.1, or different scheme/port). Instrumentation will show different `[BOOT_ORIGIN]` and backend `Origin`/`Cookie` length when the issue reproduces.

---

## Step 5 — Minimal fix (for root cause A)

- **Single canonical origin in dev:** Use one env var (e.g. `BASE_URL` or `APP_URL`) for the public URL of the app and ensure the frontend server injects **that** value into the meta `api-base-url` instead of the raw `Host` header when available. That way, no matter whether the user hits the gateway as `localhost` or `127.0.0.1:8080`, the app and API base URL stay consistent if we set e.g. `BASE_URL=https://localhost` in .env and the gateway forwards Host or X-Forwarded-Host.  
- **Minimal code change:** In `srcs/services/frontend/srcs/config/server.js`, when serving the index view, prefer `process.env.BASE_URL` (or a new `APP_CANONICAL_ORIGIN`) over `request.headers.host` so that the meta base URL is stable. Document that users must use the same canonical URL (e.g. always `https://localhost`) and that `127.0.0.1` and `localhost` are not interchangeable for session persistence.
- **Alternative (even smaller):** Only document that the app must be used at a single canonical URL (e.g. `https://localhost`) and that opening or refreshing via `http://127.0.0.1:8080` will not share session; add a comment in server.js and a short note in README. No code change to auth logic.

**Implemented:** Frontend server redirects to `APP_CANONICAL_ORIGIN` when set and request origin differs, so all traffic uses one origin and session persists. Set e.g. `APP_CANONICAL_ORIGIN=https://localhost` in frontend env.

---

## Step 6 — Verification checklist

- [ ] **Login → refresh same tab:** Log in (42 or OTP), then refresh (F5). Still on menu, user still shown. Console: `[BOOT_ORIGIN]` same as before refresh, `[BOOT_STORAGE] arcade_user present= true`, backend logs `token present= true`.
- [ ] **New tab same origin:** Log in, open new tab, same URL (e.g. https://localhost/). Still logged in (cookies sent). If using `APP_CANONICAL_ORIGIN`, opening http://127.0.0.1:8080 in new tab should redirect to canonical and then show logged in.
- [ ] **localhost vs 127.0.0.1:** Either set `APP_CANONICAL_ORIGIN=https://localhost` and confirm 127.0.0.1 redirects and session shared, or document that only one entry URL must be used.
- [ ] **WS reconnect:** Disconnect network briefly or restart socket service; WS reconnects. No global logout; no `[AUTH_CLEAR]` except on explicit logout.
- [ ] **Explicit logout:** Click logout. Console: `[AUTH_CLEAR] logoutHandler called` and trace. After redirect, `[BOOT_STORAGE] arcade_user present= false` and AUTH page shown.
