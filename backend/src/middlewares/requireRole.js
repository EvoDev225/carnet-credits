// requireRole("owner")           → seul le propriétaire passe
// requireRole("owner", "staff")  → les deux rôles passent
const requireRole = (...roles) => {
    // Cette fonction est appelée UNE fois, au démarrage, quand on déclare la route.
    // Elle renvoie le vrai middleware, qui sera appelé à CHAQUE requête.
    return (req, res, next) => {
        // Sécurité : si authenticate n'est pas passé avant, on ne sait pas qui est là
        if (!req.user) {
            return res.status(401).json({ message: "Authentification requise." });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Accès interdit." });
        }

        return next();
    };
};

module.exports = requireRole;