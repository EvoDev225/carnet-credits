# Prompt — Finalisation du projet « Carnet de crédits »

> Copie tout ce qui suit dans une nouvelle session Claude Code ouverte à la racine du dépôt `carnet-credits`.

---

## 0. Rôle et objectif

Tu es un développeur full-stack senior (Node.js/Express/MongoDB + Expo/React Native) et un relecteur sécurité. Ta mission : **amener le projet « Carnet de crédits » à un état livrable en production**. Concrètement :

1. corriger toutes les failles de sécurité listées en §3 (puis refaire ton propre audit) ;
2. implémenter toutes les fonctionnalités manquantes (§4 et §5) ;
3. améliorer et unifier le design de l'application mobile (§6) ;
4. ajouter tests, documentation et configuration de déploiement (§7 et §8).

L'application est un **carnet de crédit numérique pour petites boutiques** (contexte Afrique de l'Ouest, montants en FCFA, entiers). Un propriétaire (`owner`) crée sa boutique, ajoute des collaborateurs (`staff`), enregistre des clients et leurs opérations : `DEBT` (le client prend à crédit) et `PAYMENT` (le client rembourse). Le solde du client est la somme des dettes moins les remboursements, et ne peut jamais être négatif.

---

## 1. Règles de travail (obligatoires)

- **Langue** : code en anglais ou français selon le fichier existant ; textes UI, messages d'erreur API et messages de commit **en français** (tutoiement dans l'UI, comme l'existant).
- **Lis avant d'écrire** : lis chaque fichier concerné en entier avant de le modifier, et imite le style existant (indentation 4 espaces, `async/await`, `next(error)` dans les contrôleurs, validation `zod` via `validate()`, `req.validated`).
- **Expo SDK 58** : ne fais pas confiance à ta mémoire. Lis `mobile/AGENTS.md`, puis consulte `https://docs.expo.dev/versions/v58.0.0/` et `https://docs.expo.dev/llms.txt` avant toute API Expo/React Native. Installe les paquets mobiles **uniquement** avec `npx expo install <paquet>`.
- **Mongoose 9 / Express 5 / Zod 4** : vérifie dans la doc les options utilisées (ex. `new: true` vs `returnDocument: "after"` dans `findOneAndUpdate`) au lieu de supposer.
- **Animations** : utilise `react-native-reanimated` (déjà installé, v4). Les skills GSAP installés dans `.agents/skills` **ne s'appliquent pas** à React Native, ignore-les pour le mobile.
- **Commits atomiques**, un par étape logique, au format existant : `feat(mobile) : …`, `fix(api) : …`, `chore : …`, `test(api) : …`, `docs : …`. **Ne pousse jamais** (`git push`) sans me demander.
- **Secrets** : n'affiche jamais le contenu de `backend/.env`, ne commite jamais de `.env`, n'écris jamais de vrai secret dans le code ou les docs.
- **Avant de déclarer une étape terminée** :
  - mobile : `cd mobile && npx tsc --noEmit && npx expo lint` sans erreur ;
  - backend : `cd backend && npm test` vert (une fois les tests en place, §7).
- Si une décision métier est ambiguë (voir les questions en §9), **demande-moi** au lieu de deviner.
- Avance **phase par phase** dans l'ordre du §10 ; à la fin de chaque phase, donne-moi un court bilan (fait / reste / points à valider).

---

## 2. État actuel du projet (inventaire)

### Backend — `backend/src`
- Express 5 + Mongoose 9 + Zod 4 + JWT (HS256, 7 jours) + bcryptjs.
- Routes :
  - `POST /api/auth/register` (crée boutique + owner), `POST /api/auth/login`, `GET /api/auth/me`
  - `/api/customers` : `POST /`, `GET /` (search, status `all|debt|settled`, sort, page, limit), `GET /:id`, `PATCH /:id`, `DELETE /:id` (owner, solde 0 et sans historique)
  - `POST /api/customers/:id/transactions`, `GET /api/customers/:id/transactions` (paginé)
  - `PATCH /api/transactions/:id/cancel` (owner)
  - `/api/staff` (owner) : `POST /`, `GET /`, `PATCH /:id` (name, active, password)
  - `GET /api/dashboard` (owner) : résumé, top 5 débiteurs, stats du mois, 5 dernières opérations
- Isolation multi-boutique correcte : toutes les requêtes filtrent sur `shop: req.user.shop`.
- Aucun test automatisé (seulement `src/scripts/testModels.js`).

