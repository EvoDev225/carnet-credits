// Source unique des tokens de design : importée par tailwind.config.js (classes
// NativeWind) et par src/lib/theme.ts (props qui n'acceptent pas de classes).
// En CommonJS pour que la config Tailwind puisse la lire.
//
// Contrastes vérifiés (WCAG AA, texte normal ≥ 4,5:1) :
//   muted / canvas 5,06 · muted / blanc 5,48 · blanc / navy-light 8,87 · blanc / brand 5,97
//   debt / debt-soft 5,75 · payment / payment-soft 5,27 · warning / warning-soft 4,78
// À éviter : muted sur line (4,37).

const colors = {
    navy: "#0F2A43",
    "navy-light": "#1C4D75",
    brand: "#0B6E78",
    canvas: "#F4F6F8",
    surface: "#FFFFFF",
    white: "#FFFFFF",
    line: "#E1E6EB",
    ink: "#1B2733",
    muted: "#5B6B7A",
    avatar: "#E3EEF3",
    // Dette : rouge
    debt: "#B42318",
    "debt-soft": "#FDECEA",
    // Remboursement / soldé : vert
    payment: "#17723F",
    "payment-soft": "#E6F4EC",
    warning: "#B54708",
    "warning-soft": "#FEF0C7",
    // Fond des boîtes de dialogue
    overlay: "rgba(15, 42, 67, 0.55)",
};

const radius = {
    chip: 10, // puces de filtre
    control: 12, // champs et boutons
    card: 16, // cartes
    header: 28, // bas arrondi des en-têtes
};

const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
};

const fontSize = {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    display: 34,
};

const fonts = {
    regular: "PlusJakartaSans_400Regular",
    semibold: "PlusJakartaSans_600SemiBold",
    bold: "PlusJakartaSans_700Bold",
    extrabold: "PlusJakartaSans_800ExtraBold",
};

module.exports = { colors, radius, spacing, fontSize, fonts };
