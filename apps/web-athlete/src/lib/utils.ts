export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  // converts native YYYY-MM-DD to DD / MM / YYYY.
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]} / ${parts[1]} / ${parts[0]}`;
  return dateStr;
}
