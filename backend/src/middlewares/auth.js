const User = require("../models/User");
const { verifierToken } = require("../utils/genererToken");

const authenticate = async (req, res, next) => {
    // 1. Vérifier l'en-tête Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentification requise.",
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Token manquant.",
        });
    }

    let payload;

    // 2. Vérifier le token JWT (signature, expiration, émetteur, destinataire)
    try {
        payload = verifierToken(token);
    } catch (error) {
        return res.status(401).json({
            message: "Token invalide ou expiré.",
        });
    }

    // Vérifier la présence de l'identifiant utilisateur et de la version
    if (typeof payload.sub !== "string" || !/^[a-f\d]{24}$/i.test(payload.sub) || typeof payload.ver !== "number") {
        return res.status(401).json({
            message: "Token invalide.",
        });
    }

    try {
        // 3. Récupérer l'utilisateur en base de données
        const user = await User.findById(payload.sub);

        if (!user || user.active === false) {
            return res.status(401).json({
                message: "Utilisateur inexistant ou désactivé.",
            });
        }

        // 4. Token émis avant un changement de mot de passe ou une désactivation : révoqué
        if (user.tokenVersion !== payload.ver) {
            return res.status(401).json({
                message: "Session expirée, reconnecte-toi.",
            });
        }

        // 5. Attacher l'utilisateur à la requête
        req.user = user;

        return next();
    } catch (error) {
        return next(error);
    }
};

module.exports = authenticate;
