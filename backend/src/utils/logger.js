const pino = require("pino");

const isTest = process.env.NODE_ENV === "test";
const isProduction = process.env.NODE_ENV === "production";

// pino-pretty est une dépendance de dev : absente après "npm ci --omit=dev"
const hasPretty = (() => {
    try {
        require.resolve("pino-pretty");
        return true;
    } catch {
        return false;
    }
})();

// Ces chemins ne doivent jamais apparaître en clair dans les journaux
const REDACTED_PATHS = [
    "req.headers.authorization",
    "req.headers.cookie",
    "*.password",
    "*.newPassword",
    "*.currentPassword",
    "*.passwordHash",
    "*.token",
];

const logger = pino({
    level: process.env.LOG_LEVEL || (isTest ? "silent" : "info"),
    redact: { paths: REDACTED_PATHS, censor: "[masqué]" },
    // Lisible en développement, JSON brut en production (pour l'hébergeur)
    transport:
        !isProduction && !isTest && hasPretty
            ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } }
            : undefined,
});

module.exports = logger;
