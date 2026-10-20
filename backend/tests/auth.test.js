const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const User = require("../src/models/User");
const Shop = require("../src/models/Shop");
const {
    app,
    request,
    setupDatabase,
    randomLocalPhone,
    randomIp,
    authHeader,
    createOwner,
    createStaff,
    DEFAULT_PASSWORD,
} = require("./helpers");

setupDatabase();

const register = (body, ip = randomIp()) =>
    request(app).post("/api/auth/register").set("X-Forwarded-For", ip).send(body);

const login = (body, ip = randomIp()) =>
    request(app).post("/api/auth/login").set("X-Forwarded-For", ip).send(body);

const validRegistration = () => ({
    shopName: "Boutique Awa",
    name: "Awa Koné",
    phone: randomLocalPhone(),
    password: "motdepasse123",
});

describe("POST /api/auth/register", () => {
    test("crée la boutique et le propriétaire, renvoie un token", async () => {
        const body = validRegistration();
        const res = await register(body);

        expect(res.status).toBe(201);
        expect(res.body.token).toEqual(expect.any(String));
        expect(res.body.user).toMatchObject({ name: "Awa Koné", role: "owner", phone: `225${body.phone}` });
        expect(res.body.user.passwordHash).toBeUndefined();
        expect(await Shop.countDocuments()).toBe(1);
    });

    test("ignore un rôle envoyé par le client (pas de mass assignment)", async () => {
        const res = await register({ ...validRegistration(), role: "staff", tokenVersion: 42, active: false });
        expect(res.status).toBe(201);
        const user = await User.findById(res.body.user.id);
        expect(user.role).toBe("owner");
        expect(user.tokenVersion).toBe(0);
        expect(user.active).toBe(true);
    });

    test("refuse un numéro déjà inscrit, même écrit autrement (409)", async () => {
        const body = validRegistration();
        await register(body);
        const spaced = body.phone.replace(/(\d{2})(?=\d)/g, "$1 ");
        const res = await register({ ...validRegistration(), phone: `+225 ${spaced}` });
        expect(res.status).toBe(409);
        expect(res.body.message).toBe("Ce numéro est déjà utilisé");
        expect(await Shop.countDocuments()).toBe(1);
    });

    test("refuse un mot de passe de moins de 8 caractères", async () => {
        const res = await register({ ...validRegistration(), password: "1234567" });
        expect(res.status).toBe(400);
        expect(res.body.errors).toEqual(
            expect.arrayContaining([expect.objectContaining({ field: "password" })])
        );
    });

    test("refuse un mot de passe de plus de 72 octets (S7)", async () => {
        // 37 caractères accentués = 74 octets en UTF-8
        const res = await register({ ...validRegistration(), password: "é".repeat(37) });
        expect(res.status).toBe(400);
        expect(res.body.errors[0].message).toMatch(/72 octets/);
    });

    test("refuse un numéro invalide et des champs manquants", async () => {
        const res = await register({ shopName: "", name: "A", phone: "abc", password: "motdepasse123" });
        expect(res.status).toBe(400);
        const fields = res.body.errors.map((e) => e.field);
        expect(fields).toEqual(expect.arrayContaining(["shopName", "phone"]));
    });

    test("est limité à 5 inscriptions par heure et par IP (S1)", async () => {
        const ip = randomIp();
        for (let i = 0; i < 5; i += 1) {
            const res = await register(validRegistration(), ip);
            expect(res.status).toBe(201);
        }
        const blocked = await register(validRegistration(), ip);
        expect(blocked.status).toBe(429);
        expect(blocked.body.message).toMatch(/Trop de tentatives d'inscription/);
    });
});

describe("POST /api/auth/login", () => {
    test("connecte avec le numéro dans n'importe quel format", async () => {
        const { localPhone } = await createOwner();
        const res = await login({ phone: `+225 ${localPhone}`, password: DEFAULT_PASSWORD });
        expect(res.status).toBe(200);
        expect(res.body.token).toEqual(expect.any(String));
    });

    test("mauvais mot de passe : 401 générique", async () => {
        const { localPhone } = await createOwner();
        const res = await login({ phone: localPhone, password: "mauvais-mot-de-passe" });
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Identifiants incorrects");
    });

    test("numéro inconnu : même 401 et bcrypt est quand même appelé (S9)", async () => {
        const spy = jest.spyOn(bcryptjs, "compare");
        const res = await login({ phone: randomLocalPhone(), password: "peu-importe" });
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Identifiants incorrects");
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });

    test("collaborateur désactivé : 401", async () => {
        const { shop } = await createOwner();
        const { localPhone } = await createStaff(shop, { active: false });
        const res = await login({ phone: localPhone, password: DEFAULT_PASSWORD });
        expect(res.status).toBe(401);
    });

    test("refuse une tentative d'injection NoSQL (S10)", async () => {
        const res = await login({ phone: { $gt: "" }, password: { $gt: "" } });
        expect(res.status).toBe(400);
    });

    test("bloque après 5 échecs sur le même numéro, même depuis des IP différentes (S1)", async () => {
        const { localPhone } = await createOwner();
        for (let i = 0; i < 5; i += 1) {
            const res = await login({ phone: localPhone, password: "mauvais" });
            expect(res.status).toBe(401);
        }
        const blocked = await login({ phone: localPhone, password: DEFAULT_PASSWORD });
        expect(blocked.status).toBe(429);
        expect(blocked.body.message).toMatch(/Trop de tentatives de connexion\. Réessaie dans \d+ minutes?\./);
        expect(blocked.headers.ratelimit).toBeDefined();
    });

    test("bloque une IP après 20 échecs, tous numéros confondus (S1)", async () => {
        const ip = randomIp();
        for (let i = 0; i < 20; i += 1) {
            await login({ phone: randomLocalPhone(), password: "mauvais" }, ip);
        }
        const blocked = await login({ phone: randomLocalPhone(), password: "mauvais" }, ip);
        expect(blocked.status).toBe(429);
    });

    test("les connexions réussies ne consomment pas le quota", async () => {
        const { localPhone } = await createOwner();
        const ip = randomIp();
        for (let i = 0; i < 8; i += 1) {
            const res = await login({ phone: localPhone, password: DEFAULT_PASSWORD }, ip);
            expect(res.status).toBe(200);
        }
    });
});

describe("GET /api/auth/me et validité des tokens (S3)", () => {
    test("renvoie l'utilisateur connecté", async () => {
        const { token, owner } = await createOwner();
        const res = await request(app).get("/api/auth/me").set(authHeader(token));
        expect(res.status).toBe(200);
        expect(res.body.user).toMatchObject({ id: String(owner._id), role: "owner" });
    });

    test("sans token : 401", async () => {
        const res = await request(app).get("/api/auth/me");
        expect(res.status).toBe(401);
    });

    test("token expiré : 401", async () => {
        const { owner } = await createOwner();
        const expired = jwt.sign({ sub: String(owner._id), ver: 0 }, process.env.JWT_SECRET, {
            expiresIn: -10,
            issuer: "carnet-credits-api",
            audience: "carnet-credits-app",
        });
        const res = await request(app).get("/api/auth/me").set(authHeader(expired));
        expect(res.status).toBe(401);
    });

    test("token sans issuer/audience (ancien format) : 401", async () => {
        const { owner } = await createOwner();
        const legacy = jwt.sign({ sub: String(owner._id) }, process.env.JWT_SECRET, { expiresIn: "7d" });
        const res = await request(app).get("/api/auth/me").set(authHeader(legacy));
        expect(res.status).toBe(401);
    });

    test("token signé avec un autre secret : 401", async () => {
        const { owner } = await createOwner();
        const forged = jwt.sign({ sub: String(owner._id), ver: 0 }, "un-autre-secret-de-plus-de-32-caracteres!!", {
            issuer: "carnet-credits-api",
            audience: "carnet-credits-app",
        });
        const res = await request(app).get("/api/auth/me").set(authHeader(forged));
        expect(res.status).toBe(401);
    });

    test("token d'un collaborateur désactivé ensuite : 401", async () => {
        const { shop, token: ownerToken } = await createOwner();
        const { staff, token } = await createStaff(shop);

        expect((await request(app).get("/api/auth/me").set(authHeader(token))).status).toBe(200);

        await request(app)
            .patch(`/api/staff/${staff._id}`)
            .set(authHeader(ownerToken))
            .send({ active: false })
            .expect(200);

        // Réactivé : l'ancien token reste révoqué (tokenVersion incrémenté)
        await request(app)
            .patch(`/api/staff/${staff._id}`)
            .set(authHeader(ownerToken))
            .send({ active: true })
            .expect(200);

        const res = await request(app).get("/api/auth/me").set(authHeader(token));
        expect(res.status).toBe(401);
    });

    test("token invalidé après réinitialisation du mot de passe par le propriétaire", async () => {
        const { shop, token: ownerToken } = await createOwner();
        const { staff, token, localPhone } = await createStaff(shop);

        await request(app)
            .patch(`/api/staff/${staff._id}`)
            .set(authHeader(ownerToken))
            .send({ password: "nouveau-mot-de-passe" })
            .expect(200);

        expect((await request(app).get("/api/auth/me").set(authHeader(token))).status).toBe(401);

        const relog = await login({ phone: localPhone, password: "nouveau-mot-de-passe" });
        expect(relog.status).toBe(200);
        expect((await request(app).get("/api/auth/me").set(authHeader(relog.body.token))).status).toBe(200);
    });
});

describe("Boutique dans les réponses d'authentification", () => {
    test("register, login et /me renvoient { id, name } de la boutique", async () => {
        const body = validRegistration();
        const registered = await register(body);
        expect(registered.body.user.shop).toEqual({ id: expect.any(String), name: "Boutique Awa" });

        const logged = await login({ phone: body.phone, password: body.password });
        expect(logged.body.user.shop).toEqual(registered.body.user.shop);

        const me = await request(app).get("/api/auth/me").set(authHeader(logged.body.token));
        expect(me.body.user.shop).toEqual(registered.body.user.shop);
    });
});

describe("PATCH /api/auth/password", () => {
    const changePassword = (token, body) =>
        request(app).patch("/api/auth/password").set(authHeader(token)).send(body);

    test("change le mot de passe, renvoie un nouveau token et révoque les anciens", async () => {
        const { token, localPhone } = await createOwner();
        const otherSession = (await login({ phone: localPhone, password: DEFAULT_PASSWORD })).body.token;

        const res = await changePassword(token, { currentPassword: DEFAULT_PASSWORD, newPassword: "tout-nouveau-123" });
        expect(res.status).toBe(200);
        expect(res.body.token).toEqual(expect.any(String));
        expect(res.body.user.shop.name).toBe("Boutique Test");

        expect((await request(app).get("/api/auth/me").set(authHeader(res.body.token))).status).toBe(200);
        expect((await request(app).get("/api/auth/me").set(authHeader(token))).status).toBe(401);
        expect((await request(app).get("/api/auth/me").set(authHeader(otherSession))).status).toBe(401);

        expect((await login({ phone: localPhone, password: DEFAULT_PASSWORD })).status).toBe(401);
        expect((await login({ phone: localPhone, password: "tout-nouveau-123" })).status).toBe(200);
    });

    test("mot de passe actuel faux : 400 (pas 401, qui déconnecterait l'app)", async () => {
        const { token } = await createOwner();
        const res = await changePassword(token, { currentPassword: "faux-mot-de-passe", newPassword: "tout-nouveau-123" });
        expect(res.status).toBe(400);
        expect(res.body.errors[0].field).toBe("currentPassword");
        expect((await request(app).get("/api/auth/me").set(authHeader(token))).status).toBe(200);
    });

    test("nouveau mot de passe trop court ou identique à l'actuel : 400", async () => {
        const { token } = await createOwner();
        expect((await changePassword(token, { currentPassword: DEFAULT_PASSWORD, newPassword: "court" })).status).toBe(400);
        const same = await changePassword(token, { currentPassword: DEFAULT_PASSWORD, newPassword: DEFAULT_PASSWORD });
        expect(same.status).toBe(400);
        expect(same.body.errors[0].field).toBe("newPassword");
    });

    test("un collaborateur peut changer son propre mot de passe", async () => {
        const { shop } = await createOwner();
        const { token } = await createStaff(shop);
        const res = await changePassword(token, { currentPassword: DEFAULT_PASSWORD, newPassword: "tout-nouveau-123" });
        expect(res.status).toBe(200);
    });

    test("bloqué après 5 échecs (S1)", async () => {
        const { token } = await createOwner();
        for (let i = 0; i < 5; i += 1) {
            await changePassword(token, { currentPassword: "faux", newPassword: "tout-nouveau-123" });
        }
        const res = await changePassword(token, { currentPassword: DEFAULT_PASSWORD, newPassword: "tout-nouveau-123" });
        expect(res.status).toBe(429);
    });
});
