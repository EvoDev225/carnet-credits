const z = require("zod");

const nameField = z
    .string({ message: "Le nom doit être une chaîne" })
    .trim()
    .min(1, { message: "Le nom est requis" })
    .max(100, { message: "Le nom ne peut pas dépasser 100 caractères" });

const phoneField = z
    .string({ message: "Le téléphone doit être une chaîne" })
    .trim()
    .min(6, { message: "Le téléphone doit contenir au moins 6 caractères" })
    .max(20, { message: "Le téléphone ne peut pas dépasser 20 caractères" });

// Pas de trim : un mot de passe ne se modifie jamais
const passwordField = z
    .string({ message: "Le mot de passe doit être une chaîne" })
    .min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" })
    .max(100, { message: "Le mot de passe ne peut pas dépasser 100 caractères" });

const createStaffSchema = z.object({
    name: nameField,
    phone: phoneField,
    password: passwordField,
});

const updateStaffSchema = z
    .object({
        name: nameField.optional(),
        active: z.boolean({ message: "Le statut doit être vrai ou faux" }).optional(),
        password: passwordField.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "Au moins un champ doit être fourni",
    });

module.exports = { createStaffSchema, updateStaffSchema };