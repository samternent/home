# Ternent UI

A modern, comprehensive Vue 3 design system built with Tailwind CSS and DaisyUI. Inspired by the elegant design patterns of Slack and Stripe, Ternent UI provides a complete set of polished, accessible components for building beautiful web applications.

## ✨ Features

- **Modern Design**: Clean, professional aesthetics with subtle animations and glassmorphism effects
- **Comprehensive Component Library**: 30+ carefully crafted components covering all common UI patterns
- **Accessibility First**: Built with screen readers and keyboard navigation in mind
- **Fully Responsive**: All components work seamlessly across devices
- **TypeScript Ready**: Full TypeScript support with proper prop definitions
- **Theme System**: Multiple built-in themes with easy customization
- **Zero Dependencies**: Only requires Vue 3, no external UI libraries needed
- **Tree Shakeable**: Import only the components you need

## 🚀 Quick Start

```bash
npm install ternent-ui
```

```javascript
// Import individual components
import { SButton, SCard, SInput } from "ternent-ui/components";

// Import styles
import "ternent-ui/styles";
```

## 📦 Components

### Canonical component APIs
The library now ships a single polished implementation for each component, aligning prop names, sizes, and variants across controls:

- **Shared sizing**: `xs`, `sm`, `md`, `lg`, `xl` (with backwards-compatible aliases like `base` → `md`).
- **Shared color palette**: `primary`, `secondary`, `accent`, `info`, `success`, `warning`, `error`, `neutral`, plus optional premium/ghost tones where applicable.
- **Data attributes**: each control surfaces `data-size` and `data-variant`/`data-tone` for consistent styling hooks.

| Component | Key props | Variants & sizes |
| --- | --- | --- |
| `SButton` | `variant` (visual style), `size`, `loading`, `disabled`, `icon`, `fullWidth`, navigation props (`to`, `href`, `external`), a11y (`ariaLabel`, `ariaDescribedBy`) | Sizes `xs`-`xl` (+ `micro`), variants `primary`, `secondary`, `accent`, `outline`, `ghost`, `ghost-icon`, `link`, `success`, `warning`, `error` |
| `SIndicator` | `variant` (style: `solid`, `outline`, `soft`, `glow`, `glass`), `type`/`color` (palette), `size`, animation flags (`pulse`, `animated`) | Sizes `xs`-`xl`; tone palette matches button variants |
| `SInput` | `modelValue`, `type`, `size`, `variant` (`default`, `filled`, `borderless`, `ghost`), `label`, `placeholder`, `error`, `hint`, `icon` & `iconPosition`, `loading`, `disabled`, `required` | Sizes `xs`-`xl` with matching padding and icon spacing |

### Form Controls
- **SButton** - Enhanced buttons with ripple effects, loading states, and multiple variants
- **SInput** - Modern input fields with floating labels, icons, and validation states
- **SFileInput** - Drag-and-drop file input with preview capabilities

### Layout & Navigation
- **SNavBar** - Responsive navigation with glassmorphism and sticky positioning
- **STabs** - Modern tab navigation with multiple styles (underline, pills, bordered)
- **SBreadcrumbs** - Customizable breadcrumb navigation with icons
- **SDrawerRight/SDrawerLeft** - Sliding panel drawers with backdrop blur
- **SFooter** - Clean footer with flexible layouts

### Data Display
- **SCard** - Flexible card component with multiple variants (elevated, glass, gradient)
- **SAlert** - Enhanced alerts with icons, dismissible options, and animations
- **SBanner** - Prominent banners for important announcements
- **SAvatar** - User avatars with status indicators and multiple sizes
- **SIndicator** - Badges and status indicators with solid, outline, and soft variants
- **SProgress** - Progress bars with gradients, stripes, and indeterminate states
- **STimeline** - Vertical timeline for displaying chronological data

### Feedback & Loading
- **SSpinner** - Customizable loading spinners with multiple sizes and colors
- **SSkeleton** - Loading skeletons with shimmer animations
- **SToast** - Toast notifications with positioning and auto-dismiss

