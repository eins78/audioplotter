# Dark Mode

**Version:** 1.0
**Date:** 2025-11-21
**Status:** Production Ready

## Overview

Automatic dark mode support that follows your system's color scheme preference. The UI seamlessly switches between light and dark themes without requiring manual toggle or configuration.

## Features

- **Automatic Detection:** Follows system preference via `prefers-color-scheme` media query
- **No Toggle Needed:** Respects OS-level dark/light mode settings
- **Instant Application:** Theme applied before page render (no flash)
- **PWA Compatible:** Works offline
- **Bootstrap 5 Native:** Built on Bootstrap's `data-bs-theme` attribute

## How It Works

When the page loads, a small inline script detects your system's color scheme preference and applies the appropriate theme. The detection happens instantly, before React hydrates, preventing any flash of incorrect theme.

**Light Mode (System Default)**
- White backgrounds (#ffffff)
- Dark text (#212529)
- Light gray cards (#f8f9fa)
- Standard Bootstrap colors

**Dark Mode (System Dark)**
- Dark backgrounds (#1a1a1a, #2d2d2d)
- Light text (#e0e0e0, #ffffff)
- Dark cards with subtle borders
- Purple accent color maintained (#500cbd)

## Styled Components

All UI elements adapt automatically:

- **Cards:** Dark background (#2d2d2d), subtle borders
- **Form Controls:** Dark inputs with light text, purple focus border
- **Buttons:** Inverted outline colors for dark backgrounds
- **Range Sliders:** Purple thumbs for consistency
- **Collapsible Sections:** Dark headers with proper contrast

## SVG Preview

The SVG preview area is **independent** of UI theme:

- Background color controlled by "Preview Settings"
- Blend modes work in both UI themes
- Download includes your custom background, not UI theme

## Technical Details

### Implementation

**Theme Detection (pages/_app.js)**
```javascript
<script dangerouslySetInnerHTML={{
  __html: `
    (function() {
      const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-bs-theme', theme);
    })();
  `
}} />
```

**Dark Mode Styles (styles/style.scss)**
```scss
[data-bs-theme='dark'] {
  --bs-body-bg: #1a1a1a;
  --bs-body-color: #e0e0e0;
  // ... custom component styling
}
```

### Color Palette

**Dark Mode Colors:**
- Body background: `#1a1a1a`
- Card background: `#2d2d2d`
- Card header: `#242424`
- Text: `#e0e0e0`
- Emphasis text: `#ffffff`
- Borders: `#404040`
- Primary (accent): `#500cbd` (purple, unchanged)

**Light Mode:** Standard Bootstrap 5 defaults

## Browser Support

Works in all modern browsers with:
- CSS custom properties
- `prefers-color-scheme` media query support
- Chrome 76+, Firefox 67+, Safari 12.1+, Edge 79+

## Changing Your Theme

**macOS:**
- System Preferences → General → Appearance → Dark/Light

**Windows:**
- Settings → Personalization → Colors → Choose your color

**Linux (GNOME):**
- Settings → Appearance → Dark/Light

**iOS/iPadOS:**
- Settings → Display & Brightness → Dark/Light

**Android:**
- Settings → Display → Dark theme

The app will update automatically when you change your system preference.

## Future Enhancements

Possible additions (not currently implemented):
- Manual override toggle (independent of system preference)
- localStorage persistence for manual override
- Multiple theme options (not just light/dark)
- Smooth theme transition animations

## Files Modified

- `pages/_app.js` - Theme detection script
- `styles/style.scss` - Dark mode component styles

---

**Respects your preferences, no configuration needed** 🌙
