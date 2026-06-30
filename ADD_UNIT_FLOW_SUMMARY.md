# Add Unit Flow - Technical Summary

## Overview
The "Add Unit" flow is a **multi-step form modal** (3 steps) that allows users to create or edit real estate units (properties) with support for both **Sale** and **Rental** purposes.

---

## UI/UX Flow

### Entry Points
- **Button**: `src/components/ui/unit-forms/add-unit-button.jsx` → Opens modal
- **Modal Component**: `src/components/ui/unit-forms/add-unit-Modal.jsx` (1300+ lines)

### Multi-Step Form (3 Steps)

| Step | Title | Purpose | Purpose-Specific |
|------|-------|---------|------------------|
| 1 | **Basic Details** | Project, building type, area, bedrooms, city, district, etc. | No |
| 2 | **Financial/Rental Details** | Pricing info (sell: price, down payment; rent: daily/weekly/monthly rates) | **Yes** |
| 3 | **Images & Info** | Upload images, video, finishing, furnishing, extra notes | No |

### Step 1: Basic Details
**Component**: `BasicDetailsStep` (`src/components/ui/unit-forms/basic-details-step.jsx`)

**Fields**:
- `unitTitle` (string) - Unit name/description
- `buildingType` (dropdown) - apartment, villa, townhouse, penthouse, studio, office, garage, etc.
- `project` (searchable select) - Compound/project name
- `city` (searchable select) - Auto-fills from project if selected
- `district` (searchable select) - Auto-fills from city
- `developer` (autocomplete) - Developer name
- `purpose` (required) - **"sell"** or **"rent"** (controls step 2)
- `landArea` (number) - Total area in m²
- `roomsCount` (number) - Bedrooms (skip for office type)
- `bathroomCount` (number) - Bathrooms (skip for office type)
- `floor` (number) - Floor level
- `view` (dropdown) - View type (e.g., garden, street, sea)
- `phase` (string) - Project phase
- `code` (string) - Unit code
- `model` (string) - Unit model
- `deliveryStatus` (string) - Status (e.g., ready, under_construction)
- `gardenSize`, `gardeArea`, `outdoor_area`, `roof_area` (numbers) - Optional area details

**Validation**:
- ✓ Project (required)
- ✓ Building Type (required)
- ✓ Purpose (required)
- ✓ landArea (required, 0 is valid)
- ✓ roomsCount, bathroomCount (required if buildingType ≠ "office")

---

### Step 2A: Sale Details (Purpose = "Sell")
**Component**: `SaleDetailsStep` (`src/components/ui/unit-forms/sale-details-step.jsx`)

**Fields**:
- `totalPrice` (number, EGP) - Asking price
- `downPayment` (number, EGP) - Initial payment
- `deliveryDate` (date) - Handover date
- `paid_amount` (number) - Already paid
- `remaining_amount` (number) - Still to pay
- `installment_years` (number) - Payment plan duration
- `over_price` (number) - Price premium (if any)
- `owner_mobile` (string) - **Required for brokers adding units**; optional for own units
- `owner_name` (string) - Owner name (broker context only)

**Validation**:
- ✓ totalPrice (required, > 0)
- ✓ deliveryDate (required, valid date within 30 years past to 10 years future)
- ✓ installment_years (if provided, must be > 0)
- ✓ owner_mobile (required if broker adding unit)

---

### Step 2B: Rental Details (Purpose = "Rent")
**Component**: `RentalDetailsStep` (`src/components/ui/unit-forms/rental-details-step.jsx`)

**Fields**:
- `availabilityDate` (date) - Rental availability date (default: today)
- `rentDurationType` (object) - Price structure by duration:
  ```javascript
  {
    daily: { price, securityDeposit, cleaningFee, serviceFee, currency: "EGP" },
    weekly: { price, securityDeposit, cleaningFee, serviceFee, currency: "EGP" },
    monthly: { price, securityDeposit, cleaningFee, serviceFee, currency: "EGP" }
  }
  ```
- `amenities` (array) - Selected amenities
- `owner_mobile` (string) - **Required for brokers**
- `owner_name` (string) - Owner name (broker context only)

**Validation**:
- ✓ At least one duration type must have price > 0
- ✓ owner_mobile (required if broker adding unit)

---

### Step 3: Images & Info
**Component**: `ImagesStep` (`src/components/ui/unit-forms/images-step.jsx`)

