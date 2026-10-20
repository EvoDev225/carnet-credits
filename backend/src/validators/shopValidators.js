const z = require("zod");

const updateShopSchema = z.object({
    name: z
        .string({ message: "Le nom de la boutique est requis" })
        .trim()
        .min(1, { message: "Le nom de la boutique est requis" })
        .max(100, { message: "Le nom de la boutique ne peut pas dépasser 100 caractères" }),
});

module.exports = { updateShopSchema };
