# Design System Guidelines

**Project**: LinkedIn Analytics Dashboard
**Version**: 1.0.0
**Design Stack**: Magic UI + shadcn/ui + Tailwind CSS
**Last Updated**: October 26, 2025

---

## Overview

This document defines the design system for the LinkedIn Analytics Dashboard, including component libraries, animation principles, typography, and implementation guidelines.

**Design Philosophy**: Create a professional, polished dashboard experience with purposeful animations that enhance usability without distracting from data insights.

---

## Component Libraries

### Magic UI

**What it is**: Open-source library of 150+ animated React components built on Tailwind, TypeScript, and Framer Motion.

**Why we use it**:
- ✅ Animated components perfect for dashboards (number tickers, charts, cards)
- ✅ Copy-paste approach (no external dependencies)
- ✅ Built on same stack as our project (Next.js, Tailwind, TypeScript)
- ✅ Professional, subtle animations
- ✅ Free and open-source (MIT license)

**Documentation**: https://magicui.design/docs

### shadcn/ui

**What it is**: Base component library that Magic UI builds upon.

**Why we use it**:
- ✅ Magic UI uses shadcn/ui CLI for installation
- ✅ Same copy-paste philosophy
- ✅ Full code ownership
- ✅ Accessible components (ARIA compliant)
- ✅ Customizable with Tailwind

**Documentation**: https://ui.shadcn.com/docs

### Relationship

```
shadcn/ui (base components)
    ↓
Magic UI (animated versions)
    ↓
Our Custom Components (domain-specific)
```

---

## Installation & Setup

### Initial Setup (One-time)

```bash
# 1. Initialize shadcn/ui
npx shadcn@latest init

# Configuration:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
# - Tailwind config: Yes
# - Components path: @/components
# - Utils path: @/lib/utils

# 2. Install Framer Motion (animation engine)
npm install framer-motion

# 3. Install Geist fonts (optional but recommended)
npm install geist

# 4. Install utility dependencies
npm install class-variance-authority clsx tailwind-merge
```

This creates:
- `components/ui/` - Component folder
- `lib/utils.ts` - `cn()` helper function
- Updates `tailwind.config.ts` with theme tokens

### Adding Components

```bash
# Magic UI components (use remote URLs)
npx shadcn@latest add "https://magicui.design/r/[component-name]"

# Example:
npx shadcn@latest add "https://magicui.design/r/number-ticker"

# shadcn/ui components (use component name)
npx shadcn@latest add button
npx shadcn@latest add card
```

---

## Component Catalog

### Priority Components for Dashboard

#### **Tier 1: High Impact (Implement First)**

| Component | Use Case | Files Affected | Impact |
|-----------|----------|----------------|--------|
| `number-ticker` | Animated stats (likes, comments, engagement) | `app/page.tsx`, `components/EnhancedStatsCard.tsx` | 🔥 High |
| `bento-grid` | Modern dashboard layout | `app/page.tsx` | 🔥 High |
| `animated-list` | Posts table, profile lists | `components/SortablePostsTable.tsx`, `components/ProfileCard.tsx` | 🔥 High |
| `blur-fade` | Page load transitions | All `page.tsx` files | 🔥 High |

**Installation:**
```bash
npx shadcn@latest add "https://magicui.design/r/number-ticker"
npx shadcn@latest add "https://magicui.design/r/bento-grid"
npx shadcn@latest add "https://magicui.design/r/animated-list"
npx shadcn@latest add "https://magicui.design/r/blur-fade"
```

#### **Tier 2: Visual Polish (Implement Second)**

| Component | Use Case | Files Affected | Impact |
|-----------|----------|----------------|--------|
| `sparkles` | Highlight key metrics | `components/EnhancedStatsCard.tsx` | ⭐ Medium |
| `animated-border` | Profile cards, workspace cards | `components/ProfileCard.tsx` | ⭐ Medium |
| `meteors` | Background effects on cards | `components/ProfileCard.tsx` | ⭐ Medium |
| `dot-pattern` | Page backgrounds | `app/layout.tsx` | ⭐ Medium |

