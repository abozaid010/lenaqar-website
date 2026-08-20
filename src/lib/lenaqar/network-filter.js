function normalizeForTokens(text) {
  return String(text)
    .toLowerCase()
    .replace(/[|/_.,+()[\]{}·–—-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordsOf(text) {
  const normalized = normalizeForTokens(text);
  if (!normalized) return [];
  return normalized.split(" ").filter(Boolean);
}

/** Exact token match. "نور" must not match inside "نورث". "ال"+token is allowed. */
function wordMatchesToken(word, token) {
  if (word === token) return true;
  if (word === `ال${token}`) return true;
  return false;
}

function haystackHasToken(haystack, token) {
  const normalizedToken = normalizeForTokens(token);
  if (!normalizedToken) return false;

  if (normalizedToken.includes(" ")) {
    const padded = ` ${normalizeForTokens(haystack)} `;
    return padded.includes(` ${normalizedToken} `);
  }

  return wordsOf(haystack).some((word) =>
    wordMatchesToken(word, normalizedToken)
  );
}

function fieldHaystack(unit, keys) {
  return keys
    .map((key) => unit?.[key])
    .filter((v) => typeof v === "string" && v.trim())
    .join(" ");
}

/**
 * Token allowlist, not substring. A unit must match a developer token AND
 * a project token. Empty developer/project fails closed.
 */
export function matchesNetwork(unit, network) {
  if (!unit || !network) return false;

  const developerHay = fieldHaystack(unit, ["developer", "developerAr"]);
  const projectHay = fieldHaystack(unit, ["project", "projectAr"]);
  if (!developerHay || !projectHay) return false;

  const developerOk = (network.developerTokens || []).some((token) =>
    haystackHasToken(developerHay, token)
  );
  const projectOk = (network.projectTokens || []).some((token) =>
    haystackHasToken(projectHay, token)
  );
  return developerOk && projectOk;
}
