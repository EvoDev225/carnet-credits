const z = require("zod");
const { nameField, phoneField, passwordField } = require("./commonValidators");

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
