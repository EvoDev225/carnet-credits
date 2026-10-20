// Même indicatif par défaut que l'API (DEFAULT_COUNTRY_CODE côté backend)
const DEFAULT_COUNTRY_CODE = "225";

export function formatNumber(amount: number): string {
  const formatted = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount);
  return formatted.replace(/ | /g, " ");
}

export function formatFcfa(amount: number): string {
  return `${formatNumber(amount)} FCFA`;
}

export function getInitials(name: string): string {
  const words = name.split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) {
    return "?";
  }
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

function groupByTwo(digits: string): string {
  const groups: string[] = [];
  for (let index = 0; index < digits.length; index += 2) {
    groups.push(digits.slice(index, index + 2));
  }
  return groups.join(" ");
}

// L'API stocke les numéros normalisés ("2250700000000").
// Numéro du pays par défaut → forme locale "07 00 00 00 00", sinon "+221 77 12 34 56 7".
export function formatPhone(phone?: string): string {
  if (!phone) {
    return "";
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith(DEFAULT_COUNTRY_CODE) && digits.length === DEFAULT_COUNTRY_CODE.length + 10) {
    return groupByTwo(digits.slice(DEFAULT_COUNTRY_CODE.length));
  }
  if (/^\d{10}$/.test(digits)) {
    return groupByTwo(digits);
  }
  if (/^\d{8,15}$/.test(digits)) {
    return `+${digits}`;
  }
  return phone;
}

// "12 octobre 2026 à 14:05"
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${day} à ${time}`;
}

// Saisie d'un montant : on ne garde que les chiffres ("5 000" → 5000)
export function parseAmount(text: string): number {
  const digits = text.replace(/\D/g, "");
  return digits.length > 0 ? Number(digits) : 0;
}
