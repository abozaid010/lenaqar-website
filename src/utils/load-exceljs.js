/**
 * Lazy-load ExcelJS once; subsequent calls reuse the same module promise.
 */

let excelJsPromise = null;

export function loadExcelJS() {
  if (!excelJsPromise) {
    excelJsPromise = import("exceljs").then((mod) => mod.default ?? mod);
  }
  return excelJsPromise;
}
