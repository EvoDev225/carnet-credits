const User = require("../models/User");
const Shop = require("../models/Shop");
const genererToken = require("../utils/genererToken");
const { hashPassword, verifyPassword } = require("../utils/password");
const withTransaction = require("../utils/withTransaction");

const INVALID_CREDENTIALS = "Identifiants incorrects";
const PHONE_TAKEN = "Ce numéro est déjà utilisé";

// Liste blanche : seuls ces champs sortent vers le client (jamais passwordHash)
const publicUser = (user, shop) => ({
    id: user._id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    shop: { id: shop._id, name: shop.name },
});

// Fabrique la réponse commune à register, login et changement de mot de passe
const buildAuthResponse = async (user, shop) => ({
    token: genererToken(user),
    user: publicUser(user, shop ?? (await Shop.findById(user.shop).select("name"))),
});

// Le corps est déjà validé et nettoyé par validate(registerSchema)
const register = async (req, res, next) => {
    try {
        const { shopName, name, phone, password } = req.validated.body;

        // Numéro déjà pris ? On vérifie AVANT de hacher (bcrypt est lent)
        if (await User.exists({ phone })) {
            return res.status(409).json({ message: PHONE_TAKEN });
        }

        const passwordHash = await hashPassword(password);

        // Boutique et propriétaire créés ensemble : jamais de boutique orpheline
        const { shop, user } = await withTransaction(async (session) => {
            const [createdShop] = await Shop.create([{ name: shopName }], { session });
            const [owner] = await User.create(
                [
                    {
                        name,
                        phone,
                        passwordHash,
                        role: "owner", // écrit en dur : jamais lu dans req.body
                        shop: createdShop._id,
                    },
                ],
                { session }
            );
            return { shop: createdShop, user: owner };
        });

        return res.status(201).json(await buildAuthResponse(user, shop));
    } catch (error) {
        // Deux inscriptions simultanées : seul l'index unique les départage
        if (error.code === 11000) {
            return res.status(409).json({ message: PHONE_TAKEN });
        }
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { phone, password } = req.validated.body;

        const user = await User.findOne({ phone }).select("+passwordHash");

        // Toujours un appel à bcrypt, même si le numéro est inconnu :
        // le temps de réponse ne doit pas révéler quels numéros sont inscrits
        const isMatch = await verifyPassword(password, user?.passwordHash);

        if (!user || !isMatch || user.active === false) {
            return res.status(401).json({ message: INVALID_CREDENTIALS });
        }

        return res.status(200).json(await buildAuthResponse(user));
    } catch (error) {
        next(error);
    }
};

// req.user est placé par le middleware authenticate
const me = async (req, res, next) => {
    try {
        const shop = await Shop.findById(req.user.shop).select("name");
        return res.status(200).json({ user: publicUser(req.user, shop) });
    } catch (error) {
        next(error);
    }
};

// 400 (et non 401) si le mot de passe actuel est faux : un 401 déconnecterait l'app
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.validated.body;

        const user = await User.findById(req.user._id).select("+passwordHash");
        if (!(await verifyPassword(currentPassword, user.passwordHash))) {
            return res.status(400).json({
                message: "Mot de passe actuel incorrect",
                errors: [{ field: "currentPassword", message: "Mot de passe actuel incorrect" }],
            });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: "Données invalides",
                errors: [{ field: "newPassword", message: "Le nouveau mot de passe doit être différent de l'actuel" }],
            });
        }

        // tokenVersion + 1 : toutes les autres sessions sont déconnectées,
        // celle-ci reçoit un nouveau token
        const updated = await User.findOneAndUpdate(
            { _id: user._id },
            { $set: { passwordHash: await hashPassword(newPassword) }, $inc: { tokenVersion: 1 } },
            { returnDocument: "after" }
        );

        return res.status(200).json({ message: "Mot de passe modifié", ...(await buildAuthResponse(updated)) });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, me, changePassword };
