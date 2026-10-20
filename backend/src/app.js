const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const pinoHttp = require("pino-http");
const logger = require("./utils/logger");
const { loadEnv, parseTrustProxy, parseList } = require("./config/env");
const { apiLimiter } = require("./middlewares/rateLimit");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const staffRoutes = require("./routes/staffRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const shopRoutes = require("./routes/shopRoutes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const env = loadEnv();
const app = express();

// Derrière un hébergeur (Render, Railway…), req.ip vient de X-Forwarded-For :
// indispensable pour que la limitation de débit vise le vrai client
app.set("trust proxy", parseTrustProxy(env.TRUST_PROXY));
app.disable("x-powered-by");

// Identifiant de requête : repris du proxy s'il est sûr, sinon généré.
// Renvoyé dans X-Request-Id et présent dans chaque ligne de log.
app.use(
    pinoHttp({
        logger,
        genReqId: (req, res) => {
            const incoming = req.headers["x-request-id"];
            const id =
                typeof incoming === "string" && /^[\w-]{8,64}$/.test(incoming)
                    ? incoming
                    : crypto.randomUUID();
            res.setHeader("X-Request-Id", id);
            return id;
        },
        customLogLevel: (req, res, error) => {
            if (error || res.statusCode >= 500) return "error";
            if (res.statusCode >= 400) return "warn";
            return "info";
        },
    })
);

app.use(helmet());

// L'app mobile native n'envoie pas d'en-tête Origin : CORS ne concerne que le web.
// En développement, Expo web (localhost:8081) est autorisé par défaut.
const corsOrigins = parseList(env.CORS_ORIGINS);
if (corsOrigins.length === 0 && env.NODE_ENV === "development") {
    corsOrigins.push("http://localhost:8081");
}
app.use(cors({ origin: corsOrigins }));

app.use(express.json({ limit: "10kb" }));

app.get("/api/health", async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            throw new Error("MongoDB non connecté");
        }
        await mongoose.connection.db.admin().ping();
        return res.status(200).json({ status: "ok", database: "ok" });
    } catch (error) {
        req.log.error({ err: error }, "Vérification de santé : base injoignable");
        return res.status(503).json({ status: "error", database: "unreachable" });
    }
});

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/shop", shopRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
