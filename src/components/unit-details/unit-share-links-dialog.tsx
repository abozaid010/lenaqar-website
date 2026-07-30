'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, Globe, MessageCircle } from 'lucide-react';
import UnifiedDialog from '@/components/ui/UnifiedDialog';
import { useI18n } from '@/hooks/useI18n';
import { useMessagingProviderConfig } from '@/hooks/useMessagingProviderConfig';
import { buildUnitShareLinks, buildUnitWhatsappShareMessage } from '@/lib/units/unit-share-links';
import { normalizeWhatsappPhone } from '@/lib/whatsapp-messaging-provider';

interface UnitShareLinksDialogProps {
  isOpen: boolean;
  onClose: () => void;
  unitCode: string | null | undefined;
  /** Listing client's id for the permanent canonical share URL. */
  listingClientId?: string | null;
}

interface ShareLinkRowProps {
  icon: typeof Globe;
  label: string;
  value: string;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
  onCopy: () => void;
}

function ShareLinkRow({
  icon: Icon,
  label,
  value,
  copied,
  copyLabel,
  copiedLabel,
  onCopy,
}: ShareLinkRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E2DBFF]/40">
          <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
        </span>
        <span className="text-sm font-medium text-primary">{label}</span>
      </div>
      <div className="flex items-stretch gap-2">
        <div className="flex min-w-0 flex-1 items-center rounded-lg border border-primary/10 bg-[#E2DBFF]/10 px-3 py-2.5">
          <span className="truncate text-sm text-gray-700" dir="ltr" title={value}>
            {value}
          </span>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="icon-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-white text-primary transition-colors hover:bg-[#E2DBFF]/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label={copied ? copiedLabel : copyLabel}
          title={copied ? copiedLabel : copyLabel}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" aria-hidden />
          ) : (
            <Copy className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}

export default function UnitShareLinksDialog({
  isOpen,
  onClose,
  unitCode,
  listingClientId,
}: UnitShareLinksDialogProps) {
  const { translate } = useI18n();
  const { data: messagingConfig } = useMessagingProviderConfig();
  const primaryAccount =
    messagingConfig?.readyAccounts?.[0] ?? messagingConfig?.accounts?.[0] ?? null;
  const linkedWhatsappNumberRaw = primaryAccount?.whatsapp_number ?? null;
  const linkedWhatsappNumber = linkedWhatsappNumberRaw
    ? normalizeWhatsappPhone(linkedWhatsappNumberRaw)
    : null;
  const [copiedWebsite, setCopiedWebsite] = useState(false);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

  const code = unitCode?.trim() || null;
  const { websiteUrl, whatsappUrl, whatsappDirectUrl } = code
    ? buildUnitShareLinks({
        code,
        listingClientId,
        whatsappNumber: linkedWhatsappNumber,
      })
    : { websiteUrl: '', whatsappUrl: null, whatsappDirectUrl: null };
  const whatsappOpenUrl = whatsappDirectUrl ?? whatsappUrl;
  const whatsappMessage = code ? buildUnitWhatsappShareMessage(code) : '';

  const handleCopyWebsite = async () => {
    if (!websiteUrl) return;
    try {
      await navigator.clipboard.writeText(websiteUrl);
      setCopiedWebsite(true);
      setTimeout(() => setCopiedWebsite(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleCopyWhatsapp = async () => {
    const linkToCopy = whatsappDirectUrl || whatsappUrl;
    if (!linkToCopy) return;
    try {
      await navigator.clipboard.writeText(linkToCopy);
      setCopiedWhatsapp(true);
      setTimeout(() => setCopiedWhatsapp(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onClose}
      title={translate('unitShare.title', 'Share Property')}
      cancelLabel={translate('buttons.close', 'Close')}
      cancelAriaLabel={translate('buttons.close', 'Close')}
      headerVariant="unified"
      headerLeading={undefined}
      headerTrailing={null}
      submitLabel={null}
      onSubmit={null}
      dialogClassName="max-w-md"
      bodyClassName="space-y-5 py-5"
    >
      {!code ? (
        <p className="py-6 text-center text-sm text-gray-500">
          {translate(
            'unitShare.noCode',
            'This unit does not have a reference code yet.'
          )}
        </p>
      ) : (
        <>
          <p className="text-center text-sm text-gray-500">
            {translate(
              'unitShare.subtitle',
              'Copy a link and share it with your clients.'
            )}
          </p>

          <ShareLinkRow
            icon={Globe}
            label={translate('unitShare.websiteLink', 'Website link')}
            value={websiteUrl}
            copied={copiedWebsite}
            copyLabel={translate('unitShare.copyWebsite', 'Copy website link')}
            copiedLabel={translate('unitShare.copied', 'Copied!')}
            onCopy={handleCopyWebsite}
          />

          {whatsappDirectUrl ? (
            <div className="space-y-3 border-t border-primary/10 pt-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E2DBFF]/40">
                  <MessageCircle className="h-3.5 w-3.5 text-primary" aria-hidden />
                </span>
                <span className="text-sm font-medium text-primary">
                  {translate('unitShare.whatsappLink', 'WhatsApp link')}
                </span>
              </div>

              <div className="rounded-lg border border-primary/10 bg-[#E2DBFF]/10 px-3 py-2.5">
                <p className="text-sm leading-relaxed text-gray-700">{whatsappMessage}</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCopyWhatsapp}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary/20 bg-white px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-[#E2DBFF]/20"
                >
                  {copiedWhatsapp ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" aria-hidden />
                      {translate('unitShare.copied', 'Copied!')}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" aria-hidden />
                      {translate('unitShare.copyWhatsapp', 'Copy WhatsApp link')}
                    </>
                  )}
                </button>
                {whatsappOpenUrl ? (
                  <a
                    href={whatsappOpenUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    {translate('unitShare.openWhatsapp', 'Open WhatsApp')}
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="border-t border-primary/10 pt-5 text-center text-sm text-gray-500">
              {translate(
                'unitShare.noWhatsapp',
                'No linked WhatsApp number is configured for this client.'
              )}
            </p>
          )}
        </>
      )}
    </UnifiedDialog>
  );
}