### Mobile — `mobile/src` (Expo Router, NativeWind, React Query, SecureStore)
- Fait : connexion (`(auth)/index.tsx`), routes protégées (`Stack.Protected`), token dans SecureStore, déconnexion auto sur 401, écran Clients (en-tête dashboard pour owner, recherche debouncée, filtres, scroll infini, pull-to-refresh), onglet Profil (infos + déconnexion), composants UI (`Avatar`, `Button`, `Input`, `SearchBar`, `FilterChips`, `EmptyState`, `ErrorState`, `ListSkeleton`, `CustomerRow`, `HeroHeader`).
- `CustomerRow` accepte `onPress` mais **n'est branché à aucune navigation**.
- `tsc --noEmit` passe actuellement.

---

## 3. Sécurité — failles identifiées à corriger (Phase 1)

Pour chaque point : corrige, ajoute un test (§7) quand c'est testable, et note-le dans le bilan.

### 🔴 Élevé

**S1 — Aucune limitation de débit sur l'authentification**
`POST /api/auth/login` et `/register` acceptent un nombre illimité d'essais ; avec un mot de passe de 6 caractères minimum, le brute-force est réaliste.
→ Ajouter `express-rate-limit` : login limité par IP **et** par numéro de téléphone (ex. 5 essais / 15 min), register limité par IP (ex. 5 / heure), limite globale plus large sur `/api`. Configurer `app.set("trust proxy", …)` via une variable d'env (indispensable derrière un hébergeur/proxy). Réponse 429 avec message français. Côté mobile, afficher le message 429 sur l'écran de connexion.

**S2 — Mises à jour du solde non atomiques**
`createTransaction` et `cancelTransaction` (`backend/src/controllers/transactionController.js`) modifient le solde du client puis créent/modifient l'opération, avec un « rollback » manuel. Un crash, une erreur réseau Mongo ou une exception entre les deux écritures laisse un solde incohérent (et dans `cancelTransaction`, une erreur levée par la mise à jour du client laisse l'opération annulée sans correction du solde).
→ Utiliser les **transactions MongoDB** (`mongoose.startSession()` + `session.withTransaction(...)`) pour les deux écritures. Attention : cela exige un **replica set**. La base actuelle est une instance locale non-`srv` : documente comment lancer Mongo en replica set mono-nœud en local (ou utiliser MongoDB Atlas) et fais échouer le démarrage avec un message clair si les transactions ne sont pas disponibles. Garder les filtres conditionnels existants (`balance: { $gte: amount }`) qui empêchent un solde négatif.

**S3 — Tokens JWT non révocables**
Un token reste valide 7 jours même après un changement de mot de passe (ex. l'owner réinitialise le mot de passe d'un collaborateur compromis : l'ancien token marche toujours).
→ Ajouter `tokenVersion: { type: Number, default: 0 }` au modèle `User`, l'inclure dans le JWT (`ver`), le vérifier dans `middlewares/auth.js`, l'incrémenter à chaque changement de mot de passe et à chaque désactivation. Rendre la durée configurable (`JWT_EXPIRES_IN`), et vérifier au démarrage que `JWT_SECRET` fait au moins 32 caractères. Ajouter `issuer`/`audience` à la signature et à la vérification.

**S4 — Dépendances vulnérables / inutiles**
`npm audit` remonte 3 vulnérabilités **hautes** via `nodemon` (placé dans `dependencies`). `bcrypt` (module natif) est installé mais inutilisé (seul `bcryptjs` sert). `npm start` lance `nodemon` (inadapté en production).
→ Passer `nodemon` en `devDependencies` (mis à jour), supprimer `bcrypt`, scripts : `"dev": "nodemon src/server.js"`, `"start": "node src/server.js"`. Relancer `npm audit --omit=dev` : 0 vulnérabilité haute attendue.

**S5 — Fichiers d'environnement**
`mobile/.env` est **versionné dans git** (commit `dfd0f20`) et pointe vers une URL en **HTTP clair** sur IP locale. Ce n'est pas un secret (toute variable `EXPO_PUBLIC_*` est embarquée en clair dans l'app), mais c'est une mauvaise pratique et la prod doit être en HTTPS. `backend/.env` contient en plus des clés `tokenA` / `tokenB` (tokens de test) qui n'ont rien à y faire.
→ `git rm --cached mobile/.env`, ajouter `.env` au `.gitignore` mobile, créer `mobile/.env.example` et `backend/.env.example` (valeurs factices, toutes les variables documentées). Supprimer `tokenA`/`tokenB` de `backend/.env` (me le signaler, ne pas afficher le fichier). Côté mobile, en build de production, refuser une `EXPO_PUBLIC_API_URL` qui ne commence pas par `https://`. Règle à écrire dans le README : **jamais de secret dans une variable `EXPO_PUBLIC_*`**.

