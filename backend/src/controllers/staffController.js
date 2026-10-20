const User = require("../models/User");
const { hashPassword } = require("../utils/password");

const PHONE_TAKEN = "Ce numéro est déjà utilisé";

const publicStaff = (user) => ({
    id: user._id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
});

const createStaff = async (req, res, next) => {
    try {
        const { name, phone, password } = req.validated.body;

        if (await User.exists({ phone })) {
            return res.status(409).json({ message: PHONE_TAKEN });
        }

        const passwordHash = await hashPassword(password);
        const staff = await User.create({
            name,
            phone,
            passwordHash,
            role: "staff",
            shop: req.user.shop,
        });

        return res.status(201).json({ message: "Collaborateur créé", staff: publicStaff(staff) });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: PHONE_TAKEN });
        }
        next(error);
    }
};

const listStaff = async (req, res, next) => {
    try {
        const staff = await User.find({ shop: req.user.shop, role: "staff" }).sort({
            createdAt: -1,
            _id: -1,
        });
        return res.status(200).json({ items: staff.map(publicStaff) });
    } catch (error) {
        next(error);
    }
};

const updateStaff = async (req, res, next) => {
    try {
        const { name, active, password } = req.validated.body;
        const update = { $set: {} };

        if (name !== undefined) update.$set.name = name;
        if (active !== undefined) update.$set.active = active;
        if (password !== undefined) update.$set.passwordHash = await hashPassword(password);

        // Nouveau mot de passe ou désactivation : les sessions ouvertes sont révoquées
        if (password !== undefined || active === false) {
            update.$inc = { tokenVersion: 1 };
        }

        const staff = await User.findOneAndUpdate(
            { _id: req.params.id, shop: req.user.shop, role: "staff" },
            update,
            { returnDocument: "after", runValidators: true }
        );

        if (!staff) {
            return res.status(404).json({ message: "Collaborateur introuvable" });
        }

        return res.status(200).json({ message: "Collaborateur modifié", staff: publicStaff(staff) });
    } catch (error) {
        next(error);
    }
};

module.exports = { createStaff, listStaff, updateStaff };
