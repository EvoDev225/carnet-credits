const express = require("express");
const { register, login, me } = require("../controllers/authController");
const authenticate = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

const router = express.Router();
// Publiques
router.post("/register", register);
router.post("/login", login);

// Protégée : il faut être connecté
router.get("/me", authenticate, me);



module.exports = router;