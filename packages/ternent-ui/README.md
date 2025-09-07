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

Ternent UI comes with several built-in themes:

```javascript
// Available themes
const themes = [
  'azureBloom',
  'azureBloomDark', 
  'corporateProfessional',
  'corporateDark',
  'neonBlanc',
  'neonNoir',
  'marshmallowLight',
  'coffeeShop',
  'wallsOfLight'
];

// Apply theme
document.documentElement.setAttribute('data-theme', 'azureBloom');
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
