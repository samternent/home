/**
 * Design System Tokens
 * Inspired by Stripe and Airbnb design systems
 *
 * This file defines the foundational design tokens that create
 * a cohesive, premium visual language across all components.
 */

import { colors as foundationColors } from './foundation.js';

export const designTokens = {
  // === COLOR SYSTEM ===
  colors: {
    ...foundationColors,
  },

  // === SPACING SCALE ===
  // Based on 4px base unit with strategic scaling
  spacing: {
    px: '1px',
    0: '0',
    0.5: '2px',   // 0.125rem
    1: '4px',     // 0.25rem
    1.5: '6px',   // 0.375rem
    2: '8px',     // 0.5rem
    2.5: '10px',  // 0.625rem
    3: '12px',    // 0.75rem
    3.5: '14px',  // 0.875rem
    4: '16px',    // 1rem
    5: '20px',    // 1.25rem
    6: '24px',    // 1.5rem
    7: '28px',    // 1.75rem
    8: '32px',    // 2rem
    9: '36px',    // 2.25rem
    10: '40px',   // 2.5rem
    11: '44px',   // 2.75rem
    12: '48px',   // 3rem
    14: '56px',   // 3.5rem
    16: '64px',   // 4rem
    20: '80px',   // 5rem
    24: '96px',   // 6rem
    28: '112px',  // 7rem
    32: '128px',  // 8rem
    36: '144px',  // 9rem
    40: '160px',  // 10rem
    44: '176px',  // 11rem
    48: '192px',  // 12rem
    52: '208px',  // 13rem
    56: '224px',  // 14rem
    60: '240px',  // 15rem
    64: '256px',  // 16rem
    72: '288px',  // 18rem
    80: '320px',  // 20rem
    96: '384px',  // 24rem
  },

  // === TYPOGRAPHY SCALE ===
  // Carefully crafted type scale for hierarchy and readability
  typography: {
    fontSize: {
      xs: ['12px', '16px'],     // 0.75rem, line-height 1.33
      sm: ['14px', '20px'],     // 0.875rem, line-height 1.43
      base: ['16px', '24px'],   // 1rem, line-height 1.5
      lg: ['18px', '28px'],     // 1.125rem, line-height 1.56
      xl: ['20px', '28px'],     // 1.25rem, line-height 1.4
      '2xl': ['24px', '32px'],  // 1.5rem, line-height 1.33
      '3xl': ['30px', '36px'],  // 1.875rem, line-height 1.2
      '4xl': ['36px', '40px'],  // 2.25rem, line-height 1.11
      '5xl': ['48px', '56px'],  // 3rem, line-height 1.17
      '6xl': ['60px', '72px'],  // 3.75rem, line-height 1.2
      '7xl': ['72px', '80px'],  // 4.5rem, line-height 1.11
      '8xl': ['96px', '104px'], // 6rem, line-height 1.08
      '9xl': ['128px', '136px'], // 8rem, line-height 1.06
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    fontFamily: {
      sans: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ],
      mono: [
        '"JetBrains Mono"',
        '"Fira Code"',
        'Consolas',
        '"SF Mono"',
        'Monaco',
        'monospace',
      ],
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // === BORDER RADIUS ===
  // Consistent rounded corners that feel modern but not overly rounded
  borderRadius: {
    none: '0',
    xs: '2px',
    sm: '4px',
    base: '6px',    // Default for most elements
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
    full: '9999px',
  },

  // === SHADOWS ===
  // Subtle, layered shadows that create depth without being heavy
  shadow: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    
    // Colored shadows for interactive elements
    primary: '0 4px 14px 0 rgb(99 91 255 / 0.15)',
    success: '0 4px 14px 0 rgb(0 217 36 / 0.15)',
    warning: '0 4px 14px 0 rgb(255 167 38 / 0.15)',
    error: '0 4px 14px 0 rgb(226 89 80 / 0.15)',
  },

  // === TRANSITIONS ===
  // Smooth, professional animation timings
  transition: {
    duration: {
      fastest: '75ms',
      fast: '150ms',
      base: '200ms',
      medium: '300ms',
      slow: '500ms',
      slowest: '1000ms',
    },
    easing: {
      linear: 'linear',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      
      // Custom Stripe-inspired easings
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },

  // === Z-INDEX SCALE ===
  // Organized layering system
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },

  // === COMPONENT SIZING ===
  // Consistent sizing for interactive elements
  size: {
    button: {
      micro: { height: '20px', padding: '0 6px', fontSize: 'xs' },
      xs: { height: '24px', padding: '0 8px', fontSize: 'xs' },
      sm: { height: '32px', padding: '0 12px', fontSize: 'sm' },
      base: { height: '40px', padding: '0 16px', fontSize: 'base' },
      lg: { height: '48px', padding: '0 20px', fontSize: 'lg' },
      xl: { height: '56px', padding: '0 24px', fontSize: 'xl' },
    },
    input: {
      sm: { height: '32px', padding: '0 8px', fontSize: 'sm' },
      base: { height: '40px', padding: '0 12px', fontSize: 'base' },
      lg: { height: '48px', padding: '0 16px', fontSize: 'lg' },
    },
    avatar: {
      xs: '20px',
      sm: '24px',
      base: '32px',
      lg: '40px',
      xl: '48px',
      '2xl': '56px',
      '3xl': '64px',
    },
  },

  // === LAYOUT CONSTANTS ===
  layout: {
    maxWidth: {
      xs: '320px',
      sm: '384px',
      md: '448px',
      lg: '512px',
      xl: '576px',
      '2xl': '672px',
      '3xl': '768px',
      '4xl': '896px',
      '5xl': '1024px',
      '6xl': '1152px',
      '7xl': '1280px',
      full: '100%',
    },
    container: {
      padding: '16px',
      maxWidth: '1200px',
    },
    sidebar: {
      width: '240px',
      collapsedWidth: '64px',
    },
    header: {
      height: '64px',
    },
  },
};

// Export individual token categories for easy imports
export const { colors, spacing, typography, borderRadius, shadow, transition, zIndex, size, layout } = designTokens;
