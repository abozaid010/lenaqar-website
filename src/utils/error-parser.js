/**
 * Utility functions for parsing error messages from API responses
 * Specifically handles Python dict string representations in error messages
 */

/**
 * Maps error messages to translation keys
 * This allows us to use translations from locale files instead of hardcoding messages
 */
const ERROR_TYPE_MAPPINGS = {
  // Arabic text validation
  'Text must contain only Arabic letters, Arabic digits, English digits, and spaces': 'arabicTextOnly',
  'text must contain only arabic letters, arabic digits, english digits, and spaces': 'arabicTextOnly',
  
  // English text validation
  'Text must contain only English letters, digits, and spaces': 'englishTextOnly',
  'text must contain only english letters, digits, and spaces': 'englishTextOnly',
};

/**
 * Parses validation errors from API responses
 * Extracts field name and maps error message to translation key
 * @param {string} errorMessage - The error message string from API
 * @returns {object} - Object with field names as keys and translation keys as values
 */
export function parseValidationErrors(errorMessage) {
  if (!errorMessage || typeof errorMessage !== 'string') {
    return {};
  }

  const errors = {};
  
  try {
    // Pattern: "Validation error: body -> field_name (error_type): Error message"
    const errorPattern = /Validation error:\s*body\s*->\s*(\w+)\s*\([^)]+\):\s*(.+?)(?=\n|$|Validation error:)/gi;
    
    let match;
    while ((match = errorPattern.exec(errorMessage)) !== null) {
      const fieldName = match[1];
      let errorMsg = match[2].trim();
      
      // Remove "Value error, " prefix if present
      errorMsg = errorMsg.replace(/^Value error,\s*/i, '').trim();
      
      // Map error message to translation key
      const translationKey = ERROR_TYPE_MAPPINGS[errorMsg] || null;
      
      if (translationKey) {
        // Return translation key - component will use it to get message from locale
        errors[fieldName] = translationKey;
      } else {
        // Fallback: use the error message as-is (capitalized)
        errors[fieldName] = errorMsg.charAt(0).toUpperCase() + errorMsg.slice(1);
      }
    }
  } catch (error) {
    console.warn('[parseValidationErrors] Failed to parse error message:', errorMessage, error);
  }
  
  return errors;
}

/**
 * Extracts a balanced brace structure starting from a given position
 * @param {string} str - The string to search in
 * @param {number} startPos - Starting position (should be at opening brace)
 * @returns {string|null} - The extracted brace structure or null
 */
function extractBalancedBraces(str, startPos) {
  if (str[startPos] !== '{') {
    return null;
  }
  
  let depth = 0;
  let inString = false;
  let stringChar = null;
  let escapeNext = false;
  let endPos = startPos;
  
  for (let i = startPos; i < str.length; i++) {
    const char = str[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
      continue;
    }
    
    if (inString && char === stringChar) {
      inString = false;
      stringChar = null;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          endPos = i;
          break;
        }
      }
    }
  }
  
  if (depth === 0) {
    return str.substring(startPos, endPos + 1);
  }
  
  return null;
}

/**
 * Parses Python dict string representation to extract existing_project_data
 * Handles format: "400: {'error_message': '...', 'existing_project_data': {...}}"
 * @param {string} errorMessage - The error message string from API
 * @returns {object|null} - Parsed existing_project_data or null if not found
 */
