
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

    // 2. Vérifier le token JWT
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET,{ algorithms: ["HS256"] });
    } catch (error) {
        return res.status(401).json({
            message: "Token invalide ou expiré.",
        });
    }

    // Vérifier la présence de l'identifiant utilisateur
    if (!payload.sub) {
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

        // 4. Attacher l'utilisateur à la requête
        req.user = user;

        return next();
    } catch (error) {
        return next(error);
    }
};

module.exports = authenticate;
