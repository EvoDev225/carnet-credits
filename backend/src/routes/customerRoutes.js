const express = require("express");
const authenticate = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const { validate } = require("../middlewares/validate");
const {
    createCustomerSchema,
    updateCustomerSchema,
    listQuerySchema,
} = require("../validators/customerValidators");
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

router.post("/", validate(createCustomerSchema), createCustomer);
router.get("/", validate(listQuerySchema, "query"), listCustomers);
router.get("/:id", getCustomer);
router.patch("/:id", validate(updateCustomerSchema), updateCustomer);
router.post("/:id/transactions", validate(createTransactionSchema), createTransaction);
router.get("/:id/transactions", validate(historyQuerySchema, "query"), listTransactions);
router.delete("/:id", requireRole("owner"), deleteCustomer);

module.exports = router;