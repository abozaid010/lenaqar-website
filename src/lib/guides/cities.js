import fs from "fs";
import path from "path";

let _cities = null;

function loadCitiesFile() {
  if (_cities) return _cities;
  const filePath = path.join(process.cwd(), "content", "guides", "_cities.json");
  _cities = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return _cities;
}

export function getCities() {
  return loadCitiesFile().cities || [];
}

export function getCityById(id) {
  return getCities().find((c) => c.id === id) || null;
}

export function getCityIds() {
  return getCities().map((c) => c.id);
}

export function isKnownCitySlug(slug) {
  return getCityIds().includes(slug);
}
