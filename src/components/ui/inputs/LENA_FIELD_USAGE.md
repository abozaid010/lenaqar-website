# Lena Field Components - Usage Guide

## Overview

The Lena field components (`LenaTextField`, `LenaTextarea`, `LenaFieldWrapper`) provide enhanced form inputs with automatic error animations and scroll-to-error functionality.

## Features

- ✅ Automatic shake animation on error
- ✅ Smooth error state transitions
- ✅ Forward ref support for scroll-to-error
- ✅ Drop-in replacement for `FormInput`
- ✅ Fade-in error messages

## Components

### 1. LenaTextField

Enhanced text input component with error animations.

```jsx
import { LenaTextField } from "@/components/ui/inputs";

// Basic usage
<LenaTextField
  label="Email"
  name="email"
  value={formData.email}
  onChange={handleChange}
  required
  error={errors.email}
  errorMessage={errors.email}
  placeholder="Enter your email"
/>

// With ref for scroll-to-error
const emailRef = useRef(null);

<LenaTextField
  ref={emailRef}
  label="Email"
  name="email"
  value={formData.email}
  onChange={handleChange}
  error={errors.email}
/>
```

### 2. LenaTextarea

Enhanced textarea component with error animations.

```jsx
import { LenaTextarea } from "@/components/ui/inputs";

<LenaTextarea
  label="Description"
  name="description"
  value={formData.description}
  onChange={handleChange}
  required
  rows={5}
  error={errors.description}
  errorMessage={errors.description}
/>
```

### 3. LenaFieldWrapper

Wrapper for custom form components (dropdowns, multi-selects, etc.) to add error animations.

```jsx
import { LenaFieldWrapper } from "@/components/ui/inputs";
import SearchableDropdownSelect from "./searchable-dropdown-select";

<LenaFieldWrapper
  error={errors.city}
  errorMessage={errors.city}
>
  <SearchableDropdownSelect
    name="city"
    value={formData.city}
    onChange={handleChange}
    // ... other props
  />
</LenaFieldWrapper>
```

## Using with useFormFieldRefs Hook

The `useFormFieldRefs` hook simplifies managing refs and scrolling to errors:

```jsx
import { useFormFieldRefs } from "@/hooks/use-form-field-refs";
import { LenaTextField } from "@/components/ui/inputs";

function MyForm() {
  const fieldRefs = useFormFieldRefs();
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Automatically scroll to first error
      setTimeout(() => {
        fieldRefs.scrollToFirstError(validationErrors, [
          'email',
          'password',
          'name',
          // ... field order
        ]);
      }, 100);
      return;
    }
    
    // Submit form...
  };

  return (
    <form onSubmit={handleSubmit}>
      <LenaTextField
        ref={fieldRefs.register('email')}
        label="Email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
      />
      
      <LenaTextField
        ref={fieldRefs.register('password')}
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
      />
    </form>
  );
}
```

## Migration from FormInput

### Before (FormInput)

```jsx
import FormInput from "@/components/ui/inputs/form-input";

<FormInput
  label="Email"
  name="email"
  value={formData.email}
  onChange={handleChange}
  error={errors.email}
  errorMessage={errors.email}
/>
```

### After (LenaTextField)

```jsx
import { LenaTextField } from "@/components/ui/inputs";

<LenaTextField
  label="Email"
  name="email"
  value={formData.email}
  onChange={handleChange}
  error={errors.email}
  errorMessage={errors.email}
/>
```

**Note:** `LenaTextField` is a drop-in replacement. The API is identical, but with added animations.

## Props

### LenaTextField & LenaTextarea

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | - | Label text |
| `name` | string | - | Input name attribute |
| `value` | string/number | - | Input value |
| `onChange` | function | - | Change handler |
| `placeholder` | string | - | Placeholder text |
| `required` | boolean | false | Whether field is required |
| `error` | boolean/string | false | Error state or error message |
| `errorMessage` | string | "" | Error message (if error is boolean) |
| `type` | string | "text" | Input type (text, email, url, etc.) |
| `className` | string | "" | Additional CSS classes |
| `dir` | string | undefined | Text direction (ltr/rtl) |
| `...rest` | object | - | Other input props |

### LenaFieldWrapper

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | - | Child component to wrap |
| `error` | boolean/string | false | Error state or error message |
| `errorMessage` | string | "" | Error message (if error is boolean) |
| `className` | string | "" | Additional CSS classes |

## Animation Details

- **Shake Animation**: Triggers automatically when error appears (0.5s duration)
- **Fade-in**: Error messages fade in smoothly (0.2s duration)
- **Ring Effect**: Red ring appears around field on error (1s duration)

## Best Practices

1. **Use consistent error handling**: Always pass both `error` and `errorMessage` for clarity
2. **Field order matters**: When using `scrollToFirstError`, define field order to match form layout
3. **Wrap custom components**: Use `LenaFieldWrapper` for components that don't have built-in error animations
4. **Accessibility**: All components maintain proper ARIA attributes and keyboard navigation

## Examples

See `src/components/ui/add-compound-dialog.jsx` for a complete implementation example.
