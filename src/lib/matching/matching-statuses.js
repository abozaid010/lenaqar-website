/** Lead match result statuses for the Matching session (session-only). */
export const MATCHING_STATUS = {
  READY: "Ready",
  MISSING_REQUIREMENT: "MissingRequirement",
  MISSING_PRICE: "MissingPrice",
  NO_MATCHING_UNITS: "NoMatchingUnits",
  READY_TO_SEND: "ReadyToSend",
  SENT: "Sent",
  FAILED: "Failed",
  REQUIREMENT_ERROR: "RequirementError",
  UNITS_ERROR: "UnitsError",
};

/** Statuses that can appear in the WhatsApp send preview. */
export function isSendEligibleStatus(status) {
  return (
    status === MATCHING_STATUS.READY ||
    status === MATCHING_STATUS.READY_TO_SEND
  );
}

export function matchingStatusTranslateKey(status) {
  switch (status) {
    case MATCHING_STATUS.READY:
      return "matching.status.ready";
    case MATCHING_STATUS.MISSING_REQUIREMENT:
      return "matching.status.missingRequirement";
    case MATCHING_STATUS.MISSING_PRICE:
      return "matching.status.missingPrice";
    case MATCHING_STATUS.NO_MATCHING_UNITS:
      return "matching.status.noMatchingUnits";
    case MATCHING_STATUS.READY_TO_SEND:
      return "matching.status.readyToSend";
    case MATCHING_STATUS.SENT:
      return "matching.status.sent";
    case MATCHING_STATUS.FAILED:
      return "matching.status.failed";
    case MATCHING_STATUS.REQUIREMENT_ERROR:
      return "matching.status.requirementError";
    case MATCHING_STATUS.UNITS_ERROR:
      return "matching.status.unitsError";
    default:
      return "matching.status.ready";
  }
}