### 🟠 Moyen

**S6 — En-têtes HTTP et CORS**
`app.use(cors())` autorise toutes les origines ; pas d'en-têtes de sécurité ; `X-Powered-By` exposé.
→ Ajouter `helmet`, `app.disable("x-powered-by")`, CORS limité à une liste `CORS_ORIGINS` lue dans l'env (l'app mobile native n'en a pas besoin ; garder l'accès pour Expo web en dev uniquement).

**S7 — Authentification validée à la main, sans limite de taille**
`register`/`login` n'utilisent pas `zod` ; aucune longueur maximale de mot de passe (bcrypt tronque silencieusement au-delà de 72 octets).
→ Créer `validators/authValidators.js` et brancher `validate()` sur ces routes. Mot de passe : min 8 caractères, max 72 **octets** (même règle pour `staffValidators`). Garder des messages génériques au login.

**S8 — Numéros de téléphone non normalisés**
`"07 00 00 00 00"`, `"0700000000"` et `"+2250700000000"` sont considérés comme trois numéros différents : contournement de l'unicité `User.phone`, doublons de clients, échecs de connexion incompréhensibles.
→ Créer un utilitaire unique `normalizePhone()` (chiffres uniquement, gestion de l'indicatif pays configurable via `DEFAULT_COUNTRY_CODE`, rejet des formats invalides) utilisé par les validateurs zod (`.transform`) pour `User` et `Customer`. Écrire un script de migration idempotent pour les données existantes, qui **signale** (sans fusionner) les doublons trouvés. Utiliser le même format d'affichage côté mobile (`lib/format.ts → formatPhone`).

**S9 — Énumération de comptes par mesure du temps**
Au login, si le numéro n'existe pas, `bcrypt.compare` n'est pas appelé : la réponse est nettement plus rapide, ce qui révèle les numéros inscrits.
→ Comparer avec un hash factice quand l'utilisateur est introuvable. (Le 409 de `/register` reste acceptable une fois S1 en place.)

**S10 — Taille des requêtes et défense en profondeur**
→ `express.json({ limit: "10kb" })` ; `mongoose.set("sanitizeFilter", true)` et `strictQuery` ; valider les `:id` avec un schéma zod ObjectId (renvoyer 400 proprement) au lieu de compter sur le `CastError`.

**S11 — Journalisation**
`console.error(err)` brut, aucun log de requête.
→ Logger structuré (`pino` + `pino-http`) avec **masquage** de `authorization`, `password`, `passwordHash`. Pas de stack trace dans les réponses. Ajouter un identifiant de requête.

### 🟡 À vérifier / documenter

- **S12 — Matrice des droits** : aujourd'hui un `staff` peut créer des clients, les modifier et enregistrer **des remboursements** (qui réduisent une dette). C'est peut-être voulu, mais c'est un risque de fraude interne. Rédige la matrice owner/staff dans le README et **demande-moi validation** avant d'ajouter des restrictions.
- **S13 — Re-audit** : une fois S1–S11 corrigés, refais un audit complet (contrôle d'accès / IDOR entre boutiques, injection NoSQL, mass assignment, validation, gestion d'erreurs, stockage mobile, journaux, dépendances avec `npm audit`) et liste tout point nouveau trouvé avant de le corriger.

---

## 4. Backend — compléments fonctionnels (Phase 2)

1. **`/api/auth/me`** renvoie aussi la boutique : `shop: { id, name }` (aujourd'hui seul l'id est renvoyé). Même chose dans la réponse de login/register.
2. **`PATCH /api/auth/password`** (connecté) : `currentPassword` + `newPassword`, vérifie l'ancien, hache le nouveau, incrémente `tokenVersion`, renvoie un nouveau token.
3. **`PATCH /api/shop`** (owner) : renommer la boutique.
4. **Recherche clients** : rechercher aussi par numéro de téléphone (sur la forme normalisée), pas seulement par nom.
5. **Historique** : ajouter la population `cancelledBy` (nom) dans `GET /customers/:id/transactions`.
6. **Seed de dev** : `npm run seed` crée une boutique de démo (1 owner, 2 staff, ~30 clients, opérations variées) avec des identifiants écrits dans `backend/.env.example` / README (valeurs de démo, jamais réelles).
7. Supprimer ou convertir `src/scripts/testModels.js` en vrais tests (§7).

---

## 5. Mobile — fonctionnalités manquantes (Phase 3)

### 5.1 Restructuration de la navigation
Les écrans de détail doivent s'empiler **au-dessus** des onglets :

```
src/app/
  _layout.tsx                      (inchangé : Stack + Stack.Protected)
  (auth)/index.tsx                 connexion
  (auth)/register.tsx              NOUVEAU : inscription
  (app)/_layout.tsx                devient un Stack
  (app)/(tabs)/_layout.tsx         Tabs : Clients, Équipe (owner uniquement), Profil
  (app)/(tabs)/index.tsx           liste des clients (existant, déplacé)
  (app)/(tabs)/team.tsx            NOUVEAU (owner) : collaborateurs
  (app)/(tabs)/profile.tsx         existant, enrichi
  (app)/customers/new.tsx          NOUVEAU : création (présentation formSheet/modal)
  (app)/customers/[id]/index.tsx   NOUVEAU : fiche client + historique
  (app)/customers/[id]/edit.tsx    NOUVEAU : modification
  (app)/customers/[id]/operation.tsx NOUVEAU : nouvelle opération (formSheet)
  (app)/team/new.tsx               NOUVEAU (owner) : ajouter un collaborateur
  (app)/team/[id].tsx              NOUVEAU (owner) : modifier/désactiver/réinitialiser
  (app)/password.tsx               NOUVEAU : changer mon mot de passe
```
Vérifie dans la doc Expo Router v58 : `Tabs` imbriqués dans un `Stack`, `presentation: "formSheet"`, masquer l'onglet Équipe pour un staff (`href: null` ou équivalent actuel), routes typées (`typedRoutes` est activé).

### 5.2 Écrans à construire
1. **Inscription** : nom de la boutique, ton nom, téléphone, mot de passe + confirmation, affichage/masquage du mot de passe, erreurs champ par champ (les `errors[]` de l'API), lien depuis/vers la connexion.
2. **Fiche client** : en-tête (avatar, nom, téléphone, note), **solde en grand** (rouge si dette, vert si soldé), boutons principaux « + Dette » et « Remboursement », actions secondaires (appeler `tel:`, SMS/WhatsApp de rappel avec message pré-rempli contenant le montant, modifier, supprimer pour l'owner). **Historique** paginé (scroll infini) groupé par jour (« Aujourd'hui », « Hier », « 12 octobre »), chaque ligne : type, montant signé, description, auteur, heure ; opérations annulées barrées avec mention « Annulée par X ». Appui long (owner) → annuler l'opération avec confirmation.
3. **Nouvelle opération** : sélecteur segmenté Dette / Remboursement, saisie du montant avec pavé numérique et formatage FCFA en direct, montants rapides (ex. 500, 1 000, 5 000), description optionnelle, pour un remboursement bouton « Tout rembourser » et blocage si montant > solde (message du 409 sinon). Retour haptique au succès.
4. **Créer / modifier un client** : nom, téléphone, note ; bouton flottant (FAB) « Ajouter un client » sur la liste.
5. **Supprimer un client** (owner) : expliquer clairement pourquoi c'est refusé (solde non nul ou historique existant — messages 409 de l'API).
6. **Équipe** (owner) : liste des collaborateurs (actif/désactivé), ajout, désactivation/réactivation, réinitialisation du mot de passe.
7. **Profil** : nom de la boutique (+ renommer pour l'owner), changer mon mot de passe, version de l'app, déconnexion avec confirmation.
8. **Liste des clients** : brancher `CustomerRow` → fiche client ; ajouter le tri (nom / solde décroissant) ; afficher sous l'en-tête owner les **top débiteurs** et les **dernières opérations** déjà renvoyés par `/api/dashboard` mais jamais affichés.

### 5.3 Données (React Query)
- Hooks à créer dans `src/hooks/` : `useCustomer(id)`, `useTransactions(id)` (infinite), `useCreateCustomer`, `useUpdateCustomer`, `useDeleteCustomer`, `useCreateTransaction`, `useCancelTransaction`, `useStaff`, `useCreateStaff`, `useUpdateStaff`, `useChangePassword`, `useRegister` (ou `signUp` dans `AuthContext`).
- Après chaque mutation, invalider précisément : `["customers"]`, `["customer", id]`, `["transactions", id]`, `["dashboard"]`. Mettre à jour le solde de la fiche directement depuis la réponse (`balance`) pour un retour instantané.
- Types à ajouter dans `lib/types.ts` : `Transaction`, `Staff`, `Shop`, réponses des mutations.
- Bloquer le double envoi des formulaires (bouton en chargement, `isPending`).

---

## 6. Design — amélioration et unification (Phase 4)

Le style actuel (bleu marine `#0F2A43`, teal `#0B6E78`, police Plus Jakarta Sans, en-têtes arrondis, mascotte) est une bonne base : **garde cette identité** et rends-la cohérente et plus soignée.

1. **Une seule source de vérité pour les tokens** : aujourd'hui les couleurs sont dupliquées entre `tailwind.config.js` et `src/lib/theme.ts`. Crée un fichier de tokens unique (couleurs, rayons, espacements, tailles de police) importé par les deux. Ajoute les tokens manquants : `payment`/`payment-soft` (vert), `warning`, `surface`, `overlay`.
2. **Composants à créer / factoriser** (`src/components/ui/`) :
   - `ScreenHeader` : le bandeau navy arrondi est copié dans la connexion, l'accueil et le profil → un seul composant (titre, sous-titre, bouton retour, actions).
   - `Card`, `IconButton`, `Fab`, `Badge` (Dette / Soldé / Annulée / Désactivé), `SegmentedControl`, `AmountInput`, `ConfirmDialog`, `Toast`/snackbar de confirmation, `SectionHeader` (dates), `TransactionRow`, `PasswordInput` (œil afficher/masquer).
3. **Montants** : chiffres à chasse fixe (`fontVariant: ["tabular-nums"]`), signe `+`/`−` et couleur sémantique cohérente partout (rouge = dette, vert = remboursement), jamais de couleur seule pour porter l'information (toujours un libellé ou une icône).
4. **Animations (Reanimated 4)** : apparition des lignes de liste (`FadeIn`/`FadeInDown` légers), transitions de mise en page à l'ajout/suppression, effet d'échelle à l'appui des boutons, skeleton avec effet shimmer, compteur animé du solde après une opération. Respecter « Réduire les animations » (`useReducedMotion`). Haptique (`expo-haptics`) sur succès/erreur.
5. **Dates** : utilitaires `formatDate`/`formatRelativeDay` en `fr-FR` dans `lib/format.ts`.
6. **États** : chaque écran doit avoir un état chargement (skeleton), vide (mascotte + bouton d'action, ex. « Ajouter mon premier client »), erreur (réessayer) et hors ligne (message clair quand le serveur est injoignable).
7. **Accessibilité** : zones tactiles ≥ 44×44, `accessibilityLabel` sur tous les boutons-icônes, contrastes WCAG AA vérifiés (notamment `muted` sur `canvas` et le texte sur `navy-light`), prise en charge des grandes tailles de police (pas de hauteurs fixes qui coupent le texte).
8. **Clavier et formulaires** : `KeyboardAvoidingView` cohérent, enchaînement des champs (`returnKeyType="next"`), fermeture du clavier au défilement.
9. **Connexion** : afficher/masquer le mot de passe, lien « Créer ma boutique », message 429 (S1).
10. **Mode sombre** : facultatif, à la fin seulement, si les tokens le permettent (`userInterfaceStyle: "automatic"`) — demande-moi avant.
11. **Icônes de l'app** : les icônes actuelles sont provisoires (commit `5d41d09`) ; prépare la liste des tailles nécessaires et signale-moi qu'il faut les visuels définitifs.

Montre-moi des captures (simulateur, ou Expo web via le navigateur intégré si c'est plus simple) des écrans principaux après cette phase.

---

## 7. Qualité et tests (Phase 5)

### Backend
- `jest` + `supertest` + `mongodb-memory-server` **en mode replica set** (pour tester les transactions de S2). `npm test` doit tourner sans base externe.
- Séparer `app.js` (déjà fait) et le démarrage serveur pour tester l'app sans écouter un port.
- Couverture minimale attendue :
  - auth : register, login OK/KO, `/me`, token expiré, token d'un utilisateur désactivé, token invalidé après changement de mot de passe (S3), rate-limit (S1) ;
  - **isolation entre boutiques** : un utilisateur de la boutique A ne peut ni lire, ni modifier, ni supprimer, ni créer d'opération sur un client de la boutique B (404 attendu) ;
  - rôles : un staff reçoit 403 sur dashboard, staff, annulation et suppression ;
  - soldes : dette, remboursement, remboursement > solde (409), annulation d'une dette déjà partiellement remboursée (409), cohérence du solde après échec simulé (S2), opérations concurrentes ;
  - validation : champs inconnus ignorés (pas de mass assignment sur `balance`, `shop`, `role`), téléphones normalisés (S8).

### Mobile
- `npx tsc --noEmit` et `npx expo lint` sans erreur ni avertissement.
- Tests unitaires simples pour `lib/format.ts` (montants, téléphones, dates) si un runner est mis en place (`jest-expo`, à installer via `npx expo install`).

---

## 8. Documentation et déploiement (Phase 6)

1. **`README.md` racine** : il est actuellement **corrompu** (encodé en UTF-16, il s'affiche `��#   c a r n e t …`). Le réécrire en UTF-8 : présentation, architecture, prérequis, lancement local (Mongo en replica set, backend, mobile), variables d'environnement, matrice des droits (S12), commandes de test, déploiement.
2. **Backend en production** : proposer un hébergeur (Render, Railway ou Fly.io) + MongoDB Atlas (replica set inclus), HTTPS obligatoire, variables d'env, `trust proxy`, endpoint `/api/health` (ajouter un test de connexion à la base). Ne crée aucun compte ni ressource en ligne toi-même : donne-moi les étapes.
3. **Mobile (EAS)** : `eas.json` avec profils `development`, `preview`, `production` et `EXPO_PUBLIC_API_URL` par profil ; compléter `app.json` (`android.package`, `ios.bundleIdentifier`, `versionCode`/`buildNumber` — demande-moi l'identifiant à utiliser). Vérifier `npx expo-doctor`.
4. **`.agents/`, `.claude/skills/`, `skills-lock.json`** (skills GSAP, non suivis par git) : demande-moi s'il faut les commiter ou les ajouter au `.gitignore`.

---

## 9. Questions à me poser avant d'implémenter

1. Les collaborateurs (`staff`) peuvent-ils enregistrer des **remboursements**, modifier les clients, voir le total des impayés ? (S12)
2. Indicatif pays par défaut pour la normalisation des numéros (Côte d'Ivoire `+225` avec 10 chiffres, comme le suggère `formatPhone`) ? (S8)
3. Politique de mot de passe : 8 caractères minimum suffisent-ils, ou faut-il un code PIN pour le staff ?
4. Identifiant d'application (`com.xxx.carnetcredits`) pour Android/iOS.
5. Mode sombre : oui ou non ?

---

## 10. Ordre d'exécution et définition de « terminé »

| Phase | Contenu | Livrable |
|---|---|---|
| 1 | Sécurité S1 → S11, puis re-audit S13 | commits `fix(api)`/`chore`, bilan des failles |
| 2 | Compléments backend (§4) | endpoints + seed |
| 3 | Fonctionnalités mobile (§5) | écrans branchés de bout en bout |
| 4 | Design (§6) | composants unifiés + captures |
| 5 | Tests (§7) | `npm test` vert, tsc/lint propres |
| 6 | Docs & déploiement (§8) | README, `.env.example`, `eas.json` |

Le projet est **terminé** quand :
- un propriétaire peut, depuis l'app, créer sa boutique, ajouter un client, lui faire crédit, enregistrer un remboursement, consulter l'historique, annuler une opération, gérer ses collaborateurs et changer son mot de passe ;
- un collaborateur ne voit et ne fait que ce que la matrice des droits autorise ;
- toutes les failles S1–S11 sont corrigées et couvertes par des tests quand c'est possible, et le re-audit ne laisse aucun point élevé ouvert ;
- `npm test`, `npx tsc --noEmit`, `npx expo lint`, `npm audit --omit=dev` (0 haute) et `npx expo-doctor` passent ;
- le README permet à quelqu'un de nouveau de lancer le projet en local en moins de 15 minutes.

Commence par la **Phase 1**. Avant de modifier quoi que ce soit, pose-moi les questions du §9 qui bloquent cette phase (n°2 et n°3), puis avance.
