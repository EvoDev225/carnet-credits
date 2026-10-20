const z = require("zod");
const { normalizePhone } = require("../utils/phone");

const nameField = z
    .string({ message: "Le nom doit être une chaîne" })
    .trim()
    .min(1, { message: "Le nom est requis" })
    .max(100, { message: "Le nom ne peut pas dépasser 100 caractères" });

// Le numéro sort du validateur déjà normalisé (ex. "2250700000000")
const phoneField = z
    .string({ message: "Le téléphone est requis" })
    .trim()
    .min(1, { message: "Le téléphone est requis" })
    .max(30, { message: "Le téléphone ne peut pas dépasser 30 caractères" })
    .transform((value, ctx) => {
        const normalized = normalizePhone(value);
        if (!normalized) {
            ctx.addIssue({ code: "custom", message: "Numéro de téléphone invalide" });
            return z.NEVER;
        }
        return normalized;
    });

// Pas de trim : un mot de passe ne se modifie jamais.
// bcrypt ignore tout ce qui dépasse 72 octets : on refuse plutôt que tronquer en silence.
const passwordField = z
    .string({ message: "Le mot de passe est requis" })
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
        message: "Le mot de passe est trop long (72 octets maximum)",
    });

const objectId = z
    .string()
    .regex(/^[a-f\d]{24}$/i, { message: "Identifiant invalide" });

// Pour validate(idParamsSchema, "params") sur les routes /:id
const idParamsSchema = z.object({ id: objectId });

module.exports = { nameField, phoneField, passwordField, objectId, idParamsSchema };
