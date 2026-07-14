"use client";

import { useState } from "react";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import { useI18n } from "@/hooks/useI18n";
import {
  getAuthorOptionLabel,
  resolveAuthorDisplayLabel,
  useTeamAuthorOptions,
} from "@/hooks/useTeamAuthorOptions";
import { isValidEmail } from "@/utils/email";

/**
 * Author filter dropdown — same Team-member source and UX as Leads Author,
 * with full author list available to all users.
 *
 * Empty selection (= "All") yields "" so callers can omit/send null to the API.
 */
export default function AuthorFilterSelect({
  value = "",
  onChange,
  name = "author",
  className = "",
  buttonClassName = "",
  menuPlacement = "bottom",
}) {
  const { translate } = useI18n();
  const [authorError, setAuthorError] = useState("");
  const selected =
    typeof value === "string" ? value.trim() : value == null ? "" : String(value);

  const { authorOptions, isLoading } = useTeamAuthorOptions({
    selectedAuthor: selected,
  });

  const handleChange = (event) => {
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
    onChange?.({ target: { name, value: nextAuthor || "" } });
  };

  return (
    <SearchableDropdownSelect
      name={name}
      options={authorOptions}
      value={selected}
      onChange={handleChange}
      menuPlacement={menuPlacement}
      getValue={(option) => option.email}
      getLabel={getAuthorOptionLabel}
      resolveSelectedLabel={(v) => resolveAuthorDisplayLabel(v, authorOptions)}
      searchFields={["name", "email"]}
      placeholder={translate("dashboardFilter.author.placeholder", "Author")}
      showAllOption
      allOptionLabel={translate("dashboardFilter.author.all", "All")}
      allOptionValue=""
      allowCreate
      isValidCreateValue={(query) => isValidEmail(query)}
      formatCreateLabel={(query) =>
        translate("dashboardFilter.author.useEmail", "Use {email}").replace(
          "{email}",
          query,
        )
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
      className={className}
      buttonClassName={buttonClassName}
    />
  );
}
