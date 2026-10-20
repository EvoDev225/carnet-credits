const express = require("express");
const authenticate = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const { validate } = require("../middlewares/validate");
const { idParamsSchema } = require("../validators/commonValidators");
const { cancelTransaction } = require("../controllers/transactionController");

const router = express.Router();

router.use(authenticate);

router.patch("/:id/cancel", requireRole("owner"), validate(idParamsSchema, "params"), cancelTransaction);

module.exports = router;