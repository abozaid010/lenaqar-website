import { phoneToE164 } from "@/components/phone/phone-utils";
import { normalizeOwnerType } from "@/constants/owner-type";
import { quickSearchMessages } from "@/utils/api";
import { getUnitSelectionIdFromListItem } from "@/lib/units/unit-whatsapp-recipient";

/**
 * TEMP: resolve owner_type via GET /messages/quick-search for a phone.
 * @param {string} phone
 * @returns {Promise<boolean>}
 */
async function isBrokerPhone(phone) {
  const trimmed = String(phone ?? "").trim();
  if (!trimmed) return false;

  const searchPhone = phoneToE164(trimmed, "EG") || trimmed;
  try {
    const response = await quickSearchMessages({ phone: searchPhone, limit: 5 });
    const users = Array.isArray(response?.data?.users) ? response.data.users : [];
    if (users.length === 0) return false;

    const normalizedSearch = searchPhone.replace(/\s+/g, "");
    const match =
      users.find((user) => {
        const candidate = String(user?.phone_number ?? "").replace(/\s+/g, "");
        return candidate && candidate === normalizedSearch;
      }) || users[0];

    return normalizeOwnerType(match?.owner_type) === "broker";
  } catch (error) {
    console.error(
      "Broker phone lookup failed:",
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

/**
 * TEMP: resolve owner_type via messages/quick-search for each unit's owner_mobile.
 * Used only when an admin/owner explicitly clicks "Mark broker units".
 * Dedupes by phone so the same owner is looked up once.
 *
 * @param {Array<Record<string, unknown>>} units
 * @param {{ onProgress?: (done: number, total: number) => void }} [options]
 * @returns {Promise<Set<string>>} unit selection ids whose owner_type is broker
 */
export async function detectBrokerUnitIds(units, { onProgress } = {}) {
  const list = Array.isArray(units) ? units : [];
  const brokerIds = new Set();
  /** @type {Map<string, boolean>} */
  const phoneIsBroker = new Map();

  const jobs = [];
  for (const unit of list) {
    const unitId = getUnitSelectionIdFromListItem(unit);
    const rawPhone = String(
      unit?.owner_mobile ?? unit?.ownerMobile ?? unit?.mobile_number ?? ""
    ).trim();
    if (!unitId || !rawPhone) continue;
    const cacheKey = phoneToE164(rawPhone, "EG") || rawPhone;
    jobs.push({ unitId: String(unitId), cacheKey, rawPhone });
  }

  const uniquePhones = [
    ...new Map(jobs.map((j) => [j.cacheKey, j.rawPhone])).entries(),
  ];
  let done = 0;
  const total = uniquePhones.length;
  onProgress?.(done, total);

  for (const [cacheKey, rawPhone] of uniquePhones) {
    phoneIsBroker.set(cacheKey, await isBrokerPhone(rawPhone));
    done += 1;
    onProgress?.(done, total);
  }

  for (const job of jobs) {
    if (phoneIsBroker.get(job.cacheKey)) {
      brokerIds.add(job.unitId);
    }
  }

  return brokerIds;
}
