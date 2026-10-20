const { rateLimit } = require("express-rate-limit");
const { loadEnv } = require("../config/env");

const MINUTE = 60 * 1000;

// Stockage en mémoire : suffisant pour une seule instance du serveur.
// Avec plusieurs instances, il faudra un store partagé (ex. Redis).

// Réponse 429 en français, avec le délai d'attente restant
const tooManyRequests = (action) => (req, res) => {
    const resetTime = req.rateLimit?.resetTime;
    const minutes = resetTime ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / MINUTE)) : 15;
    return res.status(429).json({
        message: `Trop de tentatives ${action}. Réessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.`,
    });
};

const common = {
    standardHeaders: "draft-8",
    legacyHeaders: false,
};

// Filet de sécurité global sur toute l'API
const apiLimiter = rateLimit({
    ...common,
    windowMs: 15 * MINUTE,
    limit: () => loadEnv().RATE_LIMIT_MAX,
    handler: tooManyRequests("de requêtes"),
});

// Connexion, par IP : seuls les échecs comptent. Seuil plus large que par numéro
// car beaucoup de clients mobiles partagent la même IP (NAT des opérateurs).
const loginIpLimiter = rateLimit({
    ...common,
    windowMs: 15 * MINUTE,
    limit: 20,
    skipSuccessfulRequests: true,
    handler: tooManyRequests("de connexion"),
});

// Connexion, par numéro (déjà normalisé par validate) : 5 échecs / 15 min.
// Bloque le brute-force d'un compte même réparti sur plusieurs IP.
const loginPhoneLimiter = rateLimit({
    ...common,
    windowMs: 15 * MINUTE,
    limit: 5,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `phone:${req.validated.body.phone}`,
    handler: tooManyRequests("de connexion"),
});

// Inscription, par IP : 5 boutiques par heure
const registerLimiter = rateLimit({
    ...common,
    windowMs: 60 * MINUTE,
    limit: 5,
    handler: tooManyRequests("d'inscription"),
});

// Changement de mot de passe, par utilisateur connecté : 5 échecs / 15 min
const passwordChangeLimiter = rateLimit({
    ...common,
    windowMs: 15 * MINUTE,
    limit: 5,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `user:${req.user._id}`,
    handler: tooManyRequests("de changement de mot de passe"),
});

module.exports = {
    apiLimiter,
    loginIpLimiter,
    loginPhoneLimiter,
    registerLimiter,
    passwordChangeLimiter,
};
