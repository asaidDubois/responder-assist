# Test local de l'add-in Outlook Desktop

## Prerequis

- **Windows 10/11** avec Outlook 2016 ou ulterieur (Microsoft 365)
- **Git pour Windows**
- **Node.js 20+** et **npm**

## 1. Installation

```bash
cd D:\OpenCode\ResponderAssist
npm install
```

## 2. Generation du certificat HTTPS local

Outlook Desktop exige HTTPS meme pour localhost. On utilise **mkcert** :

```bash
# Deja fait : le CA root est installe dans Windows
# Deja fait : cert localhost genere dans tunnel/localhost.pem
```

Si tu veux regenerer le cert :
```bash
cd tunnel
.\mkcert.exe -install
.\mkcert.exe -cert-file localhost.pem -key-file localhost-key.pem localhost 127.0.0.1 ::1
```

## 3. Lancer le serveur Vite en HTTPS

```bash
cd D:\OpenCode\ResponderAssist
npm run dev
```

Sortie attendue :
```
  VITE v5.4.21  ready in 456 ms
  Local:   https://localhost:3000/
```

## 4. Installer le manifeste dans Outlook

### 4.1 Ouvrir le dossier des manifestes Outlook

```powershell
# Ouvre le dossier de sideload d'Outlook
explorer "$env:APPDATA\Microsoft\Outlook\Sideload"
```

### 4.2 Copier le manifeste

Copie `D:\OpenCode\ResponderAssist\manifest.dev.xml` vers :
`%APPDATA%\Microsoft\Outlook\Sideload\`

### 4.3 Alternative : utiliser un catalogue Exchange (organisation)

Si tu as acces a Exchange Admin :
1. Centre d'administration Exchange → Compléments
2. Ajouter depuis fichier → `manifest.dev.xml`

### 4.4 Alternative : regkey Windows (test local uniquement)

```powershell
# Execute en tant qu'administrateur
$regPath = "HKCU:\Software\Microsoft\Office\16.0\Outlook\Options\WebExt"
New-Item -Path $regPath -Force | Out-Null
New-ItemProperty -Path $regPath -Name "SolutionCatalog" -Value "https://localhost:3000/" -PropertyType String -Force
```

## 5. Demarrer Outlook et tester

1. Lance Outlook Desktop
2. Va dans **Fichier → Infos → Gérer les compléments** (bouton en haut)
3. Section **Compléments développeur** : l'add-in devrait apparaitre

OU

1. Ouvre un courriel
2. Ruban **Accueil** ou **Message**
3. Cherche un groupe **"Responder Assist"** avec un bouton **Open Responder Assist**
4. Clique → le panneau s'ouvre dans la fenetre Outlook

## 6. Premier lancement dans l'add-in

1. Definis une **phrase de passe** (chiffrement local)
2. Onglet **Configuration IA** :
   - URL : ex `https://api.openai.com/v1` ou `http://localhost:11434/v1`
   - Cle API : ta cle
   - Modele : ex `gpt-5-mini`
3. Clique **Tester la connexion**
4. Va dans **Parametres** pour configurer tutoiement, etc.

## 7. Utilisation

- **Ouvre un courriel** → l'add-in traduit automatiquement
- **Onglet Reponses** → genere 3 reponses
- **Onglet Correction** → corrige ton brouillon
- **Onglet Style** → analyse le courriel ouvert

## Depannage

### Outlook n'affiche pas le ruban Responder Assist

- Verifie que Vite tourne et que `https://localhost:3000` repond 200
- Ferme Outlook, relance-le apres avoir demarre Vite
- Verifie que le manifest pointe vers `https://localhost:3000/`

### Erreur "certificate not trusted"

- Reexecute `.\mkcert.exe -install` en tant qu'administrateur
- Accepte l'installation du CA root dans Windows

### L'add-in s'ouvre mais "Chargement d'Office..." reste

- Ouvre la console dev (F12) dans Outlook Web ou Desktop
- Verifie qu'il n'y a pas d'erreur de chargement du bundle
- Recharge le panneau

### Le serveur Vite s'arrete

- Relance `npm run dev` dans un terminal
- Recharge Outlook (Ctrl+F5)

## Avantages du test local

- **Pas de publication** requise
- **Pas de cache CDN Microsoft** a attendre
- **Modifications en direct** : modifie le code, sauvegarde, Vite recharge automatiquement
- **Debogage complet** : F12 dans Outlook, breakpoints, etc.
