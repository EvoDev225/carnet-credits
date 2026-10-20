// routes/staffRoutes.js
const express = require("express");
const authenticate = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const { validate } = require("../middlewares/validate");
const { createStaffSchema, updateStaffSchema } = require("../validators/staffValidators");
const { idParamsSchema } = require("../validators/commonValidators");
const { createStaff, listStaff, updateStaff } = require("../controllers/staffController");

const router = express.Router();

router.use(authenticate);
router.use(requireRole("owner"));

router.post("/", validate(createStaffSchema), createStaff);
router.get("/", listStaff);
router.patch("/:id", validate(idParamsSchema, "params"), validate(updateStaffSchema), updateStaff);

module.exports = router;