const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");
// Échappe les caractères spéciaux d'une recherche avant de l'utiliser dans une regex
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Les champs à null (numéro ou note effacés) sont retirés du document
const buildUpdate = (fields) => {
    const update = {};
    for (const [key, value] of Object.entries(fields)) {
        if (value === null) {
            update.$unset = { ...update.$unset, [key]: "" };
        } else {
            update.$set = { ...update.$set, [key]: value };
        }
    }
    return update;
};

const createCustomer = async (req, res, next) => {
    try {
        const { name, phone, note } = req.validated.body;
        const customer = await Customer.create({
            name,
            phone: phone ?? undefined,
            note: note ?? undefined,
            shop: req.user.shop, // lu dans le token, jamais dans le corps
        });
        return res.status(201).json({ message: "Client créé avec succès", customer });
    } catch (error) {
        next(error);
    }
};

const listCustomers = async (req, res, next) => {
    try {
        const { search, page, limit, sort,status } = req.validated.query;

        const filter = { shop: req.user.shop };
        if (status === "debt") filter.balance = mongoose.trusted({ $gt: 0 });
        if (status === "settled") filter.balance = 0;
        if (search) {
            const byName = { name: mongoose.trusted({ $regex: escapeRegex(search), $options: "i" }) };
            // Au moins 3 chiffres : on cherche aussi dans les numéros (stockés en chiffres seuls)
            const digits = search.replace(/\D/g, "");
            filter.$or =
                digits.length >= 3
                    ? [byName, { phone: mongoose.trusted({ $regex: digits }) }]
                    : [byName];
        }

        const descending = sort.startsWith("-");
        const sortField = descending ? sort.slice(1) : sort;
        // _id en second : départage les égalités (beaucoup de soldes à 0),
        // sinon un client peut apparaître deux fois ou disparaître entre deux pages
        const sortOptions = { [sortField]: descending ? -1 : 1, _id: 1 };
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Customer.find(filter)
                .sort(sortOptions)
                .collation({ locale: "fr", strength: 2 }) // tri alphabétique naturel, sans souci de casse
                .skip(skip)
                .limit(limit),
            Customer.countDocuments(filter),
        ]);

        return res.status(200).json({ items, page, limit, total,status });
    } catch (error) {
        next(error);
    }
};

const getCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findOne({
            _id: req.params.id,
            shop: req.user.shop,
        });

        if (!customer) {
            return res.status(404).json({ message: "Client introuvable" });
        }

        return res.status(200).json({ customer });
    } catch (error) {
        next(error);
    }
};

const updateCustomer = async (req, res, next) => {
    try {
        // Seuls les champs du schéma zod arrivent ici : ni balance, ni shop
        const customer = await Customer.findOneAndUpdate(
            { _id: req.params.id, shop: req.user.shop },
            buildUpdate(req.validated.body),
            { returnDocument: "after", runValidators: true }
        );

        if (!customer) {
            return res.status(404).json({ message: "Client introuvable" });
        }

        return res.status(200).json({ message: "Client modifié avec succès", customer });
    } catch (error) {
        next(error);
    }
};

const deleteCustomer = async (req, res, next) => {
    try {
        const customerExists = await Customer.exists({ _id: req.params.id, shop: req.user.shop });
        if (!customerExists) {
            return res.status(404).json({ message: "Client introuvable" });
        }

        const transactionExists = await Transaction.exists({ shop: req.user.shop, customer: req.params.id });
        if (transactionExists) {
            return res.status(409).json({ message: "Ce client a un historique d'opérations, il ne peut pas être supprimé" });
        }

        const deletedCustomer = await Customer.findOneAndDelete({
            _id: req.params.id,
            shop: req.user.shop,
            balance: 0
        });

        if (!deletedCustomer) {
            return res.status(409).json({ message: "Impossible de supprimer ce client : son solde n'est pas de zéro" });
        }

        return res.status(204).end();
    } catch (error) {
        next(error);
    }
};

module.exports = {createCustomer,listCustomers,updateCustomer,deleteCustomer,getCustomer}
