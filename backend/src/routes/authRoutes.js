const express = require("express");
const { register, login, me, changePassword } = require("../controllers/authController");
const authenticate = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const {
    loginIpLimiter,
    loginPhoneLimiter,
    registerLimiter,
    passwordChangeLimiter,
} = require("../middlewares/rateLimit");
const { registerSchema, loginSchema, changePasswordSchema } = require("../validators/authValidators");

const router = express.Router();

// Publiques, avec limitation de débit (anti brute-force)
router.post("/register", registerLimiter, validate(registerSchema), register);
// Limite par IP avant validation, puis par numéro (une fois normalisé)
router.post("/login", loginIpLimiter, validate(loginSchema), loginPhoneLimiter, login);

// Protégées : il faut être connecté
router.get("/me", authenticate, me);
router.patch("/password", authenticate, passwordChangeLimiter, validate(changePasswordSchema), changePassword);

module.exports = router;
