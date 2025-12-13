# Multiband Frequency Visualization Design

**Date:** 2025-11-20
**Status:** Approved
**Author:** Claude + mfa

## Overview

Add multiband frequency visualization to audioplotter, allowing users to create waveform plots with 1-8 frequency bands (bass, mid, treble, etc.) rendered in different colors. Each band is filtered to a specific frequency range and rendered as a separate SVG group for pen plotter compatibility.

## Goals

- Support 1-8 frequency bands with preset frequency ranges
- Allow per-band color customization
- Maintain backwards compatibility with single-band mode
- Persist all settings to URL using nuqs
- Generate SVG output compatible with pen plotter tools (vpype, Inkscape)
- Reorganize UI into collapsible sections for better organization

## Terminology Changes

- **Current:** "bands" parameter controls timeline sampling
- **New:** Rename to "points" (clearer - represents number of data points/samples)
- **New:** "bands" now refers to frequency bands (low/mid/high)

## Architecture & Data Flow

### Current Flow
```
Audio File → Decode → Sample Timeline → Single Peak Array → Single SVG Path
```

### New Multiband Flow
```
Audio File → Decode → For Each Band:
  → Apply Bandpass Filter (Web Audio BiquadFilterNode)
  → Sample Filtered Timeline
  → Band Peak Array
→ Combine All Band Peak Arrays → Multiple SVG Paths (Different Colors)
```

### Key Changes

- **AudioAnalyzer.js**: Add `filterAudioByFrequency()` function using Web Audio API's BiquadFilterNode
- **AudioPeaks component**: Return array of `bandPeaks: [{name, lowHz, highHz, color, peaks}]` instead of single `peaks` array
- **SvgFromAudioPeaks.js**: Accept array of band configs, generate multiple SVG groups with colored paths
- **AudioPlotter.js**: Manage multiband state (number of bands, per-band colors)

### Backwards Compatibility

