# Carnet de crédits

Carnet de crédit numérique pour petites boutiques (montants en FCFA). Le propriétaire crée sa boutique, ajoute des collaborateurs, enregistre ses clients et leurs opérations :

- **Dette** : le client prend à crédit, son solde augmente ;
- **Remboursement** : le client paie, son solde diminue (jamais en dessous de 0).

```
carnet-credits/
├── backend/   API REST — Node.js 22+, Express 5, Mongoose 9, Zod 4, JWT
└── mobile/    App — Expo SDK 58, Expo Router, NativeWind, React Query
```

---

## Démarrage local (≈ 15 minutes)

### 1. Prérequis

- Node.js **22 ou plus** (`node -v`)
- MongoDB **7 ou plus**, en **replica set** (étape 2)
- Pour le mobile : un téléphone avec un *development build*, ou un émulateur Android Studio

### 2. MongoDB en replica set

Les soldes sont modifiés dans des **transactions MongoDB**, qui exigent un replica set. Un MongoDB « autonome » (standalone) ne suffit pas : l'API refuse alors de démarrer avec un message explicite.

**Option A — MongoDB installé sous Windows (service)**

1. Ouvre `C:\Program Files\MongoDB\Server\<version>\bin\mongod.cfg` en administrateur et ajoute :
   ```yaml
   replication:
     replSetName: rs0
   ```
2. Redémarre le service (PowerShell administrateur) :
   ```powershell
   Restart-Service MongoDB
   ```
3. Initialise le replica set, une seule fois :
   ```bash
   mongosh --eval 'rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })'
   ```
4. Vérifie : `mongosh --eval "rs.status().ok"` doit afficher `1`.

**Option B — Docker**

```bash
docker run -d --name carnet-mongo -p 27017:27017 mongo:8 --replSet rs0 --bind_ip_all
docker exec carnet-mongo mongosh --eval 'rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })'
```

**Option C — MongoDB Atlas** : un cluster gratuit est déjà un replica set, il suffit de copier son URI `mongodb+srv://…`.

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env        # puis édite .env (voir « Variables d'environnement »)
npm run seed                # facultatif : boutique de démonstration
npm run dev                 # API sur http://localhost:3000 (redémarre à chaque modification)
```

Vérification : `curl http://localhost:3000/api/health` → `{"status":"ok","database":"ok"}`.

**Comptes de démonstration** créés par `npm run seed` (valeurs de démo, jamais en production) :

| Rôle | Téléphone | Mot de passe |
|---|---|---|
| Propriétaire | 07 00 00 00 01 | demo1234 |
| Collaborateur | 07 00 00 00 02 | demo1234 |
| Collaborateur désactivé | 07 00 00 00 03 | demo1234 |

**Base existante (avant cette version)** : les numéros sont désormais normalisés. Lance une fois la migration (elle signale les doublons sans les fusionner) :

```bash
npm run migrate:phones -- --dry-run   # simulation
npm run migrate:phones                # application
```

Les anciens jetons de connexion ne sont plus valides : il faut se reconnecter dans l'app.

### 4. Mobile

```bash
cd mobile
npm install
cp .env.example .env        # EXPO_PUBLIC_API_URL = IP locale de ton PC, ex. http://192.168.1.20:3000
npx expo start
```

- Sur un téléphone, `localhost` désigne le téléphone lui-même : utilise l'IP de ton PC sur le Wi-Fi (`ipconfig`).
- Émulateur Android : `http://10.0.2.2:3000` pointe vers le PC.
- Installe un paquet mobile **uniquement** avec `npx expo install <paquet>`.

---

## Variables d'environnement

> ⚠️ **Jamais de secret dans une variable `EXPO_PUBLIC_*`** : elles sont embarquées en clair dans l'application.
> Les fichiers `.env` ne sont jamais commités ; les modèles documentés sont dans `backend/.env.example` et `mobile/.env.example`.

### Backend (`backend/.env`)

| Variable | Obligatoire | Défaut | Rôle |
|---|---|---|---|
| `MONGO_URI` | oui | — | URI MongoDB **en replica set**, ex. `mongodb://127.0.0.1:27017/carnet-credits?replicaSet=rs0` |
| `JWT_SECRET` | oui | — | Au moins 32 caractères aléatoires : `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `PORT` | non | `3000` | Port HTTP |
| `NODE_ENV` | non | `development` | `development`, `production` ou `test` |
| `JWT_EXPIRES_IN` | non | `7d` | Durée des sessions (`7d`, `12h`, `30m`, secondes) |
| `TRUST_PROXY` | non | `false` | Nombre de proxys devant l'API (souvent `1` chez un hébergeur) |
| `CORS_ORIGINS` | non | vide | Origines web autorisées, séparées par des virgules |
| `DEFAULT_COUNTRY_CODE` | non | `225` | Indicatif ajouté aux numéros saisis sans indicatif |
| `LOG_LEVEL` | non | `info` | Niveau des journaux pino |
| `RATE_LIMIT_MAX` | non | `300` | Requêtes max par IP et par 15 min sur l'API |

L'API vérifie ces variables au démarrage et s'arrête avec un message clair si l'une est invalide.

### Mobile (`mobile/.env`)

| Variable | Rôle |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL de l'API. Un build de production refuse toute URL qui ne commence pas par `https://`. |

---

## Droits : propriétaire et collaborateur

| Action | Propriétaire | Collaborateur |
|---|:---:|:---:|
| Voir la liste et la fiche des clients | ✅ | ✅ |
| Créer et modifier un client | ✅ | ✅ |
| Enregistrer une **dette** | ✅ | ✅ |
| Enregistrer un **remboursement** | ✅ | ❌ |
| Annuler une opération | ✅ | ❌ |
| Supprimer un client (solde nul et sans historique) | ✅ | ❌ |
| Tableau de bord (total des impayés, stats du mois) | ✅ | ❌ |
| Gérer l'équipe (ajouter, désactiver, réinitialiser un mot de passe) | ✅ | ❌ |
| Renommer la boutique | ✅ | ❌ |
| Changer son propre mot de passe | ✅ | ✅ |

