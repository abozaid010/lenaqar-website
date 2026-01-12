/**
 * Phone Number Utilities
 * 
 * Helper functions for phone number operations including:
 * - Formatting phone numbers for WhatsApp
 * - Removing country codes
 * - Copying to clipboard
 * - Opening WhatsApp
 */

/**
 * Formats a phone number for WhatsApp URL
 * Removes spaces, dashes, parentheses, and dots
 * Handles international prefixes (00, +)
 * 
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} WhatsApp URL (e.g., "https://wa.me/201205230618") or empty string if invalid
 * 
 * @example
 * formatPhoneForWhatsApp("+20 120 523 0618") // "https://wa.me/201205230618"
 * formatPhoneForWhatsApp("00201205230618") // "https://wa.me/201205230618"
 */
export function formatPhoneForWhatsApp(phoneNumber) {
  if (!phoneNumber) return "";
  
  let cleaned = String(phoneNumber).trim().replace(/[\s\-\(\)\.]/g, "");
  
  // Remove international prefix (00)
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.slice(2);
  }
  
  // Remove plus sign
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }
  
  // Extract only digits
  const digitsOnly = cleaned.replace(/\D/g, "");
  
  return digitsOnly ? `https://wa.me/${digitsOnly}` : "";
}

/**
 * Removes country code from phone number
 * Specifically handles Egypt country code (+20, 0020, 20)
 * 
 * @param {string} phoneNumber - The phone number to process
 * @returns {string} Phone number without country code
 * 
 * @example
 * removeCountryCode("+201205230618") // "01205230618"
 * removeCountryCode("00201205230618") // "01205230618"
 * removeCountryCode("201205230618") // "01205230618"
 */
export function removeCountryCode(phoneNumber) {
  if (!phoneNumber) return "";
  
  let cleaned = String(phoneNumber).trim().replace(/[\s\-\(\)\.]/g, "");
  
  // Remove +20 (Egypt country code)
  if (cleaned.startsWith("+20")) {
    return cleaned.slice(3);
  }
  
  // Remove 0020 (Egypt country code with 00 prefix)
  if (cleaned.startsWith("0020")) {
    return cleaned.slice(4);
  }
  
  // Remove 20 (if it starts with 20 and has more digits, likely country code)
  if (cleaned.startsWith("20") && cleaned.length > 10) {
    return cleaned.slice(2);
  }
  
  return cleaned;
}

/**
 * Copies text to clipboard with fallback for older browsers
 * 
 * @param {string} text - The text to copy
 * @param {Function} onSuccess - Optional success callback
 * @param {Function} onError - Optional error callback
 * @returns {Promise<boolean>} True if successful, false otherwise
 * 
 * @example
 * await copyToClipboard("01205230618", 
 *   () => toast.success("Copied!"),
 *   () => toast.error("Failed to copy")
 * );
 */
export async function copyToClipboard(text, onSuccess, onError) {
  if (!text) {
    if (onError) onError("No text provided");
    return false;
  }

  try {
    // Modern clipboard API
    await navigator.clipboard.writeText(text);
    if (onSuccess) onSuccess();
    return true;
  } catch (err) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      
      if (successful) {
        if (onSuccess) onSuccess();
        return true;
      } else {
        if (onError) onError("Copy command failed");
        return false;
      }
    } catch (fallbackErr) {
      if (onError) onError(fallbackErr.message || "Failed to copy");
      return false;
    }
  }
}

/**
 * Copies phone number to clipboard without country code
 * 
 * @param {string} phoneNumber - The phone number to copy
 * @param {Function} onSuccess - Optional success callback
 * @param {Function} onError - Optional error callback
 * @returns {Promise<boolean>} True if successful, false otherwise
 * 
 * @example
 * await copyPhoneNumber("+201205230618",
 *   () => toast.success("Phone number copied"),
 *   () => toast.error("Failed to copy")
 * );
 */
export async function copyPhoneNumber(phoneNumber, onSuccess, onError) {
  const phoneWithoutCountryCode = removeCountryCode(phoneNumber);
  
  if (!phoneWithoutCountryCode) {
    if (onError) onError("Invalid phone number");
    return false;
  }
  
  return copyToClipboard(phoneWithoutCountryCode, onSuccess, onError);
}

/**
 * Opens WhatsApp with the given phone number
 * 
 * @param {string} phoneNumber - The phone number to open WhatsApp with
 * @param {Object} options - Optional configuration
 * @param {boolean} options.newTab - Whether to open in new tab (default: true)
 * @param {string} options.target - Target window (default: "_blank")
 * 
 * @example
 * openWhatsApp("+201205230618");
 * openWhatsApp("+201205230618", { newTab: false });
 */
export function openWhatsApp(phoneNumber, options = {}) {
  if (!phoneNumber || phoneNumber.trim() === "") {
    console.warn("openWhatsApp: No phone number provided");
    return;
  }
  
  const whatsappUrl = formatPhoneForWhatsApp(phoneNumber);
  
  if (!whatsappUrl) {
    console.warn("openWhatsApp: Invalid phone number format");
    return;
  }
  
  const { newTab = true, target = "_blank" } = options;
  
  if (newTab) {
    window.open(whatsappUrl, target, "noopener,noreferrer");
  } else {
    window.location.href = whatsappUrl;
  }
}

/**
 * Event handler for opening WhatsApp (stops event propagation)
 * Useful for click handlers in tables or lists
 * 
 * @param {Event} e - The click event
 * @param {string} phoneNumber - The phone number to open WhatsApp with
 * @param {Object} options - Optional configuration (see openWhatsApp)
 * 
 * @example
 * <button onClick={(e) => handleOpenWhatsApp(e, "+201205230618")}>
 *   Open WhatsApp
 * </button>
 */
export function handleOpenWhatsApp(e, phoneNumber, options = {}) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  openWhatsApp(phoneNumber, options);
}

/**
 * Event handler for copying phone number (stops event propagation)
 * Useful for click handlers in tables or lists
 * 
 * @param {Event} e - The click event
 * @param {string} phoneNumber - The phone number to copy
 * @param {Function} onSuccess - Optional success callback
 * @param {Function} onError - Optional error callback
 * 
 * @example
 * <span onClick={(e) => handleCopyPhoneNumber(e, "+201205230618",
 *   () => toast.success("Copied!"),
 *   () => toast.error("Failed")
 * )}>
 *   +201205230618
 * </span>
 */
export async function handleCopyPhoneNumber(e, phoneNumber, onSuccess, onError) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  return copyPhoneNumber(phoneNumber, onSuccess, onError);
}
