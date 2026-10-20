const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    // Toujours normalisé (utils/phone.js) : chiffres uniquement, indicatif inclus
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, default: "staff", enum: ["owner", "staff"], required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    active: { type: Boolean, default: true },
    // Copié dans chaque JWT (claim "ver") : l'incrémenter révoque tous les tokens existants
    tokenVersion: { type: Number, default: 0 },
},
{ timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
