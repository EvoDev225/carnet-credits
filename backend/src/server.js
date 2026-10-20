require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const { loadEnv } = require("./config/env");

const lancerServeur = async () => {
    try {
        // Vérifie toutes les variables (dont JWT_SECRET ≥ 32 caractères) avant tout
        const env = loadEnv();
        const app = require("./app");
        const connectDB = require("./config/db");

        await connectDB(env.MONGO_URI);

        const server = app.listen(env.PORT, () => {
            logger.info(`Serveur démarré sur le port ${env.PORT} (${env.NODE_ENV})`);
        });

        // Arrêt propre demandé par l'hébergeur (déploiement, redémarrage)
        const arreter = (signal) => {
            logger.info(`${signal} reçu, arrêt du serveur`);
            server.close(async () => {
                await mongoose.disconnect();
                process.exit(0);
            });
            // Filet de sécurité si des connexions restent ouvertes
            setTimeout(() => process.exit(1), 10000).unref();
        };
        process.on("SIGTERM", arreter);
        process.on("SIGINT", arreter);
    } catch (error) {
        logger.fatal(error.message);
        process.exit(1);
    }
};

lancerServeur();
