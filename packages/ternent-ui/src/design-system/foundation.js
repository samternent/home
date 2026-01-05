/**
 * COMPLETE DESIGN SYSTEM
 * World-class design tokens and utilities for premium SaaS interfaces
 * Inspired by Stripe, Airbnb, Linear, and Vercel
 */

// === CORE COLOR PALETTE ===
export const colors = {
  // Sophisticated grays (backbone of professional design)
  gray: {
    25: '#fcfcfd',
    50: '#f9fafb',
    100: '#f2f4f7', 
    200: '#e4e7ec',
    300: '#d0d5dd',
    400: '#98a2b3',
    500: '#667085',
    600: '#475467',
    700: '#344054',
    800: '#1d2939',
    900: '#101828',
    950: '#0c111d',
  },
  
  // Primary brand colors
  primary: {
    50: '#f0f0ff',
    100: '#e0e0ff',
    200: '#c7c7ff',
    300: '#a5a5ff',
    400: '#8080ff',
    500: '#635bff', // Main brand
    600: '#5b52ff',
    700: '#4f46e5',
    800: '#4338ca',
    900: '#3730a3',
    950: '#1e1b4b',
  },
  
  // Success/positive
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#00d924', // Main success
    600: '#00c221',
    700: '#00a01c',
    800: '#008018',
    900: '#006613',
  },
  
  // Warning/attention
  warning: {
    50: '#fefaf0',
    100: '#fef3c7',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f5a623', // Main warning
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  
  // Error/danger
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#e25950', // Main error
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Info/accent
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#0073e6', // Main info
    600: '#0066cc',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
};

// === SPACING SYSTEM ===
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px - Base unit
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  11: '2.75rem',   // 44px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  28: '7rem',      // 112px
  32: '8rem',      // 128px
  36: '9rem',      // 144px
  40: '10rem',     // 160px
  44: '11rem',     // 176px
  48: '12rem',     // 192px
  52: '13rem',     // 208px
  56: '14rem',     // 224px
  60: '15rem',     // 240px
  64: '16rem',     // 256px
  72: '18rem',     // 288px
  80: '20rem',     // 320px
  96: '24rem',     // 384px
};

// === TYPOGRAPHY SYSTEM ===
export const typography = {
  fontFamily: {
    sans: ['Inter var', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Consolas', 'monospace'],
    display: ['Cal Sans', 'Inter var', 'Inter', 'sans-serif'], // For headings
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],
    sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
    base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
    lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
    xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
    '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.05em' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.05em' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.075em' }],
    '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.075em' }],
    '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.075em' }],
    '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.075em' }],
    '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.075em' }],
    '9xl': ['8rem', { lineHeight: '1', letterSpacing: '-0.075em' }],
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
};

// === COMPONENT SYSTEM ===
export const components = {
  // Button variants with precise styling
  button: {
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '500',
      transition: 'color 180ms ease, background-color 180ms ease, box-shadow 180ms ease',
      borderRadius: '0.75rem',
      border: '1px solid transparent',
      cursor: 'pointer',
      outline: 'none',
      position: 'relative',
      overflow: 'hidden',
    },
    
    sizes: {
      xs: {
        height: '1.75rem', // 28px
        padding: '0 0.6rem',
        fontSize: '0.75rem',
        gap: '0.25rem',
      },
      sm: {
        height: '2rem', // 32px
        padding: '0 0.85rem',
        fontSize: '0.8125rem',
        gap: '0.35rem',
      },
      base: {
        height: '2.5rem', // 40px
        padding: '0 1rem',
        fontSize: '0.875rem',
        gap: '0.5rem',
      },
      lg: {
        height: '2.75rem', // 44px
        padding: '0 1.15rem',
        fontSize: '0.9375rem',
        gap: '0.45rem',
      },
      xl: {
        height: '3rem', // 48px
        padding: '0 1.35rem',
        fontSize: '1rem',
        gap: '0.6rem',
      },
    },
    
    variants: {
      primary: {
        backgroundColor: colors.primary[500],
        color: 'white',
        hover: {
          backgroundColor: colors.primary[600],
          boxShadow: '0 6px 18px rgba(99, 91, 255, 0.18)',
        },
        focus: {
          boxShadow: '0 0 0 3px rgba(99, 91, 255, 0.2)',
        },
      },
      secondary: {
        backgroundColor: colors.gray[100],
        color: colors.gray[800],
        border: `1px solid ${colors.gray[300]}`,
        hover: {
          backgroundColor: colors.gray[200],
          borderColor: colors.gray[400],
          boxShadow: '0 8px 20px rgba(52, 64, 84, 0.08)',
        },
      },
      outline: {
        backgroundColor: 'transparent',
        color: colors.primary[600],
        border: `1px solid ${colors.primary[300]}`,
        hover: {
          backgroundColor: colors.primary[50],
          borderColor: colors.primary[400],
          boxShadow: '0 0 0 1px rgba(99, 91, 255, 0.25)',
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: colors.gray[700],
        hover: {
          backgroundColor: colors.gray[100],
        },
      },
    },
  },
  
  // Card system
  card: {
    base: {
      backgroundColor: 'white',
      borderRadius: '0.75rem',
      border: `1px solid ${colors.gray[200]}`,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: 'all 200ms ease-out',
    },
    variants: {
      default: {},
      elevated: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        hover: {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          transform: 'translateY(-2px)',
        },
      },
      interactive: {
        cursor: 'pointer',
        hover: {
          borderColor: colors.primary[300],
          boxShadow: '0 4px 12px rgba(99, 91, 255, 0.15)',
        },
      },
    },
  },
  
  // Input system
  input: {
    base: {
      width: '100%',
      padding: '0.5rem 0.75rem',
      backgroundColor: 'white',
      border: `1px solid ${colors.gray[300]}`,
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      transition: 'all 200ms ease-out',
      outline: 'none',
    },
    states: {
      focus: {
        borderColor: colors.primary[500],
        boxShadow: '0 0 0 3px rgba(99, 91, 255, 0.1)',
      },
      error: {
        borderColor: colors.error[500],
        boxShadow: '0 0 0 3px rgba(226, 89, 80, 0.1)',
      },
      disabled: {
        backgroundColor: colors.gray[50],
        color: colors.gray[400],
        cursor: 'not-allowed',
      },
    },
  },
};

// === LAYOUT SYSTEM ===
export const layout = {
  containers: {
    xs: '20rem',    // 320px
    sm: '24rem',    // 384px
    md: '28rem',    // 448px
    lg: '32rem',    // 512px
    xl: '36rem',    // 576px
    '2xl': '42rem', // 672px
    '3xl': '48rem', // 768px
    '4xl': '56rem', // 896px
    '5xl': '64rem', // 1024px
    '6xl': '72rem', // 1152px
    '7xl': '80rem', // 1280px
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  grid: {
    cols: 12,
    gap: '1.5rem', // 24px
  },
  
  app: {
    headerHeight: '4rem',     // 64px
    sidebarWidth: '16rem',    // 256px
    sidebarCollapsed: '4rem', // 64px
    maxContentWidth: '80rem', // 1280px
  },
};

// === ANIMATION SYSTEM ===
export const animations = {
  durations: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  easings: {
    linear: 'linear',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  micro: {
    hover: 'transform 200ms ease-out',
    press: 'transform 100ms ease-out',
    focus: 'box-shadow 200ms ease-out',
  },
};

// === Z-INDEX SCALE ===
export const zIndex = {
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
};

// Export everything as the complete design system
export const designSystem = {
  colors,
  spacing,
  typography,
  components,
  layout,
  animations,
  zIndex,
};
