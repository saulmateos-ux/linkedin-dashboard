/**
 * Design Tokens - LinkedIn Analytics Dashboard
 *
 * Central source of truth for all design decisions.
 * Based on modern SaaS design principles with low-light aesthetic.
 *
 * @see .claude/docs/DESIGN-STRATEGY.md
 */

export const tokens = {
  /**
   * Color System
   * Low-light aesthetic with muted, sophisticated tones
   */
  colors: {
    // Background layers (depth through elevation, not shadows)
    background: {
      primary: '#121212',      // Dark gray, not pure black
      elevated: '#1E1E1E',     // Lighter surfaces for depth
      card: '#252525',         // Card backgrounds
      overlay: 'rgba(255, 255, 255, 0.05)', // Subtle overlays
      glass: 'rgba(255, 255, 255, 0.02)',   // Glassmorphism
    },

    // Text hierarchy (desaturated for dark theme)
    text: {
      primary: '#E5E7EB',      // Main text - high contrast
      secondary: '#9CA3AF',    // Supporting text
      tertiary: '#6B7280',     // Metadata, timestamps
      disabled: '#4B5563',     // Disabled state
      inverse: '#1F2937',      // Text on light backgrounds
    },

    // Accent colors (muted, not vibrant)
    accent: {
      blue: '#4A90E2',         // Primary actions
      green: '#52C41A',        // Success states
      purple: '#9333EA',       // Team profiles
      yellow: '#F59E0B',       // Warnings
      red: '#EF4444',          // Errors
    },

    // Semantic colors (WCAG 2.2 compliant)
    semantic: {
      success: {
        bg: '#10B981',
        text: '#D1FAE5',
        border: '#059669',
      },
      error: {
        bg: '#EF4444',
        text: '#FEE2E2',
        border: '#DC2626',
      },
      warning: {
        bg: '#F59E0B',
        text: '#FEF3C7',
        border: '#D97706',
      },
      info: {
        bg: '#3B82F6',
        text: '#DBEAFE',
        border: '#2563EB',
      },
    },

    // Border colors (subtle)
    border: {
      default: 'rgba(255, 255, 255, 0.1)',
      hover: 'rgba(255, 255, 255, 0.2)',
      focus: '#4A90E2',
      divider: 'rgba(255, 255, 255, 0.05)',
    },
  },

  /**
   * Typography System
   * Geist Sans for UI, Geist Mono for data
   */
  typography: {
    // Font families
    fontFamily: {
      sans: 'var(--font-geist-sans)',
      mono: 'var(--font-geist-mono)',
    },

    // Type scale (1.25 ratio)
    fontSize: {
      xs: '12px',       // Captions, metadata
      sm: '14px',       // Supporting text
      base: '16px',     // Body copy
      lg: '20px',       // Section headings
      xl: '24px',       // Card titles
      '2xl': '30px',    // Page titles
      '3xl': '38px',    // Hero stats
      '4xl': '48px',    // Large displays
    },

    // Line heights
    lineHeight: {
      tight: 1.2,       // Headlines
      normal: 1.5,      // Body text
      relaxed: 1.6,     // Long-form content
    },

    // Font weights
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    // Letter spacing
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.02em',
    },
  },

  /**
   * Spacing System
   * 8px base grid for consistency
   */
  spacing: {
    0: '0',
    0.5: '4px',       // Tight spacing
    1: '8px',         // Base unit
    2: '16px',        // Standard spacing
    3: '24px',        // Medium spacing
    4: '32px',        // Large spacing
    5: '40px',        // XL spacing
    6: '48px',        // 2XL spacing
    8: '64px',        // 3XL spacing
    10: '80px',       // 4XL spacing
    12: '96px',       // 5XL spacing
    16: '128px',      // 6XL spacing
  },

  /**
   * Border Radius
   * Soft, modern corners
   */
  borderRadius: {
    none: '0',
    sm: '4px',        // Small elements
    md: '8px',        // Cards, buttons
    lg: '12px',       // Containers
    xl: '16px',       // Large containers
    '2xl': '24px',    // Hero sections
    full: '9999px',   // Circles, pills
  },

  /**
   * Shadows (minimal, subtle)
   * Used sparingly in low-light theme
   */
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    glow: '0 0 20px rgba(74, 144, 226, 0.3)', // Accent glow
  },

  /**
   * Animation System
   * Purposeful, performant motion
   */
  animation: {
    // Duration (in milliseconds)
    duration: {
      instant: 50,      // Instant feedback (hover states)
      fast: 150,        // Micro-interactions (button clicks)
      normal: 200,      // Standard transitions (menu open)
      slow: 300,        // Modal transitions
      complex: 400,     // Page transitions
      elaborate: 500,   // Multi-step animations
    },

    // Easing functions
    easing: {
      // Entrances (objects coming in)
      out: 'cubic-bezier(0.16, 1, 0.3, 1)',

      // Exits (objects leaving)
      in: 'cubic-bezier(0.7, 0, 0.84, 0)',

      // Transitions (state changes)
      inOut: 'cubic-bezier(0.87, 0, 0.13, 1)',

      // Playful (use sparingly)
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },

  /**
   * Z-index layers
   * Consistent stacking context
   */
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    toast: 1400,
    tooltip: 1500,
  },

  /**
   * Breakpoints
   * Mobile-first responsive design
   */
  breakpoints: {
    sm: '640px',      // Mobile landscape
    md: '768px',      // Tablet
    lg: '1024px',     // Desktop
    xl: '1280px',     // Large desktop
    '2xl': '1536px',  // Extra large
  },

  /**
   * Layout constraints
   */
  layout: {
    maxWidth: {
      content: '1440px',    // Dashboard content
      prose: '720px',       // Long-form text
      modal: '640px',       // Modals
    },
    minWidth: {
      card: '280px',        // Stat cards
      button: '44px',       // Touch targets
    },
    minHeight: {
      touch: '44px',        // WCAG 2.2 target size
    },
  },

  /**
   * Opacity levels
   * For overlays and states
   */
  opacity: {
    disabled: 0.4,
    hover: 0.8,
    pressed: 0.6,
    overlay: 0.95,
  },

  /**
   * Blur effects
   * For glassmorphism
   */
  blur: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
} as const;

/**
 * Type-safe token accessor
 */
export type DesignTokens = typeof tokens;

/**
 * Helper to get token values
 */
export const getToken = <T extends keyof DesignTokens>(category: T): DesignTokens[T] => {
  return tokens[category];
};

/**
 * CSS variable mapping
 * Use these in Tailwind config or CSS
 */
export const cssVariables = {
  // Colors
  '--color-bg-primary': tokens.colors.background.primary,
  '--color-bg-elevated': tokens.colors.background.elevated,
  '--color-bg-card': tokens.colors.background.card,
  '--color-text-primary': tokens.colors.text.primary,
  '--color-text-secondary': tokens.colors.text.secondary,
  '--color-accent-blue': tokens.colors.accent.blue,

  // Typography
  '--font-sans': tokens.typography.fontFamily.sans,
  '--font-mono': tokens.typography.fontFamily.mono,

  // Spacing
  '--space-1': tokens.spacing[1],
  '--space-2': tokens.spacing[2],
  '--space-3': tokens.spacing[3],
  '--space-4': tokens.spacing[4],

  // Animation
  '--duration-fast': `${tokens.animation.duration.fast}ms`,
  '--duration-normal': `${tokens.animation.duration.normal}ms`,
  '--ease-out': tokens.animation.easing.out,
} as const;

export default tokens;
