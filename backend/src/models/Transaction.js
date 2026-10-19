const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["DEBT", "PAYMENT"], required: true },
    amount: {
        type: Number,
        required: true,
        min: 1,
        validate: {
            validator: Number.isInteger,
            message: "Le montant doit être un entier"
        }
    },
    description: { type: String, maxlength: 200 },
    cancelled: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, {
    timestamps: true
});

transactionSchema.index({ shop: 1, customer: 1, createdAt: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;