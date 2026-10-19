const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");
// Échappe les caractères spéciaux d'une recherche avant de l'utiliser dans une regex
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.create({
            ...req.validated.body,
            shop: req.user.shop, // après le spread : le corps ne peut pas l'écraser
        });
        return res.status(201).json({ message: "Client créé avec succès", customer });
    } catch (error) {
        next(error);
    }
};

const listCustomers = async (req, res, next) => {
    try {
        const { search, page, limit, sort } = req.validated.query;

        const filter = { shop: req.user.shop };
        if (search) {
            filter.name = { $regex: escapeRegex(search), $options: "i" };
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

        return res.status(200).json({ items, page, limit, total });
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
        const customer = await Customer.findOneAndUpdate(
            { _id: req.params.id, shop: req.user.shop },
            req.validated.body,
            { new: true, runValidators: true }
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