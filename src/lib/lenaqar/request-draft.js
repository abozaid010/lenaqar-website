/**
 * Unsaved buy-request form, kept for the tab so the buyer's typing survives a move
 * between the onboarding scenes and the form (or a reload) until they save.
 *
 * sessionStorage: it lives in this tab only and goes when the tab closes. It holds what
 * the buyer typed (including name and phone, as typed); it is never sent anywhere and is
 * removed as soon as the request is saved. Storage is passed in so `node --test` can use a fake.
 */
import { normalizePlaces } from "./request-places.js";

export const REQUEST_DRAFT_KEY = "lenaqar_request_draft_v1";

const TEXT_FIELDS = [
  "buildingType",
  "roomsCount",
  "max_price",
  "paymentMode",
  "downPayment",
  "monthlyInstallment",
  "deliveryDate",
];
const NOTES_MAX = 2000;
const SHORT_MAX = 80;

function text(value, max) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

/** A clean draft from anything read back, or null when it holds nothing. */
export function cleanDraft(raw) {
  if (!raw || typeof raw !== "object") return null;
  const form = {};
  const source = raw.form && typeof raw.form === "object" ? raw.form : {};
  for (const field of TEXT_FIELDS) {
    const value = text(source[field], SHORT_MAX);
    if (value) form[field] = value;
  }
  const notes = text(source.notes, NOTES_MAX);
  if (notes.trim()) form.notes = notes;
  const places = normalizePlaces(source.places);
  if (places.length) form.places = places;
  const contactName = text(raw.contactName, SHORT_MAX);
  const phoneNumber = text(raw.phoneNumber, 32);
  if (!Object.keys(form).length && !contactName.trim() && !phoneNumber) return null;
  return { form, contactName, phoneNumber };
}

export function readDraft(storage) {
  if (!storage) return null;
  try {
    return cleanDraft(JSON.parse(storage.getItem(REQUEST_DRAFT_KEY) || "null"));
  } catch {
    return null;
  }
}

/** Save the draft, or remove it when it holds nothing. */
export function writeDraft(storage, draft) {
  if (!storage) return;
  try {
    const clean = cleanDraft(draft);
    if (clean) storage.setItem(REQUEST_DRAFT_KEY, JSON.stringify(clean));
    else storage.removeItem(REQUEST_DRAFT_KEY);
  } catch {
    /* private mode / quota */
  }
}

export function clearDraft(storage) {
  try {
    storage?.removeItem(REQUEST_DRAFT_KEY);
  } catch {
    /* private mode */
  }
}
