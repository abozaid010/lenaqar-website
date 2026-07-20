import { phoneToE164 } from "@/components/phone/phone-utils";
import { digitsOnlyNormalized } from "@/utils/lead-list-search";
import { fetchUsersData, getClientid } from "@/utils/api";
import { addNewLeadAction } from "@/app/(admin)/dashboard/_actions/leads";

export type LeadByPhoneResult = {
  userId: string;
  phoneNumber: string;
  name: string;
  created: boolean;
};

function phonesMatch(a?: string | null, b?: string | null): boolean {
  const left = digitsOnlyNormalized(phoneToE164(a, "EG") || a || "");
  const right = digitsOnlyNormalized(phoneToE164(b, "EG") || b || "");
  if (!left || !right) return false;
  return left === right || left.endsWith(right) || right.endsWith(left);
}

/**
 * Find an existing lead by phone, or create one with the minimum required fields.
 * Reuses dashboard lead list search + addNewLeadAction (same as manual add lead).
 */
export async function findOrCreateLeadByPhone(
  phoneE164: string,
): Promise<LeadByPhoneResult> {
  const normalized = phoneToE164(phoneE164, "EG") || String(phoneE164).trim();
  if (!normalized) {
    throw new Error("Invalid phone number");
  }

  const searchQuery = digitsOnlyNormalized(normalized) || normalized;
  const data = await fetchUsersData({ query: searchQuery, limit: 50 });
  const users = Array.isArray(data?.users) ? data.users : [];

  const existing = users.find((user) =>
    phonesMatch(user?.phone_number, normalized),
  );

  if (existing?.user_id) {
    return {
      userId: String(existing.user_id),
      phoneNumber:
        phoneToE164(existing.phone_number, "EG") ||
        String(existing.phone_number || normalized),
      name: String(existing.name || existing.user_name || normalized),
      created: false,
    };
  }

  const clientId = getClientid() || "public";
  const payload = {
    user_id: crypto.randomUUID(),
    phone_number: normalized,
    user_name: normalized,
    query: "",
    client_id: clientId,
    platform: "website",
    campaign_id: "added_manually",
  };

  const result = await addNewLeadAction(payload);
  if (!result?.success) {
    throw new Error(result?.message || "Failed to create lead");
  }

  const created = result.data || payload;
  const userId = String(created.user_id || payload.user_id);
  const phoneNumber =
    phoneToE164(created.phone_number, "EG") ||
    String(created.phone_number || normalized);

  return {
    userId,
    phoneNumber,
    name: String(created.user_name || created.name || phoneNumber),
    created: true,
  };
}
