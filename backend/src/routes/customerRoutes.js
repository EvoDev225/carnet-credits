const express = require("express");
const authenticate = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const { validate } = require("../middlewares/validate");
const {
    createCustomerSchema,
    updateCustomerSchema,
    listQuerySchema,
} = require("../validators/customerValidators");
const { idParamsSchema } = require("../validators/commonValidators");
const {
    createCustomer,
    listCustomers,
    getCustomer,
    updateCustomer,
    deleteCustomer,
} = require("../controllers/customerController");
const {
    createTransactionSchema,
    historyQuerySchema,
} = require("../validators/transactionValidators");
const {
    createTransaction,
    listTransactions,
} = require("../controllers/transactionController");

const router = express.Router();

router.use(authenticate);

// Un :id mal formé est refusé proprement (400) avant d'atteindre MongoDB
const validId = validate(idParamsSchema, "params");

router.post("/", validate(createCustomerSchema), createCustomer);
router.get("/", validate(listQuerySchema, "query"), listCustomers);
router.get("/:id", validId, getCustomer);
router.patch("/:id", validId, validate(updateCustomerSchema), updateCustomer);
router.post("/:id/transactions", validId, validate(createTransactionSchema), createTransaction);
router.get("/:id/transactions", validId, validate(historyQuerySchema, "query"), listTransactions);
router.delete("/:id", requireRole("owner"), validId, deleteCustomer);

module.exports = router;