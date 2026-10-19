require("dotenv").config();
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const Shop = require("../models/Shop");
const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");

// Option : node src/scripts/testModels.js --keep  (garde les données pour les voir dans Compass)
const KEEP = process.argv.includes("--keep");

// phone est unique pour User : on en génère un différent à chaque exécution
const uniquePhone = () => "07" + String(Date.now()).slice(-8);

// Vérifie qu'une action ÉCHOUE bien (c'est ça, un vrai test d'échec)
const expectFailure = async (label, action) => {
    try {
        await action();
        console.log(`PROBLÈME : "${label}" aurait dû être refusé`);
        process.exitCode = 1;
    } catch (error) {
        console.log(`OK, refusé (${label}) :`, error.message);
    }
};

const testModels = async () => {
    let shop; // déclaré ici pour être visible dans le finally

    try {
        await connectDB();

        // 1. Cas valides
        const passwordHash = await bcryptjs.hash("password", 10);

        shop = await Shop.create({ name: "Test Shop" });

        const user = await User.create({
            name: "Admin",
            phone: uniquePhone(),
            passwordHash,
            role: "owner",
            shop: shop._id,
        });

        const customer = await Customer.create({
            name: "John Doe",
            phone: "0987654321",
            note: "Client de test",
            balance: 100,
            shop: shop._id,
        });

        const transaction = await Transaction.create({
            customer: customer._id,
            shop: shop._id,
            createdBy: user._id,
            type: "DEBT",
            amount: 100,
        });

        console.log("Boutique créée :", shop._id);
        console.log("Utilisateur créé :", user._id);
        console.log("Client créé :", customer._id);
        console.log("Transaction créée :", transaction._id);

        // 2. Cas invalides : chacun doit être refusé
        await expectFailure("client sans nom", () =>
            Customer.create({ phone: "0000000000", balance: 0, shop: shop._id })
        );

        await expectFailure("montant décimal", () =>
            Transaction.create({
                customer: customer._id,
                shop: shop._id,
                createdBy: user._id,
                type: "DEBT",
                amount: 12.5,
            })
        );

        // 3. Vérification de select: false
        const sansHash = await User.findOne({ _id: user._id });
        console.log("Sans select, passwordHash :", sansHash.passwordHash); // attendu : undefined

        const avecHash = await User.findOne({ _id: user._id }).select("+passwordHash");
        console.log("Avec +passwordHash :", avecHash.passwordHash ? "présent" : "absent"); // attendu : présent
    } catch (error) {
        console.error("Erreur inattendue :", error.message);
        process.exitCode = 1;
    } finally {
        // 4. Nettoyage pour pouvoir relancer le script
        if (shop && !KEEP) {
            await Transaction.deleteMany({ shop: shop._id });
            await Customer.deleteMany({ shop: shop._id });
            await User.deleteMany({ shop: shop._id });
            await Shop.deleteOne({ _id: shop._id });
        }
        await mongoose.disconnect();
    }
};

testModels();