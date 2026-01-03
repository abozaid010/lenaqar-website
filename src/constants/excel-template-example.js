/**
 * Excel Template Example Configuration
 * This file contains the column headers and example row data
 * that are displayed in the upload dialog.
 */

export const excelTemplateColumns = [
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
    key: "bathroomCount",
    label: "Bathroom Count",
    is_required: false,
  },
  {
    key: "floor",
    label: "Floor",
    is_required: false,
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
    key: "gardenSize",
    label: "Garden Area",
    is_required: false,
  },
  {
    key: "finishing",
    label: "Finishing",
    is_required: true,
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
    key: "downPayment",
    label: "Down Payment",
    is_required: false,
  },
  {
    key: "totalPrice",
    label: "Total Price",
    is_required: true,
  },
  {
    key: "deliveryDate",
    label: "Delivery Date",
    is_required: true,
  },
];

export const excelTemplateExampleRow = {
  buildingType: "apartment",
  project: "madinty",
  view: "garden",
  unitTitle: "two bedrooms",
  bathroomCount: "2",
  floor: "1",
  roomsCount: "2",
  landArea: "100",
  gardenSize: "50",
  finishing: "finished",
  furnishing: "furnished",
  garageArea: "20",
  model: "A1",
  downPayment: "50000",
  totalPrice: "1000000",
  deliveryDate: "2025-12-31",
};

