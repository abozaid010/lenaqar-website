"use client";

import UnifiedDialog from "@/components/ui/UnifiedDialog";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import { useI18n } from "@/hooks/useI18n";
import {
  getAuthorOptionLabel,
  resolveAuthorDisplayLabel,
  useTeamAuthorOptions,
} from "@/hooks/useTeamAuthorOptions";
import { assignLeadsAuthor } from "@/utils/api";
import { isValidEmail } from "@/utils/email";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export default function BulkAssignAuthorDialog({
  isOpen,
  onClose,
  selectedLeads = [],
  onSuccess,
}) {
  const { translate } = useI18n();
  const authorSelectRef = useRef(null);
  const [author, setAuthor] = useState("");
  const [authorError, setAuthorError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { authorOptions, isLoading } = useTeamAuthorOptions({
    selectedAuthor: author,
  });

  useEffect(() => {
    if (!isOpen) return;
    setAuthor("");
    setAuthorError("");
    setIsSubmitting(false);
    const frameId = window.requestAnimationFrame(() => {
      authorSelectRef.current?.open?.();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen]);

  const handleAuthorChange = (event) => {
    const raw =
      typeof event?.target?.value === "string" ? event.target.value : "";
    const nextAuthor = raw.trim();

    if (nextAuthor && !isValidEmail(nextAuthor)) {
      setAuthorError(
        translate(
          "dashboardFilter.author.invalidEmail",
          "Enter a valid email address",
        ),
      );
      return;
    }

    setAuthorError("");
    setAuthor(nextAuthor);
  };

  const handleAssign = async () => {
    const leadIds = selectedLeads
      .map((lead) => (typeof lead?.user_id === "string" ? lead.user_id.trim() : ""))
      .filter(Boolean);
    const nextAuthor = author.trim();

    if (leadIds.length === 0 || !nextAuthor) return;
    if (!isValidEmail(nextAuthor)) {
      setAuthorError(
        translate(
          "dashboardFilter.author.invalidEmail",
          "Enter a valid email address",
        ),
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await assignLeadsAuthor({
        lead_ids: leadIds,
        author: nextAuthor,
      });
      const message =
        typeof res?.message === "string" && res.message.trim()
          ? res.message.trim()
          : translate(
              "dashboardFilter.bulkAssignAuthor.success",
              "Assigned author to {count} lead(s)",
            ).replace("{count}", String(leadIds.length));
      toast.success(message);
      onClose?.();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          error?.message ||
          translate(
            "dashboardFilter.bulkAssignAuthor.error",
            "Failed to assign author. Please try again.",
          ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogTitle = translate(
    "dashboardFilter.bulkAssignAuthor.dialogTitle",
    "Assign author to {count} lead(s)",
  ).replace("{count}", String(selectedLeads.length));

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={dialogTitle}
      cancelLabel={translate("buttons.cancel")}
      submitLabel={
        isSubmitting
          ? translate(
              "dashboardFilter.bulkAssignAuthor.assigning",
              "Assigning...",
            )
          : translate(
              "dashboardFilter.bulkAssignAuthor.applyButton",
              "Assign author",
            )
      }
      onSubmit={handleAssign}
      submitDisabled={
        isSubmitting ||
        !author.trim() ||
        Boolean(authorError) ||
        selectedLeads.length === 0
      }
      submitLoading={isSubmitting}
      headerVariant="unified"
      dialogClassName="max-w-lg"
    >
      <div className="max-w-md mx-auto w-full" style={{ minHeight: 500 }}>
        <label
          htmlFor="bulk_assign_author"
          className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5"
        >
          {translate(
            "dashboardFilter.bulkAssignAuthor.authorLabel",
            "Author",
          )}
        </label>
        <SearchableDropdownSelect
          ref={authorSelectRef}
          name="bulk_assign_author"
          options={authorOptions}
          value={author}
          onChange={handleAuthorChange}
          getValue={(option) => option.email}
          getLabel={getAuthorOptionLabel}
          resolveSelectedLabel={(value) =>
            resolveAuthorDisplayLabel(value, authorOptions)
          }
          searchFields={["name", "email"]}
          placeholder={translate(
            "dashboardFilter.bulkAssignAuthor.authorPlaceholder",
            "Select or type an email",
          )}
          showAllOption={false}
          allowCreate
          isValidCreateValue={(query) => isValidEmail(query)}
          formatCreateLabel={(query) =>
            translate(
              "dashboardFilter.author.useEmail",
              "Use {email}",
            ).replace("{email}", query)
          }
          isLoading={isLoading}
          error={Boolean(authorError)}
          errorMessage={authorError}
          searchPlaceholder={translate(
            "dashboardFilter.author.search",
            "Search by name or email",
          )}
          noResultsText={translate(
            "dashboardFilter.author.noResults",
            "No matching team members",
          )}
          menuPlacement="bottom"
          className="w-full"
        />
      </div>
    </UnifiedDialog>
  );
}
