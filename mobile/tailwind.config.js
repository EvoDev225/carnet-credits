const { colors, radius, fontSize, fonts } = require("./src/theme/tokens");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // App en thème clair uniquement ; "class" évite une erreur de NativeWind sur Expo web
  darkMode: "class",
  theme: {
    extend: {
      // Toutes les couleurs viennent de src/theme/tokens.js
      colors: {
        navy: { DEFAULT: colors.navy, light: colors["navy-light"] },
        brand: colors.brand,
        canvas: colors.canvas,
        surface: colors.surface,
        line: colors.line,
        ink: colors.ink,
        muted: colors.muted,
        avatar: colors.avatar,
        overlay: colors.overlay,
        debt: { DEFAULT: colors.debt, soft: colors["debt-soft"] },
        payment: { DEFAULT: colors.payment, soft: colors["payment-soft"] },
        warning: { DEFAULT: colors.warning, soft: colors["warning-soft"] },
        // Alias historique : "ok" = vert des remboursements
        ok: { DEFAULT: colors.payment, soft: colors["payment-soft"] },
      },
      // Noms dédiés pour ne pas écraser les classes rounded-* de Tailwind
      borderRadius: {
        chip: `${radius.chip}px`,
        control: `${radius.control}px`,
        card: `${radius.card}px`,
        header: `${radius.header}px`,
      },
      fontSize: {
        display: [`${fontSize.display}px`, { lineHeight: `${fontSize.display + 8}px` }],
      },
      fontFamily: {
        jakarta: [fonts.regular],
        "jakarta-semibold": [fonts.semibold],
        "jakarta-bold": [fonts.bold],
        "jakarta-extrabold": [fonts.extrabold],
      },
    },
  },
  plugins: [],
};
