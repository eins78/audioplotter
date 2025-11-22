# Dark Mode

**Version:** 1.0
**Date:** 2025-11-21

## Overview

Dark mode detection follows the system's `prefers-color-scheme` setting. The app applies the theme automatically before page render, with no manual toggle or configuration.

## Features

- **Automatic Detection:** Detects system preference via `prefers-color-scheme` media query
- **No Configuration:** Uses OS-level dark/light mode settings directly
- **No Flash:** Theme applies before page render
- **Offline Support:** Works in PWA offline mode
- **Bootstrap 5:** Uses Bootstrap's `data-bs-theme` attribute

## How It Works

An inline script detects the system color scheme preference and applies the theme before React hydrates, preventing a theme flash.

**Light Mode**
- White backgrounds (#ffffff)
- Dark text (#212529)
- Light gray cards (#f8f9fa)

**Dark Mode**
- Dark backgrounds (#1a1a1a, #2d2d2d)
- Light text (#e0e0e0, #ffffff)
- Dark cards with subtle borders
- Purple accent (#500cbd)

## Styled Components

All UI elements adapt automatically:

- **Cards:** Dark background (#2d2d2d), subtle borders
- **Form Controls:** Dark input backgrounds with light text and purple focus border
- **Buttons:** Inverted outline colors
- **Range Sliders:** Purple thumbs
- **Collapsible Sections:** Dark headers with contrast

## SVG Preview

The SVG preview area uses independent styling:

- Background color controlled by Preview Settings
- Blend modes work in both themes
- Downloaded SVG includes the custom background, not UI theme colors

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

Requires:
- CSS custom properties support
- `prefers-color-scheme` media query support
- Chrome 76+, Firefox 67+, Safari 12.1+, Edge 79+

## Changing Your Theme

**macOS:** System Preferences → General → Appearance

**Windows:** Settings → Personalization → Colors

**Linux (GNOME):** Settings → Appearance

**iOS/iPadOS:** Settings → Display & Brightness

**Android:** Settings → Display → Dark theme

The app updates automatically when you change your system preference.

## Future Enhancements

Possible additions:
- Manual theme toggle override
- localStorage persistence for overrides
- Additional theme options
- Smooth theme transitions

## Files Modified

- `pages/_app.js` - Theme detection script
- `styles/style.scss` - Dark mode component styles
