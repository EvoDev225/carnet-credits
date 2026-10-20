import {
    dayKey,
    formatFcfa,
    formatNumber,
    formatPhone,
    formatRelativeDay,
    formatSignedFcfa,
    getInitials,
    parseAmount,
} from "../format";

// Les montants utilisent des espaces insécables : on les ramène à des espaces simples
const plain = (text: string) => text.replace(/\s/g, " ");
const MINUS = String.fromCharCode(0x2212);
const NBSP = String.fromCharCode(0x00a0);

describe("montants", () => {
    test("séparateur de milliers français et suffixe FCFA", () => {
        expect(plain(formatNumber(1234567))).toBe("1 234 567");
        expect(plain(formatFcfa(5000))).toBe("5 000 FCFA");
        expect(plain(formatFcfa(0))).toBe("0 FCFA");
    });

    test("le montant ne se coupe jamais en fin de ligne (espaces insécables)", () => {
        const text = formatFcfa(5000);
        expect(text).not.toContain(" ");
        expect(text).toContain(NBSP);
    });

    test("signe + pour une dette, vrai signe moins pour un remboursement", () => {
        expect(plain(formatSignedFcfa(5000, "DEBT"))).toBe("+5 000 FCFA");
        expect(plain(formatSignedFcfa(2000, "PAYMENT"))).toBe(`${MINUS}2 000 FCFA`);
    });

    test("parseAmount ne garde que les chiffres", () => {
        expect(parseAmount("5 000")).toBe(5000);
        expect(parseAmount(formatNumber(12500))).toBe(12500);
        expect(parseAmount("abc")).toBe(0);
        expect(parseAmount("")).toBe(0);
        expect(parseAmount("1.5")).toBe(15);
    });
});

describe("téléphones", () => {
    test("numéro ivoirien normalisé → forme locale groupée par deux", () => {
        expect(formatPhone("2250700000000")).toBe("07 00 00 00 00");
    });

    test("numéro local à 10 chiffres", () => {
        expect(formatPhone("0708091011")).toBe("07 08 09 10 11");
    });

    test("numéro étranger → format international", () => {
        expect(formatPhone("221771234567")).toBe("+221771234567");
    });

    test("vide ou inconnu", () => {
        expect(formatPhone(undefined)).toBe("");
        expect(formatPhone("")).toBe("");
        expect(formatPhone("abc")).toBe("abc");
    });
});

describe("dates", () => {
    const now = new Date(2026, 9, 20, 15, 30);

    test("dayKey regroupe par jour local", () => {
        expect(dayKey(new Date(2026, 9, 20, 0, 5).toISOString())).toBe("2026-10-20");
        expect(dayKey(new Date(2026, 9, 20, 23, 55).toISOString())).toBe("2026-10-20");
    });

    test("Aujourd'hui, Hier, puis la date", () => {
        expect(formatRelativeDay(new Date(2026, 9, 20, 8, 0).toISOString(), now)).toBe("Aujourd'hui");
        expect(formatRelativeDay(new Date(2026, 9, 19, 22, 0).toISOString(), now)).toBe("Hier");
        expect(formatRelativeDay(new Date(2026, 9, 12, 10, 0).toISOString(), now)).toBe("12 octobre");
    });

    test("l'année est précisée si ce n'est pas l'année en cours", () => {
        expect(formatRelativeDay(new Date(2025, 11, 31, 10, 0).toISOString(), now)).toBe("31 décembre 2025");
    });
});

describe("initiales", () => {
    test("deux premières initiales en majuscules", () => {
        expect(getInitials("awa koné traoré")).toBe("AK");
        expect(getInitials("Moussa")).toBe("M");
        expect(getInitials("   ")).toBe("?");
    });
});
