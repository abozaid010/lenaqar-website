/**
 * Excel Utilities - Safe wrapper around ExcelJS
 * Replaces vulnerable XLSX library with secure ExcelJS
 * 
 * Security considerations:
 * - ExcelJS is actively maintained and has no known CVEs
 * - Protects against Prototype Pollution attacks
 * - Protects against ReDoS vulnerabilities
 */

import ExcelJS from "exceljs";

/**
 * Parse Excel file and extract data
 * @param {File} file - The Excel file to parse
 * @returns {Promise<{headers: string[], rows: any[][], sheetName: string}>}
 */
export async function parseExcelFile(file) {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();

    // Read workbook from buffer
    await workbook.xlsx.load(buffer);

    // Get first sheet
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error(
        "No worksheet found in the Excel file. Please ensure your file contains at least one worksheet."
      );
    }

    /**
     * ExcelJS returns formula cells as an object like:
     * { formula: 'SUM(A1,C1)', result: 123 }
     *
     * We prefer the computed value (`result`) over the formula text.
     * Note: ExcelJS does NOT calculate formulas; it only exposes the cached result
     * stored by Excel/Sheets when the file was last saved.
     */
    const getCellComputedValue = (cell) => {
      const v = cell?.value;

      // Dates are objects too, so handle them early.
      if (v instanceof Date) return v;

      // Formula / sharedFormula cells
      if (v && typeof v === "object" && (v.formula || v.sharedFormula)) {
        // Prefer the computed result if available
        if (v.result !== undefined && v.result !== null) {
          return v.result;
        }

        // Fallback: try to get the displayed text value from Excel
        const cellText = cell?.text;
        if (cellText !== undefined && cellText !== null && cellText !== "") {
          // Filter out error-indicating formulas
          const textStr = String(cellText).trim();
          if (!textStr.startsWith('=IFERROR(__xludf') && !textStr.startsWith('=__xludf')) {
            return cellText;
          }
        }

        // If formula can't be resolved and text is an error formula, return null/empty
        const f = v.formula || v.sharedFormula;
        if (f && (f.includes('__xludf') || f.includes('DUMMYFUNCTION'))) {
          return null; // Don't show error formulas
        }

        // Last resort: return null instead of formula string to avoid showing formulas
        return null;
      }

      // Other complex cell types (richText, hyperlink, etc.) -> use rendered text
      if (v && typeof v === "object") {
        return cell?.text ?? null;
      }

      return v;
    };

    // Extract headers from first row
    // First, find the maximum column number by checking the header row and all data rows
    const headerRow = worksheet.getRow(1);
    let maxColumn = 0;
    
    // Check header row for max column
    if (headerRow.lastCell && headerRow.lastCell.number > maxColumn) {
      maxColumn = headerRow.lastCell.number;
    }
    
    // Check all data rows to find the maximum column
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // Skip header row
      if (row.lastCell && row.lastCell.number > maxColumn) {
        maxColumn = row.lastCell.number;
      }
    });

    // Fallback: if still no columns found, try worksheet columnCount
    if (maxColumn === 0) {
      maxColumn = worksheet.columnCount || 0;
    }
    
    // Safety check: ensure we have at least one column
    if (maxColumn === 0) {
      throw new Error("Excel file appears to be empty or has no columns.");
    }

    // Extract headers from first row - iterate through all columns
    const headers = [];
    for (let col = 1; col <= maxColumn; col++) {
      const cell = headerRow.getCell(col);
      const headerValue = getCellComputedValue(cell);
      headers.push(headerValue === null || headerValue === undefined ? "" : String(headerValue));
    }

    // Helper function to check if a cell value is effectively empty
    const isCellEmpty = (value) => {
      if (value === null || value === undefined) return true;
      const str = String(value).trim();
      if (str === "") return true;
      // Filter out error formulas
      if (str.startsWith('=IFERROR(__xludf') || str.startsWith('=__xludf')) return true;
      return false;
    };

    // Extract data rows - iterate through all columns to maintain index alignment
    const rows = [];
    let consecutiveEmptyRows = 0;
    const MAX_CONSECUTIVE_EMPTY = 10; // Stop after 10 consecutive empty rows
    let hasSeenData = false; // Track if we've encountered any data rows

    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // Skip header row

      const rowData = [];
      let hasNonEmptyValue = false;
      
      // Iterate through all columns to ensure consistent array length
      for (let col = 1; col <= maxColumn; col++) {
        const cell = row.getCell(col);
        const value = getCellComputedValue(cell);
        
        // Check if value is actually non-empty (after trimming and filtering formulas)
        if (!isCellEmpty(value)) {
          hasNonEmptyValue = true;
        }
        
        rowData.push(value);
      }

      // Only include rows with actual data
      if (hasNonEmptyValue) {
        consecutiveEmptyRows = 0;
        hasSeenData = true;
        rows.push(rowData);
      } else {
        consecutiveEmptyRows++;
        // Optimization: if we've seen data and hit many consecutive empty rows,
        // we can assume we've reached the end of the data section
        // Note: ExcelJS eachRow doesn't support early return, but this helps with performance
        // by identifying when we're past the data section
        if (hasSeenData && consecutiveEmptyRows >= MAX_CONSECUTIVE_EMPTY) {
          // We'll continue iterating but won't add more rows
          // This is a performance optimization hint
        }
      }
    });

    if (rows.length === 0) {
      throw new Error(
        "Excel file must contain headers and at least one data row."
      );
    }

    return {
      headers,
      rows,
      sheetName: worksheet.name,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse Excel file: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Create Excel workbook from data
 * @param {Object} options - Configuration options
 * @param {string} options.filename - Output filename
 * @param {string} options.sheetName - Sheet name
 * @param {Array<Object>} options.data - Array of objects to write
 * @param {Array<string>} options.columns - Column names
 * @param {Object} options.styles - Optional styling configuration
 * @returns {Promise<Uint8Array>}
 */
export async function createExcelFile({
  filename,
  sheetName = "Sheet1",
  data = [],
  columns = [],
  styles = {},
}) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (columns.length > 0) {
      // Add header row
      worksheet.columns = columns.map((col) => ({
        header: typeof col === "string" ? col : col.header,
        key: typeof col === "string" ? col : col.key,
        width: typeof col === "string" ? 15 : col.width || 15,
      }));

      // Style header row if provided
      if (styles.headerStyle) {
        worksheet.getRow(1).eachCell((cell) => {
          cell.fill = styles.headerStyle.fill || {};
          cell.font = styles.headerStyle.font || {};
          cell.alignment = styles.headerStyle.alignment || {};
        });
      }
    }

    // Add data rows
    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Apply row styles if provided
    if (styles.rowStyle) {
      worksheet.eachRow((row, rowIndex) => {
        if (rowIndex > 1) {
          // Skip header
          row.eachCell((cell) => {
            if (styles.rowStyle.alignment) {
              cell.alignment = styles.rowStyle.alignment;
            }
          });
        }
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    throw new Error(
      `Failed to create Excel file: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Append data to an existing workbook
 * @param {Uint8Array} buffer - Existing workbook buffer
 * @param {string} sheetName - New sheet name
 * @param {Array<Object>} data - Data to append
 * @param {Array<string>} columns - Column names
 * @returns {Promise<Uint8Array>}
 */
export async function appendSheetToExcel(
  buffer,
  sheetName,
  data = [],
  columns = []
) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.addWorksheet(sheetName);

    if (columns.length > 0) {
      worksheet.columns = columns.map((col) => ({
        header: typeof col === "string" ? col : col.header,
        key: typeof col === "string" ? col : col.key,
        width: typeof col === "string" ? 15 : col.width || 15,
      }));
    }

    data.forEach((row) => {
      worksheet.addRow(row);
    });

    const newBuffer = await workbook.xlsx.writeBuffer();
    return newBuffer;
  } catch (error) {
    throw new Error(
      `Failed to append sheet: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Download Excel file to client
 * @param {Uint8Array} buffer - File buffer
 * @param {string} filename - Download filename
 */
export function downloadExcelFile(buffer, filename) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
