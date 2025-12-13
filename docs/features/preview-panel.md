# Preview Panel

**Version:** 2.0
**Date:** December 2025
**Status:** Production Ready

## Overview

The preview panel provides an interactive, resizable workspace for viewing and manipulating your waveform visualization before downloading. You can pin it to stay visible while scrolling, resize it to your preferred height, and use pan/zoom controls to inspect details.

## Features

### Sticky Mode (Pin/Unpin)

**Pin the preview** to keep it visible at the bottom of your viewport while you scroll through settings.

- **Default:** Unpinned (preview scrolls with page)
- **Pinned:** Preview stays fixed at bottom of screen, overlays page content
- **Toggle:** Click the pin icon in the toolbar
  - 📌 (filled pin) = Pinned
  - 📍 (angled pin) = Unpinned

**When to use pinned mode:**
- Adjusting multiple settings while watching live preview updates
- Comparing different configurations without losing sight of the preview
- Working on small screens where scrolling back and forth is tedious

**When to use unpinned mode:**
- Focused on reading/editing settings
- Saving screen real estate
- Default scrolling behavior

---

### Resizable Height

**Drag the handle** at the top of the preview panel to resize it vertically.

- **Visual indicator:** Horizontal line with resize cursor
- **Drag direction:** Up (taller) or down (shorter)
- **Minimum height:** ~200px (enough to see waveform)
- **Maximum height:** ~80% of viewport height
- **Persistence:** Your preferred height is saved in browser localStorage

**How to resize:**
1. Hover over the top edge of the preview panel (above the toolbar)
2. Cursor changes to vertical resize (↕)
3. Click and drag up or down
4. Release to set new height

**Tips:**
- Taller preview = better for inspecting waveform details
- Shorter preview = more room for settings controls
- Height persists across page reloads

---

### Pan & Zoom Controls

**Toolbar buttons** provide quick access to zoom and pan functions.

#### Zoom In (+)
- **Button:** Magnifying glass with plus sign
- **Action:** Zoom in 20% closer to the waveform
- **Keyboard:** Not available (mouse wheel recommended)

#### Zoom Out (−)
- **Button:** Magnifying glass with minus sign
- **Action:** Zoom out 20% further from the waveform
- **Keyboard:** Not available (mouse wheel recommended)

#### Fit to View
- **Button:** Fullscreen icon
- **Action:** Reset zoom and pan to show entire waveform
- **Use case:** Return to default view after zooming/panning

#### Mouse Wheel Zoom
- **Action:** Scroll wheel up = zoom in, down = zoom out
- **Center point:** Zooms toward cursor position
- **Modifier:** None required

#### Click & Drag Pan
- **Action:** Click anywhere on the SVG and drag to pan
- **Cursor:** Changes to grabbing hand
- **Use case:** Inspect specific sections at high zoom levels

---

## Common Workflows

### Workflow 1: Fine-Tuning Colors
1. **Pin the preview** (click pin icon)
2. Scroll down to Frequency Bands section
3. Adjust colors/opacity while watching preview update live
4. No need to scroll back and forth

### Workflow 2: Comparing Waveform Styles
1. **Resize preview taller** (drag handle up)
2. Switch between zigzag/saw/bars in Waveform Settings
3. **Zoom in** to see style differences clearly
4. **Fit to view** to reset between comparisons

### Workflow 3: Inspecting Details
1. Generate waveform with high resolution (1024+ points)
2. **Zoom in** using mouse wheel
3. **Click and drag** to pan to different sections
4. **Zoom out** or **Fit to view** when done

---

## State Persistence

Your preview panel preferences are **automatically saved** to browser localStorage:

| Setting | Saved? | Scope |
|---------|--------|-------|
| Pinned state | ✓ | Per-browser, all sessions |
| Panel height | ✓ | Per-browser, all sessions |
| Zoom level | ✗ | Resets to fit-to-view on reload |
| Pan position | ✗ | Resets to center on reload |

**What this means:**
- Your preferred pin state and panel height persist across page reloads
- Zoom/pan reset each time you generate a new waveform (intentional - shows full result)

---

## Keyboard Shortcuts

Currently not available. Use toolbar buttons and mouse interactions.

**Future enhancement:** Keyboard shortcuts for pan/zoom may be added in a future version.

---

## Browser Compatibility

- **Required:** Modern browser with SVG support
- **Tested:** Chrome, Firefox, Safari, Edge
- **Pan/Zoom Library:** Uses [@panzoom/panzoom](https://github.com/timmywil/panzoom) v4.6+

---

## Tips & Best Practices

### For Large Waveforms
- Use **Fit to View** first to see the whole picture
- **Zoom in** gradually (multiple clicks) rather than extreme zoom
- **Pan** to specific areas of interest instead of zooming too far

### For Multiband Visualizations
- **Pin the preview** while adjusting per-band colors
- **Resize taller** to see frequency separation clearly
- Use **Zoom** to check if blend modes are working correctly

### For Pen Plotter Preparation
- **Fit to View** to see final composition
- **Zoom in** to check for overlapping lines (may cause ink buildup)
- Use unpinned mode and scroll down to download settings

---

## Troubleshooting

### Preview panel is stuck/frozen
**Cause:** Panzoom library initialization issue
**Solution:**
1. Refresh the page (F5 / Cmd+R)
2. Generate a new waveform (click "Go!")
3. If still stuck, clear browser cache and reload

### Can't resize panel
**Cause:** Missing or misaligned drag handle
**Solution:**
- Look for horizontal line at top of preview panel
- Cursor should change to ↕ resize cursor
- Try unpinning panel first, then resize

### Zoom/Pan controls not working
**Cause:** SVG not fully rendered or library not loaded
**Solution:**
1. Wait for waveform to finish generating
2. Try **Fit to View** button to reset
3. Refresh page if still not working

### Pinned panel covers settings
**Cause:** Panel height too tall for small screens
**Solution:**
1. **Resize panel shorter** (drag handle down)
2. Or **unpin the panel** (click pin icon)
3. Scroll normally to access covered settings

---

## Technical Details

### Implementation
- **Pan/Zoom Library:** @panzoom/panzoom (MIT license)
- **State Management:** usehooks-ts `useLocalStorage`
- **Resize:** CSS resize handles with React state
- **Sticky Positioning:** CSS `position: sticky` with `bottom: 0`

### Performance
- **Smooth panning:** GPU-accelerated transforms
- **Memory:** Minimal overhead (~50KB library + state)
- **Responsive:** Updates in real-time as you interact

---

## Future Enhancements

Possible additions (not currently implemented):

- Keyboard shortcuts (arrow keys for pan, +/- for zoom)
- Pinch-to-zoom on touch devices
- Double-click to fit-to-view
- Mini-map for navigation in highly zoomed views
- Preset zoom levels (25%, 50%, 100%, 200%)

---

## Related Documentation

- [Multiband Frequency Visualization](multiband-frequency-visualization.md) - Works great with pinned preview
- [Dark Mode](dark-mode.md) - Preview panel respects theme
- [CLAUDE.md](../../CLAUDE.md) - Technical implementation details

---

**Built for the pen plotter community** 🖊️✨
