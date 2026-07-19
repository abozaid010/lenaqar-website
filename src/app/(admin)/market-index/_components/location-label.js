export function locationLabel(node, locale) {
  if (!node) return "";
  if (locale === "ar" && node.ar_name) return node.ar_name;
  return node.en_name || node.id;
}
