const mongoose = require("mongoose");

// Exécute fn(session) dans une transaction MongoDB : toutes les écritures
// faites avec cette session sont validées ensemble, ou annulées ensemble.
// withTransaction rejoue fn en cas d'erreur transitoire (ex. deux opérations
// simultanées sur le même client) : fn doit donc pouvoir être relancée.
// Lever une HttpError dans fn annule la transaction puis remonte l'erreur.
const withTransaction = async (fn) => {
    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            result = await fn(session);
        });
        return result;
    } finally {
        await session.endSession();
    }
};

module.exports = withTransaction;
