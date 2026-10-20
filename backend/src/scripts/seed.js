// Crée une boutique de démonstration (développement uniquement).
//
//   npm run seed
//
// Relançable : la boutique de démo précédente est supprimée puis recréée.
// Identifiants (valeurs de démo, jamais à utiliser en production) :
//   propriétaire    07 00 00 00 01 / demo1234
//   collaborateurs  07 00 00 00 02 et 07 00 00 00 03 / demo1234
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const Shop = require("../models/Shop");
const User = require("../models/User");
const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");
const { hashPassword } = require("../utils/password");
const { normalizePhone } = require("../utils/phone");

const DEMO_PASSWORD = "demo1234";
const OWNER_PHONE = normalizePhone("0700000001");
const STAFF_PHONES = [normalizePhone("0700000002"), normalizePhone("0700000003")];

const FIRST_NAMES = ["Awa", "Moussa", "Fatou", "Ibrahim", "Aminata", "Kouadio", "Mariam", "Yao", "Aïcha", "Seydou", "Adjoua", "Bakary", "Salimata", "Konan", "Fanta"];
const LAST_NAMES = ["Koné", "Traoré", "Diabaté", "Kouassi", "Coulibaly", "Bamba", "Yao", "Ouattara", "Touré", "N'Guessan"];
const ITEMS = ["Riz 5 kg", "Huile 1 L", "Sucre", "Savon", "Lait en poudre", "Pain", "Recharge crédit", "Sardines", "Oignons", "Café"];

// Générateur pseudo-aléatoire déterministe : la démo est identique à chaque lancement
let seed = 42;
const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
};
const pick = (list) => list[Math.floor(random() * list.length)];
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000 - random() * 8 * 60 * 60 * 1000);

const removePreviousDemo = async () => {
    const owner = await User.findOne({ phone: OWNER_PHONE });
    const phones = [OWNER_PHONE, ...STAFF_PHONES];
    if (owner) {
        await Transaction.deleteMany({ shop: owner.shop });
        await Customer.deleteMany({ shop: owner.shop });
        await User.deleteMany({ shop: owner.shop });
        await Shop.deleteOne({ _id: owner.shop });
    }
    // Numéros de démo utilisés ailleurs : on ne touche pas aux données de quelqu'un d'autre
    if (await User.exists({ phone: { $in: phones } })) {
        throw new Error("Un numéro de démo appartient à une autre boutique : seed annulé.");
    }
};

const main = async () => {
    if (process.env.NODE_ENV === "production") {
        console.error("Le seed est interdit en production.");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        await removePreviousDemo();

        const passwordHash = await hashPassword(DEMO_PASSWORD);
        const shop = await Shop.create({ name: "Boutique de démo" });
        const owner = await User.create({ name: "Awa Koné", phone: OWNER_PHONE, passwordHash, role: "owner", shop: shop._id });
        const staff = await User.insertMany([
            { name: "Moussa Traoré", phone: STAFF_PHONES[0], passwordHash, role: "staff", shop: shop._id },
            { name: "Fatou Diabaté", phone: STAFF_PHONES[1], passwordHash, role: "staff", shop: shop._id, active: false },
        ]);
        const authors = [owner, owner, staff[0]];

        let transactionsCount = 0;
        for (let i = 0; i < 30; i += 1) {
            const customer = await Customer.create({
                name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
                phone: random() < 0.8 ? `22507${String(Math.floor(random() * 1e8)).padStart(8, "0")}` : undefined,
                note: random() < 0.2 ? "Paie en fin de mois" : undefined,
                shop: shop._id,
            });

            // Opérations du plus ancien au plus récent ; le solde reste toujours >= 0
            let balance = 0;
            const operations = [];
            const count = Math.floor(random() * 8);
            for (let j = count; j > 0; j -= 1) {
                const createdAt = daysAgo(j * 3);
                const author = pick(authors);
                if (balance > 0 && random() < 0.4) {
                    // Tout ou partie du solde ; seul le propriétaire enregistre un remboursement
                    const partial = Math.max(100, Math.round((balance * random()) / 100) * 100);
                    const amount = Math.min(balance, random() < 0.3 ? balance : partial);
                    balance -= amount;
                    operations.push({ type: "PAYMENT", amount, createdBy: owner._id, createdAt });
                } else {
                    const amount = (Math.floor(random() * 50) + 1) * 100;
                    balance += amount;
                    operations.push({ type: "DEBT", amount, description: pick(ITEMS), createdBy: author._id, createdAt });
                }
            }

            // Une dette annulée de temps en temps, pour la démo de l'historique
            if (random() < 0.15) {
                operations.push({
                    type: "DEBT",
                    amount: 1500,
                    description: "Erreur de saisie",
                    createdBy: staff[0]._id,
                    createdAt: daysAgo(1),
                    cancelled: true,
                    cancelledAt: daysAgo(0.5),
                    cancelledBy: owner._id,
                });
            }

            if (operations.length > 0) {
                await Transaction.insertMany(
                    operations.map((op) => ({ ...op, updatedAt: op.createdAt, shop: shop._id, customer: customer._id })),
                    { timestamps: false }
                );
                transactionsCount += operations.length;
            }
            await Customer.updateOne({ _id: customer._id }, { $set: { balance } });
        }

        console.log(`Boutique de démo créée : 30 clients, ${transactionsCount} opérations.`);
        console.log(`  Propriétaire   : 07 00 00 00 01 / ${DEMO_PASSWORD}`);
        console.log(`  Collaborateur  : 07 00 00 00 02 / ${DEMO_PASSWORD}`);
        console.log(`  Désactivé      : 07 00 00 00 03 / ${DEMO_PASSWORD}`);
    } catch (error) {
        console.error("Seed interrompu :", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

main();
