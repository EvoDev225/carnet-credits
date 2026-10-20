const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");
const connectDB = require("../src/config/db");
const Shop = require("../src/models/Shop");
const User = require("../src/models/User");
const Customer = require("../src/models/Customer");
const genererToken = require("../src/utils/genererToken");
const { hashPassword } = require("../src/utils/password");
const { normalizePhone } = require("../src/utils/phone");

const DEFAULT_PASSWORD = "motdepasse123";

// À appeler en tête de chaque fichier de test qui touche à la base
const setupDatabase = () => {
    beforeAll(async () => {
        await connectDB(process.env.MONGO_URI);
        // Index (dont l'unicité de User.phone) créés avant le premier test
        await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
    });

    beforeEach(async () => {
        const collections = await mongoose.connection.db.collections();
        await Promise.all(collections.map((collection) => collection.deleteMany({})));
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    });
};

// Numéro ivoirien local aléatoire, ex. "0712345678"
const randomLocalPhone = () => `07${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;

// IP aléatoire, envoyée dans X-Forwarded-For (les limiteurs de débit comptent par IP)
const randomIp = () => `10.${[0, 0, 0].map(() => Math.floor(Math.random() * 250) + 1).join(".")}`;

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const createOwner = async ({ shopName = "Boutique Test", name = "Awa Koné", password = DEFAULT_PASSWORD } = {}) => {
    const localPhone = randomLocalPhone();
    const shop = await Shop.create({ name: shopName });
    const owner = await User.create({
        name,
        phone: normalizePhone(localPhone),
        passwordHash: await hashPassword(password),
        role: "owner",
        shop: shop._id,
    });
    return { shop, owner, token: genererToken(owner), localPhone, password };
};

const createStaff = async (shop, { name = "Moussa Traoré", password = DEFAULT_PASSWORD, active = true } = {}) => {
    const localPhone = randomLocalPhone();
    const staff = await User.create({
        name,
        phone: normalizePhone(localPhone),
        passwordHash: await hashPassword(password),
        role: "staff",
        shop: shop._id,
        active,
    });
    return { staff, token: genererToken(staff), localPhone, password };
};

const createCustomer = (shop, fields = {}) =>
    Customer.create({ name: "Client Test", balance: 0, ...fields, shop: shop._id });

module.exports = {
    app,
    request,
    setupDatabase,
    randomLocalPhone,
    randomIp,
    authHeader,
    createOwner,
    createStaff,
    createCustomer,
    DEFAULT_PASSWORD,
};
