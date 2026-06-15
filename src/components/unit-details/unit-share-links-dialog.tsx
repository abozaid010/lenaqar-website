'use client';

import { useState } from 'react';
import { Check, Copy, Globe, MessageCircle, Share2 } from 'lucide-react';
import UnifiedDialog from '@/components/ui/UnifiedDialog';
import { useI18n } from '@/hooks/useI18n';
import { useMessagingProviderConfig } from '@/hooks/useMessagingProviderConfig';
import { buildUnitShareLinks } from '@/lib/units/unit-share-links';

interface UnitShareLinksDialogProps {
  isOpen: boolean;
  onClose: () => void;
  unitCode: string | null | undefined;
}

export default function UnitShareLinksDialog({
  isOpen,
  onClose,
  unitCode,
}: UnitShareLinksDialogProps) {
  const { translate } = useI18n();
  const { data: messagingConfig } = useMessagingProviderConfig();
  const defaultSenderPhone = messagingConfig?.defaultSenderPhone ?? null;
  const [copiedWebsite, setCopiedWebsite] = useState(false);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

  const code = unitCode?.trim() || null;
  const { websiteUrl, whatsappUrl } = code
    ? buildUnitShareLinks({ code, whatsappNumber: defaultSenderPhone })
    : { websiteUrl: '', whatsappUrl: null };

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
    if (!whatsappUrl) return;
    try {
      await navigator.clipboard.writeText(whatsappUrl);
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
      bodyClassName="space-y-4"
    >
      {!code ? (
        <p className="text-sm text-gray-600 text-center py-4">
          {translate(
            'unitShare.noCode',
            'This unit does not have a reference code yet.'
          )}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-gray-700">
                {translate('unitShare.websiteLink', 'Website link')}
              </span>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-700 break-all">{websiteUrl}</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyWebsite}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:opacity-90 transition-colors"
                >
                  {copiedWebsite ? (
                    <>
                      <Check className="w-4 h-4" />
                      {translate('unitShare.copied', 'Copied!')}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {translate('unitShare.copyWebsite', 'Copy website link')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {whatsappUrl ? (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-gray-700">
                  {translate('unitShare.whatsappLink', 'WhatsApp link')}
                </span>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-700 break-all">{whatsappUrl}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyWhatsapp}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:opacity-90 transition-colors"
                  >
                    {copiedWhatsapp ? (
                      <>
                        <Check className="w-4 h-4" />
                        {translate('unitShare.copied', 'Copied!')}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        {translate('unitShare.copyWhatsapp', 'Copy WhatsApp link')}
                      </>
                    )}
                  </button>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    {translate('unitShare.openWhatsapp', 'Open WhatsApp')}
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center">
              {translate(
                'unitShare.noWhatsapp',
                'No linked WhatsApp number is configured for this client.'
              )}
            </p>
          )}
        </div>
      )}
    </UnifiedDialog>
  );
}
