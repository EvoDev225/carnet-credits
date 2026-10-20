const User = require("../models/User");
const Shop = require("../models/Shop");
const genererToken = require("../utils/genererToken");
const { hashPassword, verifyPassword } = require("../utils/password");
const withTransaction = require("../utils/withTransaction");

const INVALID_CREDENTIALS = "Identifiants incorrects";
const PHONE_TAKEN = "Ce numéro est déjà utilisé";

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
        const user = await withTransaction(async (session) => {
            const [shop] = await Shop.create([{ name: shopName }], { session });
            const [owner] = await User.create(
                [
                    {
                        name,
                        phone,
                        passwordHash,
                        role: "owner", // écrit en dur : jamais lu dans req.body
                        shop: shop._id,
                    },
                ],
                { session }
            );
            return owner;
        });

        return res.status(201).json(buildAuthResponse(user));
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

        return res.status(200).json(buildAuthResponse(user));
    } catch (error) {
        next(error);
    }
};

// req.user est placé par le middleware authenticate
const me = (req, res) => res.status(200).json({ user: publicUser(req.user) });

module.exports = { register, login, me };
