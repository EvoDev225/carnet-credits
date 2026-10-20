const z = require("zod");

// Toutes les variables d'environnement passent par ici : une valeur absente
// ou invalide fait échouer le démarrage avec un message clair
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    MONGO_URI: z.string({ message: "MONGO_URI est requis" }).min(1, { message: "MONGO_URI est requis" }),
    JWT_SECRET: z
        .string({ message: "JWT_SECRET est requis" })
        .min(32, { message: "JWT_SECRET doit contenir au moins 32 caractères" }),
    // Format accepté par jsonwebtoken : "7d", "12h", "30m" ou un nombre de secondes
    JWT_EXPIRES_IN: z
        .string()
        .regex(/^\d+[smhd]?$/, { message: "JWT_EXPIRES_IN doit ressembler à 7d, 12h, 30m ou 3600" })
        .default("7d"),
    // false, true, un nombre de proxys (ex. 1) ou une liste d'adresses (voir doc Express "trust proxy")
    TRUST_PROXY: z.string().default("false"),
    // Origines autorisées par CORS, séparées par des virgules (inutile pour l'app native)
    CORS_ORIGINS: z.string().default(""),
    DEFAULT_COUNTRY_CODE: z
        .string()
        .regex(/^[1-9]\d{0,2}$/, { message: "DEFAULT_COUNTRY_CODE doit être un indicatif sans + (ex. 225)" })
        .default("225"),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
    // Limite globale de requêtes par IP sur /api (fenêtre de 15 minutes)
    RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
});

let cached;

const loadEnv = () => {
    if (cached) return cached;

    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        const details = result.error.issues
            .map((issue) => `  - ${issue.path.join(".")} : ${issue.message}`)
            .join("\n");
        throw new Error(`Configuration invalide (fichier .env) :\n${details}`);
    }

    cached = result.data;
    return cached;
};

// "false" → false, "true" → true, "1" → 1, sinon la chaîne telle quelle (liste d'IP / sous-réseaux)
const parseTrustProxy = (value) => {
    if (value === "false") return false;
    if (value === "true") return true;
    if (/^\d+$/.test(value)) return Number(value);
    return value;
};

const parseList = (value) =>
    value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

module.exports = { loadEnv, parseTrustProxy, parseList };