**Fields**:
- `images` (array of strings) - Uploaded image URLs (max: 10 images)
- `video` (string) - Video URL (optional)
- `finishing` (dropdown) - Finishing level (luxury, semi-finish, etc.) - **Required**
- `furnishing` (dropdown) - Furnishing level (furnished, unfurnished, etc.) - **Required for rent only**
- `notes` (text) - Additional notes
- `visibility` (enum) - "visible", "pending_approval", "hidden" (controls approval workflow)

**Validation**:
- ✓ finishing (required)
- ✓ furnishing (required for rental only)
- ✓ images.length ≤ 10

---

## Data Loading Strategy

### 1. Projects (Compounds)
**Endpoint**: `GET /projectsv2/all_projects_names`

**Hook**: `useProjectsNames(isPublic = false)` (`src/hooks/use-admin-shared-data.js`)

**Response Structure**:
```javascript
[
  {
    id: string | number,
    en_name: string,           // Display name (English)
    ar_name: string,           // Display name (Arabic)
    city: string,              // City name
    district: string,          // District name
    developer_id: string,      // Associated developer
    developer_name: string,    // Developer display name
    developer_ar_name: string, // Developer Arabic name
    // ... other fields
  }
]
```

**Caching**: 5 minutes (React Query `staleTime`)

**Usage in Form**:
- User types in "Project" field → autocomplete suggests matching projects
- When project is selected → auto-populates city, district, developer
- Projects list can be searched/filtered

---

### 2. Developers
**Endpoint**: `GET /developers/v1/get_all_names`

**Hook**: `useDeveloperNames(clientId)` (`src/hooks/use-admin-shared-data.js`)

**Response Structure**:
```javascript
[
  {
    id: string,          // Developer ID
    en_name: string,     // English name
    ar_name: string,     // Arabic name
    description: string, // Optional
    // ... other fields
  }
]
```

**Caching**: 15 minutes (React Query `staleTime`)

**Usage in Form**:
- Dropdown in Step 1 for developer selection
- Auto-filled from project if project is selected

---

### 3. Cities & Districts
**Source**: **Static JSON file** (`/cities_list.json` in public folder)

**Manager**: `CityManager` singleton (`src/utils/city_manager.js`)

**Loading**:
```javascript
// Loads once at app lifetime
const cityManager = CityManager.getInstance();
await cityManager.initializeData(); // Fetches /cities_list.json
```

**Data Structure**:
```javascript
// /cities_list.json contains:
[
  {
    id: number,
    en_name: string,       // e.g., "Cairo"
    ar_name: string,       // e.g., "القاهرة"
    districts: [
      {
        en_name: string,   // e.g., "Maadi"
        ar_name: string,   // e.g., "المعادي"
        aliases: [string]  // Alternative names
      }
    ]
  }
]
```

**Normalization**:
- City values sent to API: **lowercase en_name** (e.g., "cairo" not "Cairo")
- District values sent to API: **lowercase en_name** (e.g., "maadi" not "Maadi")
- `CityManager.normalizeCityValueAsync(rawValue)` → returns canonical lowercase en_name
- `CityManager.normalizeDistrictValueAsync(rawValue, city)` → returns canonical lowercase en_name

**Usage in Form**:
- Step 1: User selects city → district dropdown filters to matching city's districts
- If project is selected → city/district auto-filled (then normalized to API format)
- On save: city/district normalized to lowercase before sending to API

---

## Form Data Structure

### Common Form Data (All Steps)
```javascript
{
  unitId: string,              // UUID, generated on add; fixed on edit
  clientId: string,            // From auth token (source of truth)
  clientName: string,          // From auth
  country: string,             // Default: "Egypt"
  dataSource: string,          // Default: "website"
  buildingType: string,        // apartment, villa, etc.
  purpose: string,             // "sell" or "rent"
  project: string,             // Project name (en_name)
  project_ar: string,          // Project Arabic name (ar_name)
  project_id: string,          // Project ID
  city: string,                // Canonical lowercase en_name
  district: string,            // Canonical lowercase en_name
  developer: string,           // Developer name
  developer_id: string,        // Developer ID
  unitTitle: string,           // Display title
  bathroomCount: number,       // 0 or positive
  floor: number,               // 0 or positive
  roomsCount: number,          // 0 or positive (0 for office)
  landArea: number,            // Square meters
  gardenSize: number,
  garageArea: number,
  outdoor_area: number,
  roof_area: number,
  finishing: string,           // luxury, semi-finish, etc. (required step 3)
  furnishing: string,          // furnished, unfurnished, etc.
  phase: string,               // Project phase
  code: string,                // Unit code
  model: string,               // Unit model
  deliveryStatus: string,      // ready, under_construction, etc.
  view: string,                // garden, street, sea, etc.
  images: string[],            // Image URLs
  video: string,               // Video URL
  notes: string,               // Extra notes
  visibility: string,          // "visible", "pending_approval", "hidden"
  // Owner fields (shown only for brokers or new units)
  owner_name: string,          // (broker only)
  owner_mobile: string,        // (broker only or required for new units)
}
```

