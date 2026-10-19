/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0F2A43", light: "#1C4D75" },
        brand: "#0B6E78",
        canvas: "#F4F6F8",
        line: "#E1E6EB",
        ink: "#1B2733",
        muted: "#5B6B7A",
        debt: { DEFAULT: "#B42318", soft: "#FDECEA" },
        ok: "#1A7F4B",
        avatar: "#E3EEF3",
      },
      fontFamily: {
        jakarta: ["PlusJakartaSans_400Regular"],
        "jakarta-semibold": ["PlusJakartaSans_600SemiBold"],
        "jakarta-bold": ["PlusJakartaSans_700Bold"],
        "jakarta-extrabold": ["PlusJakartaSans_800ExtraBold"],
      },
    },
  },
  plugins: [],
};