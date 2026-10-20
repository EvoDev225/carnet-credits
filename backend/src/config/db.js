const mongoose = require("mongoose");
const logger = require("../utils/logger");

// Défense en profondeur contre l'injection NoSQL : un objet { $gt: "" } venu
// du client est neutralisé ; nos propres opérateurs passent par mongoose.trusted()
mongoose.set("sanitizeFilter", true);
// Un champ de filtre inconnu du schéma est ignoré plutôt que transmis à MongoDB
mongoose.set("strictQuery", true);

// Les opérations sur les soldes utilisent des transactions MongoDB,
// qui n'existent que sur un replica set (ou un cluster Atlas)
const assertTransactionsSupported = async () => {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    const isReplicaSet = Boolean(hello.setName);
    const isSharded = hello.msg === "isdbgrid";

    if (!isReplicaSet && !isSharded) {
        throw new Error(
            "MongoDB tourne en mode autonome (standalone) : les transactions sont indisponibles. " +
                "Lance MongoDB en replica set (voir README, section « MongoDB en replica set ») " +
                "ou utilise MongoDB Atlas."
        );
    }
};

const connectDB = async (uri = process.env.MONGO_URI) => {
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
        await assertTransactionsSupported();
        logger.info("MongoDB connecté (transactions disponibles)");
    } catch (error) {
        await mongoose.disconnect().catch(() => {});
        throw error;
    }
};

module.exports = connectDB;
