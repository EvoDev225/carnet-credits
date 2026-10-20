const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 100 },
        // Normalisé comme pour User (chiffres uniquement, indicatif inclus)
        phone: { type: String, trim: true, maxlength: 20 },
        note: { type: String, trim: true, maxlength: 500 },
        balance: {
            type: Number,
            default: 0,
            min: 0,
            validate: {
                validator: Number.isInteger,
                message: "Le solde doit être un nombre entier",
            },
        },
        shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    },
    { timestamps: true }
);

customerSchema.index({ shop: 1, name: 1 });
customerSchema.index({ shop: 1, phone: 1 });

module.exports = mongoose.model("Customer", customerSchema);