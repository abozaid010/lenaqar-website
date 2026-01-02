# News Page Visual Guide

## Layout Overview

The News page displays a clean, scrollable feed of real estate news articles. Here's what it looks like:

```
┌─────────────────────────────────────────────────────────────┐
│  Admin Dashboard Header (with user menu, notifications)     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  News (الأخبار)                                              │
│  Latest real estate news and updates                         │
│  (أحدث أخبار وتحديثات القطاع العقاري)                       │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  شركة طلعت مصطفى تطلق المرحلة الجديدة من مشروع مدينتي   ││
│  │                                                           ││
│  │  أعلنت شركة طلعت مصطفى عن إطلاق المرحلة الجديدة من      ││
│  │  مشروع مدينتي، والتي تضم وحدات سكنية وتجارية بمساحات... ││
│  │                                                           ││
│  │  ┌───────────────────┬──────────────────────────────────┐││
│  │  │ 📅 2 hours ago    │    Read more ➚                   │││
│  │  └───────────────────┴──────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  وزارة الإسكان تعلن عن تعديل جديد في قانون البناء الموحد││
│  │                                                           ││
│  │  أصدرت وزارة الإسكان تعديلات جديدة على قانون البناء    ││
│  │  الموحد تهدف إلى تسهيل إجراءات الترخيص وتقليل الوقت...  ││
│  │                                                           ││
│  │  ┌───────────────────┬──────────────────────────────────┐││
│  │  │ 📅 5 hours ago    │    Read more ➚                   │││
│  │  └───────────────────┴──────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  شركة إعمار مصر تبدأ تنفيذ مشروع جديد في القاهرة الجديدة││
│  │                                                           ││
│  │  أعلنت شركة إعمار مصر عن بدء تنفيذ مشروع سكني فاخر في   ││
│  │  منطقة القاهرة الجديدة، يتضمن وحدات سكنية بمساحات...    ││
│  │                                                           ││
│  │  ┌───────────────────┬──────────────────────────────────┐││
│  │  │ 📅 1 day ago      │    Read more ➚                   │││
│  │  └───────────────────┴──────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ↓ Scroll for more news...                                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Page Header
- **Title**: "News" (English) or "الأخبار" (Arabic)
- **Subtitle**: "Latest real estate news and updates" (English) or "أحدث أخبار وتحديثات القطاع العقاري" (Arabic)
- Centered layout with clear typography

### 2. News Cards
Each news article is displayed in a card with:

#### Card Structure:
```
┌─────────────────────────────────────────────┐
│  TITLE (Large, bold, 20px)                  │
│                                             │
│  Description text that shows first 3        │
│  lines with an ellipsis if longer...        │
│                                             │
│  ─────────────────────────────────────────  │
│  📅 Relative Time  │  Read more ➚          │
└─────────────────────────────────────────────┘
```

#### Visual Design:
- **Background**: White with subtle shadow
- **Border**: Light gray (1px)
- **Padding**: 24px
- **Border Radius**: 8px
- **Gap between cards**: 16px
- **Hover Effect**: Enhanced shadow for depth

#### Title Styling:
- Font Size: 20px (xl)
- Font Weight: 600 (semibold)
- Color: Gray-900
- Line Height: Tight
- Margin Bottom: 12px

#### Description Styling:
- Font Size: 14px (base)
- Color: Gray-700
- Line Height: Relaxed
- Line Clamp: 3 lines max
- Margin Bottom: 16px

#### Footer Section:
- Border Top: Light gray divider
- Padding Top: 12px
- Flex Layout: Space between
- Gap: 12px (for mobile wrapping)

##### Date Display:
- Icon: Calendar (16px)
- Text: Relative time (e.g., "2 hours ago", "3 days ago")
- Color: Gray-500
- Font Size: 14px (sm)

##### Read More Link:
- Text: "Read more" with external link icon
- Color: Primary blue
- Hover: Darker primary
- Icon Animation: Slides right on hover
- Opens in new tab

### 3. Loading State
```
┌─────────────────────────────────┐
│                                 │
│         ⟳ (Spinning)            │
│                                 │
│     Loading news...             │
│                                 │
└─────────────────────────────────┘
```

### 4. Error State
```
┌─────────────────────────────────┐
│                                 │
│  ⚠️ Error loading news          │
│                                 │
│  [Error message]                │
│  Please try again later         │
│                                 │
└─────────────────────────────────┘
```

### 5. Empty State
```
┌─────────────────────────────────┐
│                                 │
│  📰                             │
│                                 │
│  No news available at           │
│  the moment                     │
│                                 │
└─────────────────────────────────┘
```

## Responsive Behavior

### Desktop (≥1024px):
- Max width: 1024px (4xl)
- Centered on page
- Full cards visible
- Hover effects active

### Tablet (768px - 1023px):
- Max width: 768px
- Adjusted padding
- Cards stack vertically

### Mobile (<768px):
- Full width with padding
- Reduced padding in cards (16px)
- Footer items may wrap
- Touch-friendly link sizes

## Interaction Patterns

### 1. Card Hover (Desktop)
- Shadow increases from md to lg
- Smooth transition (200ms)
- Cursor: pointer on entire card

### 2. Read More Link
- Hover: Color darkens
- Icon slides right 4px
- Opens in new tab
- External link behavior

### 3. Scrolling
- Smooth scroll
- Native scrollbar
- No pagination (all items load at once)
- Can be extended with infinite scroll

## Color Scheme

```css
Background Colors:
- Page background: Gray-50 (#F9FAFB)
- Card background: White (#FFFFFF)
- Card border: Gray-200 (#E5E7EB)

Text Colors:
- Primary text: Gray-900 (#111827)
- Secondary text: Gray-700 (#374151)
- Muted text: Gray-600 (#4B5563)
- Date/metadata: Gray-500 (#6B7280)

Accent Colors:
- Primary link: Primary Blue (from theme)
- Primary hover: Darker Primary
- Error: Red-600
- Success: Green-500
```

## Accessibility Features

1. **Semantic HTML**
   - `<article>` for each news item
   - `<time>` for dates with datetime attribute
   - Proper heading hierarchy

2. **ARIA Attributes**
   - `rel="noopener noreferrer"` on external links
   - `target="_blank"` with proper ARIA labels

3. **Keyboard Navigation**
   - All interactive elements are focusable
   - Proper tab order
   - Visible focus indicators

4. **Screen Readers**
   - Meaningful link text
   - Date formatting in readable format
   - Proper semantic structure

## Performance Optimizations

1. **Data Caching**: TanStack Query caches data for 5 minutes
2. **Optimistic UI**: Loading states prevent content jumps
3. **Lazy Loading**: Can be extended with React.lazy if needed
4. **Efficient Re-renders**: Proper key usage in list

## Future Enhancement Options

1. **Infinite Scroll**: Load more news as user scrolls
2. **Filters**: By date range, category, source
3. **Search**: Full-text search within news
4. **Bookmarks**: Save favorite articles
5. **Share**: Social media sharing
6. **Categories**: Tag-based filtering
7. **Notifications**: Alert for breaking news

---

## Implementation Status: ✅ Complete

All code is ready and tested. The news feed will display automatically when users navigate to the "News" tab in the sidebar.

