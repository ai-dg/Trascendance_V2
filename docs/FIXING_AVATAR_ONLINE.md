# Fixing avatar display in online game

Ce document décrit les correctifs appliqués pour afficher correctement les avatars des joueurs en partie en ligne (invite depuis Live Chat et Play Against Random Player).

---

## Problème

- **Côté A (invitant ou joueur 1)** : l’avatar de l’adversaire (B) restait `unknownPlayer.jpeg`.
- **Côté B (invité ou joueur 2)** : son propre avatar (colonne de gauche) restait `unknownPlayer.jpeg`.
- **Play Against Random Player** : même comportement pour les deux joueurs (avatar adversaire non affiché).

---

## Causes

1. **Backend** : quand l’auth ne renvoie pas d’avatar (ou que `fetchAuthUserById` échoue), on envoyait `opponentAvatar: null` / `yourAvatar: null` → le frontend affichait le fallback `unknownPlayer.jpeg`.
2. **Frontend** : `resolveAvatarSrc` ajoutait systématiquement `.png` → si le backend envoyait déjà `"default.png"`, le chemin devenait `public/avatars/default.png.png` (image introuvable).
3. **Joueur 2** : le frontend utilisait uniquement `this.user` pour afficher “mon” avatar ; en flux invite (ou après nav), `this.user.avatar` pouvait être vide.

---

## Correctifs

### 1. Backend — remote-players (`srcs/services/remote-players/app/server.js`)

- **Flux invite (join-game)**  
  Lors de l’envoi de `opponent-found` après acceptation d’une invite :
  - `player1Avatar` / `player2Avatar` : si l’auth renvoie une valeur non vide (après `trim()`), on l’utilise ; sinon `socket.avatar`, sinon **`'default'`** (plus de `null`).
  - En cas d’erreur du fetch auth (bloc `catch`) : `opponentAvatar` et `yourAvatar` passent à **`'default'`** au lieu de `null`.

- **Flux matchmaking (onMatchFound — Play Against Random Player)**  
  Même logique :
  - `player1Avatar` = `(player1Info?.avatar && String(player1Info.avatar).trim()) || player1Socket?.avatar || 'default'`
  - `player2Avatar` = `(player2Info?.avatar && String(player2Info.avatar).trim()) || player2Socket?.avatar || 'default'`
  - Dans le `catch` : `opponentAvatar: player1Socket.avatar || 'default'` et `opponentAvatar: player2Socket.avatar || 'default'` (et `yourAvatar: 'default'` pour le joueur 2).

- **Payload pour le joueur 2**  
  Dans les deux flux (invite et matchmaking), l’event `opponent-found` envoyé au joueur 2 inclut **`yourUsername`** et **`yourAvatar`** pour qu’il affiche son propre pseudo et avatar à gauche, même si `this.user` n’est pas renseigné côté front.

### 2. Frontend — GameRemotePage (`srcs/services/frontend/srcs/public/scripts/ts/pages/GameRemotePage.ts`)

- **`resolveAvatarSrc(avatar)`**  
  - Gestion de `null` / `undefined` / chaîne vide (après `trim()`).
  - Si l’avatar a déjà une extension (`.png`, `.jpg`, etc.), on ne rajoute pas `.png` → `public/avatars/${avatar}`.
  - Sinon → `public/avatars/${avatar}.png`.
  - Sinon (vide) → `public/avatars/unknownPlayer.jpeg`.

- **`handleOpponentFound(data)`**  
  Pour le **joueur 2** (`data.playerNumber === 2`) :
  - Pseudo à gauche : `data.yourUsername` si présent, sinon `this.user?.username`.
  - Avatar à gauche : `data.yourAvatar` si présent, sinon `this.user?.avatar` → passé à `resolveAvatarSrc`.

---

## Fichiers modifiés

| Fichier | Modifications |
|--------|----------------|
| `srcs/services/remote-players/app/server.js` | Fallback `'default'` pour tous les avatars (invite + matchmaking + catch) ; champs `yourUsername` / `yourAvatar` dans `opponent-found` pour le joueur 2. |
| `srcs/services/frontend/srcs/public/scripts/ts/pages/GameRemotePage.ts` | `resolveAvatarSrc` : trim, extension optionnelle, pas de double `.png` ; `handleOpponentFound` : usage de `data.yourAvatar` et `data.yourUsername` pour le joueur 2. |

---

## Vérification

- **Invite (Live Chat)** : A et B voient l’avatar de l’autre (au pire `default.png`). B voit son propre avatar à gauche.
- **Play Against Random Player** : les deux joueurs voient l’avatar de l’adversaire (au pire `default.png`) ; le joueur 2 voit son propre avatar à gauche.

Redémarrer le service **remote-players** après modification du backend.
