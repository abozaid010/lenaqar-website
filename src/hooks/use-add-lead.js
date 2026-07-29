"use client";

import { useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/utils/query-utils";
import { addNewLeadAction } from "@/app/(admin)/dashboard/_actions/leads";

/**
 * Shared hook for adding a new lead.
 * Reuses logic and API structure as required by the mobile lead screen.
 */
export function useAddLead({ onSuccess, clientId } = {}) {
  const { t, translate } = useI18n();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addNewLead = async (formData) => {
    const { phonePayload, user_name, query, phone_number, owner_type } = formData;

    if (!user_name?.trim()) {
      toast.error(translate("common.nameRequired", "Name is required"));
      return false;
    }

    if (!phonePayload?.combined) {
      if (!phone_number?.trim()) {
        toast.error(translate("common.phoneRequired", "Phone number is required"));
      } else {
        toast.error(
          translate(
            "common.invalidPhone",
            "Invalid phone number format. Please include country code (e.g. +20...)",
          ),
        );
      }
      return false;
    }

    setIsSubmitting(true);
    try {
      // Single combined international number (E.164) from PhoneField.
      const payload = {
        user_id: crypto.randomUUID(),
        phone_number: phonePayload.combined,
        user_name: user_name.trim(),
        query: query?.trim() || "",
        client_id: clientId || "public",
        platform: "website",
        campaign_id: "added_manually",
        ...(owner_type ? { owner_type } : {}),
      };

      const result = await addNewLeadAction(payload);

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(translate("common.leadAdded", "Lead added successfully"));
      
      // Refresh relevant queries
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: ["campaignSessions"] });

      if (onSuccess) {
        onSuccess(result.data);
      }
      return true;
    } catch (error) {
      console.error("Error adding lead:", error?.message ?? error);
      toast.error(error.message || "Something went wrong");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    addNewLead,
    isSubmitting,
  };
}