**Installation:**
```bash
npx shadcn@latest add "https://magicui.design/r/sparkles"
npx shadcn@latest add "https://magicui.design/r/animated-border"
npx shadcn@latest add "https://magicui.design/r/meteors"
npx shadcn@latest add "https://magicui.design/r/dot-pattern"
```

#### **Tier 3: Advanced Features (Implement Last)**

| Component | Use Case | Files Affected | Impact |
|-----------|----------|----------------|--------|
| `animated-bar-chart` | Engagement charts | `app/page.tsx` | ✨ Low |
| `animated-beam` | Show data flow | `app/insights/page.tsx` | ✨ Low |
| `grid-pattern` | Alternative background | `app/layout.tsx` | ✨ Low |
| `shimmer-button` | Primary CTA buttons | `components/ScrapeButton.tsx` | ✨ Low |

---

## Typography

### Fonts

**Primary Font**: Geist Sans (modern, professional)
**Monospace Font**: Geist Mono (code, data)

**Installation:**
```bash
npm install geist
```

**Implementation** (`app/layout.tsx`):
```tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={GeistSans.variable}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
```

### Type Scale

Follow Tailwind's default type scale:

```tsx
<h1 className="text-4xl font-bold">Dashboard Title</h1>
<h2 className="text-3xl font-semibold">Section Title</h2>
<h3 className="text-2xl font-medium">Card Title</h3>
<p className="text-base">Body text</p>
<small className="text-sm text-gray-500">Metadata</small>
```

---

## Animation Principles

### When to Animate

✅ **DO animate:**
- Number changes (stats updating)
- Data visualization (charts appearing)
- State transitions (loading → loaded)
- User interactions (hover, click)
- Page transitions (navigation)

❌ **DON'T animate:**
- Static content on initial load (unless fade-in)
- Small UI elements (< 20px)
- High-frequency updates (> 5/second)
- Critical data (confuses users)

### Animation Timing

**Duration Guidelines:**
- **Fast**: 150-200ms - Micro-interactions (hover, button click)
- **Medium**: 300-400ms - State changes (modal open, tab switch)
- **Slow**: 500-800ms - Page transitions, complex animations

**Easing Functions:**
- **Default**: `ease-in-out` - Most animations
- **Entrance**: `ease-out` - Elements appearing
- **Exit**: `ease-in` - Elements disappearing
- **Bounce**: `spring` - Playful interactions (use sparingly)

### Performance Guidelines

**60 FPS Target:**
- Use CSS transforms (not width/height)
- Add `will-change` for complex animations
- Use `transform` and `opacity` (GPU-accelerated)
- Avoid animating `box-shadow`, `border-radius` when possible

**Accessibility:**
- Respect `prefers-reduced-motion`
- Provide skip animation option
- Keep animations under 1 second

**Implementation:**
```tsx
import { motion } from 'framer-motion';

// Respects user preference
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{
    duration: 0.3,
    ease: 'easeOut'
  }}
  // Automatically respects prefers-reduced-motion
>
  {content}
</motion.div>
```

---

## Color System

### Tailwind Theme

Use Tailwind's default color palette with semantic naming:

**Primary Colors:**
- `slate-900` - Text, headings
- `slate-700` - Secondary text
- `slate-500` - Muted text
- `slate-200` - Borders
- `slate-100` - Backgrounds

**Accent Colors:**
- `blue-600` - Primary actions (links, buttons)
- `green-500` - Success states
- `red-500` - Error states
- `yellow-500` - Warning states
- `purple-600` - Team profiles

