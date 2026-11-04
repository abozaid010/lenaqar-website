import { normalizeToEnglishDigits } from "../../utils/parse-amount.js";

/**
 * Best-effort prefill for the buy-request dialog from a free-text request
 * ("عايز شقة تلت غرف ... مقدم ٣ مليون واقدر اقسط ٥٠ الف").
 *
 * Conservative on purpose: only fields we can read with high confidence are
 * returned, the full text always travels as `notes`, and the buyer reviews
 * every value in the dialog before anything is submitted. Location is never
 * guessed because the API needs exact catalog keys.
 */

export const REQUEST_TEXT_MAX = 1000;
export const REQUEST_TEXT_MIN = 12;

const TYPE_PATTERNS = [
  ["duplex", /دوبلك?س|duplex/i],
  ["penthouse", /بنت ?هاوس|penthouse/i],
  ["townhouse", /تاون ?هاوس|town ?house/i],
  ["twinhouse", /توين ?هاوس|twin ?house/i],
  ["villa", /[فڤ]يلا|villa/i],
  ["chalet", /شاليه|chalet/i],
  ["studio", /[اإ]?ستوديو|studio/i],
  ["apartment", /شق[ةه]|apartment|\bflat\b/i],
];

const ROOM_WORDS = [
  [1, /(?:غرف[ةه]|[اأ]وض[ةه])\s*واحد[ةه]/],
  [2, /غرفتين|[اأ]وضتين|(?:[اإ]تنين|[اإ]ثنين)\s*(?:غرف|[اأ]وض)/],
  [3, /(?:تلت|تلات|تلاته|تلاتة|ثلاث|ثلاثة|ثلاثه)\s*(?:غرف|[اأ]وض)/],
  [4, /(?:[اأ]ربع|[اأ]ربعة|[اأ]ربعه)\s*(?:غرف|[اأ]وض)/],
  [5, /(?:خمس|خمسة|خمسه)\s*(?:غرف|[اأ]وض)/],
];

const ROOM_DIGITS = /(\d{1,2})\s*(?:غرف|غرفة|غرفه|[اأ]وض|bed(?:room)?s?|rooms?|br\b)/i;

const AMOUNT =
  /(\d+(?:[.,]\d+)?)\s*(مليون|million|mn|m\b|[اأ]لف|thousand|k\b)(\s*و\s*نص)?/gi;

const DOWN_HINT = /مقد[ّ]?م|دفع[ةه]\s*[اأ]ولى|down/i;
const MONTHLY_HINT = /قسط|[اأ]قس[ّ]?ط|[اأ]قساط|شهري|monthly|installment/i;
const BUDGET_HINT = /ميزاني[ةه]|لحد|حتى|كاش|budget|max|up to|cash/i;
const INSTALLMENT_HINT = /قسط|[اأ]قس[ّ]?ط|[اأ]قساط|تقسيط|installment|instal?ments/i;
const CASH_HINT = /كاش|cash/i;
const READY_HINT = /[اإ]ستلام\s*فور[يى]|جاهز[ةه]?\s*للسكن|متسلم[ةه]|مسلم[ةه]|ready to move|immediate delivery|\bready\b/i;

function pickBuildingType(text) {
  let best = null;
  for (const [value, pattern] of TYPE_PATTERNS) {
    const match = pattern.exec(text);
    if (match && (best === null || match.index < best.index)) {
      best = { value, index: match.index };
    }
  }
  return best?.value;
}

function pickRooms(text) {
  const digits = ROOM_DIGITS.exec(text);
  if (digits) {
    const n = Number(digits[1]);
    if (Number.isInteger(n) && n > 0 && n < 20) return n;
  }
  for (const [n, pattern] of ROOM_WORDS) {
    if (pattern.test(text)) return n;
  }
  return undefined;
}

function toAmount(numberText, unit, half) {
  const n = parseFloat(String(numberText).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  const lower = unit.toLowerCase();
  const isMillion = /مليون|million|mn|^m$/.test(lower);
  const base = isMillion ? 1_000_000 : 1_000;
  const value = (n + (half ? 0.5 : 0)) * base;
  return Math.round(value);
}

/**
 * Classify an amount by the words right before it (and, failing that, right after).
 * @returns {"down" | "monthly" | "budget" | null}
 */
function classify(text, start, end) {
  const before = text.slice(Math.max(0, start - 28), start);
  const after = text.slice(end, end + 16);
  const lastHit = (window) => {
    const hits = [
      ["down", window.search(DOWN_HINT)],
      ["monthly", window.search(MONTHLY_HINT)],
      ["budget", window.search(BUDGET_HINT)],
    ].filter(([, index]) => index >= 0);
    if (!hits.length) return null;
    // Closest keyword to the number wins.
    hits.sort((a, b) => b[1] - a[1]);
    return hits[0][0];
  };
  return lastHit(before) || lastHit(after);
}

/**
 * @param {string} rawText
 * @returns {{ notes: string, buildingType?: string, roomsCount?: number, paymentMode?: "cash" | "installment", max_price?: number, downPayment?: number, monthlyInstallment?: number, deliveryDate?: string }}
 */
export function prefillFromRequestText(rawText) {
  const notes = String(rawText || "").trim().slice(0, REQUEST_TEXT_MAX);
  const text = String(normalizeToEnglishDigits(notes) || "");
  const out = { notes };
  if (!text) return out;

  const buildingType = pickBuildingType(text);
  if (buildingType) out.buildingType = buildingType;

  const rooms = pickRooms(text);
  if (rooms) out.roomsCount = rooms;

  let downPayment;
  let monthlyInstallment;
  let budget;
  const unclassified = [];
  for (const match of text.matchAll(AMOUNT)) {
    const amount = toAmount(match[1], match[2], Boolean(match[3]));
    if (amount == null) continue;
    const kind = classify(text, match.index, match.index + match[0].length);
    if (kind === "down" && downPayment == null) downPayment = amount;
    else if (kind === "monthly" && monthlyInstallment == null) {
      monthlyInstallment = amount;
    } else if (kind === "budget" && budget == null) budget = amount;
    else if (!kind) unclassified.push(amount);
  }

  const wantsInstallment =
    downPayment != null || monthlyInstallment != null || INSTALLMENT_HINT.test(text);

  if (wantsInstallment) {
    out.paymentMode = "installment";
    if (downPayment != null) out.downPayment = downPayment;
    if (monthlyInstallment != null) out.monthlyInstallment = monthlyInstallment;
    if (budget != null) out.max_price = budget;
    if (READY_HINT.test(text)) out.deliveryDate = "ready";
  } else if (budget != null || CASH_HINT.test(text) || unclassified.length === 1) {
    out.paymentMode = "cash";
    const cashBudget = budget ?? (unclassified.length === 1 ? unclassified[0] : undefined);
    if (cashBudget != null) out.max_price = cashBudget;
  }

  return out;
}

/**
 * Inline validation for the homepage composer.
 * @returns {"" | "empty" | "short" | "long"}
 */
export function validateRequestText(rawText) {
  const text = String(rawText || "").trim();
  if (!text) return "empty";
  if (text.length < REQUEST_TEXT_MIN) return "short";
  if (text.length > REQUEST_TEXT_MAX) return "long";
  return "";
}
