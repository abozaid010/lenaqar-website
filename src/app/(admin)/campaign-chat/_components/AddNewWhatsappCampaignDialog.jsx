"use client";

import { useState, useEffect, useCallback } from "react";
import Dialog from "@/components/ui/Dialog";
import LenaTextarea from "@/components/ui/inputs/lena-textarea";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { Send, CheckCircle, Clock, Users, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/useI18n";
import { useWhatsappBulkAccess } from "@/hooks/useWhatsappBulkAccess";
import WhatsappPlatformSelect from "@/components/whatsapp/WhatsappPlatformSelect";
import { useMessagingProviderConfig } from "@/hooks/useMessagingProviderConfig";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  getEffectiveMessagingAccount,
  isMessagingConfigReady,
  sendWhatsappWithClientConfig,
  toTransportPlatform,
  WHATSAPP_NOT_CONFIGURED_CODE,
} from "@/lib/whatsapp-messaging-provider";
import { LoadingButton, LoadingOverlay } from "@/components/ui/loading-states";
const DEFAULT_CONTACTS_JSON =
  '[\n  {\n    "phone": "+20 101 6080323",\n    "name": "Nada"\n  }\n]';

const SEND_MODE = {
  API: "api",
  AUTOMATION: "automation",
};

function getApiErrorMessage(error, fallback) {
  return (
    error?.response?.data?.error_message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

const AddNewWhatsappCampaignDialog = ({
  isOpen,
  onClose,
  recipients: recipientsProp = [],
}) => {
  const { t, translate } = useI18n();
  const {
    canUseApiTemplate: hasApiModule,
    canUseAutomation: hasAutomationModule,
    hasBothModules,
  } = useWhatsappBulkAccess();

  const [sendMode, setSendMode] = useState(
    hasApiModule ? SEND_MODE.API : SEND_MODE.AUTOMATION
  );
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS_JSON);
  const [automationMessage, setAutomationMessage] = useState("");
  const [languageCode, setLanguageCode] = useState("ar_EG");
  const [templateName, setTemplateName] = useState("download_app_message1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [jobResult, setJobResult] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [platformError, setPlatformError] = useState("");

  const clientId = LenaCookiesManager.getClientId() || "public";
  const { data: messagingData } = useMessagingProviderConfig(clientId);
  const accounts = messagingData?.accounts ?? [];
  const selectedAccount = getEffectiveMessagingAccount(
    messagingData,
    selectedPlatform
  );
  const hasPrefilledRecipients = recipientsProp.length > 0;

  const notConfiguredMessage = translate(
    "editClient.whatsapp.notConfigured",
    "WhatsApp messaging is not configured for this client."
  );

  const ensureMessagingConfigured = () => {
    if (messagingData?.hasMultipleAccounts && !selectedPlatform) {
      const err = translate(
        "whatsappSend.platformRequired",
        "Please choose which WhatsApp account to send from."
      );
      setPlatformError(err);
      setError(err);
      toast.error(err);
      return false;
    }
    if (isMessagingConfigReady(selectedAccount)) {
      setPlatformError("");
      return true;
    }
    setError(notConfiguredMessage);
    toast.error(notConfiguredMessage);
    return false;
  };

  useEffect(() => {
    if (!isOpen) return;
    if (hasApiModule && !hasAutomationModule) {
      setSendMode(SEND_MODE.API);
    } else if (!hasApiModule && hasAutomationModule) {
      setSendMode(SEND_MODE.AUTOMATION);
    } else if (hasBothModules) {
      setSendMode((prev) =>
        prev === SEND_MODE.API || prev === SEND_MODE.AUTOMATION
          ? prev
          : SEND_MODE.API
      );
    }
  }, [isOpen, hasApiModule, hasAutomationModule, hasBothModules]);

  const validatePhoneNumber = (phone) => phone.trim().length > 0;

  const validateLanguageCode = (code) => code.trim().length > 0;

  const validateContacts = (contactsStr) => {
    if (hasPrefilledRecipients) {
      if (recipientsProp.length === 0) {
        setError(
          translate(
            "dashboardFilter.bulkWhatsapp.noRecipients",
            "No leads with valid phone numbers to send."
          )
        );
        return false;
      }
      return true;
    }

    if (!contactsStr.trim()) {
      setError(
        translate(
          "campaignChat.bulkDialog.contactsRequired",
          "Contacts field is required"
        )
      );
      return false;
    }

    try {
      const parsedContacts = JSON.parse(contactsStr);

      if (!Array.isArray(parsedContacts)) {
        setError(
          translate(
            "campaignChat.bulkDialog.contactsMustBeArray",
            "Contacts must be a JSON array"
          )
        );
        return false;
      }

      if (parsedContacts.length === 0) {
        setError(
          translate(
            "campaignChat.bulkDialog.contactsEmpty",
            "Contacts array cannot be empty"
          )
        );
        return false;
      }

      for (let i = 0; i < parsedContacts.length; i++) {
        const contact = parsedContacts[i];

        if (typeof contact !== "object" || contact === null) {
          setError(
            translate(
              "campaignChat.bulkDialog.contactMustBeObject",
              `Contact at index ${i} must be an object`
            )
          );
          return false;
        }

        if (!contact.phone || !contact.name) {
          setError(
            translate(
              "campaignChat.bulkDialog.contactPhoneNameRequired",
              `Contact at index ${i} must have both 'phone' and 'name' fields`
            )
          );
          return false;
        }

        if (!validatePhoneNumber(contact.phone)) {
          setError(
            translate(
              "campaignChat.bulkDialog.invalidPhone",
              `Invalid phone number for contact at index ${i}`
            )
          );
          return false;
        }

        if (!contact.name.trim()) {
          setError(
            translate(
              "campaignChat.bulkDialog.emptyName",
              `Name cannot be empty for contact at index ${i}`
            )
          );
          return false;
        }
      }

      return true;
    } catch {
      setError(
        translate(
          "campaignChat.bulkDialog.contactsInvalidJson",
          "Contacts must be valid JSON array"
        )
      );
      return false;
    }
  };

  const validateApiForm = () => {
    setError("");

    if (!validateContacts(contacts)) {
      return false;
    }

    if (!languageCode.trim()) {
      setError(
        translate(
          "campaignChat.bulkDialog.languageRequired",
          "Language code is required"
        )
      );
      return false;
    }

    if (!validateLanguageCode(languageCode)) {
      setError(
        translate(
          "campaignChat.bulkDialog.languageInvalid",
          "Invalid language code format"
        )
      );
      return false;
    }

    if (!templateName.trim()) {
      setError(
        translate(
          "campaignChat.bulkDialog.templateRequired",
          "Template name is required"
        )
      );
      return false;
    }

    return true;
  };

  const validateAutomationForm = () => {
    setError("");

    if (recipientsProp.length === 0) {
      setError(
        translate(
          "dashboardFilter.bulkWhatsapp.noRecipients",
          "No leads with valid phone numbers to send."
        )
      );
      return false;
    }

    if (!automationMessage.trim()) {
      setError(
        translate(
          "dashboardFilter.bulkWhatsapp.messageRequired",
          "Message is required"
        )
      );
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (sendMode === SEND_MODE.AUTOMATION) {
      setIsFormValid(
        recipientsProp.length > 0 && automationMessage.trim().length > 0
      );
      return;
    }

    if (hasPrefilledRecipients) {
      setIsFormValid(
        recipientsProp.length > 0 &&
          languageCode.trim().length > 0 &&
          templateName.trim().length > 0
      );
      return;
    }

    try {
      const parsedContacts = JSON.parse(contacts);
      if (!Array.isArray(parsedContacts) || parsedContacts.length === 0) {
        setIsFormValid(false);
        return;
      }

      for (const contact of parsedContacts) {
        if (!contact?.phone || !contact?.name) {
          setIsFormValid(false);
          return;
        }
      }
    } catch {
      setIsFormValid(false);
      return;
    }

    setIsFormValid(
      languageCode.trim().length > 0 && templateName.trim().length > 0
    );
  }, [
    sendMode,
    contacts,
    languageCode,
    templateName,
    automationMessage,
    recipientsProp,
    hasPrefilledRecipients,
  ]);

  const submitApiCampaign = async () => {
    if (!validateApiForm()) return;

    const contactList = hasPrefilledRecipients
      ? recipientsProp
      : JSON.parse(contacts).map((c) => ({
          phone_number: c.phone,
          user_name: c.name,
        }));

    const transportPlatform = toTransportPlatform(selectedAccount.platform);
    const messages = contactList.map((contact) => ({
      phone_number: contact.phone_number || contact.phone,
      message: "",
      user_name: contact.user_name || contact.name || "",
      template_name: templateName,
      language_code: languageCode,
      platform: transportPlatform,
    }));

    return sendWhatsappWithClientConfig({
      config: selectedAccount,
      messages,
    });
  };

  const submitAutomationMessages = async () => {
    if (!validateAutomationForm()) return;

    const transportPlatform = toTransportPlatform(selectedAccount.platform);
    const messages = recipientsProp.map((recipient) => ({
      phone_number: recipient.phone_number,
      message: automationMessage.trim(),
      user_name: recipient.user_name || "",
      platform: transportPlatform,
    }));

    return sendWhatsappWithClientConfig({
      config: selectedAccount,
      messages,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ensureMessagingConfigured()) return;

    setIsSubmitting(true);
    setError("");

    try {
      if (sendMode === SEND_MODE.AUTOMATION) {
        const result = await submitAutomationMessages();
        const sent = result?.data?.sent ?? 0;
        const failed = result?.data?.failed ?? 0;
        const successKey =
          failed > 0
            ? "dashboardFilter.bulkWhatsapp.automationSuccessWithErrors"
            : "dashboardFilter.bulkWhatsapp.automationSuccess";
        const successText = translate(
          successKey,
          failed > 0
            ? `Sent ${sent} message(s) (${failed} failed)`
            : `Sent ${sent} message(s)`
        )
          .replace("{count}", String(sent))
          .replace("{errors}", String(failed));
        toast.success(successText);
        setAutomationMessage("");
        handleClose();
        return;
      }

      const result = await submitApiCampaign();

      if (!hasPrefilledRecipients) {
        setContacts(DEFAULT_CONTACTS_JSON);
        setLanguageCode("ar_EG");
        setTemplateName("download_app_message1");
      }

      const sent = result?.data?.sent ?? 0;
      const failed = result?.data?.failed ?? 0;
      
      if (failed > 0) {
        const warningText = translate(
          "dashboardFilter.bulkWhatsapp.sendSuccessWithErrors",
          `Sent ${sent} message(s) (${failed} failed)`
        );
        toast.success(warningText);
      } else {
        toast.success(
          translate(
            "campaignChat.bulkDialog.sendSuccess",
            "Campaign sent successfully"
          )
        );
      }

      setJobResult(result);
      handleClose();
    } catch (err) {
      if (err?.code === WHATSAPP_NOT_CONFIGURED_CODE) {
        setError(notConfiguredMessage);
        toast.error(notConfiguredMessage);
        return;
      }
      const message = getApiErrorMessage(
        err,
        translate(
          "dashboardFilter.bulkWhatsapp.sendFailed",
          "Failed to send. Please try again."
        )
      );
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = (field) => {
    if (error && error.toLowerCase().includes(field.toLowerCase())) {
      setError("");
    }
  };

  const handleClose = useCallback(() => {
    setJobResult(null);
    setError("");
    onClose();
  }, [onClose]);

  const dialogTitle = translate(
    "dashboardFilter.bulkWhatsapp.dialogTitle",
    t?.dashboardFilter?.bulkWhatsapp?.dialogTitle || "Send WhatsApp"
  );

  const recipientSummary = translate(
    "dashboardFilter.bulkWhatsapp.recipientCount",
    "{count} recipient(s)"
  ).replace("{count}", String(recipientsProp.length));

  const renderModeTabs = () => {
    if (!hasBothModules) return null;

    return (
      <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => setSendMode(SEND_MODE.API)}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            sendMode === SEND_MODE.API
              ? "bg-white text-primary shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {translate(
            "dashboardFilter.bulkWhatsapp.tabApiTemplate",
            "API Template"
          )}
        </button>
        <button
          type="button"
          onClick={() => setSendMode(SEND_MODE.AUTOMATION)}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            sendMode === SEND_MODE.AUTOMATION
              ? "bg-white text-primary shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {translate(
            "dashboardFilter.bulkWhatsapp.tabAutomation",
            "Automation"
          )}
        </button>
      </div>
    );
  };

  const renderAutomationForm = () => (
    <div className="relative flex flex-col flex-1 min-h-0">
      <LoadingOverlay
        isVisible={isSubmitting}
        message={translate("common.sending", t?.common?.sending || "Sending...")}
      />
      {hasPrefilledRecipients && (
        <p className="mb-3 text-sm text-gray-600">{recipientSummary}</p>
      )}
      <LenaTextarea
        label={translate(
          "dashboardFilter.bulkWhatsapp.messageLabel",
          "Message"
        )}
        name="automation_message"
        value={automationMessage}
        onChange={(e) => {
          setAutomationMessage(e.target.value);
          clearError("message");
        }}
        required
        rows={8}
        disabled={isSubmitting}
        placeholder={translate(
          "dashboardFilter.bulkWhatsapp.messagePlaceholder",
          "Type your WhatsApp message..."
        )}
      />
    </div>
  );

  const renderApiForm = () => (
    <form onSubmit={handleSubmit} className="h-full flex flex-col relative">
      <LoadingOverlay
        isVisible={isSubmitting}
        message={translate("common.sending", t?.common?.sending || "Sending...")}
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {hasPrefilledRecipients ? (
        <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-700">{recipientSummary}</p>
        </div>
      ) : (
        <div className="mb-6 flex-1">
          <LenaTextarea
            label={translate(
              "campaignChat.bulkDialog.contactsLabel",
              "Contacts (JSON Array)"
            )}
            name="contacts"
            value={contacts}
            onChange={(e) => {
              setContacts(e.target.value);
              clearError("contacts");
            }}
            required
            error={error && error.includes("Contacts")}
            errorMessage={error && error.includes("Contacts") ? error : ""}
            helperText={translate(
              "campaignChat.bulkDialog.contactsHelper",
              "Enter contacts as JSON array with phone and name fields."
            )}
            rows={12}
            className="font-mono text-sm"
            dir="ltr"
            disabled={isSubmitting}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <LenaTextField
          label={translate(
            "campaignChat.bulkDialog.languageLabel",
            "Language Code"
          )}
          name="language_code"
          value={languageCode}
          onChange={(e) => {
            setLanguageCode(e.target.value);
            clearError("language");
          }}
          required
          placeholder="e.g., ar_EG"
          disabled={isSubmitting}
        />
        <LenaTextField
          label={translate(
            "campaignChat.bulkDialog.templateLabel",
            "Template Name"
          )}
          name="template_name"
          value={templateName}
          onChange={(e) => {
            setTemplateName(e.target.value);
            clearError("template");
          }}
          required
          placeholder="e.g., download_app_message1"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {translate("common.cancel", t?.common?.cancel || "Cancel")}
        </button>
        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          disabled={!isFormValid}
          loadingText={translate("common.sending", t?.common?.sending || "Sending...")}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Send size={16} />
          {translate(
            "campaignChat.bulkDialog.sendCampaign",
            "Send Campaign"
          )}
        </LoadingButton>
      </div>
    </form>
  );

  const showAutomation =
    sendMode === SEND_MODE.AUTOMATION && hasAutomationModule;
  const showApi = sendMode === SEND_MODE.API && hasApiModule;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={dialogTitle}
      showCloseButton={!isSubmitting}
      closeOnOutsideClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      {jobResult ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">
                {jobResult.message ||
                  translate(
                    "campaignChat.bulkDialog.sendSuccess",
                    "Campaign created successfully"
                  )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">
                {translate("campaignChat.bulkDialog.status", "Status")}
              </p>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-gray-800 capitalize">
                  {jobResult.status}
                </span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">
                {translate(
                  "campaignChat.bulkDialog.totalContacts",
                  "Total Contacts"
                )}
              </p>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-gray-800">
                  {jobResult.total}
                </span>
              </div>
            </div>
            {jobResult.invalid_numbers > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-500 mb-1">
                  {translate(
                    "campaignChat.bulkDialog.invalidNumbers",
                    "Invalid Numbers"
                  )}
                </p>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-red-700">
                    {jobResult.invalid_numbers}
                  </span>
                </div>
              </div>
            )}
          </div>

          {jobResult.job_id && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">
                {translate("campaignChat.bulkDialog.jobId", "Job ID")}
              </p>
              <p className="font-mono text-sm text-gray-700 break-all">
                {jobResult.job_id}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            >
              {translate("common.done", t?.common?.done || "Done")}
            </button>
          </div>
        </div>
      ) : (
        <>
          {messagingData?.hasMultipleAccounts ? (
            <WhatsappPlatformSelect
              accounts={accounts}
              hasMultipleAccounts={messagingData.hasMultipleAccounts}
              value={selectedPlatform}
              onChange={(next) => {
                setSelectedPlatform(next ?? "");
                setPlatformError("");
              }}
              error={platformError}
              required
              id="bulk_whatsapp_platform"
              className="mb-4"
            />
          ) : null}
          {renderModeTabs()}
          {showAutomation ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {renderAutomationForm()}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  {translate("common.cancel", t?.common?.cancel || "Cancel")}
                </button>
                <LoadingButton
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={!isFormValid}
                  loadingText={translate(
                    "common.sending",
                    t?.common?.sending || "Sending..."
                  )}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={16} />
                  {translate("send", t?.send || "Send")}
                </LoadingButton>
              </div>
            </form>
          ) : showApi ? (
            renderApiForm()
          ) : null}
        </>
      )}
    </Dialog>
  );
};

export default AddNewWhatsappCampaignDialog;
