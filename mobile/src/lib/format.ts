export function formatNumber(amount: number): string {
  const formatted = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount);
  return formatted.replace(/\u202F|\u00A0/g, "\u00A0");
}

export function formatFcfa(amount: number): string {
  return `${formatNumber(amount)}\u00A0FCFA`;
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

export function formatPhone(phone?: string): string {
  if (!phone) {
    return "";
  }
  const digits = phone.replace(/\s/g, "");
  if (!/^\d{10}$/.test(digits)) {
    return phone;
  }
  const groups: string[] = [];
  for (let index = 0; index < digits.length; index += 2) {
    groups.push(digits.slice(index, index + 2));
  }
  return groups.join(" ");
}