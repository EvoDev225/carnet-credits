# Bilan sécurité — Carnet de crédits

Date : 20 octobre 2026. Périmètre : `backend/` (API) et `mobile/` (app Expo).

## 1. Failles initiales (S1 à S11) : toutes corrigées

| # | Faille | Correction | Test |
|---|---|---|---|
| S1 | Pas de limitation de débit | `express-rate-limit` : connexion 5 échecs / 15 min par numéro et 20 par IP, inscription 5 / h par IP, changement de mot de passe 5 échecs / 15 min, limite globale ; `TRUST_PROXY` ; 429 en français affiché par l'app | `auth.test.js` |
| S2 | Soldes non atomiques | `session.withTransaction()` pour la création et l'annulation d'opération (et l'inscription) ; démarrage refusé sans replica set | `transactions.test.js` (panne simulée, concurrence) |
| S3 | JWT non révocables | `tokenVersion` (claim `ver`) incrémenté au changement de mot de passe et à la désactivation ; `issuer` / `audience` ; `JWT_EXPIRES_IN` ; `JWT_SECRET` ≥ 32 caractères vérifié au démarrage | `auth.test.js` |
| S4 | Dépendances | `bcrypt` retiré, `nodemon` remplacé par `node --watch` ; `npm audit --omit=dev` : 0 vulnérabilité | — |
| S5 | Fichiers d'environnement | `mobile/.env` retiré de git, `.env.example` documentés, clés de test supprimées de `backend/.env`, URL `https://` obligatoire en build de production | — |
| S6 | En-têtes / CORS | `helmet`, `x-powered-by` désactivé, CORS sur liste `CORS_ORIGINS` | `validation.test.js` |
| S7 | Validation de l'auth | Schémas zod ; mot de passe 8 caractères à 72 octets | `auth.test.js` |
| S8 | Téléphones non normalisés | `normalizePhone()` (indicatif 225 par défaut) dans les validateurs ; script de migration qui signale les doublons | `phone.test.js`, `auth.test.js` |
| S9 | Énumération par mesure du temps | Comparaison bcrypt avec un hash factice si le numéro est inconnu | `auth.test.js` |
| S10 | Taille et défense en profondeur | Corps ≤ 10 ko, `sanitizeFilter`, `strictQuery`, `:id` validés (400) | `validation.test.js` |
| S11 | Journalisation | `pino` / `pino-http`, masquage des secrets, `X-Request-Id`, pas de stack dans les réponses | `transactions.test.js` (500 sans détail) |
| S12 | Matrice des droits | Validée par le propriétaire du projet : le collaborateur n'enregistre pas de remboursement (403), ne voit pas le tableau de bord, n'annule pas, ne supprime pas, ne gère pas l'équipe, ne renomme pas la boutique | `access.test.js`, `shop.test.js` |

## 2. Re-audit (S13)

| Domaine | Constat | Statut |
|---|---|---|
| Contrôle d'accès / IDOR | Toutes les requêtes filtrent sur `shop: req.user.shop` ; une ressource d'une autre boutique renvoie 404 (lecture, modification, suppression, opération, annulation, collaborateur, tableau de bord) | ✅ testé |
| Injection NoSQL | Types imposés par zod + `sanitizeFilter` ; les opérateurs internes passent par `mongoose.trusted()` ; Express 5 ne transforme pas `a[$ne]=` en objet | ✅ testé |
| Mass assignment | zod retire les champs inconnus ; `balance`, `shop`, `role`, `tokenVersion` ne sont jamais lus depuis le corps | ✅ testé |
| ReDoS sur la recherche | Recherche limitée à 50 caractères et échappée avant la regex | ✅ |
| Gestion d'erreurs | Messages génériques, `requestId` sur les 500, détail uniquement dans les logs | ✅ |
| Stockage mobile | Jeton dans SecureStore (Keychain / Keystore). Sur Expo web (développement uniquement), repli sur `localStorage` | ✅ (web hors cible) |
| Journaux | Mots de passe et jetons masqués | ⚠️ voir point 3 |
| Dépendances | Prod : 0 vulnérabilité. Dev : vulnérabilités modérées via `jest` (sans impact à l'exécution) | ✅ |

**Aucun point de gravité élevée ne reste ouvert.**

## 3. Risques résiduels acceptés (à connaître)

1. **Blocage volontaire d'un compte** : 5 essais ratés sur un numéro bloquent sa connexion 15 minutes, même si un tiers les provoque. C'est le compromis classique contre le brute-force ; les connexions réussies ne consomment pas le quota.
2. **Limites de débit en mémoire** : propres à chaque instance de l'API. Avec plusieurs instances, utiliser un store partagé (Redis).
3. **Données personnelles dans les logs** : l'URL des requêtes (donc les termes de recherche : noms, numéros de clients) apparaît dans les journaux. À restreindre si les journaux sont envoyés vers un service tiers.
4. **Inscription** : le 409 « Ce numéro est déjà utilisé » révèle qu'un numéro est inscrit ; accepté car l'inscription est limitée à 5 par heure et par IP.
5. **Contrôles côté app** : masquer un bouton n'est pas une sécurité ; toutes les règles sont appliquées par l'API (403 / 404), l'app ne fait que refléter la matrice.