Ces règles sont appliquées **par l'API** (403), l'app ne fait que masquer les boutons. Toutes les données sont cloisonnées par boutique : un utilisateur ne voit jamais les clients d'une autre boutique (404).

---

## Sécurité

- Limitation de débit : connexion (5 échecs / 15 min par numéro, 20 par IP), inscription (5 / heure par IP), changement de mot de passe (5 échecs / 15 min), et une limite globale. Les limites sont gardées en mémoire, donc propres à chaque instance de l'API.
- Les jetons JWT portent un numéro de version : un changement de mot de passe ou une désactivation déconnecte immédiatement toutes les sessions.
- Mots de passe : 8 caractères à 72 octets, hachés avec bcrypt. La comparaison est faite même pour un numéro inconnu (pas d'énumération par mesure du temps).
- Toutes les entrées sont validées par Zod. `sanitizeFilter` et `strictQuery` sont actifs, les corps sont limités à 10 ko, et les identifiants sont vérifiés.
- Sont aussi en place : helmet, CORS sur liste blanche, et des journaux structurés (pino) qui masquent les mots de passe et les jetons, avec un identifiant de requête (`X-Request-Id`).
- Côté mobile, le jeton est stocké dans SecureStore (Keychain / Keystore).

---

## Design (mobile)

- **Tokens** : une seule source, `mobile/src/theme/tokens.js` (couleurs, rayons, espacements, tailles de police). Elle est lue à la fois par `tailwind.config.js` (classes NativeWind) et par `src/lib/theme.ts` (props qui n'acceptent pas de classes). Rouge `debt` = dette, vert `payment` = remboursement / soldé, toujours accompagnés d'un libellé ou d'une icône.
- **Composants** (`src/components/ui/`) : `ScreenHeader`, `Card`, `Button`, `IconButton`, `Fab`, `Badge`, `SegmentedControl`, `AmountInput`, `PasswordInput`, `ConfirmDialog` (`useConfirm`), `Toast` (`useToast`), `SectionHeader`, `ListSkeleton`, `AnimatedAmount`, `EmptyState`, `ErrorState`.
- **Animations** (Reanimated 4) : apparition des lignes, transitions de liste, effet d'appui, squelette pulsé, solde qui compte jusqu'à sa nouvelle valeur. Toutes respectent le réglage « Réduire les animations ». Retour haptique (`expo-haptics`) sur succès et erreur.
- **Accessibilité** : contrastes vérifiés WCAG AA (voir l'en-tête de `tokens.js`), zones tactiles ≥ 44 px, libellés sur tous les boutons-icônes, hauteurs minimales plutôt que fixes (grandes polices).
- **Thème** : clair uniquement (`userInterfaceStyle: "light"`).

---

## Tests et vérifications

```bash
cd backend && npm test          # jest + supertest + MongoDB en mémoire (replica set), sans base externe
cd backend && npm audit --omit=dev
cd mobile && npm test           # jest-expo : formatage des montants, téléphones et dates
cd mobile && npx tsc --noEmit && npx expo lint && npx expo-doctor
```

`npm test` réutilise le `mongod` installé s'il est dans le PATH ; sinon il télécharge un binaire MongoDB (~800 Mo) au premier lancement.

---

## Déploiement

Ne pousse jamais un fichier `.env` ; renseigne les variables dans l'interface de l'hébergeur.

### API : Render (ou Railway / Fly.io) + MongoDB Atlas

1. **Atlas** : crée un cluster (le niveau gratuit M0 suffit pour démarrer), un utilisateur dédié et autorise l'IP de l'hébergeur. Copie l'URI `mongodb+srv://…/carnet-credits`.
2. **Render** : crée un *Web Service* depuis le dépôt :
   - Root directory : `backend`
   - Build : `npm ci --omit=dev`
   - Start : `npm start`
   - Health check path : `/api/health`
3. Variables : `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET` (nouveau, jamais celui du dev), `TRUST_PROXY=1`, `CORS_ORIGINS` (vide si pas de version web).
4. Render fournit le HTTPS : l'URL `https://…onrender.com` devient `EXPO_PUBLIC_API_URL` en production.

### Mobile : EAS

`mobile/eas.json` définit trois profils (`development`, `preview`, `production`), chacun avec son `EXPO_PUBLIC_API_URL` : remplace les URL d'exemple par les tiennes.

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest build --profile preview --platform android   # APK à installer pour tester
npx eas-cli@latest build --profile production --platform android
```

Identifiant d'application : `com.carnetcredits.app`. Incrémente `android.versionCode` et `ios.buildNumber` (`app.json`) à chaque publication.

### Icônes (à fournir)

Les icônes actuelles sont provisoires. Visuels définitifs attendus (PNG) :

| Fichier (`mobile/assets/images/`) | Taille | Usage |
|---|---|---|
| `icon.png` | 1024 × 1024, sans transparence | iOS et icône par défaut |
| `android-icon-foreground.png` | 1024 × 1024, sujet dans le cercle central de 66 % | Icône adaptative Android |
| `android-icon-background.png` | 1024 × 1024 | Fond de l'icône adaptative |
| `android-icon-monochrome.png` | 1024 × 1024, une seule couleur sur fond transparent | Icônes thématiques Android 13+ |
| `splash-icon.png` | 1024 × 1024, transparent | Écran de démarrage (fond `#0F2A43`) |
