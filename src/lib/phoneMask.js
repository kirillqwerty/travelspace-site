export function maskPhone(value) {
  if (!value) return "";

  const cleaned = value.replace(/[^\d+]/g, "");

  // Форматируем только белорусский номер
  if (cleaned.startsWith("+375") || cleaned.startsWith("375")) {
    const digits = cleaned.replace(/\D/g, "").slice(0, 12);

    const p1 = digits.slice(3, 5);
    const p2 = digits.slice(5, 8);
    const p3 = digits.slice(8, 10);
    const p4 = digits.slice(10, 12);

    let result = "+375";

    if (p1) result += ` ${p1}`;
    if (p2) result += ` ${p2}`;
    if (p3) result += `-${p3}`;
    if (p4) result += `-${p4}`;

    return result;
  }

  // Остальные страны не ломаем маской
  return value;
}

export function isValidPhone(value) {
  const digits = (value || "").replace(/\D/g, "");

  if (digits.startsWith("375")) {
    return digits.length === 12;
  }

  return digits.length >= 10;
}
