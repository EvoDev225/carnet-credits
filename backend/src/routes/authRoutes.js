const express = require("express");
const { register, login, me } = require("../controllers/authController");
const authenticate = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { loginIpLimiter, loginPhoneLimiter, registerLimiter } = require("../middlewares/rateLimit");
const { registerSchema, loginSchema } = require("../validators/authValidators");

const router = express.Router();

// Publiques, avec limitation de débit (anti brute-force)
router.post("/register", registerLimiter, validate(registerSchema), register);
// Limite par IP avant validation, puis par numéro (une fois normalisé)
router.post("/login", loginIpLimiter, validate(loginSchema), loginPhoneLimiter, login);

// Protégée : il faut être connecté
router.get("/me", authenticate, me);

module.exports = router;