### Sale-Specific Data
```javascript
{
  totalPrice: number,          // Required, in EGP
  downPayment: number,         // Optional
  deliveryDate: string,        // ISO date string (YYYY-MM-DD)
  paid_amount: number,         // Optional
  remaining_amount: number,    // Optional
  installment_years: number,   // Optional, payment plan duration
  over_price: number,          // Optional
}
```

### Rental-Specific Data
```javascript
{
  availabilityDate: string,    // ISO date string (YYYY-MM-DD)
  rentDurationType: {
    daily: {
      price: number,
      securityDeposit: number,
      cleaningFee: number,
      serviceFee: number,
      currency: "EGP"
    },
    weekly: { /* same structure */ },
    monthly: { /* same structure */ }
  },
  amenities: string[]          // Selected amenities
}
```

---

## API Endpoints Summary

### Create Unit
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/units/v1/add-sale` | POST | Add rental unit | ✓ |
| `/units/v1/add-rent` | POST | Add for-sale unit | ✓ |

**Request**: Full unit data object (merge of common + purpose-specific data)

**Response**:
```javascript
{
  success: true,           // or status: true, or code: 200
  message: "Unit added",
  data: { /* unit data */ }
}
```

---

### Update Unit
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/units/v1/update-sale` | POST | Update sale unit | ✓ |
| `/units/v1/update-rent` | POST | Update rental unit | ✓ |

**Request**: Full unit data with `unitId` (required for identifying which unit to update)

**Response**: Same as add

---

### Fetch Projects
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/projectsv2/all_projects_names` | GET | Lightweight project list (names only) | ✓ |
| `/projectsv2/all_projects_names?public=true` | GET | Public projects (no auth) | ✗ |

**Response**:
```javascript
[
  {
    id: number | string,
    en_name: string,
    ar_name: string,
    city: string,
    district: string,
    developer_id: string,
    developer_name: string,
    // ... other fields
  }
]
```

---

### Fetch Developers
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/developers/v1/get_all_names` | GET | Developer autocomplete list | ✓ |

**Response**:
```javascript
[
  {
    id: string,
    en_name: string,
    ar_name: string,
    description: string,
    // ... other fields
  }
]
```

---

### Extract Unit from Text
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/units/extract-from-text` | POST | AI/NLP extraction of unit fields from text | ✓ |

**Request**:
```javascript
{
  text: string  // Raw text containing unit details
}
```

**Response**:
```javascript
{
  success: true,
  data: {
    extracted_data: { /* partial unit object */ }
    // OR
    extracted_units: [{ /* unit 1 */ }, { /* unit 2 */ }]
  }
}
```

---

### Delete Unit
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/units/delete?unit_id={id}` | DELETE | Remove unit from system | ✓ |

**Response**:
```javascript
{
  success: true,
  message: "Unit deleted"
}
```

---

### Fetch Cities (Static)
| Source | Format | Auth |
|--------|--------|------|
| `/cities_list.json` (public folder) | JSON array | ✗ |

**Structure**:
```javascript
[
  {
    id: number,
    en_name: string,
    ar_name: string,
    districts: [
      { en_name: string, ar_name: string, aliases: string[] }
    ]
  }
]
```

---

## Integration for Other Apps

### Essential APIs for a Unit Management App

#### 1. **Create/Update Unit**
```bash
POST /units/v1/add-sale
POST /units/v1/add-rent
POST /units/v1/update-sale
POST /units/v1/update-rent

Headers: Authorization: Bearer {token}

Body:
{
  clientId: string (required - from auth token),
  purpose: "sell" | "rent" (required),
  project: string (required),
  buildingType: string (required),
  landArea: number (required),
  totalPrice: number (for sale),
  city: string (lowercase canonical),
  district: string (lowercase canonical),
  // ... see full form data structure above
}
```

#### 2. **Fetch Available Projects**
```bash
GET /projectsv2/all_projects_names

Headers: Authorization: Bearer {token}

Response:
[
  { id, en_name, ar_name, city, district, developer_id, ... },
  ...
]
```

#### 3. **Fetch Developers**
```bash
GET /developers/v1/get_all_names

Headers: Authorization: Bearer {token}

Response:
[
  { id, en_name, ar_name, description, ... },
  ...
]
```

