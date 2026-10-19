// routes/dashboardRoutes.js
const express = require("express");
const authenticate = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const { getDashboard } = require("../controllers/dashboardController");

const router = express.Router();

router.use(authenticate);
router.use(requireRole("owner"));

router.get("/", getDashboard);

module.exports = router;