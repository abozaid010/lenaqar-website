// Sample test data for testing the Unit Details Page implementation
export const mockRawUnit = {
  is_primary: true,
  images: [
    {
      fileId: "public_2d0c1a8c",
      url: "https://api.lenaai.net/gcs/public_2d0c1a8c",
      source: "project"
    },
    {
      fileId: "public_2d0c1a8d",
      url: "https://api.lenaai.net/gcs/public_2d0c1a8d",
      source: "project"
    }
  ],
  project_ar: "PX",
  phase: "px-phase 1",
  clientId: "public",
  city: "6 october",
  downPayment: 1142800,
  dataSource: "import_v2",
  installment_years: 10,
  landArea: 129.86,
  buildingType: "apartment",
  bathroomCount: 2,
  unitTitle: "px - apartment - 3BR - Unit-bcd2bf13",
  developer_id: "300bdeee-569a-4a3e-983b-7f6911b36413",
  project: "px",
  garageArea: 0,
  deliveryDate: "2028-06-30T00:00:00Z",
  purpose: "sell",
  installment_amount_yearly: 2171320,
  clientName: "public data",
  code: "H7sTHDFd",
  project_id: "11869180-ace4-4c21-a4d5-bed54bacc1b3",
  updatedAt: "2026-04-06T13:37:33.971301Z",
  totalPrice: 22856000,
  gardenSize: 69.96,
  district: "new october",
  roomsCount: 3,
  unitId: "000245eb-e84d-47df-8679-f91abcd2bf13",
  country: "Egypt",
  furnishing: "unfurnished",
  roof_area: 0,
  finishing: "semi finished",
  developer: "Palm Hills Developments"
};

export const mockRawUnitMinimal = {
  is_primary: false,
  images: [],
  project_ar: "",
  phase: "",
  clientId: "public",
  city: "",
  downPayment: 0,
  dataSource: "import_v2",
  installment_years: 0,
  landArea: 0,
  buildingType: "",
  bathroomCount: 0,
  unitTitle: "",
  developer_id: "",
  project: "",
  garageArea: 0,
  deliveryDate: "",
  purpose: "",
  installment_amount_yearly: 0,
  clientName: "public data",
  code: "",
  project_id: "",
  updatedAt: "2026-04-06T13:37:33.971301Z",
  totalPrice: 0,
  gardenSize: 0,
  district: "",
  roomsCount: 0,
  unitId: "000245eb-e84d-47df-8679-f91abcd2bf13",
  country: "",
  furnishing: "",
  roof_area: 0,
  finishing: "",
  developer: ""
};

export const mockApiResponse = {
  status: true,
  code: 200,
  message: "Operation completed successfully",
  data: {
    units: [mockRawUnit]
  }
};
