export function formatDate(value) {
  if (!value) return "";

  const raw = String(value).trim();
  if (!raw) return "";

  const [datePart, timePart] = raw.split(/[ T]/);

  const dmy = datePart.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dmy) {
    return timePart ? `${dmy[1]}.${dmy[2]}.${dmy[3]} ${timePart}` : datePart;
  }

  const ymd = datePart.match(/^(\d{4})[-.\/](\d{2})[-.\/](\d{2})$/);
  if (ymd) {
    const formatted = `${ymd[3]}.${ymd[2]}.${ymd[1]}`;
    return timePart ? `${formatted} ${timePart}` : formatted;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    return `${day}.${month}.${year}`;
  }

  return raw;
}
