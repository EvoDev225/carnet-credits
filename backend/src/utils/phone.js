// Longueur des numéros nationaux (sans indicatif) des pays de la zone.
// Sert à reconnaître un numéro local et à rejeter les longueurs impossibles.
const NATIONAL_LENGTHS = {
    225: 10, // Côte d'Ivoire
    221: 9, // Sénégal
    223: 8, // Mali
    224: 9, // Guinée
    226: 8, // Burkina Faso
    227: 8, // Niger
    228: 8, // Togo
    229: 10, // Bénin
    233: 9, // Ghana
    237: 9, // Cameroun
};

const defaultCountryCode = () => process.env.DEFAULT_COUNTRY_CODE || "225";

// Ramène un numéro saisi à une forme unique : chiffres uniquement, indicatif inclus.
//   "07 00 00 00 00", "0700000000", "+225 07 00 00 00 00", "002250700000000"
//   → "2250700000000"
// Renvoie null si le numéro est invalide.
const normalizePhone = (input, countryCode = defaultCountryCode()) => {
    if (typeof input !== "string") return null;

    const trimmed = input.trim();
    // Seuls les chiffres, un + initial et les séparateurs courants sont admis
    if (!/^\+?[\d\s.\-()]+$/.test(trimmed)) return null;

    let digits = trimmed.replace(/\D/g, "");
    const nationalLength = NATIONAL_LENGTHS[countryCode];

    if (trimmed.startsWith("+")) {
        // déjà au format international
    } else if (digits.startsWith("00")) {
        digits = digits.slice(2);
    } else if (nationalLength && digits.length === nationalLength) {
        digits = countryCode + digits;
    } else if (nationalLength && digits.length === countryCode.length + nationalLength && digits.startsWith(countryCode)) {
        // indicatif saisi sans le + : "2250700000000"
    } else if (!nationalLength && digits.length >= 6 && digits.length <= 12) {
        // pays non référencé : on fait confiance à la saisie locale
        digits = countryCode + digits;
    } else {
        return null;
    }

    // Norme E.164 : 15 chiffres maximum, indicatif compris
    if (digits.length < 8 || digits.length > 15) return null;

    // Pays connu : la longueur nationale doit être exacte (les indicatifs sont
    // sans préfixe commun, "225…" ne peut donc être qu'un numéro ivoirien)
    for (const [code, length] of Object.entries(NATIONAL_LENGTHS)) {
        if (digits.startsWith(code) && digits.length !== code.length + length) {
            return null;
        }
    }

    return digits;
};

module.exports = { normalizePhone, NATIONAL_LENGTHS };
