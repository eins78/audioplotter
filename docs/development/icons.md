# Icons

**Last Updated:** December 2025
**Status:** Production

## Overview

audioplotter uses Bootstrap Icons via the `react-bootstrap-icons` package for consistent, scalable iconography throughout the UI.

## Installation

The package is installed via pnpm:

```bash
pnpm add react-bootstrap-icons
```

## Usage

Import icons by name and use as React components:

```javascript
import { Folder, Gear, MusicNoteBeamed } from 'react-bootstrap-icons'

// Basic usage
<Folder />

// With size and color
<Folder size={24} color="royalblue" />

// With Bootstrap utility classes
<Folder size={16} className="text-primary me-2" />
```

## Icon Reference

All icons used in the application:

| Purpose | Icon | Component | Size | Location |
|---------|------|-----------|------|----------|
| Audio/File section | folder | `<Folder />` | 16px | Section headers |
| Music/Frequency | music-note-beamed | `<MusicNoteBeamed />` | 16px | Section headers |
| Settings | gear | `<Gear />` | 16px | Section headers |
| Preview/Colors | palette | `<Palette />` | 16px | Section headers |
| Warning/Error | exclamation-triangle | `<ExclamationTriangle />` | 32px | Error state |
| Expand indicator | chevron-down | `<ChevronDown />` | 12px | Section headers |
| Collapse indicator | chevron-right | `<ChevronRight />` | 12px | Section headers |
| Zoom in | zoom-in | `<ZoomIn />` | 16px | Preview toolbar |
| Zoom out | zoom-out | `<ZoomOut />` | 16px | Preview toolbar |
| Fit all | fullscreen | `<Fullscreen />` | 16px | Preview toolbar |
| Pinned preview | pin-fill | `<PinFill />` | 16px | Preview toolbar |
| Unpinned preview | pin-angle | `<PinAngle />` | 16px | Preview toolbar |
| Download | download | `<Download />` | 16px | Preview toolbar |
| Empty state | music-note-beamed | `<MusicNoteBeamed />` | 48px | Placeholder |
| Ready state | music-note-beamed | `<MusicNoteBeamed />` | 32px | Placeholder |

## Props

All icons accept standard SVG props plus:

- `size` (number|string): Width and height in pixels. Default: 16
- `color` (string): Fill color. Default: "currentColor"
- `title` (string): Accessible title for screen readers
- `className` (string): CSS classes (automatically includes `bi bi-{name}`)
- `aria-hidden` (boolean): Hide from screen readers (use for decorative icons)
- `focusable` (boolean): Whether the icon can receive focus

## Accessibility Best Practices

### Decorative Icons

Icons that accompany text labels should be hidden from screen readers:

```jsx
<Folder size={16} aria-hidden="true" focusable="false" className="me-1" />
Audio File
```

All icons in audioplotter are **decorative** because they appear alongside descriptive text labels.

### Meaningful Icons

If an icon conveys meaning without accompanying text, use `role="img"` and `aria-label`:

```jsx
<ExclamationTriangle size={32} role="img" aria-label="Error" />
```

**Note:** This pattern is not currently used in audioplotter, but is documented for future reference.

## Implementation Details

### Inline SVG Rendering

`react-bootstrap-icons` renders each icon as an inline `<svg>` element in the DOM:

```html
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
     fill="currentColor" class="bi bi-folder" viewBox="0 0 16 16">
  <path d="..."/>
</svg>
```

This approach provides:
- **Tree-shaking**: Only imported icons are bundled
- **Color inheritance**: Icons use `currentColor` by default
- **No external dependencies**: No icon fonts or sprite files needed
- **Styling flexibility**: Can be styled with CSS like any SVG

### Bundle Size Impact

The `react-bootstrap-icons` package includes 2000+ icons but uses tree-shaking to include only imported icons in the bundle. audioplotter currently uses 13 unique icons.

## Finding Icons

Browse all available icons at: [https://icons.getbootstrap.com](https://icons.getbootstrap.com)

Icon names convert to PascalCase for React:
- `arrow-right` → `ArrowRight`
- `music-note-beamed` → `MusicNoteBeamed`
- `1-circle` → `Icon1Circle` (numeric prefix gets "Icon")

## Adding New Icons

1. Find the icon at [icons.getbootstrap.com](https://icons.getbootstrap.com)
2. Note the icon name (e.g., `gear-fill`)
3. Convert to PascalCase: `GearFill`
4. Import in your component:
   ```javascript
   import { GearFill } from 'react-bootstrap-icons'
   ```
5. Use with appropriate accessibility attributes:
   ```jsx
   <GearFill size={16} aria-hidden="true" focusable="false" />
   ```

## Why react-bootstrap-icons?

We chose `react-bootstrap-icons` because:

1. **Inline SVG**: Renders actual `<svg>` elements (not icon fonts)
2. **Tree-shaking**: Only imported icons are bundled
3. **React-native**: Named imports, props, works seamlessly with JSX
4. **Consistent**: Same icons as Bootstrap CSS framework already in use
5. **Simple**: No wrapper component or configuration needed
6. **Accessible**: Built-in support for ARIA attributes

## References

- [Bootstrap Icons](https://icons.getbootstrap.com/) - Official icon library
- [react-bootstrap-icons](https://github.com/ismamz/react-bootstrap-icons) - React component wrapper
- [Accessibility Guidelines](https://icons.getbootstrap.com/) - Best practices for icon usage
