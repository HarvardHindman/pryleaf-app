# Pryleaf Color System

## Overview
Pryleaf uses a centralized color system based on CSS custom properties (variables) defined in the theme files. This ensures consistent branding and makes it easy to update colors across the entire application.

## Brand Color: Green
Our primary brand color is **green**, specifically green-600 (`#16a34a`) for light mode and green-500 (`#22c55e`) for dark mode.

## Theme Files
All colors are defined in:
- **Light Theme**: `src/styles/light-theme.css`
- **Dark Theme**: `src/styles/dark-theme.css`

## Color Variable Categories

### 1. Text Colors
High-contrast hierarchy for readability:
```css
--text-primary      /* Main text, highest contrast */
--text-secondary    /* Secondary text, slightly muted */
--text-muted        /* Muted text, less prominent */
--text-subtle       /* Subtle text, least prominent */
```

### 2. Surface Colors
Layered backgrounds for depth:
```css
--surface-primary    /* Main cards and elevated content */
--surface-secondary  /* App background */
--surface-tertiary   /* Hover states, tertiary elements */
--surface-elevated   /* Modals, popovers */
```

### 3. Border Colors
Subtle to prominent borders:
```css
--border-subtle   /* Very subtle, almost invisible */
--border-default  /* Balanced default border */
--border-strong   /* Emphasized borders */
```

### 4. Interactive Colors (Brand Green)
Primary interactive elements:
```css
--interactive-primary       /* #16a34a - Main actions, links */
--interactive-hover         /* #15803d - Hover state */
--interactive-active        /* #166534 - Active/pressed state */
--interactive-bg-subtle     /* #f0fdf4 - Light green background */
--interactive-bg-muted      /* #dcfce7 - Muted green background */
--interactive-border        /* #bbf7d0 - Green border */
--interactive-text-on-bg    /* #166534 - Text on green backgrounds */
```

### 5. Status Colors
Semantic meaning for states:
```css
/* Success (Green) */
--success-background
--success-text
--success-border

/* Warning (Amber) */
--warning-background
--warning-text
--warning-border

/* Danger (Red) */
--danger-background
--danger-text
--danger-border

/* Info (Cyan) */
--info-background
--info-text
--info-border
```

### 6. Shadows and Elevation
```css
--shadow-xs   /* Minimal shadow */
--shadow-sm   /* Small shadow */
--shadow-md   /* Medium shadow */
--shadow-lg   /* Large shadow */
--shadow-xl   /* Extra large shadow */
```

## Usage Guidelines

### ✅ DO: Use CSS Variables
```tsx
// Inline styles
<div style={{ color: 'var(--interactive-primary)' }}>
  Click me
</div>

// Background and text
<button style={{ 
  backgroundColor: 'var(--interactive-bg-subtle)',
  color: 'var(--interactive-text-on-bg)'
}}>
  Action
</button>
```

### ✅ DO: Use Utility Classes
```tsx
// For interactive hover states
<Link className="hover-interactive">
  Link text
</Link>

// For hover backgrounds
<div className="hover-interactive-bg">
  Hover me
</div>
```

### ❌ DON'T: Hardcode Tailwind Color Classes
```tsx
// ❌ Bad - hardcoded blue
<div className="bg-blue-50 text-blue-600">
  Content
</div>

// ✅ Good - uses CSS variables
<div style={{ 
  backgroundColor: 'var(--interactive-bg-subtle)',
  color: 'var(--interactive-primary)' 
}}>
  Content
</div>
```

### ❌ DON'T: Hardcode Hex Colors
```tsx
// ❌ Bad
<div style={{ color: '#3b82f6' }}>
  Content
</div>

// ✅ Good
<div style={{ color: 'var(--interactive-primary)' }}>
  Content
</div>
```

## Common Patterns

### Active/Selected States (like sidebar)
```tsx
<button
  className={`border ${isActive ? '' : 'border-transparent'}`}
  style={isActive ? {
    backgroundColor: 'var(--interactive-bg-subtle)',
    color: 'var(--interactive-text-on-bg)',
    borderColor: 'var(--interactive-border)'
  } : {}}
>
  {children}
</button>
```

### Icons with Brand Color
```tsx
<Icon 
  className="h-5 w-5"
  style={{ color: 'var(--interactive-primary)' }}
/>
```

### Hover States
```tsx
<Link 
  href="/path"
  className="text-gray-600 hover-interactive transition-colors"
>
  Hover me
</Link>
```

### Buttons and CTAs
```tsx
<button 
  className="px-4 py-2 rounded-lg transition-colors"
  style={{
    backgroundColor: 'var(--interactive-primary)',
    color: 'white'
  }}
>
  Primary Action
</button>
```

## Updating Brand Colors

To change the brand color across the entire application:

1. Update `src/styles/light-theme.css`:
```css
--interactive-primary: #YOUR_COLOR;
--interactive-hover: #YOUR_DARKER_COLOR;
--interactive-active: #YOUR_DARKEST_COLOR;
```

2. Update `src/styles/dark-theme.css`:
```css
--interactive-primary: #YOUR_COLOR;
--interactive-hover: #YOUR_DARKER_COLOR;
--interactive-active: #YOUR_DARKEST_COLOR;
```

That's it! All components using CSS variables will automatically update.

## Benefits

1. **Consistency**: Single source of truth for colors
2. **Theme Support**: Automatic dark/light mode switching
3. **Maintainability**: Change colors in one place
4. **Accessibility**: Ensures proper contrast ratios
5. **Flexibility**: Easy to experiment with different color schemes

