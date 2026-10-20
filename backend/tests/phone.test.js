const { normalizePhone } = require("../src/utils/phone");

describe("normalizePhone (S8)", () => {
    test.each([
        ["0700000000", "2250700000000"],
        ["07 00 00 00 00", "2250700000000"],
        ["07.00.00.00.00", "2250700000000"],
        ["07-00-00-00-00", "2250700000000"],
        ["+225 07 00 00 00 00", "2250700000000"],
        ["+2250700000000", "2250700000000"],
        ["002250700000000", "2250700000000"],
        ["2250700000000", "2250700000000"],
        ["  0700000000  ", "2250700000000"],
        ["+221 77 123 45 67", "221771234567"],
        ["+33 6 12 34 56 78", "33612345678"],
    ])("%s → %s", (input, expected) => {
        expect(normalizePhone(input)).toBe(expected);
    });

    test.each([
        "",
        "abc",
        "07000",
        "07000000000", // 11 chiffres
        "+225 07 00 00", // trop court pour la Côte d'Ivoire
        "+2250700000000000",
        "07 00 00 00 0a",
        "{\"$gt\":\"\"}",
    ])("rejette « %s »", (input) => {
        expect(normalizePhone(input)).toBeNull();
    });

    test("rejette les valeurs qui ne sont pas des chaînes", () => {
        expect(normalizePhone(undefined)).toBeNull();
        expect(normalizePhone(700000000)).toBeNull();
        expect(normalizePhone({ $gt: "" })).toBeNull();
    });

    test("utilise l'indicatif par défaut fourni", () => {
        expect(normalizePhone("771234567", "221")).toBe("221771234567");
        expect(normalizePhone("70123456", "226")).toBe("22670123456");
    });

    test("est idempotente", () => {
        const once = normalizePhone("07 00 00 00 00");
        expect(normalizePhone(once)).toBe(once);
    });
});
