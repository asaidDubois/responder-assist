# Test local dans Outlook — Guide complet

## Le problème

Outlook Web (outlook.office.com) tourne sur les serveurs Microsoft, **pas** sur ton PC. Il ne peut donc pas atteindre `http://localhost:3000` directement. C'est pourquoi l'installation du manifeste timeout : Outlook tente de valider l'URL du taskpane depuis ses serveurs, et n'arrive pas à se connecter.

La solution : exposer ton serveur Vite local sur Internet via un tunnel HTTPS temporaire.

## Solution : Cloudflare Quick Tunnel

`cloudflared` crée un tunnel HTTPS temporaire sans inscription ni configuration. Tout est automatique.

### Étape 1 : Démarrer Vite

```bash
cd D:\OpenCode\ResponderAssist
npm run dev
```

Laisse cette fenêtre ouverte. Vite sert sur `http://localhost:3000`.

### Étape 2 : Démarrer le tunnel (nouvelle fenêtre)

```bash
cd D:\OpenCode\ResponderAssist
npm run tunnel
```

Ce script :
1. Télécharge `cloudflared.exe` (une seule fois, ~50 Mo, dans `tunnel/`)
2. Démarre un tunnel Quick Tunnel
3. Attend l'URL publique (ex: `https://random-name.trycloudflare.com`)
4. **Met à jour automatiquement `manifest.dev.xml`** avec cette URL
5. Garde le tunnel actif

Tu verras :
```
[1/4] Téléchargement de cloudflared...
[2/4] Vite détecté sur le port 3000
[3/4] Démarrage du tunnel Cloudflare...
[4/4] Récupération de l'URL publique...
============================================
  URL publique : https://abc-xyz.trycloudflare.com
============================================
Mise à jour de manifest.dev.xml...
```

### Étape 3 : Charger le manifeste dans Outlook

1. Va sur https://outlook.office.com
2. Ouvre n'importe quel courriel
3. `...` → `Obtenir des compléments` → `Mes compléments`
4. `+ Ajouter un complément personnalisé` → `À partir d'un fichier...`
5. Sélectionne `D:\OpenCode\ResponderAssist\manifest.dev.xml`
6. Accepte les avertissements de sécurité

Le manifeste pointe maintenant vers l'URL publique du tunnel, accessible depuis les serveurs Outlook.

### Étape 4 : Tester

1. Ferme et rouvre Outlook (F5 suffit)
2. Ouvre un courriel
3. Clique sur le bouton **"Responder Assist"** dans le ruban
4. Le panneau s'ouvre avec ton interface
5. Configure ta clé API dans l'onglet "Configuration IA"

### Étape 5 : Arrêter le tunnel

Quand tu as fini :
- `Ctrl+C` dans la fenêtre du tunnel, OU
- `npm run tunnel:stop` depuis un autre terminal

Le script restaure automatiquement `manifest.dev.xml` avec `http://localhost:3000`.

## Limitations

- **URL temporaire** : l'URL change à chaque démarrage du tunnel
- **Tunnel actif requis** : si tu fermes Vite ou le tunnel, l'add-in ne marchera plus dans Outlook
- **Performance** : les requêtes passent par Cloudflare, latence ~50-100ms supplémentaires
- **Quota Cloudflare** : Quick Tunnels ont une limite d'usage raisonnable, suffisant pour le dev

## Si ça ne marche toujours pas

### Vérifier que le tunnel est joignable
```bash
curl https://TON-URL.trycloudflare.com/
```
Doit retourner le HTML de l'add-in.

### Vérifier les URLs du manifeste
```bash
npm run tunnel
# Note l'URL publique affichée
# Vérifie que manifest.dev.xml contient bien cette URL
```

### Tester sans Outlook (debug navigateur)
Ouvre l'URL du tunnel dans Chrome. Tu verras l'interface mais `Office.context` ne sera pas défini → l'app affichera l'écran de saisie de phrase de passe.

### Logs du tunnel
```bash
cat tunnel/tunnel.log
```

## Alternative : Outlook Desktop (sans tunnel)

Outlook Desktop sur Windows peut charger des add-ins depuis `localhost` directement. Mais il exige HTTPS. Pour activer HTTPS dans Vite, modifie `vite.config.ts` :

```ts
server: {
  https: true,
  // certificat auto-signé : accepter dans Windows
}
```

Outlook Desktop ignorera les avertissements de certificat pour `localhost`, contrairement à Outlook Web.

## Alternative : hébergement permanent

Pour un usage régulier, héberge les fichiers buildés sur :
- GitHub Pages (gratuit, HTTPS)
- Netlify / Vercel (gratuit, HTTPS auto)
- Ton propre serveur avec HTTPS

Puis remplace les URLs dans `manifest.xml` (le manifeste de production, pas `.dev.xml`).
