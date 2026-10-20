// Normalise les numéros déjà enregistrés (utilisateurs et clients).
//
//   node src/scripts/migratePhones.js            → applique les changements
//   node src/scripts/migratePhones.js --dry-run  → affiche seulement ce qui changerait
//
// Idempotent : un numéro déjà normalisé n'est pas modifié, on peut relancer sans risque.
// Les doublons sont SIGNALÉS mais jamais fusionnés : c'est à toi de trancher.
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const User = require("../models/User");
const Customer = require("../models/Customer");
const { normalizePhone } = require("../utils/phone");

const DRY_RUN = process.argv.includes("--dry-run");

// Regroupe des documents par clé et ne garde que les groupes de plus d'un élément
const findDuplicates = (docs, keyOf) => {
    const groups = new Map();
    for (const doc of docs) {
        const key = keyOf(doc);
        if (!key) continue;
        groups.set(key, [...(groups.get(key) || []), doc]);
    }
    return [...groups.entries()].filter(([, group]) => group.length > 1);
};

const migrateUsers = async () => {
    const users = await User.find({}, "name phone shop role").lean();
    const planned = users.map((user) => ({ user, normalized: normalizePhone(user.phone) }));

    const invalid = planned.filter((p) => !p.normalized);
    for (const { user } of invalid) {
        console.log(`  [utilisateur] numéro invalide, non modifié : ${user.name} (${user._id}) « ${user.phone} »`);
    }

    // User.phone est unique : deux comptes qui deviennent identiques ne peuvent pas être migrés
    const duplicates = findDuplicates(planned, (p) => p.normalized);
    const blocked = new Set();
    for (const [phone, group] of duplicates) {
        console.log(`  [utilisateur] DOUBLON sur ${phone} :`);
        for (const { user } of group) {
            console.log(`      - ${user.name} (${user._id}, ${user.role}, boutique ${user.shop}) « ${user.phone} »`);
            blocked.add(String(user._id));
        }
    }

    let updated = 0;
    for (const { user, normalized } of planned) {
        if (!normalized || normalized === user.phone || blocked.has(String(user._id))) continue;
        console.log(`  [utilisateur] ${user.name} : « ${user.phone} » → ${normalized}`);
        if (!DRY_RUN) await User.updateOne({ _id: user._id }, { $set: { phone: normalized } });
        updated += 1;
    }

    return { total: users.length, updated, invalid: invalid.length, duplicates: duplicates.length };
};

const migrateCustomers = async () => {
    const customers = await Customer.find({ phone: { $exists: true } }, "name phone shop").lean();
    const planned = customers.map((customer) => ({ customer, normalized: normalizePhone(customer.phone) }));

    const invalid = planned.filter((p) => p.customer.phone && !p.normalized);
    for (const { customer } of invalid) {
        console.log(`  [client] numéro invalide, non modifié : ${customer.name} (${customer._id}) « ${customer.phone} »`);
    }

    // Pas d'unicité imposée pour les clients : on migre, mais on signale les doublons par boutique
    const duplicates = findDuplicates(planned, (p) => p.normalized && `${p.customer.shop}:${p.normalized}`);
    for (const [key, group] of duplicates) {
        console.log(`  [client] DOUBLON possible dans la boutique ${key.split(":")[0]} :`);
        for (const { customer } of group) {
            console.log(`      - ${customer.name} (${customer._id}) « ${customer.phone} »`);
        }
    }

    let updated = 0;
    for (const { customer, normalized } of planned) {
        if (!normalized || normalized === customer.phone) continue;
        if (!DRY_RUN) await Customer.updateOne({ _id: customer._id }, { $set: { phone: normalized } });
        updated += 1;
    }

    return { total: customers.length, updated, invalid: invalid.length, duplicates: duplicates.length };
};

const main = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(DRY_RUN ? "Simulation (aucune écriture)\n" : "Migration des numéros\n");

        const users = await migrateUsers();
        const customers = await migrateCustomers();

        const verb = DRY_RUN ? "à modifier" : "modifiés";
        console.log(`\nUtilisateurs : ${users.updated}/${users.total} ${verb}, ${users.invalid} invalides, ${users.duplicates} doublons`);
        console.log(`Clients      : ${customers.updated}/${customers.total} ${verb}, ${customers.invalid} invalides, ${customers.duplicates} doublons`);
    } catch (error) {
        console.error("Migration interrompue :", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

main();
