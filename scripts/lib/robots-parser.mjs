/**
 * robots.txt evaluation with Google's semantics: user-agent groups, the
 * longest matching rule wins, Allow wins a tie, `*` and `$` are supported.
 * Shared by scripts/seo-health.mjs (live site) and the robots rules test.
 */
export function parseRobots(text) {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === "user-agent") {
      if (!lastWasAgent || !current) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (!current) continue;
      if (key === "allow" || key === "disallow") current.rules.push({ type: key, pattern: value });
    }
  }
  return groups;
}

export function patternToRegex(pattern) {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

export function robotsVerdict(groups, token, urlPath) {
  const t = token.toLowerCase();
  let matched = groups.filter((g) => g.agents.includes(t));
  let via = token;
  if (matched.length === 0) {
    matched = groups.filter((g) => g.agents.includes("*"));
    via = "*";
  }
  const rules = matched.flatMap((g) => g.rules).filter((r) => r.pattern !== "");
  let best = null;
  for (const rule of rules) {
    if (!patternToRegex(rule.pattern).test(urlPath)) continue;
    const len = rule.pattern.length;
    if (!best || len > best.len || (len === best.len && rule.type === "allow")) {
      best = { len, type: rule.type, pattern: rule.pattern };
    }
  }
  return { allowed: !best || best.type === "allow", group: via, rule: best ? `${best.type}: ${best.pattern}` : "no matching rule" };
}
