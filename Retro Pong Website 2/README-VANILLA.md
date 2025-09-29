# 🎮 Retro Pong Website - Vanilla TypeScript

Une application de jeu Pong rétro/synthwave construite avec **Vanilla TypeScript** et **Tailwind CSS**.

## ✨ Fonctionnalités

- 🎯 **Jeu Pong classique** avec contrôles clavier
- 🔐 **Système d'authentification** (mode démo)
- 🏆 **Leaderboard** avec scores simulés
- ⚙️ **Paramètres personnalisables**
- 🎨 **Design rétro/synthwave** avec animations
- 📱 **Interface responsive**

## 🏗️ Architecture

### Structure du projet

```
src/
├── app.ts                 # Application principale
├── main.ts               # Point d'entrée
├── index.css             # Styles Tailwind + custom
├── modules/              # Modules utilitaires
│   ├── AuthManager.ts    # Gestion de l'authentification
│   ├── GameManager.ts    # Logique du jeu Pong
│   ├── RouterManager.ts  # Navigation entre pages
│   └── UIManager.ts      # Utilitaires DOM
└── pages/                # Pages de l'application
    ├── AuthPage.ts       # Page de connexion/inscription
    ├── MenuPage.ts       # Menu principal
    ├── GamePage.ts       # Page du jeu
    ├── LeaderboardPage.ts # Classement
    └── SettingsPage.ts   # Paramètres
```

### Classes principales

#### `App`
Classe principale qui orchestre l'application :
- Gère l'état global
- Coordonne les modules
- Gère la navigation entre pages

#### `UIManager`
Utilitaires pour la manipulation du DOM :
- Création d'éléments HTML
- Gestion des événements
- Validation de formulaires
- Création d'icônes SVG

#### Pages
Chaque page est une classe qui gère :
- Le rendu de l'interface
- Les interactions utilisateur
- La logique métier spécifique

## 🚀 Installation et développement

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation
```bash
npm install
```

### Développement
```bash
npm run dev
```
L'application sera disponible sur http://localhost:3000

### Build de production
```bash
npm run build
```

## 🎮 Utilisation

### Authentification
L'application fonctionne en mode démo. Vous pouvez vous connecter avec n'importe quelles données :
- **Nom d'utilisateur** : n'importe quoi
- **Mot de passe** : n'importe quoi
- **Email** : format valide requis pour l'inscription

### Contrôles du jeu
- **Joueur 1** : W (haut), S (bas)
- **Joueur 2** : ↑ (haut), ↓ (bas)
- **Objectif** : Premier à 10 points gagne

### Navigation
- Utilisez les boutons dans l'interface pour naviguer
- Le système de routage gère la navigation entre les pages

## 🎨 Personnalisation

### Thèmes de couleur
L'application propose plusieurs thèmes :
- **Synthwave** (par défaut) : Rose, cyan, violet
- **Classic** : Vert, jaune, rouge
- **Cyberpunk** : Magenta, vert, bleu
- **Neon** : Orange, rose, violet

### Paramètres
- Volume audio (musique et effets)
- Vitesse de la balle et des raquettes
- Effets visuels (lignes de balayage, lueur)
- Mode plein écran

## 🔧 Technologies utilisées

- **TypeScript** : Langage principal
- **Tailwind CSS** : Framework CSS
- **HTML5 Canvas** : Rendu du jeu
- **Vite** : Build tool et serveur de développement
- **LocalStorage** : Persistance des données

## 📝 Notes de développement

### Conversion de React vers Vanilla TypeScript

Cette application a été convertie de React vers Vanilla TypeScript en conservant :
- ✅ Toutes les fonctionnalités
- ✅ Le design et les animations
- ✅ La structure modulaire
- ✅ Les performances

### Avantages de l'approche Vanilla TypeScript

- **Performance** : Pas de surcharge React
- **Simplicité** : Moins de dépendances
- **Contrôle** : Gestion directe du DOM
- **Taille** : Bundle plus léger (40.92 kB)

### Gestion d'état

L'état est géré par :
- `AuthManager` : Utilisateur connecté
- `RouterManager` : Page actuelle
- `GameManager` : État du jeu
- Classes de pages : État local

## 🐛 Dépannage

### Problèmes courants

1. **Erreur de compilation TypeScript**
   - Vérifiez que tous les types sont corrects
   - Assurez-vous que les imports sont corrects

2. **Styles non appliqués**
   - Vérifiez que Tailwind CSS est bien chargé
   - Vérifiez les classes CSS dans le code

3. **Jeu ne fonctionne pas**
   - Vérifiez que le canvas est correctement initialisé
   - Vérifiez les événements clavier

## 📄 Licence

Ce projet est sous licence MIT.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Ajouter de nouvelles fonctionnalités

---

**Amusez-vous bien avec Retro Pong ! 🎮✨**
