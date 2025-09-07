/**
 * SLEEK THEME SYSTEM
 * Premium themes designed for modern SaaS applications
 * Inspired by Stripe, Linear, and Vercel
 */

export const sleek = {
  light: {
    "color-scheme": "light",
    
    // Primary brand colors
    "primary": "#635bff",           // Stripe purple - premium brand
    "primary-content": "#ffffff",
    "primary-focus": "#5b52ff",     
    
    // Secondary/success colors
    "secondary": "#00d924",         // Vibrant green for success states
    "secondary-content": "#ffffff",
    "secondary-focus": "#00c221",
    
    // Accent/info colors
    "accent": "#0073e6",            // Professional blue
    "accent-content": "#ffffff",
    "accent-focus": "#0066cc",
    
    // Neutral colors
    "neutral": "#425466",           // Sophisticated gray
    "neutral-content": "#ffffff",
    "neutral-focus": "#364252",
    
    // Base colors - ultra clean foundation
    "base-100": "#ffffff",          // Pure white background
    "base-200": "#fafbfc",          // Subtle off-white
    "base-300": "#e3e8ee",          // Light borders
    "base-content": "#0a2540",      // High contrast text
    
    // Status colors
    "info": "#0073e6",              
    "info-content": "#ffffff",
    "success": "#00d924",           
    "success-content": "#ffffff",
    "warning": "#f59e0b",           
    "warning-content": "#ffffff",
    "error": "#e11d48",             
    "error-content": "#ffffff",
    
    // Component customizations
    "--rounded-box": "0.75rem",     
    "--rounded-btn": "0.5rem",      
    "--rounded-badge": "1rem",      
    "--animation-btn": "0.2s",      
    "--animation-input": "0.2s",    
    "--btn-text-case": "none",      
    "--btn-focus-scale": "0.98",    
    "--border-btn": "1px",          
    "--tab-border": "2px",
    "--tab-radius": "0.5rem",
    
    // Premium additions
    "--shadow-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "--shadow": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    "--shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    "--shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
    "--shadow-xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    "--shadow-primary": "0 4px 14px 0 rgba(99, 91, 255, 0.25)",
  },
  
  dark: {
    "color-scheme": "dark",
    
    // Primary brand colors - brighter for dark mode
    "primary": "#8b7aff",           
    "primary-content": "#ffffff",
    "primary-focus": "#9c8dff",
    
    // Secondary/success colors
    "secondary": "#00f930",         
    "secondary-content": "#000000",
    "secondary-focus": "#33fa50",
    
    // Accent/info colors  
    "accent": "#0ea5e9",            
    "accent-content": "#ffffff",
    "accent-focus": "#38bdf8",
    
    // Neutral colors
    "neutral": "#64748b",           
    "neutral-content": "#ffffff",
    "neutral-focus": "#94a3b8",
    
    // Base colors - sophisticated dark palette
    "base-100": "#0f172a",          // Deep navy background
    "base-200": "#1e293b",          // Elevated surfaces
    "base-300": "#334155",          // Borders and dividers
    "base-content": "#f1f5f9",      // High contrast text
    
    // Status colors - optimized for dark mode
    "info": "#0ea5e9",              
    "info-content": "#ffffff",
    "success": "#00f930",           
    "success-content": "#000000", 
    "warning": "#f59e0b",           
    "warning-content": "#000000",
    "error": "#f43f5e",             
    "error-content": "#ffffff",
    
    // Component customizations
    "--rounded-box": "0.75rem",
    "--rounded-btn": "0.5rem",
    "--rounded-badge": "1rem",
    "--animation-btn": "0.2s",
    "--animation-input": "0.2s",
    "--btn-text-case": "none",
    "--btn-focus-scale": "0.98",
    "--border-btn": "1px",
    "--tab-border": "2px",
    "--tab-radius": "0.5rem",
    
    // Dark mode shadows
    "--shadow-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
    "--shadow": "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.2)",
    "--shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.2)",
    "--shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.2)",
    "--shadow-xl": "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
    "--shadow-primary": "0 4px 14px 0 rgba(139, 122, 255, 0.4)",
  },

  // Premium Glass variant for special use cases
  glass: {
    "color-scheme": "light",
    
    "primary": "#635bff",
    "primary-content": "#ffffff",
    "secondary": "#00d924",
    "secondary-content": "#ffffff", 
    "accent": "#0073e6",
    "accent-content": "#ffffff",
    "neutral": "#425466",
    "neutral-content": "#ffffff",
    
    // Glass morphism backgrounds
    "base-100": "rgba(255, 255, 255, 0.8)",
    "base-200": "rgba(255, 255, 255, 0.9)",
    "base-300": "rgba(227, 232, 238, 0.8)",
    "base-content": "#0a2540",
    
    "info": "#0073e6",
    "success": "#00d924",
    "warning": "#f59e0b",
    "error": "#e11d48",
    
    // Glass-specific properties
    "--rounded-box": "1rem",
    "--rounded-btn": "0.75rem",
    "--glass-opacity": "0.1",
    "--glass-border-opacity": "0.2",
    "--backdrop-blur": "blur(12px)",
    
    // Enhanced glass shadows
    "--shadow-glass": "0 8px 32px 0 rgba(99, 91, 255, 0.1)",
    "--shadow-glass-lg": "0 16px 64px 0 rgba(99, 91, 255, 0.15)",
  }
};
