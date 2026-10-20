const express = require("express");
const authenticate = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const { validate } = require("../middlewares/validate");
const { updateShopSchema } = require("../validators/shopValidators");
const { updateShop } = require("../controllers/shopController");

const router = express.Router();

router.use(authenticate);
router.use(requireRole("owner"));

router.patch("/", validate(updateShopSchema), updateShop);

module.exports = router;
