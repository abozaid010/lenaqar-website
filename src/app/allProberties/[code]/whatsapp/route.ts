import { notFound, redirect } from 'next/navigation';
import { resolvePublicUnitByCodeParam } from '@/lib/units/unit-legacy-redirect';
import {
  buildUnitWhatsappRedirectTarget,
  resolvePublicUnitWhatsappNumber,
} from '@/lib/units/unit-whatsapp-contact';

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const rawUnit = await resolvePublicUnitByCodeParam(code);
  if (!rawUnit) notFound();

  const phone = await resolvePublicUnitWhatsappNumber(rawUnit);
  if (!phone) notFound();

  const unitCode = rawUnit.code?.trim();
  if (!unitCode) notFound();

  redirect(buildUnitWhatsappRedirectTarget(phone, unitCode));
}
