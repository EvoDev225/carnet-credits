const z = require("zod");

// Règles de base, réutilisées pour la création et la modification
const createCustomerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, { message: "Le nom est requis" })
        .max(100, { message: "Le nom ne doit pas dépasser 100 caractères" }),
    phone: z
        .string()
        .trim()
        .min(6, { message: "Le numéro doit contenir au moins 6 caractères" })
        .max(20, { message: "Le numéro ne doit pas dépasser 20 caractères" })
        .optional(),
    note: z
        .string()
        .trim()
        .max(500, { message: "La note ne doit pas dépasser 500 caractères" })
        .optional(),
});

// Mêmes règles, tous les champs optionnels, mais au moins un champ obligatoire
const updateCustomerSchema = createCustomerSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "Au moins un champ doit être fourni",
    });

const listQuerySchema = z.object({
    search: z
        .string()
        .trim()
        .max(50, { message: "La recherche est limitée à 50 caractères" })
        .optional(),
    page: z.coerce
        .number()
        .int({ message: "La page doit être un entier" })
        .min(1, { message: "La page doit être supérieure ou égale à 1" })
        .default(1),
    limit: z.coerce
        .number()
        .int({ message: "La limite doit être un entier" })
        .min(1, { message: "La limite minimale est 1" })
        .max(50, { message: "La limite maximale est 50" })
        .default(20),
    sort: z.enum(["name", "-name", "balance", "-balance"]).default("name"),
    status: z.enum(["all", "debt", "settled"]).default("all")
});

module.exports = { createCustomerSchema, updateCustomerSchema, listQuerySchema };