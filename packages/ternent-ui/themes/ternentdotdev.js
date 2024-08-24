export const ternentDotDev = {
  "ternentdotdev-dark": {
    primary: "#6AB547", // Green
    secondary: "#D8829D", // Pink
    accent: "#D5B9B2", // Rose
    neutral: "#353535", // Very Dark Gray
    info: "#4BC0C0", // Turquoise
    success: "#77DD77", // Pastel Green
    warning: "#FFA500", // Orange
    error: "#E53935", // Red

    "color-scheme": "dark",
    neutral: "#3B3B3B",
    "base-100": "#1E1E1E",
    "base-200": "#2B2B2B",
    "base-300": "#333333",
    "base-content": "#DADADA",
    "--rounded-btn": "0rem",
    "--tab-border": "2px",
    "--tab-radius": "0.7rem",
  },
  "ternentdotdev-light": {
    primary: "#1E4D2B", // Green
    secondary: "#973044", // pink
    accent: "#70483C", // pale
    neutral: "#fcfcfc", // White
    info: "#81C784", // Light Green
    success: "#A5D6A7", // Pale Green
    warning: "#FFB74D", // Darker Orange
    error: "#E57373", // Light Red
    "color-scheme": "light",
    "base-100": "#faf7f5",
    "base-200": "#efeae6",
    "base-300": "#e7e2df",
    "base-content": "#291334",
    "--rounded-btn": "0rem",
    "--tab-border": "2px",
    "--tab-radius": "0.7rem",
  },

  "vibrant-light": {
    primary: "#28527a", // Navy Blue
    secondary: "#ff8303", // Bright Orange
    accent: "#12cad6", // Cyan
    neutral: "#ffffff", // White
    info: "#ff6700", // Deep Orange
    success: "#198754", // Forest Green
    warning: "#ffe400", // Lemon Yellow
    error: "#dc3545", // Strong Red
    "base-100": "#fafafa", // Very Light Gray (background)
    "base-200": "#f0f0f0", // Lighter Gray (secondary background)
    "base-300": "#e0e0e0", // Light Gray (tertiary background)
    "base-content": "#343a40", // Dark Gray (text color)
    "--rounded-box": "0.2em",
    "--rounded-btn": "0.2em",
    "--rounded-badge": "0.2em",
    "--tab-radius": "0.2em",
    "color-scheme": "light",
  },

  "vibrant-dark": {
    primary: "#ff922b", // Mango Orange
    secondary: "#12cad6", // Cyan
    accent: "#ff3838", // Bright Red
    neutral: "#212529", // Almost Black
    info: "#ffc107", // Amber
    success: "#28a745", // Shamrock Green
    warning: "#fd7e14", // Pumpkin Orange
    error: "#dc3545", // Strong Red
    "base-100": "#323232", // Dark Charcoal (background)
    "base-200": "#383838", // Slightly Darker Gray (secondary background)
    "base-300": "#404040", // Even Darker Gray (tertiary background)
    "base-content": "#f8f9fa", // Very Light Gray (text color)
    "--rounded-box": "0.2em",
    "--rounded-btn": "0.2em",
    "--rounded-badge": "0.2em",
    "--tab-radius": "0.2em",
    "color-scheme": "dark",
  },

  "custom-light": {
    primary: "#E63946", // Darker red-pink for good contrast
    secondary: "#3A0CA3", // Rich purple for contrast
    accent: "#F1FAEE", // Soft, light beige for accents
    neutral: "#333333", // Darker neutral for text
    "base-100": "#F9F9F9", // Very light gray background (bg-base-100)
    "base-200": "#F0F0F0", // Light gray background (bg-base-200)
    "base-300": "#E0E0E0", // Mid-tone gray background (bg-base-300)
    info: "#B3E5FC", // Very soft blue for info
    success: "#C8E6C9", // Very soft green for success
    warning: "#FFF59D", // Softer yellow for warning
    error: "#E57373", // Softer red for error
    "color-scheme": "light",
    // Gradient Background for Buttons and Headers
    "--btn-gradient": "linear-gradient(90deg, #F9F9F9, #E1E1E1)",

    // Accessibility adjustments
    "--primary-content": "#FFFFFF", // Light text on primary color
    "--secondary-content": "#333333", // Dark text on softer purple
    "--neutral-content": "#F9F9F9", // Light content for neutral color
    "--base-content": "#333333", // Dark text for readability on light background

    // Button Styles
    "--btn-bg": "#F1F1F1", // Very light background for buttons
    "--btn-text": "#333333", // Dark text color for contrast on light buttons
    "--btn-border": "#E1E1E1", // Soft border color for buttons
    "--btn-hover-bg": "#EDEDED", // Slightly darker background on hover
    "--btn-active-bg": "#D4D4D4", // Background color when button is active
    "--btn-focus-bg": "#F5F5F5", // Background color for focused buttons
    "--btn-disabled-bg": "#CCCCCC", // Disabled button background color
    "--btn-disabled-text": "#666666", // Disabled button text color

    // Border and Radius
    "--rounded-box": "0.5rem", // Softer radius for buttons and inputs
    "--rounded-btn": "0.5rem", // Softer radius for buttons
    "--border-width": "1px", // Thinner border width for a softer look

    // Shadows and Depth
    "--shadow-lg": "0 5px 10px -2px rgba(0, 0, 0, 0.1)", // Very soft shadow for depth
    "--shadow-xl": "0 10px 15px -3px rgba(0, 0, 0, 0.1)", // Larger but still soft shadow

    // Additional DaisyUI Variables
    "--link-color": "#D6A3D6", // Soft link color
    "--link-hover-color": "#E63946",
  },

  "custom-dark": {
    primary: "#F85661", // Vibrant red-pink (used sparingly)
    secondary: "#8A2BE2", // Rich purple (used sparingly)
    accent: "#FF6B81", // Softer accent derived from primary
    neutral: "#E6E6E6", // Light gray for neutral elements
    "base-100": "#121212", // Very dark background
    info: "#64B5F6", // Light blue for info (easier to read on dark background)
    success: "#66BB6A", // Light green for success (easier to read on dark background)
    warning: "#FFEB3B", // Light yellow for warning (easier to read on dark background)
    error: "#E57373", // Light red for error (easier to read on dark background)

    // Gradient Background for Buttons and Headers
    "--btn-gradient": "linear-gradient(90deg, #F85661, #8A2BE2)",

    // Accessibility adjustments
    "--primary-content": "#FFFFFF", // Light text on primary color
    "--secondary-content": "#FFFFFF", // Light text on secondary color
    "--neutral-content": "#121212", // Dark content for neutral color (used sparingly)
    "--base-content": "#E6E6E6", // Light text for readability on dark background

    // Border and Radius
    "--rounded-box": "1rem", // Large radius for buttons and inputs
    "--rounded-btn": "1rem", // Large radius for buttons
    "--border-width": "2px", // Consistent border width

    // Shadows and Depth
    "--shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.5)", // Dark shadow for depth
    "--shadow-xl": "0 20px 25px -5px rgba(0, 0, 0, 0.5)", // Larger shadow for modals/cards

    // Additional DaisyUI Variables
    "--btn-text": "#FFFFFF", // Button text color
    "--btn-focus": "#6F38D5", // Button focus border color
    "--btn-disabled": "#333333", // Disabled button background color
    "--input-bg": "#1E1E1E", // Dark background for input fields
    "--input-border": "#444444", // Border color for input fields
    "--input-text": "#E6E6E6", // Text color in input fields
    "--link-color": "#6F38D5", // Link color
    "--link-hover-color": "#F85661", // Link hover color
  },
};
