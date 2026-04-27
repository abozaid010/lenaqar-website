# Header Design Specification

## Overview
Standardized header design for consistent UI across all tabs/pages in the website. This specification ensures uniform styling, behavior, and responsive design.

## Container Structure

### Main Container
```jsx
<div className="p-4 space-y-4 bg-white rounded-lg shadow-md">
  {/* Header Content */}
</div>
```

### Header Row
```jsx
<div className="flex items-center flex-wrap md:flex-nowrap gap-2 md:justify-between">
  {/* Header Elements */}
</div>
```

### Margin Separator (Optional)
```jsx
<div className="h-4 bg-gray-100"></div>
```

## Element Specifications

### 1. Dropdown Components
All dropdowns should use `SearchableDropdownSelect` component with consistent styling.

#### Container
```jsx
<div className="w-full md:w-auto md:flex-1 min-w-0">
  <SearchableDropdownSelect
    // Props
  />
</div>
```

#### Standard Props
```jsx
<SearchableDropdownSelect
  options={optionsArray}
  value={selectedValue}
  onChange={(e) => setSelectedValue(e.target.value)}
  name="fieldName"
  placeholder="Placeholder text"
  showAllOption={true}
  allOptionLabel="All Options"
  allOptionValue=""
  getValue={(option) => option.value || option.id}
  getLabel={(option, locale) => option.label || option.name}
  className="w-full"
  buttonClassName="bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] text-sm h-10 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
  disabled={isLoading}
  isLoading={isLoading}
/>
```

### 2. Action Buttons

#### Primary Action Button (ADD)
```jsx
<button
  onClick={handleAction}
  className="flex-1 md:flex-initial px-4 py-2 h-10 bg-primary hover:bg-primary/90 text-white rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
>
  <Plus size={18} className="shrink-0" />
  <span className="hidden sm:inline whitespace-nowrap">
    Button Text
  </span>
</button>
```

#### Secondary Action Button (Import/Other)
```jsx
<button
  onClick={handleAction}
  className="flex-1 md:flex-initial px-4 py-2 h-10 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
>
  <Plus size={18} className="shrink-0" />
  <span className="hidden sm:inline whitespace-nowrap">
    Button Text
  </span>
</button>
```

#### Icon Button (Help/Instructions)
```jsx
<div className="flex items-center justify-center w-10 h-10 bg-[#F6F7FB] border border-[#E6E6E6] rounded-md hover:border-primary/40 transition-colors">
  <VideoInstructionsDialog
    variant="pageType"
    iconSize="sm"
    tooltipText="Help text"
  />
</div>
```

## Color Palette

### Background Colors
- **White Container**: `bg-white`
- **Dropdown Background**: `bg-[#F6F7FB]`
- **Margin Separator**: `bg-gray-100`

### Border Colors
- **Standard Border**: `border-[#E6E6E6]`
- **Hover Border**: `hover:border-primary/40`
- **Focus Border**: `focus:border-primary`

### Text Colors
- **Primary Text**: `text-[#494A4B]`
- **White Text**: `text-white`
- **Hover States**: `hover:text-primary`

### Button Colors
- **Primary Button**: `bg-primary hover:bg-primary/90`
- **Secondary Button**: `bg-green-600 hover:bg-green-700`
- **Icon Button**: `bg-[#F6F7FB]`

## Typography

### Font Sizes
- **Standard Text**: `text-sm`
- **Button Text**: `text-sm font-medium`

### Font Weights
- **Standard**: `font-medium`
- **Button Labels**: `font-medium`

## Spacing & Sizing

### Heights
- **All Elements**: `h-10` (40px)
- **Consistent Button Height**: `h-10`

### Padding
- **Dropdowns**: `px-3 py-2`
- **Action Buttons**: `px-4 py-2`

### Gaps
- **Element Gap**: `gap-2`
- **Button Gap**: `gap-2`

### Margins
- **Container Padding**: `p-4`
- **Vertical Spacing**: `space-y-4`
- **Margin Separator**: `h-4`

## Responsive Design

### Breakpoints
- **Mobile**: Default (`flex-wrap`)
- **Tablet/Desktop**: `md:` prefix

### Responsive Classes
```jsx
// Layout
flex-wrap md:flex-nowrap
justify-between

// Widths
w-full md:w-auto md:flex-1 min-w-0

// Buttons
flex-1 md:flex-initial

// Text
hidden sm:inline
```

