"use client";

import { useEffect, useState } from "react";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import { useI18n } from "@/hooks/useI18n";
import {
  getAuthorOptionLabel,
  resolveAuthorDisplayLabel,
  useTeamAuthorOptions,
} from "@/hooks/useTeamAuthorOptions";
import {
  canViewAllDashboardLeads,
  getDashboardLoggedInEmail,
  isAllowedDashboardAuthor,
} from "@/lib/dashboard-lead-access";
import { isValidEmail } from "@/utils/email";

/**
 * Author filter dropdown — same Team-member source and ACL as Leads Author.
 * admin/owner → full team list + "All"; other roles → own email only.
 *
 * Empty selection (= "All") yields "" so callers can omit/send null to the API
 * (admins/owners only).
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
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState("");

  const selected =
    typeof value === "string" ? value.trim() : value == null ? "" : String(value);

  useEffect(() => {
    const email = getDashboardLoggedInEmail();
    const isAdmin = canViewAllDashboardLeads();
    setLoggedInEmail(email);
    setIsAdminUser(isAdmin);
    if (!isAdmin && email) {
      const current = selected.toLowerCase();
      if (current !== email.toLowerCase()) {
        onChange?.({ target: { name, value: email } });
      }
    }
    // Sync once on mount (and when role/email become available).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount ACL sync
  }, []);

  const effectiveValue =
    !isAdminUser && loggedInEmail ? loggedInEmail : selected;

  const { authorOptions, isLoading } = useTeamAuthorOptions({
    selectedAuthor: effectiveValue,
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

    if (!isAllowedDashboardAuthor(nextAuthor)) {
      setAuthorError(
        translate(
          "dashboardFilter.author.ownEmailOnly",
          "You can only filter by your own email",
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
      value={effectiveValue}
      onChange={handleChange}
      menuPlacement={menuPlacement}
      getValue={(option) => option.email}
      getLabel={getAuthorOptionLabel}
      resolveSelectedLabel={(v) => resolveAuthorDisplayLabel(v, authorOptions)}
      searchFields={["name", "email"]}
      placeholder={translate("dashboardFilter.author.placeholder", "Author")}
      showAllOption={isAdminUser}
      allOptionLabel={translate("dashboardFilter.author.all", "All Employees")}
      allOptionValue=""
      allowCreate={isAdminUser}
      isValidCreateValue={(query) => isValidEmail(query)}
      formatCreateLabel={(query) =>
        translate("dashboardFilter.author.useEmail", "Use {email}").replace(
          "{email}",
          query,
        )
      }
      isLoading={isAdminUser && isLoading}
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