- Single band (numBands=1) behaves identically to current implementation
- Default color is black (#000000)
- All URL params are optional

## URL State Management

### Technology

Use **nuqs** (6kB library) for type-safe URL state management with Next.js.

### State Structure

```javascript
// Global settings (existing + renamed)
points: number (default 1024) // Renamed from "bands"
style: 'zigzag' | 'saw' | 'bars'
height: number (default 150)
trimStart: number (default 0)
trimEnd: number (default 0)
strokeWidth: number (default 1)
normalize: boolean (default true)
caps: boolean (default true)

// NEW: Multiband settings
numBands: number (1-8, default 1)
bands: Array<{color: string}> // Only color is configurable, ranges are preset
```

### Implementation

- Use `useQueryStates` for flat values (points, style, height, etc.)
- Use `parseAsJson` with Zod schema for `bands` array
- Use `parseAsInteger` for numeric values
- When `numBands` changes, auto-generate/trim `bands` array with default colors

### Zod Schema

```javascript
const bandsSchema = z.array(z.object({
  color: z.string()
}))
```

### URL Examples

```
Single band: /?points=1024&style=saw&height=150&numBands=1
Three bands: /?points=1024&style=saw&numBands=3&bands=[{"color":"#222"},{"color":"#E74C3C"},{"color":"#3498DB"}]
```

## Frequency Band Presets

Contiguous frequency ranges (no gaps/overlaps) based on standard audio engineering practices:

```javascript
const FREQUENCY_PRESETS = {
  1: [
    { name: 'Full', low: 20, high: 20000 }
  ],
  2: [
    { name: 'Bass', low: 20, high: 250 },
    { name: 'Treble', low: 250, high: 20000 }
  ],
  3: [
    { name: 'Bass', low: 20, high: 250 },
    { name: 'Mid', low: 250, high: 4000 },
    { name: 'Treble', low: 4000, high: 20000 }
  ],
  4: [
    { name: 'Sub-Bass', low: 20, high: 60 },
    { name: 'Bass', low: 60, high: 250 },
    { name: 'Mid', low: 250, high: 4000 },
    { name: 'Treble', low: 4000, high: 20000 }
  ],
  5: [
    { name: 'Sub-Bass', low: 20, high: 60 },
    { name: 'Bass', low: 60, high: 250 },
    { name: 'Low-Mid', low: 250, high: 1000 },
    { name: 'High-Mid', low: 1000, high: 4000 },
    { name: 'Treble', low: 4000, high: 20000 }
  ],
  6: [
    { name: 'Sub-Bass', low: 20, high: 60 },
    { name: 'Bass', low: 60, high: 250 },
    { name: 'Low-Mid', low: 250, high: 500 },
    { name: 'Mid', low: 500, high: 2000 },
    { name: 'High-Mid', low: 2000, high: 6000 },
    { name: 'Treble', low: 6000, high: 20000 }
  ],
  7: [
    { name: 'Sub-Bass', low: 20, high: 60 },
    { name: 'Bass', low: 60, high: 250 },
    { name: 'Low-Mid', low: 250, high: 500 },
    { name: 'Mid', low: 500, high: 1000 },
    { name: 'Upper-Mid', low: 1000, high: 2000 },
    { name: 'High', low: 2000, high: 6000 },
    { name: 'Treble', low: 6000, high: 20000 }
  ],
  8: [
    { name: 'Sub-Bass', low: 20, high: 60 },
    { name: 'Bass', low: 60, high: 150 },
    { name: 'Low-Bass', low: 150, high: 250 },
    { name: 'Low-Mid', low: 250, high: 500 },
    { name: 'Mid', low: 500, high: 1000 },
    { name: 'Upper-Mid', low: 1000, high: 2000 },
    { name: 'High', low: 2000, high: 6000 },
    { name: 'Treble', low: 6000, high: 20000 }
  ]
}
```

## Default Color Palette

Penplotter-friendly colors that work well with common pen sets:

```javascript
const DEFAULT_BAND_COLORS = [
  '#000000', // Black (backwards compatible)
  '#E74C3C', // Red
  '#3498DB', // Blue
  '#2ECC71', // Green
  '#F39C12', // Orange
  '#9B59B6', // Purple
  '#00BCD4', // Turquoise (Lamy ink)
  '#E91E63', // Pink/Magenta
]
```

### Color Behavior

- When `numBands` increases: Add colors from palette in order
- When `numBands` decreases: Remove colors from end
- When `numBands` changes from 1 → 3: Initialize with first 3 colors
- User can override any color via HTML5 color picker (`<input type="color">`)

## UI Component Structure

### Collapsible Sections

Using Bootstrap's collapse component (already in project):

```
┌─ 📁 Audio File ─────────────────────────┐
│ [Collapsed by default]                   │
│ • URL input or file upload               │
│ • "Go" button                            │
└──────────────────────────────────────────┘

┌─ 🎵 Frequency Bands ────────────────────┐
│ [Expanded by default]                    │
│ • Number of Bands: [1] ──(slider)── [8] │
│                                          │
│ Band Cards (when numBands > 1):         │
│   ┌─ Band 1: Bass (20-250 Hz) ─────┐   │
│   │ Color: [⬛ #000000] (picker)    │   │
│   └────────────────────────────────┘   │
│   ┌─ Band 2: Mid (250-4000 Hz) ────┐   │
│   │ Color: [🟥 #E74C3C] (picker)   │   │
│   └────────────────────────────────┘   │
│   ┌─ Band 3: Treble (4000-20k Hz) ─┐   │
│   │ Color: [🟦 #3498DB] (picker)   │   │
│   └────────────────────────────────┘   │
└──────────────────────────────────────────┘

┌─ ⚙️ Waveform Settings ──────────────────┐
│ [Collapsed by default]                   │
│ • Points: [1024] (slider)                │
│ • Style: [saw ▾] (dropdown)              │
│ • Height: [150] px                       │
│ • Trim Start: [0] %                      │
│ • Trim End: [0] %                        │
│ • Stroke Width: [1] (slider)             │
│ • ☑ Normalize                            │
│ • ☑ Caps                                 │
└──────────────────────────────────────────┘

┌─ SVG Preview ───────────────────────────┐
│ [Always visible]                         │
│ (Rendered SVG)                           │
│ [Download] button                        │
└──────────────────────────────────────────┘
```

### UI Behavior

- Collapsible headers with chevron icons (▼/▶)
- Band cards only visible when `numBands > 1`
- For single band, no color picker needed (defaults to black)
- All sections use Bootstrap collapse

## Audio Processing Implementation

### New Function: filterAudioByFrequency()

Location: `components/AudioAnalyzer.js`

```javascript
/**
 * Filters audio buffer to specific frequency range using BiquadFilter
 * @param {AudioContext} audioContext
 * @param {AudioBuffer} audioBuffer - Decoded audio
 * @param {number} lowHz - Low frequency cutoff
 * @param {number} highHz - High frequency cutoff
 * @returns {Promise<Float32Array>} Filtered audio data
 */
async function filterAudioByFrequency(audioContext, audioBuffer, lowHz, highHz) {
  // Create offline context for processing
  const offlineContext = new OfflineAudioContext(
    1, // mono
    audioBuffer.length,
    audioBuffer.sampleRate
  )

  // Create source
  const source = offlineContext.createBufferSource()
  source.buffer = audioBuffer

  // Apply appropriate filters
  if (lowHz === 20 && highHz === 20000) {
    // Full range - no filtering
    source.connect(offlineContext.destination)
  } else if (lowHz === 20) {
    // Lowpass only (high frequencies)
    const lowpass = offlineContext.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = highHz
    source.connect(lowpass).connect(offlineContext.destination)
  } else if (highHz === 20000) {
    // Highpass only (low frequencies)
    const highpass = offlineContext.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = lowHz
    source.connect(highpass).connect(offlineContext.destination)
  } else {
    // Bandpass (chain highpass + lowpass)
    const highpass = offlineContext.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = lowHz

    const lowpass = offlineContext.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = highHz

    source.connect(highpass).connect(lowpass).connect(offlineContext.destination)
  }

  source.start()
  const filteredBuffer = await offlineContext.startRendering()
  return filteredBuffer.getChannelData(0)
}
```

### Modified AudioPeaks Component

**Current return value:**
```javascript
{ peaks, decodeError }
```

**New return value:**
```javascript
{
  bandPeaks: [
    { name, lowHz, highHz, color, peaks }
  ],
  decodeError
}
```

### Processing Flow

1. Decode audio buffer (existing)
2. For each frequency band:
   - Apply frequency filter using `filterAudioByFrequency()`
   - Run `filterData()` on filtered audio (existing time-domain sampling)
   - Optionally normalize (existing)
   - Store peaks with band metadata
3. Return array of band data

## SVG Generation Changes

### Modified Component Signature

**Current:**
```javascript
SvgFromAudioPeaks({ peaks, height, style, strokeWidth, withCaps })
```

**New:**
```javascript
SvgFromAudioPeaks({
  bandPeaks,  // Array of { name, lowHz, highHz, color, peaks }
  height,
  style,
  strokeWidth,
  withCaps
})
```

### SVG Output Structure

```jsx
<svg width={1000} height={finalHeight} viewBox="...">
  {bandPeaks.map((band, index) => {
    const points = calculatePoints(band.peaks, style, height, withCaps)
    const groupId = `band-${index + 1}-${band.name.toLowerCase()}-${band.lowHz}-${band.highHz}hz`

    return (
      <g key={index} id={groupId} stroke={band.color}>
        {style === 'bars' ? (
          // Multiple <line> elements
          points.map((p, i) => <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} {...strokeProps} />)
        ) : (
          // Single <Polyline>
          <Polyline points={points} {...strokeProps} />
        )}
      </g>
    )
  })}
</svg>
```

### SVG Group IDs

Format: `band-{index}-{name}-{lowHz}-{highHz}hz`

Examples:
- `band-1-bass-20-250hz`
- `band-2-mid-250-4000hz`
- `band-3-treble-4000-20000hz`

### Pen Plotter Compatibility

- Each band wrapped in `<g>` element with descriptive ID
- Stroke color applied at group level
- Plotter software (vpype, Inkscape) can map groups to physical pens
- Bands render in order (first = back layer, last = front layer)
- Fill remains white, stroke from band color

## Filename Generation

### Current Format
```
{audio-name}-h{height}-b{bands}-ts{trimStart}-te{trimEnd}-norm{yes/no}-caps{yes/no}.svg
```

### New Format
```
{audio-name}-h{height}-p{points}-{numBands}band-ts{trimStart}-te{trimEnd}-norm{yes/no}-caps{yes/no}.svg
```

### Examples

```
Single band:
amen-break-h150-p1024-1band-ts0-te0-normyes-capsyes.svg

Three bands:
amen-break-h150-p1024-3band-ts32.78-te20.22-normyes-capsyes.svg

Eight bands:
amen-break-h150-p512-8band-ts0-te0-normno-capsno.svg
```

### Rationale

- Replace `b{bands}` with `p{points}` for clarity
- Add `{numBands}band` to indicate multiband mode
- Don't list individual colors/ranges (that info is in SVG groups)
- Keeps filename concise and parseable
- Maintains alphabetic sorting

## Technical Considerations

### Web Audio API

- Use `OfflineAudioContext` for frequency filtering (no playback needed)
- `BiquadFilterNode` provides highpass, lowpass, and bandpass filters
- Default Q factor (1.0) provides reasonable filter slope
- Filters operate at audio sample rate (typically 44.1kHz or 48kHz)

### Performance

- Filtering adds processing time (linear with number of bands)
- Each band requires separate filter pass and peak calculation
- Consider showing loading indicator for large files with many bands
- Offline context processing is non-blocking (uses Promises)

### Browser Compatibility

- Web Audio API supported in all modern browsers
- OfflineAudioContext supported since Chrome 35, Firefox 25, Safari 14.1
- Falls back gracefully if API unavailable (show error)

## Future Enhancements

Not in scope for this implementation:

- Manual frequency range configuration (preset only for now)
- Adjustable filter slopes (Q factor)
- Phase compensation
- Real-time audio playback with multiband visualization
- Export individual bands as separate SVG files
- Band soloing/muting in preview

## Testing Strategy

### Manual Testing

1. Single band mode (backwards compatibility)
2. 2-way split (bass/treble)
3. 3-way split (bass/mid/treble)
4. 8-way split (maximum bands)
5. URL persistence (reload page, check settings preserved)
6. Color picker functionality
7. SVG download with correct filename
8. Import SVG into pen plotter software (vpype, Inkscape)

### Test Files

- Amen Break (default, drums across full spectrum)
- Bass-heavy track (electronic music)
- Vocal track (mid-range heavy)
- White noise (equal energy across spectrum)

### Edge Cases

- Very short audio files
- Very long audio files
- Mono vs stereo audio
- Different sample rates (44.1kHz, 48kHz)
- Invalid URLs
- Extreme trim values

## Dependencies

### New Dependencies

```json
{
  "nuqs": "^2.0.0",
  "zod": "^3.22.0"
}
```

### Existing Dependencies (No Changes)

- `audio-context`
- `audio-buffer-utils`
- `react-svg-path`
- Bootstrap 5

## Implementation Notes

- Maintain functional component style (no classes)
- Use React hooks (useState, useEffect, useCallback)
- Follow existing code style (Prettier: no semicolons, single quotes, 120 char width)
- Add JSDoc comments for new functions
- Update CLAUDE.md with new features after implementation

## Success Criteria

- ✅ User can select 1-8 frequency bands
- ✅ Each band has configurable color
- ✅ All settings persist to URL
- ✅ SVG output compatible with pen plotter tools
- ✅ Backwards compatible with single-band mode
- ✅ UI organized into collapsible sections
- ✅ Download filename includes multiband info
- ✅ No breaking changes to existing functionality
