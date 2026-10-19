const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const staffRoutes = require("./routes/staffRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;