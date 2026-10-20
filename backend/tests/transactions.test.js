const Customer = require("../src/models/Customer");
const Transaction = require("../src/models/Transaction");
const { app, request, setupDatabase, authHeader, createOwner, createStaff, createCustomer } = require("./helpers");

setupDatabase();

const addOperation = (token, customerId, body) =>
    request(app).post(`/api/customers/${customerId}/transactions`).set(authHeader(token)).send(body);

const cancel = (token, transactionId) =>
    request(app).patch(`/api/transactions/${transactionId}/cancel`).set(authHeader(token));

const balanceOf = async (customerId) => (await Customer.findById(customerId)).balance;

describe("Opérations et soldes", () => {
    let owner;
    let customer;

    beforeEach(async () => {
        owner = await createOwner();
        customer = await createCustomer(owner.shop);
    });

    test("une dette augmente le solde", async () => {
        const res = await addOperation(owner.token, customer._id, { type: "DEBT", amount: 5000, description: "Riz" });
        expect(res.status).toBe(201);
        expect(res.body.balance).toBe(5000);
        expect(res.body.transaction).toMatchObject({ type: "DEBT", amount: 5000, description: "Riz" });
        expect(await balanceOf(customer._id)).toBe(5000);
    });

    test("un remboursement diminue le solde", async () => {
        await addOperation(owner.token, customer._id, { type: "DEBT", amount: 5000 });
        const res = await addOperation(owner.token, customer._id, { type: "PAYMENT", amount: 2000 });
        expect(res.status).toBe(201);
        expect(res.body.balance).toBe(3000);
    });

    test("un remboursement supérieur au solde est refusé (409) sans rien écrire", async () => {
        await addOperation(owner.token, customer._id, { type: "DEBT", amount: 1000 });
        const res = await addOperation(owner.token, customer._id, { type: "PAYMENT", amount: 1001 });
        expect(res.status).toBe(409);
        expect(res.body.message).toBe("Le remboursement dépasse le solde du client");
        expect(await balanceOf(customer._id)).toBe(1000);
        expect(await Transaction.countDocuments({ type: "PAYMENT" })).toBe(0);
    });

    test.each([
        [{ type: "DEBT", amount: 0 }],
        [{ type: "DEBT", amount: -500 }],
        [{ type: "DEBT", amount: 10.5 }],
        [{ type: "DEBT", amount: "500" }],
        [{ type: "GIFT", amount: 500 }],
    ])("refuse une opération invalide %j", async (body) => {
        const res = await addOperation(owner.token, customer._id, body);
        expect(res.status).toBe(400);
        expect(await balanceOf(customer._id)).toBe(0);
    });

    test("annuler une dette remet le solde à jour", async () => {
        const debt = await addOperation(owner.token, customer._id, { type: "DEBT", amount: 4000 });
        const res = await cancel(owner.token, debt.body.transaction._id);
        expect(res.status).toBe(200);
        expect(res.body.balance).toBe(0);
        expect(res.body.transaction).toMatchObject({ cancelled: true, cancelledBy: String(owner.owner._id) });
    });

    test("annuler un remboursement rétablit la dette", async () => {
        await addOperation(owner.token, customer._id, { type: "DEBT", amount: 4000 });
        const payment = await addOperation(owner.token, customer._id, { type: "PAYMENT", amount: 1500 });
        const res = await cancel(owner.token, payment.body.transaction._id);
        expect(res.status).toBe(200);
        expect(res.body.balance).toBe(4000);
    });

    test("annuler une dette déjà partiellement remboursée : 409, rien n'est modifié", async () => {
        const debt = await addOperation(owner.token, customer._id, { type: "DEBT", amount: 4000 });
        await addOperation(owner.token, customer._id, { type: "PAYMENT", amount: 1000 });

        const res = await cancel(owner.token, debt.body.transaction._id);
        expect(res.status).toBe(409);
        expect(await balanceOf(customer._id)).toBe(3000);

        // La transaction MongoDB a annulé le passage à "annulée"
        const stored = await Transaction.findById(debt.body.transaction._id);
        expect(stored.cancelled).toBe(false);
        expect(stored.cancelledBy).toBeUndefined();
    });

    test("annuler deux fois la même opération : 409", async () => {
        const debt = await addOperation(owner.token, customer._id, { type: "DEBT", amount: 4000 });
        await cancel(owner.token, debt.body.transaction._id).expect(200);
        const res = await cancel(owner.token, debt.body.transaction._id);
        expect(res.status).toBe(409);
        expect(await balanceOf(customer._id)).toBe(0);
    });

    test("historique paginé avec auteur et annulateur", async () => {
        const debt = await addOperation(owner.token, customer._id, { type: "DEBT", amount: 4000 });
        await addOperation(owner.token, customer._id, { type: "DEBT", amount: 1000 });
        await cancel(owner.token, debt.body.transaction._id);

        const res = await request(app)
            .get(`/api/customers/${customer._id}/transactions?limit=1&page=2`)
            .set(authHeader(owner.token));
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ page: 2, limit: 1, total: 2, balance: 1000 });
        expect(res.body.items).toHaveLength(1);
        expect(res.body.items[0].createdBy).toMatchObject({ name: owner.owner.name });
        expect(res.body.items[0].cancelledBy).toMatchObject({ name: owner.owner.name });
    });
});

