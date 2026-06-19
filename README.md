# Responder Assist

Add-in Outlook qui aide à traduire les courriels, générer des réponses, apprendre ton style d'écriture et corriger avant envoi, en s'appuyant sur un fournisseur IA compatible OpenAI configurable.

## Stack

- **Vite** + **React** + **TypeScript**
- **Office.js** (Mailbox)
- **Fluent UI** (interface)
- **Web Crypto API** (chiffrement local de la clé API et des paramètres)
- Compatible avec : OpenAI, Azure OpenAI, Ollama, Cloudflare Workers AI, OpenRouter, Groq, DeepSeek, Mistral, ou tout endpoint compatible OpenAI

## Fonctionnalités

- **Traduction automatique** des courriels reçus vers le français
- **Génération de 3 réponses** (courte, professionnelle, détaillée) à partir du fil complet
- **Réponse multilingue** : génération en français + traduction vers la langue du courriel reçu
- **Apprentissage du style** : analyse à la demande du courriel ouvert uniquement
- **Correction avant envoi** : orthographe, grammaire, ponctuation, frappe, style — acceptation tout ou individuelle
- **Multi-fournisseurs IA** : URL + clé API + modèle saisis par l'utilisateur

---

## Déploiement sur GitHub Pages (recommandé)

Le moyen le plus fiable d'utiliser l'add-in : GitHub Pages fournit une URL HTTPS stable que Outlook Web peut atteindre depuis ses serveurs.

### Étape 1 : Créer le dépôt GitHub

1. Va sur https://github.com/new
2. Nom : `responder-assist` (ou autre)
3. **Public** (obligatoire pour GitHub Pages gratuit)
4. Ne coche pas "Initialize with README" (on a déjà un repo local)
5. Crée le dépôt

### Étape 2 : Pousser le code

```bash
cd D:\OpenCode\ResponderAssist
git remote add origin https://github.com/TON-USER/responder-assist.git
git push -u origin main
```

### Étape 3 : Activer GitHub Pages

1. Sur GitHub : **Settings** → **Pages**
2. Source : **GitHub Actions**
3. Le workflow `.github/workflows/deploy.yml` se déclenche automatiquement
4. Attend ~2 minutes, l'URL s'affiche : `https://TON-USER.github.io/responder-assist/`

### Étape 4 : Générer le manifeste Outlook

```powershell
cd D:\OpenCode\ResponderAssist
powershell -ExecutionPolicy Bypass -File scripts\build-manifest.ps1 -GitHubUser "TON-USER" -RepoName "responder-assist"
```

Cela crée `manifest.xml` avec les bonnes URLs.

### Étape 5 : Installer dans Outlook

1. Va sur https://outlook.office.com
2. Ouvre un courriel
3. `...` → `Obtenir des compléments` → **Mes compléments**
4. `+` → **Ajouter un complément personnalisé** → **À partir d'un fichier...**
5. Sélectionne `D:\OpenCode\ResponderAssist\manifest.xml`
6. Accepte les avertissements
7. Ferme/rouvre Outlook (F5)
8. Ouvre un courriel → bouton **"Responder Assist"** dans le ruban

### Étape 6 : Configurer

1. Définit une phrase de passe (chiffrement local)
2. Onglet **Configuration IA** : URL + clé API + modèle
3. Teste la connexion
4. Utilise !

### Mises à jour futures

```bash
git add .
git commit -m "Ma modification"
git push
```

Le déploiement est automatique (~2 min). L'add-in sera mis à jour dans Outlook au prochain rechargement de la page.

---

## Développement local

### Installation
```bash
cd D:\OpenCode\ResponderAssist
npm install
npm run dev
```

### Typecheck
```bash
npm run typecheck
```

### Build local
```bash
npm run build
```

### Test avec tunnel Cloudflare (optionnel)

Voir `TEST-LOCAL.md`. Note : ton DNS d'entreprise peut bloquer `*.trycloudflare.com`. GitHub Pages est plus fiable.

---

## Structure

```
src/
├── taskpane/
│   ├── App.tsx
│   ├── index.tsx
│   ├── components/
│   │   ├── AIConfigPanel.tsx       # URL + clé API + modèle
│   │   ├── SettingsPanel.tsx       # Tutoiement, ton, longueur, etc.
│   │   ├── EmailView.tsx           # Affichage + traduction
│   │   ├── ReplySuggestions.tsx    # 3 réponses générées
│   │   ├── ProofreadPanel.tsx      # Correction avant envoi
│   │   └── LearnStylePanel.tsx     # Apprentissage du style
│   ├── hooks/
│   │   ├── useEmail.ts             # Office.context.mailbox.item
│   │   └── useSettings.ts          # Paramètres + profil de style
│   └── services/
│       ├── crypto.ts               # AES-GCM 256 + PBKDF2
│       ├── storage.ts              # Persistance chiffrée
│       ├── openaiClient.ts         # Client OpenAI-compatible
│       ├── translator.ts           # Détection + traduction
│       ├── replyGenerator.ts       # Génération des 3 réponses
│       ├── styleLearner.ts         # Analyse de style
│       └── profreader.ts           # Correction
└── commands/
    └── commands.html

.github/workflows/
└── deploy.yml                       # Déploiement automatique GH Pages

scripts/
├── build-github.ps1                 # Build local pour GitHub Pages
└── build-manifest.ps1               # Génère manifest.xml avec tes URLs

manifest.github.xml                  # Template du manifeste (placeholders)
manifest.dev.xml                     # Manifeste pour dev local
manifest.xml                         # Généré par build-manifest.ps1 (gitignored)
```

## Sécurité

- Clé API chiffrée via **AES-GCM 256** (clé dérivée par PBKDF2 depuis ta phrase de passe)
- Phrase de passe **jamais stockée** (hash SHA-256 + sel)
- Déchiffrement à la volée, uniquement en mémoire pendant la session
- La phrase de passe reste en `sessionStorage` (effacé à la fermeture de l'onglet)

## Limitations connues

- Le défilement du fil via Office.js dépend des permissions du compte Exchange
- L'add-in nécessite HTTPS (Outlook refuse HTTP sauf localhost en dev)
- GitHub Pages gratuit = add-in public (acceptable car aucune donnée sensible n'est stockée sur le serveur, tout est local)
