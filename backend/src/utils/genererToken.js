const jwt = require("jsonwebtoken");
const { loadEnv } = require("../config/env");

const TOKEN_ISSUER = "carnet-credits-api";
const TOKEN_AUDIENCE = "carnet-credits-app";

// ver = tokenVersion de l'utilisateur : l'incrémenter en base invalide
// tous les tokens déjà distribués (changement de mot de passe, désactivation)
const genererToken = (user) => {
    const { JWT_SECRET, JWT_EXPIRES_IN } = loadEnv();
    return jwt.sign({ sub: user._id.toString(), ver: user.tokenVersion ?? 0 }, JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: /^\d+$/.test(JWT_EXPIRES_IN) ? Number(JWT_EXPIRES_IN) : JWT_EXPIRES_IN,
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
    });
};

// Lève une erreur si le token est invalide, expiré, ou émis pour une autre application
const verifierToken = (token) =>
    jwt.verify(token, loadEnv().JWT_SECRET, {
        algorithms: ["HS256"],
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
    });

module.exports = genererToken;
module.exports.verifierToken = verifierToken;