**Workspace Colors:**
- Use workspace.color for custom branding
- Support hex colors (#rrggbb)
- Apply to borders, badges, indicators

### Dark Mode (Future)

Currently light mode only. When implementing dark mode:
- Use CSS variables for colors
- Add `dark:` variants to all components
- Test with `prefers-color-scheme`

---

## Component Patterns

### Stat Cards with Number Ticker

**Before (Static):**
```tsx
<div className="p-6 bg-white rounded-lg shadow">
  <p className="text-sm text-gray-500">Total Engagement</p>
  <p className="text-3xl font-bold">{stats.totalEngagement}</p>
</div>
```

**After (Animated):**
```tsx
import { NumberTicker } from '@/components/ui/number-ticker';

<div className="p-6 bg-white rounded-lg shadow">
  <p className="text-sm text-gray-500">Total Engagement</p>
  <NumberTicker
    value={stats.totalEngagement}
    className="text-3xl font-bold"
  />
</div>
```

### Dashboard Layout with Bento Grid

```tsx
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid';

<BentoGrid>
  <BentoCard className="col-span-2">
    {/* Stats overview */}
  </BentoCard>
  <BentoCard>
    {/* Chart */}
  </BentoCard>
  <BentoCard className="row-span-2">
    {/* Recent posts */}
  </BentoCard>
</BentoGrid>
```

### Profile Cards with Animated Border

```tsx
import { AnimatedBorder } from '@/components/ui/animated-border';

<AnimatedBorder>
  <div className="p-6 bg-white rounded-lg">
    {/* Profile content */}
  </div>
</AnimatedBorder>
```

### Page Transitions with Blur Fade

```tsx
import { BlurFade } from '@/components/ui/blur-fade';

export default async function Page() {
  const data = await fetchData();

  return (
    <BlurFade>
      <div>
        {/* Page content */}
      </div>
    </BlurFade>
  );
}
```

### Lists with Animated List

```tsx
import { AnimatedList } from '@/components/ui/animated-list';

<AnimatedList>
  {posts.map(post => (
    <div key={post.id}>
      {/* Post content */}
    </div>
  ))}
</AnimatedList>
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goals**: Setup infrastructure, add high-impact components

**Tasks**:
1. ✅ Run `npx shadcn@latest init`
2. ✅ Install Framer Motion, Geist fonts
3. ✅ Add Tier 1 components (number-ticker, bento-grid, animated-list, blur-fade)
4. ✅ Update `app/layout.tsx` with Geist fonts
5. ✅ Add `BlurFade` to all main pages

**Files to Update**:
- `app/layout.tsx` - Fonts
- `app/page.tsx` - BentoGrid layout
- `components/EnhancedStatsCard.tsx` - NumberTicker
- All `page.tsx` files - BlurFade

### Phase 2: Visual Polish (Week 2)

**Goals**: Add visual effects, improve hover states

**Tasks**:
1. ✅ Add Tier 2 components (sparkles, animated-border, meteors, dot-pattern)
2. ✅ Update ProfileCard with AnimatedBorder
3. ✅ Add sparkles to high-value metrics
4. ✅ Add dot-pattern to page backgrounds

**Files to Update**:
- `components/ProfileCard.tsx` - AnimatedBorder + Meteors
- `components/EnhancedStatsCard.tsx` - Sparkles
- `app/layout.tsx` - DotPattern background

### Phase 3: Advanced Features (Week 3)

**Goals**: Replace charts, add advanced animations

**Tasks**:
1. ✅ Evaluate replacing Recharts with Magic UI charts
2. ✅ Add AnimatedBeam to AI insights
3. ✅ Implement ShimmerButton for primary actions
4. ✅ Performance optimization

**Files to Update**:
- `app/insights/page.tsx` - AnimatedBeam
- `components/ScrapeButton.tsx` - ShimmerButton
- Consider: Replace Recharts (may keep if working well)

---

## File Structure After Implementation

```
components/
  ui/                           # NEW: shadcn/ui + Magic UI components
    number-ticker.tsx           # Animated number counter
    bento-grid.tsx              # Dashboard layout
    animated-list.tsx           # Staggered list animations
    blur-fade.tsx               # Page transitions
    sparkles.tsx                # Sparkle effect
    animated-border.tsx         # Animated borders
    meteors.tsx                 # Meteor background
    dot-pattern.tsx             # Dot grid background
    animated-beam.tsx           # Data flow visualization
    shimmer-button.tsx          # Shimmer button effect
    [etc...]                    # Other components as needed

  # Existing components (to be updated)
  ProfileCard.tsx               # Wrap with AnimatedBorder
  EnhancedStatsCard.tsx         # Use NumberTicker + Sparkles
  SortablePostsTable.tsx        # Use AnimatedList
  AIChat.tsx                    # Add BlurFade transitions
  [etc...]

lib/
  utils.ts                      # NEW: cn() helper from shadcn
  db.ts                         # No changes needed
```

---

## Design Tokens

### Spacing

Use Tailwind's default spacing scale:
- `p-2` (8px) - Tight spacing
- `p-4` (16px) - Standard padding
- `p-6` (24px) - Card padding
- `p-8` (32px) - Section padding
- `gap-4` (16px) - Standard gap

### Shadows

```tsx
className="shadow-sm"     // Subtle elevation
className="shadow-md"     // Cards
className="shadow-lg"     // Modals
className="shadow-xl"     // Dropdowns
```

### Border Radius

```tsx
className="rounded"       // 4px - Small elements
className="rounded-lg"    // 8px - Cards
className="rounded-xl"    // 12px - Containers
className="rounded-full"  // Circle - Avatars
```

---

## Common Mistakes to Avoid

### ❌ Over-Animation

**Bad:**
```tsx
// Everything animates at once
<div className="animate-bounce animate-pulse animate-spin">
  {content}
</div>
```

**Good:**
```tsx
// Purposeful, single animation
<NumberTicker value={stat} />
```

### ❌ Ignoring Performance

**Bad:**
```tsx
// Animating box-shadow (expensive)
<motion.div animate={{ boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
```

**Good:**
```tsx
// Using transform (GPU-accelerated)
<motion.div animate={{ y: -2 }} />
```

### ❌ Not Respecting User Preferences

**Bad:**
```tsx
// No reduced motion check
<motion.div animate={{ opacity: 1 }} />
```

**Good:**
```tsx
// Framer Motion automatically respects prefers-reduced-motion
// Just use their components and it's handled
```

---

## Testing Checklist

Before shipping new animated components:

- [ ] Animations are under 1 second
- [ ] 60 FPS on low-end devices
- [ ] Works with `prefers-reduced-motion`
- [ ] No layout shifts during animation
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes
- [ ] Mobile performance is acceptable
- [ ] Animation serves a purpose (not decorative only)

---

## Resources

### Documentation
- **Magic UI**: https://magicui.design/docs
- **shadcn/ui**: https://ui.shadcn.com/docs
- **Framer Motion**: https://www.framer.com/motion/
- **Tailwind CSS**: https://tailwindcss.com/docs

### Component Browser
- **Magic UI Components**: https://magicui.design/ (browse all 150+ components)
- **shadcn/ui Components**: https://ui.shadcn.com/docs/components/accordion

### Inspiration
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Linear**: https://linear.app
- **Stripe Dashboard**: https://dashboard.stripe.com

---

## Version History

**v1.0.0 (October 26, 2025)**
- Initial design system documentation
- Magic UI + shadcn/ui integration guidelines
- Component catalog and implementation phases
- Animation principles and performance guidelines

---

## Notes for AI Assistants

When implementing design changes:

1. **Always check this file first** for approved components and patterns
2. **Follow the implementation phases** - Don't skip ahead
3. **Use the component catalog** - Don't add components not listed here
4. **Respect animation principles** - Purposeful, not decorative
5. **Test performance** - 60 FPS or don't ship
6. **Update this file** when adding new approved components

**Quick Reference**: See ADR-013 in `.claude/tracking/decisions.md` for the architectural decision behind this design system.
