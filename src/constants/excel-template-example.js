/**
 * Excel Template Example Configuration
 * This file contains the column headers and example row data
 * that are displayed in the upload dialog.
 */

export const excelTemplateColumns = [
  // ===== REQUIRED FIELDS (6) =====
  {
    key: "buildingType",
    label: "Building Type",
    is_required: true,
  },
  {
    key: "project",
    label: "Project",
    is_required: true,
  },
  {
    key: "roomsCount",
    label: "Rooms Count",
    is_required: true,
  },
  {
    key: "landArea",
    label: "Total Area",
    is_required: true,
  },
  {
    key: "totalPrice",
    label: "Total Price",
    is_required: true,
  },
  // ===== OPTIONAL FIELDS (11) =====
  {
    key: "finishing",
    label: "Finishing",
    is_required: false,
  },
  {
    key: "deliveryDate",
    label: "Delivery Date",
    is_required: false,
  },
  {
    key: "phase",
    label: "Phase",
    is_required: false,
  },
  {
    key: "view",
    label: "View",
    is_required: false,
  },
  {
    key: "unitTitle",
    label: "Unit Title",
    is_required: false,
  },
  {
    key: "floor",
    label: "Floor",
    is_required: false,
  },
  {
    key: "bathroomCount",
    label: "Bathroom Count",
    is_required: false,
  },
  {
    key: "gardenSize",
    label: "Garden Area",
    is_required: false,
  },
  {
    key: "garageArea",
    label: "Garage Area",
    is_required: false,
  },
  {
    key: "model",
    label: "Model / (Design Type)",
    is_required: false,
  },
  {
    key: "city",
    label: "City",
    is_required: false,
  },
  {
    key: "unit_number",
    label: "Unit Number",
    is_required: false,
  },
  {
    key: "building_number",
    label: "Building Number",
    is_required: false,
  },
  {
    key: "roof_area",
    label: "Roof Area",
    is_required: false,
  },
  {
    key: "outdoor_area",
    label: "Outdoor Area",
    is_required: false,
  },
];

export const excelTemplateExampleRow = {
  // Required fields
  buildingType: "apartment",
  project: "madinty",
  roomsCount: "2",
  landArea: "100",
  totalPrice: "1000000",
  // Optional fields
  finishing: "finished",
  deliveryDate: "2025-12-31",
  phase: "Phase 1",
  view: "garden",
  unitTitle: "two bedrooms",
  floor: "1",
  bathroomCount: "2",
  gardenSize: "50",
  garageArea: "20",
  model: "A1",
  furnishing: "furnished",
  city: "cairo",
  unit_number: "101",
  building_number: "B5",
  roof_area: "30",
  outdoor_area: "25",
};

