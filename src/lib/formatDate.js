export function formatDate(date) {
  if (!date) return "";

  const [datePart, timePart] = date.split(/[ T]/);

  const [year, month, day] = datePart.split("-");

  return timePart
    ? `${day}.${month}.${year} ${timePart}`
    : `${day}.${month}.${year}`;
}
