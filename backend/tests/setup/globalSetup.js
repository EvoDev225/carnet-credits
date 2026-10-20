const { execSync } = require("child_process");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

// Si un mongod est déjà installé (PATH), on l'utilise : évite de télécharger
// ~800 Mo au premier lancement. Sinon mongodb-memory-server télécharge le sien.
const findSystemMongod = () => {
    try {
        const command = process.platform === "win32" ? "where mongod" : "command -v mongod";
        return execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString().split(/\r?\n/)[0].trim() || undefined;
    } catch {
        return undefined;
    }
};

module.exports = async () => {
    if (!process.env.MONGOMS_SYSTEM_BINARY) {
        const mongod = findSystemMongod();
        if (mongod) process.env.MONGOMS_SYSTEM_BINARY = mongod;
    }

    // Replica set mono-nœud : indispensable pour tester les transactions (S2)
    const replSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: "wiredTiger" },
    });
    globalThis.__MONGO_REPLSET__ = replSet;
    process.env.TEST_MONGO_URI = replSet.getUri();
};
