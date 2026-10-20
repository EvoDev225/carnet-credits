import tokens from "../theme/tokens";

// Valeurs issues de src/theme/tokens.js (même source que tailwind.config.js)
export const colors = tokens.colors;
export const radius = tokens.radius;
export const spacing = tokens.spacing;
export const fontSize = tokens.fontSize;
export const fonts = tokens.fonts;

// Chiffres à chasse fixe : les montants restent alignés d'une ligne à l'autre
export const tabularNums = { fontVariant: ["tabular-nums" as const] };
