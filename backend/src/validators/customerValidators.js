const z = require("zod");
const { phoneField } = require("./commonValidators");

const nameField = z
    .string({ message: "Le nom est requis" })
    .trim()
    .min(1, { message: "Le nom est requis" })
    .max(100, { message: "Le nom ne doit pas dépasser 100 caractères" });

const noteField = z
    .string({ message: "La note doit être une chaîne" })
    .trim()
    .max(500, { message: "La note ne doit pas dépasser 500 caractères" });

// "" ou null = pas de numéro / pas de note (permet d'effacer en modification)
const clearable = (field) =>
    z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? null : value), field.nullable());

const createCustomerSchema = z.object({
    name: nameField,
    phone: clearable(phoneField).optional(),
    note: clearable(noteField).optional(),
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
