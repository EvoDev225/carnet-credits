const Shop = require("../models/Shop");

// Seul le nom est modifiable ; la boutique est celle de l'utilisateur connecté
const updateShop = async (req, res, next) => {
    try {
        const shop = await Shop.findOneAndUpdate(
            { _id: req.user.shop },
            { $set: { name: req.validated.body.name } },
            { returnDocument: "after", runValidators: true }
        );

        if (!shop) {
            return res.status(404).json({ message: "Boutique introuvable" });
        }

        return res.status(200).json({ message: "Boutique renommée", shop: { id: shop._id, name: shop.name } });
    } catch (error) {
        next(error);
    }
};

module.exports = { updateShop };
