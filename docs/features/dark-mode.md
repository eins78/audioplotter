# Dark Mode

**Version:** 2.0
**Last Updated:** December 6, 2025
**Status:** Production

## Overview

audioplotter automatically adapts to your system's dark mode preference. When you enable dark mode on your device, the app instantly switches to a dark theme with carefully adjusted colors for comfortable viewing in low-light environments.

**Key Features:**
- Automatic detection of your system preference
- Instant updates when you change your system settings
- No manual toggle needed
- Works offline (PWA support)

## How It Works

The app detects your operating system's dark mode setting and applies the appropriate theme automatically. When you switch between light and dark mode in your system settings, audioplotter updates within milliseconds—no page refresh required.

**What Changes:**

**Light Mode:**
- Bright white backgrounds
- Dark text for easy reading
- Light cards and form elements
- Original purple accent color (#500cbd)

**Dark Mode:**
- Deep dark backgrounds for reduced eye strain
- Light text (#e0e0e0) for comfortable reading
- Darker cards with subtle borders
- Lighter purple accent (#9d6fff) for better visibility

## Visual Adaptations

All interface elements automatically adjust for dark mode:

**Cards and Panels:**
- Dark gray backgrounds (#2d2d2d) instead of white
- Subtle borders for depth without harsh contrast
- Darker headers with good text contrast

**Form Controls:**
- Dark input backgrounds with light text
- Bright purple focus borders for clear interaction feedback
- Range sliders with visible purple thumbs

**Buttons:**
- Inverted color scheme for dark backgrounds
- Lighter purple accents for better visibility
- Clear hover states

**Text and Links:**
- Light gray text (#e0e0e0) for comfortable reading
- Pure white (#ffffff) for important headings
- Lighter purple links that stand out against dark backgrounds

## SVG Preview Independence

The SVG visualization preview area operates independently from the UI theme. Its background color is controlled by the "Preview Settings" section, not by your system's dark mode preference. This lets you preview your waveforms with any background color you choose, regardless of whether your device is in light or dark mode.

## Changing Your System Theme

To switch between light and dark mode, change your device's appearance settings:

**macOS:**
1. Open System Preferences (or System Settings)
2. Go to General → Appearance
3. Choose Light, Dark, or Auto

**Windows 10/11:**
1. Open Settings
2. Go to Personalization → Colors
3. Choose your color mode: Light, Dark, or Custom

**Linux (GNOME):**
1. Open Settings
2. Go to Appearance
3. Toggle between Light and Dark

**iOS/iPadOS:**
1. Open Settings
2. Go to Display & Brightness
3. Choose Light or Dark (or enable Automatic)

**Android:**
1. Open Settings
2. Go to Display
3. Enable or disable Dark theme

**The app updates automatically**—you don't need to refresh or restart audioplotter.

## Browser Support

Dark mode works in all modern browsers that support:
- CSS custom properties (CSS variables)
- `prefers-color-scheme` media query
- OKLCH color space (for optimal color rendering)

**Supported Browsers:**
- Chrome 111+ (March 2023 or later)
- Firefox 113+ (May 2023 or later)
- Safari 16.4+ (March 2023 or later)
- Edge 111+ (March 2023 or later)

**Coverage:** 92%+ of global users (as of December 2025)

## Future Enhancements

Potential future additions:
- Manual theme toggle (override system preference)
- localStorage persistence for manual overrides
- Additional color themes beyond light/dark
- Smooth animated transitions when switching themes

---

**For Developers:** Technical implementation details, code examples, and architecture documentation are available in [docs/development/theme-and-colors.md](../development/theme-and-colors.md).
