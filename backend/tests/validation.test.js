const Customer = require("../src/models/Customer");
const { app, request, setupDatabase, authHeader, createOwner, createCustomer } = require("./helpers");

setupDatabase();

describe("Validation et défense en profondeur (S10)", () => {
    let owner;

    beforeEach(async () => {
        owner = await createOwner();
    });

    const as = (method, url) => request(app)[method](url).set(authHeader(owner.token));

    test("création : balance et shop envoyés par le client sont ignorés", async () => {
        const other = await createOwner();
        const res = await as("post", "/api/customers").send({
            name: "Client malin",
            balance: 999999,
            shop: String(other.shop._id),
        });
        expect(res.status).toBe(201);
        const stored = await Customer.findById(res.body.customer._id);
        expect(stored.balance).toBe(0);
        expect(String(stored.shop)).toBe(String(owner.shop._id));
    });

    test("modification : balance et shop ne sont jamais modifiables", async () => {
        const customer = await createCustomer(owner.shop, { balance: 300 });
        const res = await as("patch", `/api/customers/${customer._id}`).send({ name: "Renommé", balance: 0, shop: "x" });
        expect(res.status).toBe(200);
        const stored = await Customer.findById(customer._id);
        expect(stored).toMatchObject({ name: "Renommé", balance: 300 });
    });

    test("modification avec uniquement des champs interdits : 400", async () => {
        const customer = await createCustomer(owner.shop);
        expect((await as("patch", `/api/customers/${customer._id}`).send({ balance: 0 })).status).toBe(400);
    });

    test("le téléphone d'un client est normalisé, et peut être effacé", async () => {
        const created = await as("post", "/api/customers").send({ name: "Fatou", phone: "07 08 09 10 11" });
        expect(created.body.customer.phone).toBe("2250708091011");

        const cleared = await as("patch", `/api/customers/${created.body.customer._id}`).send({ phone: "" });
        expect(cleared.status).toBe(200);
        expect(cleared.body.customer.phone).toBeUndefined();
    });

    test("un téléphone de client invalide est refusé", async () => {
        const res = await as("post", "/api/customers").send({ name: "Fatou", phone: "12" });
        expect(res.status).toBe(400);
        expect(res.body.errors[0]).toMatchObject({ field: "phone", message: "Numéro de téléphone invalide" });
    });

    test("un identifiant mal formé renvoie 400", async () => {
        const res = await as("get", "/api/customers/pas-un-id");
        expect(res.status).toBe(400);
        expect(res.body.errors[0]).toMatchObject({ field: "id", message: "Identifiant invalide" });
        expect((await as("patch", "/api/transactions/123/cancel")).status).toBe(400);
    });

    test("un tableau à la place d'une chaîne dans la recherche est refusé", async () => {
        const res = await as("get", "/api/customers?search=a&search=b");
        expect(res.status).toBe(400);
    });

    test("une syntaxe d'opérateur dans l'URL n'est pas interprétée", async () => {
        await createCustomer(owner.shop, { name: "Awa" });
        // Express 5 (parseur "simple") ne crée pas d'objet : search[$ne] est une clé inconnue, ignorée
        const res = await as("get", "/api/customers?search[$ne]=zzz&status[$ne]=all");
        expect(res.status).toBe(200);
        expect(res.body.total).toBe(1);
    });

    test("les caractères spéciaux de regex dans la recherche ne cassent rien", async () => {
        await createCustomer(owner.shop, { name: "Boutique (centre)" });
        const res = await as("get", `/api/customers?search=${encodeURIComponent("(centre")}`);
        expect(res.status).toBe(200);
        expect(res.body.total).toBe(1);
    });

    test("un corps de plus de 10 ko est refusé (413)", async () => {
        const res = await as("post", "/api/customers").send({ name: "A", note: "x".repeat(11 * 1024) });
        expect(res.status).toBe(413);
    });

    test("un JSON mal formé renvoie 400", async () => {
        const res = await as("post", "/api/customers").set("Content-Type", "application/json").send("{ pas du json");
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("JSON invalide");
    });
});

describe("En-têtes HTTP (S6, S11)", () => {
    test("pas de X-Powered-By, en-têtes helmet présents, identifiant de requête renvoyé", async () => {
        const res = await request(app).get("/api/health");
        expect(res.headers["x-powered-by"]).toBeUndefined();
        expect(res.headers["x-content-type-options"]).toBe("nosniff");
        expect(res.headers["strict-transport-security"]).toBeDefined();
        expect(res.headers["x-request-id"]).toEqual(expect.any(String));
    });

    test("CORS : une origine non autorisée ne reçoit pas d'en-tête Access-Control", async () => {
        const res = await request(app).get("/api/health").set("Origin", "https://site-malveillant.example");
        expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    });

    test("/api/health vérifie la base", async () => {
        const res = await request(app).get("/api/health");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok", database: "ok" });
    });

    test("route inconnue : 404 en français", async () => {
        const res = await request(app).get("/api/inexistant");
        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Route introuvable");
    });
});
