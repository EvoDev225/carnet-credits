const bcryptjs = require("bcryptjs");
const User = require("../models/User");
const Shop = require("../models/Shop");
const genererToken = require("../utils/genererToken");

const INVALID_CREDENTIALS = "Identifiants incorrects";

// Liste blanche : seuls ces champs sortent vers le client (jamais passwordHash)
const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    shop: user.shop,
});

// Fabrique la réponse commune à register et login
const buildAuthResponse = (user) => ({
    token: genererToken(user),
    user: publicUser(user),
});

const register = async (req, res) => {
    let shop; // déclarés avant le try pour être visibles dans le catch
    let user;

    try {
        const { shopName, name, phone, password } = req.body;

        // 1. Types d'abord : trim() plante sur autre chose qu'une chaîne
        if ([shopName, name, phone, password].some((v) => typeof v !== "string")) {
            return res.status(400).json({ message: "Tous les champs sont requis !" });
        }

        // 2. Nettoyage (jamais sur le mot de passe)
        const cleanShopName = shopName.trim();
        const cleanName = name.trim();
        const cleanPhone = phone.trim();

        if (!cleanShopName || !cleanName || !cleanPhone || !password) {
            return res.status(400).json({ message: "Tous les champs sont requis !" });
        }
        if (password.length < 6) {
            return res
                .status(400)
                .json({ message: "Le mot de passe doit contenir au moins 6 caractères !" });
        }

        // 3. Numéro déjà pris ? On vérifie AVANT de hacher (bcrypt est lent)
        if (await User.exists({ phone: cleanPhone })) {
            return res.status(409).json({ message: "Ce numéro est déjà utilisé" });
        }

        // 4. Hachage
        const passwordHash = await bcryptjs.hash(password, 10);

        // 5. Création : la boutique, puis le propriétaire
        shop = await Shop.create({ name: cleanShopName });
        user = await User.create({
            name: cleanName,
            phone: cleanPhone,
            passwordHash,
            role: "owner", // écrit en dur : jamais lu dans req.body
            shop: shop._id,
        });

        return res.status(201).json(buildAuthResponse(user));
    } catch (error) {
        // Boutique créée mais pas d'utilisateur : on évite l'orpheline
        if (shop && !user) {
            await Shop.findByIdAndDelete(shop._id);
        }
        // Deux inscriptions simultanées : seul l'index unique les départage
        if (error.code === 11000) {
            return res.status(409).json({ message: "Ce numéro est déjà utilisé" });
        }
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur" });
    }
};

const login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (typeof phone !== "string" || typeof password !== "string") {
            return res.status(400).json({ message: "Tous les champs sont requis !" });
        }
        const cleanPhone = phone.trim();
        if (!cleanPhone || !password) {
            return res.status(400).json({ message: "Tous les champs sont requis !" });
        }

        const user = await User.findOne({ phone: cleanPhone }).select("+passwordHash");
        if (!user) {
            return res.status(401).json({ message: INVALID_CREDENTIALS });
        }

        const isMatch = await bcryptjs.compare(password, user.passwordHash);
        if (!isMatch || user.active === false) {
            return res.status(401).json({ message: INVALID_CREDENTIALS });
        }

        return res.status(200).json(buildAuthResponse(user));
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur" });
    }
};

// req.user est placé par le middleware authenticate
const me = (req, res) => res.status(200).json({ user: publicUser(req.user) });

module.exports = { register, login, me };