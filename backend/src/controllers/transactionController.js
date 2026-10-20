const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");
const HttpError = require("../utils/httpError");
const withTransaction = require("../utils/withTransaction");

const createTransaction = async (req, res, next) => {
    try {
        const { type, amount, description } = req.validated.body;
        const delta = type === "DEBT" ? amount : -amount;

        // Matrice des droits : un remboursement réduit une dette, seul le propriétaire
        // peut l'enregistrer (limite le risque de fraude interne)
        if (type === "PAYMENT" && req.user.role !== "owner") {
            return res.status(403).json({ message: "Seul le propriétaire peut enregistrer un remboursement." });
        }

        // Solde et opération sont écrits dans la même transaction :
        // impossible d'avoir l'un sans l'autre, même en cas de panne
        const result = await withTransaction(async (session) => {
            const filter = { _id: req.params.id, shop: req.user.shop };
            if (type === "PAYMENT") {
                // Condition atomique : le solde ne peut jamais devenir négatif
                filter.balance = mongoose.trusted({ $gte: amount });
            }

            const updatedCustomer = await Customer.findOneAndUpdate(
                filter,
                { $inc: { balance: delta } },
                { returnDocument: "after", session }
            );

            if (!updatedCustomer) {
                const customerExists = await Customer.exists({ _id: req.params.id, shop: req.user.shop }).session(session);
                if (!customerExists) {
                    throw new HttpError(404, "Client introuvable");
                }
                throw new HttpError(409, "Le remboursement dépasse le solde du client");
            }

            const [transaction] = await Transaction.create(
                [
                    {
                        shop: req.user.shop,
                        customer: req.params.id,
                        createdBy: req.user._id,
                        type,
                        amount,
                        description: description || undefined,
                    },
                ],
                { session }
            );

            return { transaction, balance: updatedCustomer.balance };
        });

        return res.status(201).json({
            message: "Opération enregistrée",
            transaction: result.transaction,
            balance: result.balance
        });
    } catch (error) {
        next(error);
    }
};

const listTransactions = async (req, res, next) => {
    try {
        const { page, limit } = req.validated.query;

        const customer = await Customer.findOne({ _id: req.params.id, shop: req.user.shop });
        if (!customer) {
            return res.status(404).json({ message: "Client introuvable" });
        }

        const filter = { shop: req.user.shop, customer: req.params.id };

        const [items, total] = await Promise.all([
            Transaction.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("createdBy", "name")
                .populate("cancelledBy", "name"),
            Transaction.countDocuments(filter)
        ]);

        return res.status(200).json({
            items,
            page,
            limit,
            total,
            balance: customer.balance
        });
    } catch (error) {
        next(error);
    }
};

const cancelTransaction = async (req, res, next) => {
    try {
        const result = await withTransaction(async (session) => {
            const transaction = await Transaction.findOneAndUpdate(
                { _id: req.params.id, shop: req.user.shop, cancelled: false },
                { $set: { cancelled: true, cancelledAt: new Date(), cancelledBy: req.user._id } },
                { returnDocument: "after", session }
            );

            if (!transaction) {
                const exists = await Transaction.exists({ _id: req.params.id, shop: req.user.shop }).session(session);
                if (!exists) {
                    throw new HttpError(404, "Opération introuvable");
                }
                throw new HttpError(409, "Cette opération est déjà annulée");
            }

            const delta = transaction.type === "DEBT" ? -transaction.amount : transaction.amount;

            const filter = { _id: transaction.customer, shop: req.user.shop };
            if (delta < 0) {
                filter.balance = mongoose.trusted({ $gte: transaction.amount });
            }

            const updatedCustomer = await Customer.findOneAndUpdate(
                filter,
                { $inc: { balance: delta } },
                { returnDocument: "after", session }
            );

            // L'erreur annule aussi le passage de l'opération à "annulée"
            if (!updatedCustomer) {
                throw new HttpError(409, "Annulation impossible : le solde du client est insuffisant (une partie de cette dette a déjà été remboursée)");
            }

            return { transaction, balance: updatedCustomer.balance };
        });

        return res.status(200).json({
            message: "Opération annulée",
            transaction: result.transaction,
            balance: result.balance
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createTransaction, listTransactions, cancelTransaction }