### Overlays & Modals
- **SModal** - Modern modal dialogs with backdrop blur and smooth animations
- **SDropdown** - Enhanced dropdowns with glassmorphism and smooth transitions
- **SMenu** - Context menus with keyboard navigation and icons

### Utilities
- **SThemeToggle** - Theme switcher component
- **SResizer** - Resizable panel component
- **SResizablePanels** - Multi-panel layout with drag-to-resize
- **SSwap** - Animated content swapping

## 🎨 Design Principles

### Modern Aesthetics
- Subtle shadows and depth
- Smooth transitions and micro-interactions
- Glassmorphism effects for overlays
- Professional color palettes

### Consistent Spacing
- 8px grid system
- Comfortable padding and margins
- Responsive breakpoints

### Enhanced Typography
- System font stacks for optimal performance
- Proper font weights and line heights
- Accessible contrast ratios

## 🎭 Theming

Ternent UI uses CSS custom properties with data-attribute driven themes. You can
lazy-load a theme CSS file and swap themes by updating `data-theme` on the root
element.

```javascript
import "ternent-ui/styles.css";

// Lazy-load the print themes only when needed
await import("ternent-ui/themes/print.css");

// Apply theme
document.documentElement.setAttribute("data-theme", "print-light");
```

Built-in CSS theme files:

- `print.css` → `print-light`, `print-dark`
- `neon-noir.css` → `neon-noir`
- `spruce-ink.css` → `spruce-light`, `spruce-dark`
- `citrine-ash.css` → `citrine-light`, `citrine-dark`
- `harbor-rose.css` → `harbor-light`, `harbor-dark`
- `obsidian-iris.css` → `obsidian-light`, `obsidian-dark`
- `garnet-honey.css` → `garnet-light`, `garnet-dark`
- `prism.css` → `prism-light`, `prism-dark`
- `sunset.css` → `sunset-light`, `sunset-dark`
- `aurora.css` → `aurora-light`, `aurora-dark`

### CSS Custom Properties

All themes expose a shared set of `--ui-*` tokens. You can import the token
documentation from `ternent-ui/components`:

```javascript
import { uiCssTokenDocs, uiCssTokens } from "ternent-ui/components";
```

## 💫 Animations

All components include thoughtful animations:

- **Fade In** - Smooth opacity transitions
- **Slide Up/Down** - Directional slide animations  
- **Scale In** - Gentle scaling effects
- **Bounce In** - Playful bounce animations
- **Pulse Subtle** - Gentle pulsing for loading states

## 🔧 Customization

### CSS Custom Properties

Ternent UI uses CSS custom properties for easy theming:

```css
:root {
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
}
```

### Utility Classes

Use built-in utility classes for consistent styling:

```html
<div class="card-modern">
  <div class="section-padding">
    <h2 class="text-gradient">Beautiful Heading</h2>
    <p class="text-muted">Subtle text content</p>
  </div>
</div>
```

## 📱 Responsive Design

All components are mobile-first and fully responsive:

- Breakpoint system based on Tailwind CSS
- Touch-friendly interaction targets
- Optimized layouts for all screen sizes

## ♿ Accessibility

- Semantic HTML markup
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Reduced motion preferences

## 🔄 Migration from v0.1.x

Version 0.2.0 introduces many breaking changes for a better developer experience:

### Component Updates
- `SAlert` now has `type`, `dismissible` props
- `SButton` enhanced with `loading`, `size`, `variant` props
- `SInput` completely rewritten with better API
- New components: `SModal`, `SToast`, `SProgress`

### Style Changes
- Modern class naming convention
- Enhanced CSS custom properties
- New utility classes

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## 📄 License

MIT License - see LICENSE file for details.

## 🛠 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build package
npm run build

# Run tests
npm run test
```

---

Built with ❤️ by the Ternent team. For support and documentation, visit our website.
