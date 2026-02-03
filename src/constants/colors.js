/**
 * Centralized UI color constants
 * Control all selection and active state colors from this single file
 */

// Selection/Active state colors
export const SELECTION_COLORS = {
  // Background color for selected items (light purple with opacity)
  BG: "bg-[#E2DBFF]/10",
  
  // Background color for active/selected items (solid purple)
  ACTIVE_BG: "bg-[#E2DBFF]",
  
  // Text color for selected items
  TEXT: "text-primary",
  
  // Border color for selected items  
  BORDER: "border-primary",
  
  // Combined classes for common selected state
  SELECTED: "bg-[#E2DBFF] text-primary",
  
  // Combined classes for selected state with shadow (light background)
  SELECTED_WITH_SHADOW: "bg-[#E2DBFF]/10 text-primary border-primary shadow-lg",
  
  // Combined classes for selected state with shadow (solid background - for sidebar)
  SELECTED_WITH_SHADOW_SOLID: "bg-[#E2DBFF] text-primary border-primary shadow-lg",
};

// Hover states for selection
export const SELECTION_HOVER = {
  BG: "hover:bg-[#E2DBFF]/20",
  TEXT: "hover:text-primary",
};

// Combined selection classes helper
export const getSelectionClasses = (isSelected, withShadow = false) => {
  if (!isSelected) return "";
  return withShadow ? SELECTION_COLORS.SELECTED_WITH_SHADOW : SELECTION_COLORS.SELECTED;
};
