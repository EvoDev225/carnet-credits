const Customer = require("../src/models/Customer");
const Transaction = require("../src/models/Transaction");
const User = require("../src/models/User");
const { app, request, setupDatabase, authHeader, createOwner, createStaff, createCustomer } = require("./helpers");

setupDatabase();

describe("Isolation entre boutiques", () => {
    let shopA;
    let shopB;
    let customerB;
    let transactionB;
    let staffB;

    beforeEach(async () => {
        shopA = await createOwner({ shopName: "Boutique A" });
        shopB = await createOwner({ shopName: "Boutique B" });
        customerB = await createCustomer(shopB.shop, { name: "Client de B", balance: 1000 });
        transactionB = await Transaction.create({
            shop: shopB.shop._id,
            customer: customerB._id,
            createdBy: shopB.owner._id,
            type: "DEBT",
            amount: 1000,
        });
        staffB = (await createStaff(shopB.shop)).staff;
    });

    const asA = (method, url) => request(app)[method](url).set(authHeader(shopA.token));

    test("A ne peut pas lire un client de B", async () => {
        expect((await asA("get", `/api/customers/${customerB._id}`)).status).toBe(404);
    });

    test("A ne voit pas les clients de B dans sa liste ni dans la recherche", async () => {
        const res = await asA("get", "/api/customers?search=Client");
        expect(res.status).toBe(200);
        expect(res.body.total).toBe(0);
    });

    test("A ne peut pas modifier un client de B", async () => {
        const res = await asA("patch", `/api/customers/${customerB._id}`).send({ name: "Piraté" });
        expect(res.status).toBe(404);
        expect((await Customer.findById(customerB._id)).name).toBe("Client de B");
    });

    test("A ne peut pas supprimer un client de B", async () => {
        await Customer.updateOne({ _id: customerB._id }, { balance: 0 });
        await Transaction.deleteMany({});
        expect((await asA("delete", `/api/customers/${customerB._id}`)).status).toBe(404);
        expect(await Customer.exists({ _id: customerB._id })).toBeTruthy();
    });

    test("A ne peut pas créer d'opération sur un client de B", async () => {
        const res = await asA("post", `/api/customers/${customerB._id}/transactions`).send({ type: "PAYMENT", amount: 1000 });
        expect(res.status).toBe(404);
        expect((await Customer.findById(customerB._id)).balance).toBe(1000);
    });

    test("A ne peut pas lire l'historique d'un client de B", async () => {
        expect((await asA("get", `/api/customers/${customerB._id}/transactions`)).status).toBe(404);
    });

    test("A ne peut pas annuler une opération de B", async () => {
        expect((await asA("patch", `/api/transactions/${transactionB._id}/cancel`)).status).toBe(404);
        expect((await Transaction.findById(transactionB._id)).cancelled).toBe(false);
    });

    test("A ne peut pas modifier un collaborateur de B", async () => {
        const res = await asA("patch", `/api/staff/${staffB._id}`).send({ active: false });
        expect(res.status).toBe(404);
        expect((await User.findById(staffB._id)).active).toBe(true);
    });

    test("le tableau de bord de A n'inclut pas les chiffres de B", async () => {
        const res = await asA("get", "/api/dashboard");
        expect(res.status).toBe(200);
        expect(res.body.summary.totalOutstanding).toBe(0);
        expect(res.body.recentTransactions).toHaveLength(0);
    });
});

describe("Rôles : ce qu'un collaborateur ne peut pas faire (403)", () => {
    let owner;
    let staff;
    let customer;

    beforeEach(async () => {
        owner = await createOwner();
        staff = await createStaff(owner.shop);
        customer = await createCustomer(owner.shop, { balance: 1000 });
    });

    const asStaff = (method, url) => request(app)[method](url).set(authHeader(staff.token));

    test("tableau de bord", async () => {
        expect((await asStaff("get", "/api/dashboard")).status).toBe(403);
    });

    test("gestion de l'équipe", async () => {
        expect((await asStaff("get", "/api/staff")).status).toBe(403);
        expect((await asStaff("post", "/api/staff").send({ name: "X", phone: "0711111111", password: "motdepasse" })).status).toBe(403);
        expect((await asStaff("patch", `/api/staff/${staff.staff._id}`).send({ name: "X" })).status).toBe(403);
    });

    test("annulation d'une opération", async () => {
        const tx = await Transaction.create({
            shop: owner.shop._id,
            customer: customer._id,
            createdBy: owner.owner._id,
            type: "DEBT",
            amount: 1000,
        });
        expect((await asStaff("patch", `/api/transactions/${tx._id}/cancel`)).status).toBe(403);
    });

    test("suppression d'un client", async () => {
        const settled = await createCustomer(owner.shop);
        expect((await asStaff("delete", `/api/customers/${settled._id}`)).status).toBe(403);
    });

    test("remboursement (matrice des droits S12)", async () => {
        const res = await asStaff("post", `/api/customers/${customer._id}/transactions`).send({ type: "PAYMENT", amount: 500 });
        expect(res.status).toBe(403);
        expect((await Customer.findById(customer._id)).balance).toBe(1000);
    });
});

describe("Rôles : ce qu'un collaborateur peut faire", () => {
    test("créer et modifier un client, enregistrer une dette, lire l'historique", async () => {
        const owner = await createOwner();
        const staff = await createStaff(owner.shop);
        const as = (method, url) => request(app)[method](url).set(authHeader(staff.token));

        const created = await as("post", "/api/customers").send({ name: "Nouveau client" });
        expect(created.status).toBe(201);
        const id = created.body.customer._id;

        expect((await as("patch", `/api/customers/${id}`).send({ note: "Habite au marché" })).status).toBe(200);
        expect((await as("post", `/api/customers/${id}/transactions`).send({ type: "DEBT", amount: 700 })).status).toBe(201);
        expect((await as("get", `/api/customers/${id}/transactions`)).status).toBe(200);
        expect((await as("get", "/api/customers")).body.total).toBe(1);
    });
});
