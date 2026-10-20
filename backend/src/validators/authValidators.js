const z = require("zod");
const { nameField, phoneField, passwordField } = require("./commonValidators");

const registerSchema = z.object({
    shopName: z
        .string({ message: "Le nom de la boutique est requis" })
        .trim()
        .min(1, { message: "Le nom de la boutique est requis" })
        .max(100, { message: "Le nom de la boutique ne peut pas dépasser 100 caractères" }),
    name: nameField,
    phone: phoneField,
    password: passwordField,
});

// Au login, pas de règle de longueur minimale : un compte créé avec l'ancienne
// règle (6 caractères) doit pouvoir se connecter. Le message d'échec reste générique.
const loginSchema = z.object({
    phone: phoneField,
    password: z
        .string({ message: "Le mot de passe est requis" })
        .min(1, { message: "Le mot de passe est requis" })
        .max(200, { message: "Le mot de passe est trop long" }),
});

const changePasswordSchema = z.object({
    currentPassword: z
        .string({ message: "Le mot de passe actuel est requis" })
        .min(1, { message: "Le mot de passe actuel est requis" })
        .max(200, { message: "Le mot de passe est trop long" }),
    newPassword: passwordField,
});

module.exports = { registerSchema, loginSchema, changePasswordSchema };
