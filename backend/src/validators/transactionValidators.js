const z = require("zod");

const createTransactionSchema = z.object({
    type: z.enum(["DEBT", "PAYMENT"], { message: "Le type doit être DEBT ou PAYMENT" }),
    amount: z.number({ message: "Le montant est requis et doit être un nombre" })
        .int({ message: "Le montant doit être un entier" })
        .min(1, { message: "Le montant doit être au moins 1" })
        .max(100000000, { message: "Le montant ne doit pas dépasser 100000000" }),
    description: z.string().trim().max(200, { message: "La description ne doit pas dépasser 200 caractères" }).optional()
});

const historyQuerySchema = z.object({
    page: z.coerce.number({ message: "La page doit être un nombre" })
        .int({ message: "La page doit être un entier" })
        .min(1, { message: "La page doit être supérieure ou égale à 1" })
        .default(1),
    limit: z.coerce.number({ message: "La limite doit être un nombre" })
        .int({ message: "La limite doit être un entier" })
        .min(1, { message: "La limite doit être au moins 1" })
        .max(50, { message: "La limite ne doit pas dépasser 50" })
        .default(20)
});

module.exports = { createTransactionSchema, historyQuerySchema };