# Interactive Africa Map Component

## Overview
A beautiful glassmorphic interactive map of Africa built with Next.js, React, and anime.js. Features smooth animations, dynamic tooltips, and responsive design.

## Features

### ✨ Glassmorphic Design
- Backdrop blur effects with `backdrop-filter: blur(15px)`
- Semi-transparent backgrounds with subtle borders
- Gradient overlays for enhanced visual appeal
- Responsive glass effects that adapt to screen size

### 🎯 Interactive Animations
- **Scale Animation**: Countries scale from 1 to 1.1 on hover
- **Color Transitions**: Smooth color changes with blue highlight
- **Glow Effects**: Drop-shadow effects for enhanced interactivity
- **Smooth Transitions**: Powered by anime.js for fluid animations

### 💫 Dynamic Tooltips
- Follow cursor position in real-time
- Display country names with enhanced styling
- Backdrop blur effects and subtle borders
- Arrow pointer for better UX

## Usage

### Basic Implementation
```jsx
import AfricaMap from "@/components/africa-map";

export default function MyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900">
      <AfricaMap />
    </div>
  );
}
```

### Demo Page
Visit `/africa-map-demo` to see the full implementation with:
- Gradient background
- Feature showcase cards
- Responsive layout
- Usage examples

## Technical Stack

- **Framework**: Next.js 15 with React
- **Animations**: anime.js for smooth interactions
- **Styling**: Tailwind CSS + Custom CSS
- **TypeScript**: Full type safety
- **Responsive**: Mobile-first design

## Countries Included

The map includes 20+ African countries with individual interactive paths:
- Algeria, Libya, Egypt, Morocco, Tunisia
- Nigeria, Ghana, Kenya, Ethiopia, Chad
- Niger, Mali, Côte d'Ivoire, Burkina Faso
- Uganda, Tanzania, Angola, Zambia, Zimbabwe
- South Africa, and more...

## Customization

### Adding New Countries
```typescript
const newCountry: CountryData = {
  id: "country-code",
  name: "Country Name", 
  path: "SVG path data"
};
```

### Styling Modifications
Edit `app/globals.css` to customize:
- `.glass-map` - Main container styling
- `.glass-card` - Feature card styling  
- `.country-path` - Individual country styling

### Animation Tweaks
Modify the anime.js parameters in `handleCountryEnter`:
```typescript
anime({
  targets: target,
  scale: 1.2, // Increase scale
  duration: 500, // Slower animation
  easing: 'easeOutElastic' // Different easing
});
```

## Browser Support

- ✅ Chrome, Firefox, Safari, Edge (modern versions)
- ✅ Mobile browsers with backdrop-filter support
- ⚠️ Fallback graceful degradation for older browsers

## Performance

- Optimized SVG paths for fast rendering
- Hardware acceleration with `transform3d`
- Efficient event handling with React hooks
- Minimal re-renders with proper state management

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install animejs @types/animejs
   ```

2. **Add Component**:
   Copy `components/africa-map.tsx` to your project

3. **Add Styles**:
   Include the glassmorphic CSS from `app/globals.css`

4. **Use Component**:
   Import and use in your pages

## Development

- **Local Server**: `npm run dev`
- **Build**: `npm run build`
- **Type Check**: `npm run type-check`

## Next Steps

Consider extending with:
- Real country data integration
- Click events for navigation
- Country statistics overlay
- Multiple map themes
- Animation presets
- Sound effects

---

**🎉 Ready to showcase your interactive Africa map!**

Visit `http://localhost:3000/africa-map-demo` to see it in action.