/**
 * Component Utilities
 * Core utilities for building consistent, premium components
 */

import { designTokens } from '../design-system/tokens.js';

/**
 * Generate consistent component classes based on size and variant
 */
export const createComponentClasses = {
  /**
   * Button class generator - creates premium button styles
   */
  button: ({ variant = 'primary', size = 'base', state = 'default' }) => {
    const baseClasses = [
      'inline-flex items-center justify-center',
      'font-medium tracking-wide',
      'border border-transparent',
      'transition-all duration-200 ease-smooth',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'disabled:transform-none',
      'transform hover:scale-[1.02] active:scale-[0.98]',
    ];

    // Size-specific classes
    const sizeClasses = {
      micro: ['text-xs', 'px-2', 'py-1', 'h-5', 'rounded', 'min-w-[20px]'],
      xs: ['text-xs', 'px-2.5', 'py-1.5', 'h-6', 'rounded', 'min-w-[24px]'],
      sm: ['text-sm', 'px-3', 'py-2', 'h-8', 'rounded-md', 'min-w-[32px]'],
      base: ['text-base', 'px-4', 'py-2.5', 'h-10', 'rounded-md', 'min-w-[40px]'],
      lg: ['text-lg', 'px-6', 'py-3', 'h-12', 'rounded-lg', 'min-w-[48px]'],
      xl: ['text-xl', 'px-8', 'py-4', 'h-14', 'rounded-lg', 'min-w-[56px]'],
    };

    // Variant-specific classes
    const variantClasses = {
      primary: [
        'bg-primary text-primary-content',
        'hover:bg-primary-focus hover:shadow-primary',
        'focus:ring-primary/50',
        'active:bg-primary-focus',
      ],
      secondary: [
        'bg-secondary text-secondary-content',
        'hover:bg-secondary-focus hover:shadow-success',
        'focus:ring-secondary/50',
        'active:bg-secondary-focus',
      ],
      accent: [
        'bg-accent text-accent-content',
        'hover:bg-accent-focus hover:shadow-primary',
        'focus:ring-accent/50',
        'active:bg-accent-focus',
      ],
      outline: [
        'bg-transparent text-base-content border-base-300',
        'hover:bg-base-200 hover:border-base-400 hover:shadow-sm',
        'focus:ring-primary/30 focus:border-primary',
        'active:bg-base-300',
      ],
      ghost: [
        'bg-transparent text-base-content border-transparent',
        'hover:bg-base-200 hover:shadow-sm',
        'focus:ring-primary/30',
        'active:bg-base-300',
      ],
      'ghost-icon': [
        'bg-transparent text-base-content border-transparent p-2',
        'hover:bg-base-200 hover:shadow-sm rounded-lg',
        'focus:ring-primary/30',
        'active:bg-base-300',
        'aspect-square justify-center',
      ],
      link: [
        'bg-transparent text-primary border-transparent',
        'hover:text-primary-focus hover:underline',
        'focus:ring-primary/30',
        'active:text-primary-focus',
        'px-0 h-auto py-0 min-w-0',
      ],
      success: [
        'bg-success text-success-content',
        'hover:bg-success/90 hover:shadow-success',
        'focus:ring-success/50',
      ],
      warning: [
        'bg-warning text-warning-content',
        'hover:bg-warning/90 hover:shadow-warning',
        'focus:ring-warning/50',
      ],
      error: [
        'bg-error text-error-content',
        'hover:bg-error/90 hover:shadow-error',
        'focus:ring-error/50',
      ],
    };

    return [
      ...baseClasses,
      ...(sizeClasses[size] || sizeClasses.base),
      ...(variantClasses[variant] || variantClasses.primary),
    ].join(' ');
  },

  /**
   * Card class generator - creates premium card styles
   */
  card: ({ variant = 'default', padding = 'base', elevated = false }) => {
    const baseClasses = [
      'bg-base-100 border border-base-300',
      'transition-all duration-200 ease-smooth',
    ];

    const paddingClasses = {
      none: [],
      sm: ['p-4'],
      base: ['p-6'],
      lg: ['p-8'],
      xl: ['p-10'],
    };

    const variantClasses = {
      default: ['rounded-lg'],
      elevated: ['rounded-lg shadow-md hover:shadow-lg'],
      bordered: ['rounded-lg border-2'],
      glass: ['rounded-xl backdrop-blur-sm bg-base-100/80 border-base-300/50'],
    };

    const elevationClasses = elevated ? ['shadow-lg hover:shadow-xl'] : ['shadow-sm hover:shadow-md'];

    return [
      ...baseClasses,
      ...(paddingClasses[padding] || paddingClasses.base),
      ...(variantClasses[variant] || variantClasses.default),
      ...elevationClasses,
    ].join(' ');
  },

  /**
   * Input class generator - creates premium input styles
   */
  input: ({ size = 'base', state = 'default', variant = 'default' }) => {
    const baseClasses = [
      'w-full border rounded-md',
      'bg-base-100 text-base-content placeholder-base-content/50',
      'transition-all duration-200 ease-smooth',
      'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-base-200',
    ];

    const sizeClasses = {
      sm: ['text-sm', 'px-3', 'py-2', 'h-8'],
      base: ['text-base', 'px-4', 'py-2.5', 'h-10'],
      lg: ['text-lg', 'px-5', 'py-3', 'h-12'],
    };

    const stateClasses = {
      default: ['border-base-300 hover:border-base-400'],
      error: ['border-error focus:ring-error/30 focus:border-error'],
      success: ['border-success focus:ring-success/30 focus:border-success'],
      warning: ['border-warning focus:ring-warning/30 focus:border-warning'],
    };

    return [
      ...baseClasses,
      ...(sizeClasses[size] || sizeClasses.base),
      ...(stateClasses[state] || stateClasses.default),
    ].join(' ');
  },

  /**
   * Badge class generator - creates premium badge styles
   */
  badge: ({ variant = 'default', size = 'base' }) => {
    const baseClasses = [
      'inline-flex items-center justify-center',
      'font-medium rounded-full',
      'transition-all duration-200 ease-smooth',
    ];

    const sizeClasses = {
      xs: ['text-xs', 'px-2', 'py-0.5', 'h-4'],
      sm: ['text-xs', 'px-2.5', 'py-1', 'h-5'],
      base: ['text-sm', 'px-3', 'py-1', 'h-6'],
      lg: ['text-base', 'px-4', 'py-1.5', 'h-7'],
    };

    const variantClasses = {
      default: ['bg-base-200 text-base-content'],
      primary: ['bg-primary/10 text-primary border border-primary/20'],
      secondary: ['bg-secondary/10 text-secondary border border-secondary/20'],
      accent: ['bg-accent/10 text-accent border border-accent/20'],
      success: ['bg-success/10 text-success border border-success/20'],
      warning: ['bg-warning/10 text-warning border border-warning/20'],
      error: ['bg-error/10 text-error border border-error/20'],
      neutral: ['bg-neutral/10 text-neutral border border-neutral/20'],
    };

    return [
      ...baseClasses,
      ...(sizeClasses[size] || sizeClasses.base),
      ...(variantClasses[variant] || variantClasses.default),
    ].join(' ');
  },
};

/**
 * Animation utilities for premium interactions
 */
export const animations = {
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-200',
  slideInFromTop: 'animate-in slide-in-from-top-2 duration-300',
  slideInFromBottom: 'animate-in slide-in-from-bottom-2 duration-300',
  slideInFromLeft: 'animate-in slide-in-from-left-2 duration-300',
  slideInFromRight: 'animate-in slide-in-from-right-2 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  scaleOut: 'animate-out zoom-out-95 duration-200',
};

/**
 * Focus management utilities
 */
export const focus = {
  ring: 'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2',
  visible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
  within: 'focus-within:ring-2 focus-within:ring-primary/30',
};

/**
 * Layout utilities for consistent spacing and structure
 */
export const layout = {
  container: 'container mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-12 sm:py-16 lg:py-20',
  stack: 'space-y-6',
  stackSm: 'space-y-4',
  stackLg: 'space-y-8',
  grid: 'grid gap-6',
  flex: 'flex items-center gap-4',
  center: 'flex items-center justify-center',
};