## Interactions & States

### Hover Effects
- **Dropdowns**: `hover:border-primary/40`
- **Buttons**: `hover:bg-primary/90` or `hover:bg-green-700`
- **Icon Button**: `hover:border-primary/40`

### Focus States
- **Dropdowns**: `focus:ring-2 focus:ring-primary/20 focus:border-primary`
- **Buttons**: Inherited from button element

### Transitions
- **All Interactive Elements**: `transition-colors`

### Shadows
- **Buttons**: `shadow-sm hover:shadow-md`
- **Container**: `shadow-md`

## Icon Specifications

### Sizes
- **Button Icons**: `size={18}`
- **Dropdown Icons**: `size={18}` (ChevronDown)
- **Dialog Icons**: `iconSize="sm"`

### Icon Classes
- **Shrink Prevention**: `shrink-0`
- **Icon Container**: `flex items-center justify-center`

## Accessibility

### ARIA Attributes
- Use semantic HTML elements
- Proper button types
- Focus management

### Keyboard Navigation
- Tab order follows visual layout
- Enter/Space for buttons
- Escape for dropdowns

## Implementation Template

### Complete Header Template
```jsx
{/* Header Container */}
<div className="p-4 bg-white rounded-lg shadow-md">
  <div className="flex items-center flex-wrap md:flex-nowrap gap-2 md:justify-between">
    
    {/* Filter Dropdown 1 */}
    <div className="w-full md:w-auto md:flex-1 min-w-0">
      <SearchableDropdownSelect
        options={filterOptions}
        value={selectedFilter}
        onChange={(e) => setSelectedFilter(e.target.value)}
        name="filter"
        placeholder="All Options"
        showAllOption={true}
        allOptionLabel="All Options"
        allOptionValue=""
        getValue={(option) => option.value}
        getLabel={(option) => option.label}
        className="w-full"
        buttonClassName="bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] text-sm h-10 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        disabled={isLoading}
        isLoading={isLoading}
      />
    </div>

    {/* Filter Dropdown 2 (Optional) */}
    <div className="w-full md:w-auto md:flex-1 min-w-0">
      <SearchableDropdownSelect
        // Same styling as above
      />
    </div>

    {/* Action Buttons */}
    <div className="w-full md:w-auto flex-shrink-0 flex gap-2 items-center">
      <button
        onClick={handleAdd}
        className="flex-1 md:flex-initial px-4 py-2 h-10 bg-primary hover:bg-primary/90 text-white rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
      >
        <Plus size={18} className="shrink-0" />
        <span className="hidden sm:inline whitespace-nowrap">Add</span>
      </button>
      
      <button
        onClick={handleImport}
        className="flex-1 md:flex-initial px-4 py-2 h-10 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
      >
        <Plus size={18} className="shrink-0" />
        <span className="hidden sm:inline whitespace-nowrap">Import</span>
      </button>
      
      <div className="flex items-center justify-center w-10 h-10 bg-[#F6F7FB] border border-[#E6E6E6] rounded-md hover:border-primary/40 transition-colors">
        <VideoInstructionsDialog
          variant="pageType"
          iconSize="sm"
          tooltipText="Help"
        />
      </div>
    </div>
  </div>
</div>

{/* Optional Margin Separator */}
<div className="h-4 bg-gray-100"></div>

{/* Page Content */}
<div className="flex-1 min-h-0 overflow-y-auto">
  {/* Content goes here */}
</div>
```

## Notes for Implementation

1. **Consistency**: Always use the exact class names and values specified
2. **Responsive**: Test on 13-inch devices and mobile screens
3. **Accessibility**: Ensure proper focus management and keyboard navigation
4. **Performance**: Use `useMemo` for options arrays to prevent unnecessary re-renders
5. **Internationalization**: Support both Arabic and English text directions

## Component Requirements

### Required Dependencies
- `SearchableDropdownSelect` component
- `VideoInstructionsDialog` component (for help buttons)
- Lucide React icons (`Plus`, `ChevronDown`)

### State Management Pattern
```jsx
const [selectedFilter, setSelectedFilter] = useState("");
const filterOptions = useMemo(() => 
  data.map(item => ({
    value: item.value,
    label: item.label
  }))
, [data]);
```

This specification ensures consistent, professional, and accessible header design across all pages in the website.
