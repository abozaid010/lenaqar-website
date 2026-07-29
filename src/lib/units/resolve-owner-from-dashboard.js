import { normalizeOwnerType } from "@/constants/owner-type";
import { phoneToE164 } from "@/components/phone/phone-utils";
import { quickSearchMessages } from "@/utils/api";

/**
 * Format a dashboard contact name for unit owner_name.
 * Brokers get a stable "broker: …" prefix so ownership is obvious at a glance.
 * @param {unknown} name
 * @param {unknown} ownerType
 * @returns {string | null}
 */
export function formatResolvedOwnerName(name, ownerType) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return null;
  if (normalizeOwnerType(ownerType) === "broker") {
    return `broker: ${trimmed}`;
  }
  return trimmed;
}

/**
 * Lazy lookup: if we already know this phone in the dashboard, return the
 * suggested owner display name (with broker prefix when applicable).
 * @param {string | null | undefined} phone
 * @returns {Promise<{ name: string | null, rawName: string, ownerType: string | null, userId: string | null } | null>}
 */
export async function resolveOwnerFromDashboardPhone(phone) {
  const trimmed = String(phone ?? "").trim();
  if (!trimmed) return null;

  const searchPhone = phoneToE164(trimmed, "EG") || trimmed;

  try {
    const response = await quickSearchMessages({ phone: searchPhone, limit: 5 });
    const users = Array.isArray(response?.data?.users) ? response.data.users : [];
    if (users.length === 0) return null;

    const normalizedSearch = searchPhone.replace(/\s+/g, "");
    const match =
      users.find((user) => {
        const candidate = String(user?.phone_number ?? "").replace(/\s+/g, "");
        return candidate && candidate === normalizedSearch;
      }) || users[0];

    const rawName = String(match?.name ?? "").trim();
    const name = formatResolvedOwnerName(rawName, match?.owner_type);
    const userId = match?.user_id ? String(match.user_id) : null;
    // Existing lead with empty name is still a registered lead — keep userId.
    if (!name && !userId) return null;

    return {
      name: name || null,
      rawName,
      ownerType: normalizeOwnerType(match?.owner_type),
      userId,
    };
  } catch (error) {
    console.error(
      "Failed to resolve owner from dashboard phone:",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}
