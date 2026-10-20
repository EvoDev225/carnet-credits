const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");

const getDashboard = async (req, res, next) => {
    try {
        const shop = req.user.shop;
        const now = new Date();
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        const [customerStats, topDebtors, transactionStats, recentTransactions] = await Promise.all([
            Customer.aggregate([
                { $match: { shop } },
                {
                    $group: {
                        _id: null,
                        customersCount: { $sum: 1 },
                        totalOutstanding: { $sum: "$balance" },
                        customersWithDebt: { $sum: { $cond: [{ $gt: ["$balance", 0] }, 1, 0] } }
                    }
                }
            ]),
            Customer.find({ shop, balance: mongoose.trusted({ $gt: 0 }) })
                .sort({ balance: -1, _id: 1 })
                .limit(5)
                .select("name phone balance"),
            Transaction.aggregate([
                { $match: { shop, cancelled: false, createdAt: { $gte: monthStart } } },
                {
                    $group: {
                        _id: "$type",
                        total: { $sum: "$amount" },
                        count: { $sum: 1 }
                    }
                }
            ]),
            Transaction.find({ shop })
                .sort({ createdAt: -1, _id: -1 })
                .limit(5)
                .populate("customer", "name")
                .populate("createdBy", "name")
        ]);

        const stats = customerStats[0] || { customersCount: 0, totalOutstanding: 0, customersWithDebt: 0 };
        const debtStat = transactionStats.find((s) => s._id === "DEBT") || { total: 0, count: 0 };
        const paymentStat = transactionStats.find((s) => s._id === "PAYMENT") || { total: 0, count: 0 };

        res.status(200).json({
            summary: {
                customersCount: stats.customersCount,
                customersWithDebt: stats.customersWithDebt,
                totalOutstanding: stats.totalOutstanding
            },
            topDebtors,
            month: {
                start: monthStart,
                debts: { total: debtStat.total, count: debtStat.count },
                payments: { total: paymentStat.total, count: paymentStat.count }
            },
            recentTransactions
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboard
};