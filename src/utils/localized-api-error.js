/**
 * Extract a user-facing message from an API/axios error.
 * Supports FastAPI `detail`, common `message` / `error_message` shapes, and plain strings.
 */
export function getApiErrorMessage(error, fallback = "") {
  if (!error) return fallback;
  if (typeof error === "string") return error.trim() || fallback;

  const responseData = error.response?.data;
  if (responseData) {
    const { detail } = responseData;
    if (typeof detail === "string" && detail.trim()) {
      return detail.trim();
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const parts = detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item?.msg) return item.msg;
          return null;
        })
        .filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }

    const message =
      responseData.error_message ||
      responseData.message ||
      responseData.error;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  if (error instanceof Error && error.message?.trim()) {
    return error.message.trim();
  }

  return fallback;
}

const TEAM_ERROR_MATCHERS = [
  {
    key: "phoneAlreadyExists",
    match: (msg) =>
      /team member with this phone number already exists/i.test(msg),
  },
  {
    key: "emailAlreadyExists",
    match: (msg) =>
      /team member with this email already exists/i.test(msg) ||
      /email.*already exists/i.test(msg),
  },
  {
    key: "noPermissionAdd",
    match: (msg) => /do not have permission to add team members/i.test(msg),
  },
  {
    key: "noPermissionEdit",
    match: (msg) => /do not have permission to edit team members/i.test(msg),
  },
  {
    key: "createFailed",
    match: (msg) => /failed to (add new sales|create employee)/i.test(msg),
  },
  {
    key: "updateFailed",
    match: (msg) => /failed to (edit team member|update employee)/i.test(msg),
  },
];

function isTechnicalMessage(message) {
  return (
    /^HTTP \d+/i.test(message) ||
    /network error/i.test(message) ||
    /request failed with status code/i.test(message) ||
    /ECONNABORTED|timeout/i.test(message)
  );
}

/**
 * Map a raw API/server error string to a localized team message.
 * Unknown or technical messages fall back to a generic user-safe string.
 */
export function resolveTeamApiError(rawMessage, t) {
  const normalized = (rawMessage || "").trim();
  const teamErrors = t?.team?.errors ?? {};

  if (!normalized) {
    return teamErrors.generic || t?.common?.somethingWentWrong || "Something went wrong";
  }

  for (const { key, match } of TEAM_ERROR_MATCHERS) {
    if (match(normalized) && teamErrors[key]) {
      return teamErrors[key];
    }
  }

  if (isTechnicalMessage(normalized)) {
    return teamErrors.generic || t?.common?.somethingWentWrong || "Something went wrong";
  }

  return teamErrors.generic || t?.common?.somethingWentWrong || "Something went wrong";
}
