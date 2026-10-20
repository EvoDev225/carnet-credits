// Même indicatif par défaut que l'API (DEFAULT_COUNTRY_CODE côté backend)
const DEFAULT_COUNTRY_CODE = "225";

export function formatNumber(amount: number): string {
  const formatted = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount);
  return formatted.replace(/\u202F|\u00A0/g, "\u00A0");
}

export function formatFcfa(amount: number): string {
  return `${formatNumber(amount)}\u00A0FCFA`;
}

// Montant signé : "+5 000 FCFA" pour une dette, "\u22122 000 FCFA" (vrai signe moins) pour un remboursement
export function formatSignedFcfa(amount: number, type: "DEBT" | "PAYMENT"): string {
  return `${type === "DEBT" ? "+" : "\u2212"}${formatFcfa(amount)}`;
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

// Clé de regroupement par jour (heure locale), ex. "2026-10-12"
export function dayKey(iso: string): string {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// "12 octobre 2026"
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// "14:05"
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

// "Aujourd'hui", "Hier", "12 octobre" (année ajoutée si ce n'est pas l'année en cours)
export function formatRelativeDay(iso: string, now: Date = new Date()): string {
  const key = dayKey(iso);
  if (key === dayKey(now.toISOString())) {
    return "Aujourd'hui";
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (key === dayKey(yesterday.toISOString())) {
    return "Hier";
  }
  const date = new Date(iso);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
}

// "12 octobre 2026 à 14:05"
export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} à ${formatTime(iso)}`;
}

// Saisie d'un montant : on ne garde que les chiffres ("5 000" → 5000)
export function parseAmount(text: string): number {
  const digits = text.replace(/\D/g, "");
  return digits.length > 0 ? Number(digits) : 0;
}