#### 4. **Fetch Cities & Districts**
```bash
GET /cities_list.json

No auth required - static file

Response:
[
  {
    id: number,
    en_name: string,
    ar_name: string,
    districts: [{ en_name, ar_name, aliases }, ...]
  },
  ...
]
```

---

## Important Implementation Details

### 1. **Client ID Management**
- **Source of Truth**: Auth token (JWT)
- **Validation**: `getValidatedClientId()` from `src/utils/clientId-validator.js`
- **Never trust**: Client-side cookies or URL parameters for clientId
- When adding/updating units, API payload's `clientId` is derived from token (server won't accept false claims)

### 2. **City/District Normalization**
```javascript
// Always normalize to canonical lowercase en_name before sending to API
const cityManager = CityManager.getInstance();
const canonicalCity = await cityManager.normalizeCityValueAsync(userInput);
const canonicalDistrict = await cityManager.normalizeDistrictValueAsync(userInput, city);
```

### 3. **Data Type Conversion**
- **Arabic numerals** → Converted to English (1632, 1776 charcode offsets)
- **Price fields** → Float (stored as 0 if empty)
- **Count fields** → Integer (rooms, bathrooms, floors)
- **Dates** → ISO format (YYYY-MM-DD)

### 4. **Visibility Workflow**
- `"visible"` - Published, appears in listings
- `"pending_approval"` - Awaiting admin review (pending_approval tab)
- `"hidden"` - Saved as draft, not visible to others

### 5. **Validation Errors**
- Form shows inline error state on invalid fields (red border)
- Toast notifications for API errors (unified error messages)
- Delivery date must be within 30 years past to 10 years future

### 6. **Optimistic Updates**
- Unit is added to local cache (React Query) before API response
- If API fails, cache is rolled back
- On success, cache is invalidated and refetched from server

### 7. **Multi-Purpose Form**
- **Step 1** is identical for sell/rent
- **Step 2** changes based on `formData.purpose` selection
- **Step 3** is identical for sell/rent
- Avoid mixing sell/rent data (separate state objects: `SellFormData`, `rentFormData`)

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/components/ui/unit-forms/add-unit-Modal.jsx` | Main form modal (1300+ lines) |
| `src/components/ui/unit-forms/basic-details-step.jsx` | Step 1 component |
| `src/components/ui/unit-forms/sale-details-step.jsx` | Step 2 (sale) component |
| `src/components/ui/unit-forms/rental-details-step.jsx` | Step 2 (rental) component |
| `src/components/ui/unit-forms/images-step.jsx` | Step 3 component |
| `src/hooks/use-unit-mutations.js` | React Query mutations (add, update, delete) |
| `src/hooks/use-admin-shared-data.js` | React Query hooks (projects, developers) |
| `src/utils/api.js` | API client functions |
| `src/utils/city_manager.js` | Cities/districts singleton |
| `src/lib/units/unit-api.ts` | Fetch unit details by ID/code |

---

## Error Handling

### Common Errors & Codes
| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired token | Re-login required |
| 403 Forbidden | User not allowed to edit this unit | Check ownership (clientId mismatch) |
| 404 Not Found | Unit/project not found | Verify ID exists |
| 422 Validation | Required field missing or invalid | Check form validation |
| 500 Server Error | Backend exception | Retry or contact support |

### API Response Validation
```javascript
// Success: one of these must be true
response.success === true || response.status === true || response.code === 200

// Error handling
if (!success) {
  const errorMsg = response.error || response.error_message || response.message;
  throw new Error(errorMsg);
}
```

---

## Performance Considerations

1. **Caching**
   - Projects: 5 min cache (staleTime)
   - Developers: 15 min cache
   - Cities: Loaded once, cached in-memory for app lifetime

2. **Pagination**
   - Projects list supports cursor-based pagination (limit: 20 per page)
   - Developers use infinite scroll pagination

3. **Optimistic Updates**
   - UI updates before API response
   - Rollback on failure
   - Prevents jarring UI flicker

4. **Image Upload**
   - Progress tracking via `isUploading` state
   - Max 10 images enforced
   - Async upload (button disabled during upload)

---

## Localization

- **i18n Hook**: `useI18n()` → `{ t, locale, translate }`
- **Form labels & errors**: Use `translate("key", defaultValue)` for i18n support
- **Supported locales**: Arabic (`ar`), English (`en`)
- **Text direction**: Auto-set via `dir={locale === "ar" ? "rtl" : "ltr"}`
- **Currency**: Always EGP (Egyptian Pound)
