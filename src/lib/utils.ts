/**
 * Format pul miqdorini o'zbek so'mida formatlash (masalan: 50 000 so'm)
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
}

/**
 * Vaqtni formatlash (masalan: "15:30")
 */
export function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '--:--';
  }
}

/**
 * Sanani chiroyli o'zbekcha formatlash (masalan: "16-avgust, 2026")
 */
export function formatDateUz(isoStringOrDateStr: string): string {
  try {
    const d = new Date(isoStringOrDateStr);
    const months = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
    ];
    return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}`;
  } catch {
    return isoStringOrDateStr;
  }
}

/**
 * Telefon raqamni formatlash (+998 90 123 45 67)
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('998')) {
    return `+${cleaned.slice(0, 3)} (${cleaned.slice(3, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8, 10)}-${cleaned.slice(10, 12)}`;
  }
  return phone;
}
