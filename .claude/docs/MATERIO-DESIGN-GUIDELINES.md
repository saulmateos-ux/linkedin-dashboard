# Materio MUI Design Guidelines

**Version**: 1.0.0
**Last Updated**: October 26, 2025
**Reference**: [Materio Free Demo](https://demos.themeselection.com/materio-mui-nextjs-admin-template-free/demo)

---

## Design Philosophy

Materio emphasizes **clean, professional UI** with consistent spacing, subtle shadows, and smooth transitions. The design balances visual hierarchy with minimalism, using color strategically and maintaining excellent readability in both light and dark modes.

---

## Color System

### Primary Palette
```typescript
primary: {
  main: '#8C57FF',      // Purple - primary brand color
  light: '#A678FF',     // Lighter purple for hover states
  dark: '#7E3AF2',      // Darker purple for active states
  contrastText: '#FFF'
}
```

### Semantic Colors
```typescript
success:  '#56CA00'  // Green for positive actions/metrics
warning:  '#FFB400'  // Amber for warnings/alerts
error:    '#FF4C51'  // Red for errors/destructive actions
info:     '#16B1FF'  // Blue for informational elements
secondary:'#8A8D93'  // Gray for secondary elements
```

### Backgrounds (Dark Mode)
```typescript
background: {
  default: '#28243D',   // Main background - deep purple-gray
  paper: '#312D4B'      // Card/surface background - lighter purple-gray
}
```

### Text (Dark Mode)
```typescript
text: {
  primary: 'rgba(231, 227, 252, 0.87)',    // 87% opacity - main text
  secondary: 'rgba(231, 227, 252, 0.68)',  // 68% opacity - secondary text
  disabled: 'rgba(231, 227, 252, 0.38)'    // 38% opacity - disabled text
}
```

---

## Typography System

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Type Scale
```typescript
h1: { fontSize: '1.75rem',   fontWeight: 500 }  // 28px - Page titles
h2: { fontSize: '1.5rem',    fontWeight: 500 }  // 24px - Section headers
h3: { fontSize: '1.25rem',   fontWeight: 600 }  // 20px - Card titles
h4: { fontSize: '1.125rem',  fontWeight: 600 }  // 18px - Subsections
h5: { fontSize: '1rem',      fontWeight: 600 }  // 16px - Small headers
h6: { fontSize: '0.9375rem', fontWeight: 600 }  // 15px - Smallest headers

body1: { fontSize: '0.9375rem' }  // 15px - Primary body text
body2: { fontSize: '0.875rem' }   // 14px - Secondary body text
caption: { fontSize: '0.76171875rem' }  // ~12.2px - Captions/meta text
```

### Font Weights
- **400**: Regular body text
- **500**: Medium - headings and emphasis
- **600**: Semibold - important headings and labels

---

## Spacing System

### Container Spacing
```typescript
containerPadding: {
  xs: '1rem',      // 16px - Mobile
  sm: '1.25rem',   // 20px - Small tablets
  md: '1.5rem',    // 24px - Tablets
  lg: '1.5rem',    // 24px - Desktop (standard)
  xl: '2rem'       // 32px - Large desktop
}
```

### Card Spacing
```typescript
cardPadding: {
  default: '1.25rem',   // 20px - Standard card padding
  compact: '1rem',      // 16px - Dense cards
  comfortable: '1.5rem' // 24px - Spacious cards
}
```

### Grid Gaps
```typescript
gridGap: {
  tight: '0.5rem',   // 8px - Dense grids
  normal: '1rem',    // 16px - Standard grids
  comfortable: '1.5rem'  // 24px - Spacious grids
}
```

### Common Spacing Values
```typescript
spacing: 8  // Base unit = 8px

// Multiply for common values:
// 0.5 = 4px   (micro spacing)
// 1   = 8px   (tight spacing)
// 1.5 = 12px  (compact spacing)
// 2   = 16px  (normal spacing)
// 3   = 24px  (comfortable spacing)
// 4   = 32px  (spacious spacing)
// 6   = 48px  (section spacing)
```

---

## Shadows & Elevation

### Shadow Levels
```typescript
customShadows: {
  xs: '0px 2px 4px 0px rgba(76, 78, 100, 0.2)',
  sm: '0px 2px 6px 0px rgba(76, 78, 100, 0.22)',
  md: '0px 2px 10px 0px rgba(76, 78, 100, 0.22)',   // Default card shadow
  lg: '0px 4px 14px 0px rgba(76, 78, 100, 0.25)',
  xl: '0px 8px 28px 0px rgba(76, 78, 100, 0.28)'
}
```

### Component Elevation
- **Cards**: md shadow (`0px 2px 10px`)
- **AppBar**: sm shadow (`0px 2px 6px`)
- **Modals/Dialogs**: xl shadow (`0px 8px 28px`)
- **Dropdowns/Menus**: lg shadow (`0px 4px 14px`)
- **Hover states**: Increase shadow one level

---

## Border Radius

### Standard Radius
```typescript
borderRadius: {
  default: 6,      // 6px - Cards, buttons, inputs
  small: 4,        // 4px - Chips, badges
  large: 8,        // 8px - Modals, large containers
  full: 9999       // Fully rounded - avatars, pills
}
```

### Component-Specific
- **Cards**: 6px
- **Buttons**: 6px
- **Chips**: 16px (fully rounded on short axis)
- **Inputs**: 6px
- **Modals**: 8px
- **Avatars**: 50% (circular)

---

## Component Styling

### Cards
```typescript
Card: {
  borderRadius: 6,
  boxShadow: customShadows.md,
  backgroundColor: palette.background.paper,
  transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)',

  '&:hover': {
    boxShadow: customShadows.lg  // Elevate on hover
  }
}
```

### Buttons
```typescript
Button: {
  borderRadius: 6,
  padding: '0.5rem 0.875rem',  // 8px × 14px
  fontSize: '0.9375rem',       // 15px
  fontWeight: 500,
  textTransform: 'none',       // No ALL CAPS
  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',

  // Primary variant
  primary: {
    background: 'linear-gradient(98deg, primary.main, primary.light)',
    '&:hover': {
      boxShadow: customShadows.sm
    }
  }
}
```

### Chips
```typescript
Chip: {
  height: 24,
  borderRadius: 16,
  fontSize: '0.8125rem',  // 13px
  fontWeight: 500,

  // Variants with specific colors
  outlined: {
    borderWidth: 1.5
  }
}
```

### Tables
```typescript
Table: {
  // Header
  TableHead: {
    backgroundColor: 'rgba(76, 78, 100, 0.08)',
    fontWeight: 600,
    fontSize: '0.8125rem',      // 13px
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  // Cells
  TableCell: {
    padding: '1rem',             // 16px
    borderBottom: '1px solid',
    borderColor: palette.divider,
    fontSize: '0.9375rem'        // 15px
  },

  // Hover
  TableRow: {
    '&:hover': {
      backgroundColor: palette.action.hover
    }
  }
}
```

### Navigation (Sidebar)
```typescript
Drawer: {
  width: 260,
  backgroundColor: palette.background.paper,
  borderRight: '1px solid',
  borderColor: palette.divider,

  // Navigation items
  ListItemButton: {
    borderRadius: 6,
    margin: '4px 16px',  // Spacing between items
    padding: '10px 16px',

    // Active state
    '&.active': {
      background: 'linear-gradient(72.47deg, primary.main, primary.light)',
      color: 'white',
      boxShadow: customShadows.xs
    },

    // Hover
    '&:hover': {
      backgroundColor: palette.action.hover
    }
  }
}
```

---

## Transitions & Animations

### Standard Easing
```css
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
transition-duration: 300ms;
```

### Common Transitions
```typescript
transitions: {
  hover: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  color: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  shadow: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  transform: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)'
}
```

### Performance Best Practices
- Use `transform` and `opacity` for animations (GPU accelerated)
- Avoid animating `width`, `height`, `top`, `left` (causes reflows)
- Keep durations under 400ms for snappy feel
- Use `will-change` sparingly for complex animations

---

## State Styling

### Hover States
```typescript
'&:hover': {
  backgroundColor: palette.action.hover,        // Subtle background change
  boxShadow: customShadows.lg,                 // Elevated shadow
  transform: 'translateY(-2px)',                // Slight lift (optional)
}
```

### Active States
```typescript
'&.active': {
  backgroundColor: palette.action.selected,     // Stronger background
  color: palette.primary.main,                  // Primary color text
  fontWeight: 600,                              // Bolder text
  borderLeft: `3px solid ${palette.primary.main}` // Left indicator (optional)
}
```

### Disabled States
```typescript
'&:disabled': {
  opacity: 0.45,                                // 45% opacity
  cursor: 'not-allowed',
  pointerEvents: 'none'
}
```

### Focus States (Accessibility)
```typescript
'&:focus-visible': {
  outline: `2px solid ${palette.primary.main}`,
  outlineOffset: 2
}
```

---

## Iconography

### Icon Sizing
```typescript
iconSize: {
  small: 18,      // 18px - Compact UI, chips
  medium: 20,     // 20px - Standard buttons, inputs
  large: 24,      // 24px - Navigation, headers
  xlarge: 28      // 28px - Stats cards, featured elements
}
```

### Icon Spacing
- **Icon + Text**: 8px gap (`gap: 1`)
- **Icon-only buttons**: 8px padding all sides
- **Icon in input**: 12px from edge

---

## Responsive Breakpoints

```typescript
breakpoints: {
  xs: 0,       // Phone (portrait)
  sm: 600,     // Phone (landscape) / Small tablet
  md: 900,     // Tablet
  lg: 1200,    // Desktop
  xl: 1536     // Large desktop
}
```

### Responsive Patterns
```typescript
// Mobile-first approach
sx={{
  padding: { xs: 2, sm: 3, md: 4 },     // Scale up padding
  fontSize: { xs: '0.875rem', md: '1rem' }, // Larger text on desktop
  display: { xs: 'none', lg: 'block' }   // Hide on mobile, show on desktop
}}
```

---

## Professional Polish Checklist

### Visual Consistency
- ✅ All cards use 6px border radius
- ✅ Shadows are consistent (md for cards, sm for appbar)
- ✅ Spacing follows 8px grid system
- ✅ Colors use theme palette (no hardcoded hex)

### Interaction Feedback
- ✅ Hover states on all interactive elements
- ✅ Active states clearly differentiated
- ✅ Disabled states at 45% opacity
- ✅ Focus indicators for keyboard navigation

### Typography
- ✅ Heading hierarchy is clear (h1 > h2 > h3)
- ✅ Body text uses readable sizes (≥15px)
- ✅ Line heights support readability (1.5+)
- ✅ Font weights differentiate importance

### Performance
- ✅ Transitions under 400ms
- ✅ GPU-accelerated animations (transform/opacity)
- ✅ No layout thrashing (avoid animating layout properties)
- ✅ Smooth 60fps interactions

### Accessibility
- ✅ Focus states visible for keyboard users
- ✅ Color contrast meets WCAG AA (4.5:1 minimum)
- ✅ Interactive elements ≥44px touch target
- ✅ Semantic HTML and ARIA labels where needed

---

## Implementation Examples

### Stat Card
```typescript
<Card sx={{
  borderRadius: 1.5,  // 6px
  boxShadow: 'var(--mui-customShadows-md)',
  transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    boxShadow: 'var(--mui-customShadows-lg)'
  }
}}>
  <CardContent sx={{ p: 3 }}>  {/* 24px padding */}
    <Box display="flex" alignItems="center" gap={2}>
      <Box sx={{
        width: 44,
        height: 44,
        borderRadius: 1.5,
        bgcolor: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon sx={{ fontSize: 24, color: 'white' }} />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          Total Posts
        </Typography>
        <Typography variant="h4" fontWeight={600}>
          1,234
        </Typography>
      </Box>
    </Box>
  </CardContent>
</Card>
```

### Table with Hover
```typescript
<TableRow
  hover
  sx={{
    transition: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: 'action.hover'
    }
  }}
>
  <TableCell sx={{ p: 2, fontSize: '0.9375rem' }}>Content</TableCell>
</TableRow>
```

### Primary Button
```typescript
<Button
  variant="contained"
  sx={{
    px: 2,           // 16px horizontal
    py: 1,           // 8px vertical
    borderRadius: 1.5,  // 6px
    fontSize: '0.9375rem',
    fontWeight: 500,
    textTransform: 'none',
    background: 'linear-gradient(98deg, primary.main, primary.light)',
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      boxShadow: 'var(--mui-customShadows-sm)',
      transform: 'translateY(-1px)'
    }
  }}
>
  Click Me
</Button>
```

---

## Design Tokens Reference

```typescript
// Quick reference for common values
const tokens = {
  spacing: {
    micro: 4,       // 0.5
    tight: 8,       // 1
    compact: 12,    // 1.5
    normal: 16,     // 2
    comfortable: 24,  // 3
    spacious: 32,   // 4
    section: 48     // 6
  },

  radius: {
    sm: 4,
    md: 6,
    lg: 8,
    full: 9999
  },

  shadow: {
    xs: 'customShadows.xs',
    sm: 'customShadows.sm',
    md: 'customShadows.md',
    lg: 'customShadows.lg',
    xl: 'customShadows.xl'
  },

  transition: {
    fast: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '400ms cubic-bezier(0.4, 0, 0.2, 1)'
  }
};
```

---

**Remember**: Consistency is key. When in doubt, refer back to these guidelines to maintain the professional polish that makes Materio stand out.
