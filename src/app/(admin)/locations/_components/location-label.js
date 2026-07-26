export function locationLabel(node, locale) {
  if (!node) return "";
  if (locale === "ar" && node.ar_name) return node.ar_name;
  return node.en_name || node.id;
}

/** Next creatable child level under an approved parent node. */
export function childLevelForParent(parent) {
  const level = parent?.level;
  if (level === "city") return "district";
  if (level === "district" || level === "sub_district") return "sub_district";
  return null;
}
