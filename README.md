# Responder Assist

Add-in Outlook qui aide à traduire les courriels, générer des réponses, apprendre ton style d'écriture et corriger avant envoi, en s'appuyant sur un fournisseur IA compatible OpenAI configurable.

## Stack

- **Vite** + **React** + **TypeScript**
- **Office.js** (Mailbox)
- **Fluent UI** (interface)
- **Web Crypto API** (chiffrement local de la clé API et des paramètres)
- Compatible avec : OpenAI, Azure OpenAI, Ollama, Cloudflare Workers AI, OpenRouter, ou tout endpoint compatible OpenAI

## Fonctionnalités

- **Traduction automatique** des courriels reçus vers le français
- **Génération de 3 réponses** (courte, professionnelle, détaillée) à partir du fil complet
- **Réponse multilingue** : génération en français + traduction vers la langue du courriel reçu (option activable)
- **Apprentissage du style** : analyse à la demande du courriel ouvert (pas de scan global)
- **Correction avant envoi** : orthographe, grammaire, ponctuation, frappe, style — acceptation tout ou individuelle
- **Multi-fournisseurs IA** : URL + clé API + modèle saisis par l'utilisateur

## Installation et développement

### 1. Installer les dépendances
```bash
cd D:\OpenCode\ResponderAssist
npm install
```

### 2. Lancer en mode développement
```bash
npm run dev
```
Le serveur démarre sur `http://localhost:3000`.

### 3. Charger le manifeste dans Outlook

#### Outlook sur le Web (Outlook 365)
1. Va sur https://outlook.office.com
2. Ouvre un courriel
3. Clique sur `...` → `Obtenir des compléments`
4. Onglet **Mes compléments** → **Ajouter un complément personnalisé** → **Ajouter à partir d'un fichier...**
5. Sélectionne `D:\OpenCode\ResponderAssist\manifest.xml`
6. Confirme l'installation

#### Outlook Desktop (Windows)
1. Copie le `manifest.xml` dans un dossier accessible
2. Dans Outlook : `Fichier` → `Informations` → `Gérer les compléments` (bouton en haut)
3. Onglet **Mes compléments** → `+` → **Ajouter à partir d'un fichier...**
4. Sélectionne `manifest.xml`

> **Important** : Pour que le manifeste fonctionne, le serveur de dev doit tourner. Pour un environnement de production, génère le build (`npm run build`) et héberge les fichiers statiques sur HTTPS, puis mets à jour les URLs dans `manifest.xml`.

### 4. Construire pour la production
```bash
npm run build
```
Les fichiers sont générés dans `dist/`.

## Configuration

Au premier lancement, tu dois :
1. Définir une **phrase de passe** (chiffrement local)
2. Aller dans l'onglet **Configuration IA** et saisir :
   - Le **fournisseur** (OpenAI, Azure, Ollama, Cloudflare, OpenRouter, ou personnalisé)
   - L'**URL de l'API** (par défaut `https://api.openai.com/v1`)
   - La **clé API**
   - Le **modèle** (par défaut `gpt-5-mini`)
3. Cliquer sur **Tester la connexion** pour valider
4. Aller dans **Paramètres** pour configurer tutoiement/vouvoiement, ton, longueur, etc.

## Sécurité

- La clé API et tous les paramètres sont chiffrés via **AES-GCM 256** (Web Crypto API)
- La phrase de passe n'est jamais stockée en clair (hash SHA-256 + sel)
- En production, considère un backend proxy pour ne jamais exposer la clé côté client

## Structure

```
src/
├── taskpane/
│   ├── App.tsx
│   ├── index.tsx
│   ├── components/
│   │   ├── AIConfigPanel.tsx
│   │   ├── SettingsPanel.tsx
│   │   ├── EmailView.tsx
│   │   ├── ReplySuggestions.tsx
│   │   ├── ProofreadPanel.tsx
│   │   └── LearnStylePanel.tsx
│   ├── hooks/
│   │   ├── useEmail.ts
│   │   └── useSettings.ts
│   └── services/
│       ├── crypto.ts
│       ├── storage.ts
│       ├── openaiClient.ts
│       ├── translator.ts
│       ├── replyGenerator.ts
│       ├── styleLearner.ts
│       └── profreader.ts
└── commands/
    └── commands.html
```

## Limitations connues

- Le défilement du fil de discussion via Office.js est limité selon les permissions du compte Exchange
- Web Crypto API requiert un contexte sécurisé (HTTPS ou localhost)
- Pour Outlook Desktop, Outlook 2016 ou ultérieur est requis
