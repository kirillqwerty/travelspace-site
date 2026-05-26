// Belarusian phone mask: +375 XX XXX-XX-XX
export function maskBelarusPhone(value) {
  const digits = (value || "").replace(/\D/g, "");
  // Always start with 375
  let raw = digits;
  if (raw.startsWith("8")) raw = "375" + raw.slice(1);
  if (!raw.startsWith("375")) raw = "375" + raw;
  raw = raw.slice(0, 12); // +375 + 9 digits

  const after375 = raw.slice(3);
  const p1 = after375.slice(0, 2); // operator
  const p2 = after375.slice(2, 5); // first 3
  const p3 = after375.slice(5, 7); // 2
  const p4 = after375.slice(7, 9); // 2

  let out = "+375";
  if (p1) out += " " + p1;
  if (p2) out += " " + p2;
  if (p3) out += "-" + p3;
  if (p4) out += "-" + p4;
  return out;
}

export function isValidBelarusPhone(value) {
  const digits = (value || "").replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("375");
}
