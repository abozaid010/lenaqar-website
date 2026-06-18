import type { RawUnit } from '@/lib/units/unit-types';
import { formatPhoneForWhatsApp } from '@/utils/phone-utils';
import { buildUnitWhatsappShareMessage } from '@/lib/units/unit-share-links';

// X-API-Key is added server-side by the BFF catch-all for /public/* paths.
// API_BASE_URL is not referenced here — all calls go through /api/crm/*.

type DeveloperContact = {
  id: string;
  sales_phone: string;
  whatsapp: string;
};

type ClientContact = {
  client_id: string;
  phone_number: string;
  whatsapp: string | null;
};

async function fetchDeveloperContacts(): Promise<Map<string, DeveloperContact>> {
  const response = await fetch('/api/crm/developers/get_contact', {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch developer contacts: ${response.status}`);
  }

  const result = await response.json();
  if (!result.status || !Array.isArray(result.data)) {
    throw new Error('Invalid developer contacts response');
  }

  return new Map(
    result.data.map((dev: DeveloperContact) => [dev.id, dev])
  );
}

async function fetchClientContacts(): Promise<Map<string, ClientContact>> {
  const response = await fetch('/api/crm/client/public/contact_data', {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch client contacts: ${response.status}`);
  }

  const result = await response.json();
  if (!result.status || !Array.isArray(result.data)) {
    throw new Error('Invalid client contacts response');
  }

  return new Map(
    result.data.map((client: ClientContact) => [client.client_id, client])
  );
}

/** Resolve the public WhatsApp number for a unit (developer, client, or owner). */
export async function resolvePublicUnitWhatsappNumber(
  unit: RawUnit
): Promise<string | null> {
  if (unit.is_primary && unit.developer_id) {
    const developers = await fetchDeveloperContacts();
    const contact = developers.get(unit.developer_id);
    return contact?.whatsapp?.trim() || contact?.sales_phone?.trim() || null;
  }

  if (unit.clientId && !unit.is_primary) {
    const clients = await fetchClientContacts();
    const contact = clients.get(unit.clientId);
    return (
      contact?.whatsapp?.trim() ||
      contact?.phone_number?.trim() ||
      null
    );
  }

  if (unit.owner_mobile?.trim()) {
    return unit.owner_mobile.trim();
  }

  return null;
}

export function buildUnitWhatsappRedirectTarget(
  phone: string,
  code: string
): string {
  return formatPhoneForWhatsApp(phone, buildUnitWhatsappShareMessage(code));
}
