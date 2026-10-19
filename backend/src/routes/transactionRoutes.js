const express = require("express");
const authenticate = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const { cancelTransaction } = require("../controllers/transactionController");

const router = express.Router();

router.use(authenticate);

router.patch("/:id/cancel", requireRole("owner"), cancelTransaction);

module.exports = router;