export function parseExistingProjectData(errorMessage) {
  if (!errorMessage || typeof errorMessage !== 'string') {
    return null;
  }

  try {
    // Extract the dict part after "400: " or similar status prefix
    // Match from the first { to the last } to capture nested structures
    const dictMatch = errorMessage.match(/:\s*(\{.*\})/s);
    if (!dictMatch || !dictMatch[1]) {
      console.warn('[parseExistingProjectData] No dict found in error message');
      return null;
    }

    let dictString = dictMatch[1].trim();
    
    // More robust Python dict to JSON conversion
    // Strategy: Find the existing_project_data key and extract its value directly
    
    // First, try to find existing_project_data using regex
    // Pattern: 'existing_project_data': {...} or "existing_project_data": {...}
    // Handle both single and double quotes for the key
    // Use a more robust approach: find the key and then match balanced braces
    let existingDataMatch = null;
    
    // Try pattern with single quotes for key
    const singleQuoteMatch = dictString.match(/'existing_project_data'\s*:\s*(\{)/);
    if (singleQuoteMatch) {
      const startPos = singleQuoteMatch.index + singleQuoteMatch[0].length - 1;
      const extracted = extractBalancedBraces(dictString, startPos);
      if (extracted) {
        existingDataMatch = { 1: extracted };
      }
    }
    
    // Try pattern with double quotes for key if first didn't work
    if (!existingDataMatch) {
      const doubleQuoteMatch = dictString.match(/"existing_project_data"\s*:\s*(\{)/);
      if (doubleQuoteMatch) {
        const startPos = doubleQuoteMatch.index + doubleQuoteMatch[0].length - 1;
        const extracted = extractBalancedBraces(dictString, startPos);
        if (extracted) {
          existingDataMatch = { 1: extracted };
        }
      }
    }
    
    if (existingDataMatch && existingDataMatch[1]) {
      // Extract just the existing_project_data value
      let dataString = existingDataMatch[1].trim();
      
      console.log('[parseExistingProjectData] Extracted data string length:', dataString.length);
      console.log('[parseExistingProjectData] First 200 chars:', dataString.substring(0, 200));
      
      // Convert Python dict to JSON
      // Replace Python-specific values
      // Handle DatetimeWithNanoseconds and other Python objects
      // Remove Python datetime objects (they're not valid JSON)
      dataString = dataString
        .replace(/DatetimeWithNanoseconds\([^)]*\)/g, 'null') // Remove datetime objects
        .replace(/None/g, 'null')
        .replace(/True/g, 'true')
        .replace(/False/g, 'false');
      
      // Handle mixed quotes - the error message may have double quotes inside single-quoted strings
      // Strategy: Convert all single quotes to double quotes, but preserve already-double-quoted strings
      // First, protect double-quoted strings
      const doubleQuotedStrings = [];
      dataString = dataString.replace(/"([^"\\]|\\.)*"/g, (match) => {
        const placeholder = `__DOUBLE_QUOTED_${doubleQuotedStrings.length}__`;
        doubleQuotedStrings.push(match);
        return placeholder;
      });
      
      // Now convert single quotes to double quotes
      dataString = dataString.replace(/\\'/g, '__ESCAPED_SINGLE_QUOTE__');
      dataString = dataString.replace(/'/g, '"');
      dataString = dataString.replace(/__ESCAPED_SINGLE_QUOTE__/g, '\\"');
      
      // Restore double-quoted strings
      doubleQuotedStrings.forEach((str, index) => {
        dataString = dataString.replace(`__DOUBLE_QUOTED_${index}__`, str);
      });
      
      // Handle unquoted keys (Python allows this)
      dataString = dataString.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      
      try {
        const parsed = JSON.parse(dataString);
        console.log('[parseExistingProjectData] Successfully parsed existing_project_data, keys:', Object.keys(parsed));
        return parsed;
      } catch (parseError) {
        console.warn('[parseExistingProjectData] Failed to parse extracted data:', {
          error: parseError.message,
          position: parseError.message.match(/position (\d+)/)?.[1],
          dataPreview: dataString.substring(0, 500),
          dataLength: dataString.length,
        });
        // Fallback: try parsing the whole dict
        const fallbackResult = parseFullDict(dictString);
        if (fallbackResult) {
          console.log('[parseExistingProjectData] Fallback parsing succeeded');
        }
        return fallbackResult;
      }
    } else {
      console.warn('[parseExistingProjectData] Could not find existing_project_data in dict string');
    }
    
    // Fallback: try parsing the whole dict
    return parseFullDict(dictString);
  } catch (error) {
    console.warn('[parseExistingProjectData] Failed to parse error message:', errorMessage, error);
    return null;
  }
}

/**
 * Fallback function to parse the full dict string
 */
function parseFullDict(dictString) {
  try {
    // Convert Python dict to JSON
    let jsonString = dictString
      .replace(/DatetimeWithNanoseconds\([^)]*\)/g, 'null') // Remove datetime objects
      .replace(/None/g, 'null')
      .replace(/True/g, 'true')
      .replace(/False/g, 'false');
    
    // Handle escaped quotes
    jsonString = jsonString.replace(/\\'/g, '__ESCAPED_SINGLE_QUOTE__');
    jsonString = jsonString.replace(/'/g, '"');
    jsonString = jsonString.replace(/__ESCAPED_SINGLE_QUOTE__/g, '\\"');
    
    // Handle unquoted keys
    jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    const parsed = JSON.parse(jsonString);
    
    if (parsed && parsed.existing_project_data) {
      return parsed.existing_project_data;
    }
    
    return null;
  } catch (error) {
    console.warn('[parseFullDict] Failed to parse dict:', error);
    return null;
  }
}
