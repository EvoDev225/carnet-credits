const bcryptjs = require("bcryptjs");
const User = require("../models/User");

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
            return res.status(409).json({ message: "Ce numéro est déjà utilisé" });
        }

        const passwordHash = await bcryptjs.hash(password, 10);
        const staff = await User.create({
            name,
            phone,
            passwordHash,
            role: "staff",
            shop: req.user.shop,
        });

        return res.status(201).json({ message: "Collaborateur créé", staff: publicStaff(staff) });
    } catch (error) {
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
        const update = {};

        if (name !== undefined) update.name = name;
        if (active !== undefined) update.active = active;
        if (password !== undefined) update.passwordHash = await bcryptjs.hash(password, 10);

        const staff = await User.findOneAndUpdate(
            { _id: req.params.id, shop: req.user.shop, role: "staff" },
            { $set: update },
            { new: true, runValidators: true }
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