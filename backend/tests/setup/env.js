// Exécuté avant chaque fichier de test, avant tout require de l'application
const crypto = require("crypto");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "secret-de-test-uniquement-0123456789-abcdef";
process.env.JWT_EXPIRES_IN = "1h";
process.env.DEFAULT_COUNTRY_CODE = "225";
// Les tests simulent des IP différentes via X-Forwarded-For
process.env.TRUST_PROXY = "loopback";
process.env.RATE_LIMIT_MAX = "100000";

// Une base distincte par fichier de test : les fichiers peuvent tourner en parallèle
const dbName = `test_${crypto.randomUUID().replace(/-/g, "")}`;
process.env.MONGO_URI = process.env.TEST_MONGO_URI.replace(/\/(\?|$)/, `/${dbName}$1`);
