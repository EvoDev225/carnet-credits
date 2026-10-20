const HttpError = require("../utils/httpError");

const notFound = (req, res, next) => {
    return res.status(404).json({ message: "Route introuvable" });
};

const errorHandler = (err, req, res, next) => {
    // Si une réponse est déjà partie, on laisse Express fermer proprement
    if (res.headersSent) {
        return next(err);
    }

    // Erreur métier levée volontairement (souvent dans une transaction)
    if (err instanceof HttpError) {
        return res.status(err.status).json({ message: err.message });
    }

    // Corps JSON mal formé (faute du client, pas du serveur)
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "JSON invalide" });
    }

    if (err.type === "entity.too.large") {
        return res.status(413).json({ message: "Corps de requête trop volumineux" });
    }

    // Validation Mongoose : on renvoie les champs fautifs (messages écrits par nous)
    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return res.status(400).json({ message: "Données invalides", errors });
    }

    if (err.name === "CastError") {
        return res.status(400).json({ message: "Identifiant invalide" });
    }

    if (err.code === 11000) {
        return res.status(409).json({ message: "Cette donnée existe déjà" });
    }

    // Tout le reste : le détail (et la stack) va dans les logs, jamais dans la réponse.
    // L'identifiant de requête permet de retrouver la ligne de log correspondante.
    req.log.error({ err }, "Erreur non gérée");
    return res.status(500).json({ message: "Erreur serveur", requestId: req.id });
};

module.exports = { notFound, errorHandler };
