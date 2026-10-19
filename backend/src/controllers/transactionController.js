const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");

const createTransaction = async (req, res, next) => {
    try {
        const { type, amount, description } = req.validated.body;
        const delta = type === "DEBT" ? amount : -amount;

        const filter = { _id: req.params.id, shop: req.user.shop };
        if (type === "PAYMENT") {
            filter.balance = { $gte: amount };
        }

        const updatedCustomer = await Customer.findOneAndUpdate(
            filter,
            { $inc: { balance: delta } },
            { new: true }
        );

        if (!updatedCustomer) {
            const customerExists = await Customer.exists({ _id: req.params.id, shop: req.user.shop });
            if (!customerExists) {
                return res.status(404).json({ message: "Client introuvable" });
            }
            return res.status(409).json({ message: "Le remboursement dépasse le solde du client" });
        }

        let transaction;
        try {
            transaction = await Transaction.create({
                shop: req.user.shop,
                customer: req.params.id,
                createdBy: req.user._id,
                type,
                amount,
                description
            });
        } catch (createError) {
            try {
                await Customer.updateOne(
                    { _id: req.params.id, shop: req.user.shop },
                    { $inc: { balance: -delta } }
                );
            } catch (rollbackError) {
                console.error("INCOHÉRENCE : solde modifié sans transaction pour le client " + req.params.id, rollbackError);
            }
            throw createError;
        }

        return res.status(201).json({
            message: "Opération enregistrée",
            transaction,
            balance: updatedCustomer.balance
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
                .populate("createdBy", "name"),
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
        const transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, shop: req.user.shop, cancelled: false },
            { $set: { cancelled: true, cancelledAt: new Date(), cancelledBy: req.user._id } },
            { new: true }
        );

        if (!transaction) {
            const exists = await Transaction.exists({ _id: req.params.id, shop: req.user.shop });
            if (!exists) {
                return res.status(404).json({ message: "Opération introuvable" });
            }
            return res.status(409).json({ message: "Cette opération est déjà annulée" });
        }

        const delta = transaction.type === "DEBT" ? -transaction.amount : transaction.amount;

        const filter = { _id: transaction.customer, shop: req.user.shop };
        if (delta < 0) {
            filter.balance = { $gte: transaction.amount };
        }

        const updatedCustomer = await Customer.findOneAndUpdate(
            filter,
            { $inc: { balance: delta } },
            { new: true }
        );

        if (!updatedCustomer) {
            await Transaction.updateOne(
                { _id: transaction._id },
                { $set: { cancelled: false }, $unset: { cancelledAt: "", cancelledBy: "" } }
            );
            return res.status(409).json({ message: "Annulation impossible : le solde du client est insuffisant (une partie de cette dette a déjà été remboursée)" });
        }

        return res.status(200).json({
            message: "Opération annulée",
            transaction,
            balance: updatedCustomer.balance
        });
    } catch (error) {
        next(error);
    }
};





module.exports = { createTransaction, listTransactions, cancelTransaction }