describe("Atomicité (S2)", () => {
    test("si l'écriture de l'opération échoue, le solde n'est pas modifié", async () => {
        const owner = await createOwner();
        const customer = await createCustomer(owner.shop);

        const spy = jest.spyOn(Transaction, "create").mockRejectedValueOnce(new Error("Panne simulée"));
        const res = await addOperation(owner.token, customer._id, { type: "DEBT", amount: 5000 });
        spy.mockRestore();

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ message: "Erreur serveur", requestId: expect.any(String) });
        expect(await balanceOf(customer._id)).toBe(0);
        expect(await Transaction.countDocuments()).toBe(0);
    });

    test("si la mise à jour du solde échoue à l'annulation, l'opération n'est pas annulée", async () => {
        const owner = await createOwner();
        const customer = await createCustomer(owner.shop);
        const debt = await addOperation(owner.token, customer._id, { type: "DEBT", amount: 5000 });

        const spy = jest.spyOn(Customer, "findOneAndUpdate").mockImplementationOnce(() => {
            throw new Error("Panne simulée");
        });
        const res = await cancel(owner.token, debt.body.transaction._id);
        spy.mockRestore();

        expect(res.status).toBe(500);
        expect((await Transaction.findById(debt.body.transaction._id)).cancelled).toBe(false);
        expect(await balanceOf(customer._id)).toBe(5000);
    });

    test("remboursements simultanés : le solde ne devient jamais négatif", async () => {
        const owner = await createOwner();
        const customer = await createCustomer(owner.shop);
        await addOperation(owner.token, customer._id, { type: "DEBT", amount: 500 });

        // 10 remboursements de 100 en parallèle sur un solde de 500
        const results = await Promise.all(
            Array.from({ length: 10 }, () => addOperation(owner.token, customer._id, { type: "PAYMENT", amount: 100 }))
        );
        const statuses = results.map((r) => r.status);

        expect(statuses.filter((s) => s === 201)).toHaveLength(5);
        expect(statuses.filter((s) => s === 409)).toHaveLength(5);
        expect(await balanceOf(customer._id)).toBe(0);
        expect(await Transaction.countDocuments({ type: "PAYMENT" })).toBe(5);
    });

    test("dettes simultanées : aucune n'est perdue", async () => {
        const owner = await createOwner();
        const customer = await createCustomer(owner.shop);
        const staff = await createStaff(owner.shop);

        await Promise.all(
            Array.from({ length: 10 }, (_, i) =>
                addOperation(i % 2 ? owner.token : staff.token, customer._id, { type: "DEBT", amount: 250 })
            )
        );
        expect(await balanceOf(customer._id)).toBe(2500);
        expect(await Transaction.countDocuments()).toBe(10);
    });
});
