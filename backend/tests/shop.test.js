const Shop = require("../src/models/Shop");
const { app, request, setupDatabase, authHeader, createOwner, createStaff } = require("./helpers");

setupDatabase();

describe("PATCH /api/shop", () => {
    test("le propriétaire renomme sa boutique, visible dans /me", async () => {
        const { token, shop } = await createOwner();
        const res = await request(app).patch("/api/shop").set(authHeader(token)).send({ name: "  Chez Awa  " });
        expect(res.status).toBe(200);
        expect(res.body.shop).toEqual({ id: String(shop._id), name: "Chez Awa" });

        const me = await request(app).get("/api/auth/me").set(authHeader(token));
        expect(me.body.user.shop.name).toBe("Chez Awa");
    });

    test("un collaborateur ne peut pas renommer la boutique (403)", async () => {
        const { shop } = await createOwner();
        const { token } = await createStaff(shop);
        const res = await request(app).patch("/api/shop").set(authHeader(token)).send({ name: "Piraté" });
        expect(res.status).toBe(403);
        expect((await Shop.findById(shop._id)).name).toBe("Boutique Test");
    });

    test("seule sa propre boutique est modifiée, le corps ne choisit pas la cible", async () => {
        const a = await createOwner();
        const b = await createOwner({ shopName: "Boutique B" });
        await request(app).patch("/api/shop").set(authHeader(a.token)).send({ name: "Nouveau", _id: String(b.shop._id), id: String(b.shop._id) }).expect(200);
        expect((await Shop.findById(b.shop._id)).name).toBe("Boutique B");
    });

    test("nom vide : 400", async () => {
        const { token } = await createOwner();
        expect((await request(app).patch("/api/shop").set(authHeader(token)).send({ name: "   " })).status).toBe(400);
    });
});
