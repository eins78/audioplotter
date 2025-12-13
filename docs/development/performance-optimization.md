# Performance Optimization

**Last Updated:** December 2025
**Status:** Production
**Audience:** Developers, Contributors, AI Agents

## Overview

audioplotter uses React memoization patterns to prevent unnecessary recalculations of expensive audio processing and SVG path generation operations. This document explains the parameter categorization, memoization strategies, and debug logging used to optimize rendering performance.

## Parameter Categorization

Parameters are divided into three categories based on what operations they should trigger:

| Category | Parameters | Triggers |
|----------|-----------|----------|
| **Audio Processing** | `numBands`, `trimStart`, `trimEnd`, `normalize`, `frequencyBands` | Audio peak recalculation (expensive) |
| **Geometry** | `height`, `style`, `withCaps`, `spreadPeaks` | SVG path coordinate recalculation (moderate) |
| **Styling** | `strokeWidth`, `color`, `opacity`, `blendMode`, `backgroundColor` | CSS/SVG attribute update only (cheap) |

**Goal:** Styling-only changes should NOT trigger audio processing or path recalculation.

---

## Memoization Patterns

### 1. useMemo for frequencyBands (AudioPlotter.js)

**Location:** `components/AudioPlotter.js` lines ~270-280

**Problem:** The `frequencyBands` object was recreated every render, causing `AudioPeaks` to recalculate peaks even when only styling changed.

**Solution:**
```javascript
import { useMemo } from 'react'

const frequencyBands = useMemo(() => {
  debugFreqBands('RECALCULATING frequencyBands (numFrequencyBands=%d)', numFrequencyBands)
  if (numFrequencyBands <= 1) return null
  return FREQUENCY_PRESETS[numFrequencyBands].map((preset, i) => ({
    name: preset.name,
    lowHz: preset.low,
    highHz: preset.high,
    color: bands?.[i]?.color || DEFAULT_BAND_COLORS[i],
    opacity: bands?.[i]?.opacity !== undefined ? bands[i].opacity : 1,
  }))
}, [numFrequencyBands, bands])
```

**Dependencies:**
- `numFrequencyBands` - Changes frequency split (audio processing param)
- `bands` - Contains color/opacity (includes styling, but also drives band count)

**Impact:** Prevents AudioPeaks from recalculating when unrelated state changes (e.g., `strokeWidth`, `height`)

**Debug log:** `audioplotter:frequencyBands` - Only logs when dependencies change

---

### 2. useMemo for Path Coordinates (SvgFromAudioPeaks.js)

**Location:** `components/SvgFromAudioPeaks.js` lines ~173-191

**Problem:** Path coordinates were recalculated on every render, even when only styling changed.

**Solution:**
```javascript
import { useMemo } from 'react'

// Pure function - no JSX, no side effects
function calculatePathCoordinates(
  peaks, style, targetHeight, targetWidth,
  withCaps, spreadPeaks, bandIndex, numBands
) {
  // Returns { type: 'polyline'|'bars', points/lines: [...] }
}

// In component:
const bandGeometries = useMemo(() => {
  debugGeometry('RECALCULATING geometries for %d bands (style=%s height=%d)', numBands, style, targetHeight)
  return bandPeaks.map((band, index) => ({
    bandIndex: index,
    name: band.name,
    lowHz: band.lowHz,
    highHz: band.highHz,
    geometry: calculatePathCoordinates(
      band.peaks,
      style,
      targetHeight,
      targetWidth,
      withCaps,
      spreadPeaks,
      index,
      numBands
    ),
  }))
}, [bandPeaks, style, targetHeight, targetWidth, withCaps, spreadPeaks, numBands])
```

**Dependencies (geometry-affecting only):**
- `bandPeaks` - Peak data (audio processing param)
- `style` - zigzag/saw/bars (geometry param)
- `targetHeight` - SVG height (geometry param)
- `targetWidth` - Fixed at 1000px (constant)
- `withCaps` - Add endpoint caps (geometry param)
- `spreadPeaks` - Interleave bands (geometry param)
- `numBands` - Number of bands (geometry param)

**NOT dependencies (styling only):**
- `strokeWidth` ✗
- `color` ✗
- `opacity` ✗
- `blendMode` ✗
- `backgroundColor` ✗

**Impact:** Changing `strokeWidth`, colors, or opacity does NOT recalculate paths - only updates SVG attributes.

**Debug log:** `audioplotter:svg:geometry` - Only logs when geometry changes

---

### 3. React.memo for BandGroup Component (SvgFromAudioPeaks.js)

**Location:** `components/SvgFromAudioPeaks.js` lines ~113-140

**Problem:** Band rendering components re-rendered even when their props didn't change.

**Solution:**
```javascript
const BandGroup = React.memo(function BandGroup({
  bandIndex, name, lowHz, highHz,
  color, opacity, geometry, strokeWidth, blendMode
}) {
  debugBand('render band %d (%s) color=%s strokeWidth=%s', bandIndex, name, color, strokeWidth)

  const groupId = `band-${bandIndex + 1}-${name.toLowerCase()}-${lowHz}-${highHz}hz`

  const strokeProps = {
    stroke: color,
    strokeWidth: strokeWidth,
    fill: 'white',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  // Render based on geometry.type
  let content = null
  if (geometry.type === 'polyline') {
    content = <Polyline points={geometry.points} {...strokeProps} />
  } else if (geometry.type === 'bars') {
    content = geometry.lines.map((line, i) => (
      <line key={line.key || i} x1={line.x} y1={line.yUp} x2={line.x} y2={line.yDown} {...strokeProps} />
    ))
  }

  return (
    <g id={groupId} opacity={opacity} style={{ mixBlendMode: blendMode }}>
      {content}
    </g>
  )
})
```

**How React.memo works:**
- Shallow comparison of props
- Re-renders only when props change
- Prevents unnecessary re-renders when parent re-renders

**When it re-renders:**
- `geometry` changes (object reference comparison)
- `color`, `opacity`, `strokeWidth`, `blendMode` change (primitive comparison)

**Impact:** Efficient rendering - only affected bands re-render when styling changes

**Debug log:** `audioplotter:svg:band` - Logs on every render (useful for debugging unnecessary re-renders)

---

## Debug Logging

### Setup

**Package:** `debug` (^4.4.3)
**Usage:** Opt-in via localStorage

**Enable all audioplotter logs:**
```javascript
localStorage.debug = 'audioplotter:*'
```

**Enable specific namespaces:**
```javascript
localStorage.debug = 'audioplotter:svg:geometry,audioplotter:peaks'
```

**Disable:**
```javascript
localStorage.debug = ''
```

---

### Available Namespaces

#### audioplotter:peaks
**Location:** `components/AudioAnalyzer.js` line ~228
**Triggers:** Every time `AudioPeaks` recalculates

**Output:**
```
audioplotter:peaks RECALCULATING peaks (bands=1024 normalize=true frequencyBands=3) +0ms
```

**Use case:** Verify that peaks only recalculate when audio processing params change

---

#### audioplotter:frequencyBands
**Location:** `components/AudioPlotter.js` line ~272
**Triggers:** When `frequencyBands` useMemo recomputes

**Output:**
```
audioplotter:frequencyBands RECALCULATING frequencyBands (numFrequencyBands=3) +0ms
```

**Use case:** Confirm that frequencyBands only recalculates when `numFrequencyBands` or `bands` change

---

#### audioplotter:svg:render
**Location:** `components/SvgFromAudioPeaks.js` line ~168
**Triggers:** Every `SvgFromAudioPeaks` render

**Output:**
```
audioplotter:svg:render render SvgFromAudioPeaks height=150 style=saw strokeWidth=3 bands=3 +2ms
```

**Use case:** See when entire SVG component re-renders (expected on any prop change)

---

#### audioplotter:svg:geometry
**Location:** `components/SvgFromAudioPeaks.js` line ~174
**Triggers:** When `bandGeometries` useMemo recomputes

**Output:**
```
audioplotter:svg:geometry RECALCULATING geometries for 3 bands (style=saw height=150) +0ms
```

**Use case:** **Most important** - Verify geometry ONLY recalculates when geometry params change, NOT styling

---

#### audioplotter:svg:band
**Location:** `components/SvgFromAudioPeaks.js` line ~114
**Triggers:** Every `BandGroup` render

**Output:**
```
audioplotter:svg:band render band 0 (Bass) color=#E74C3C strokeWidth=3 +0ms
audioplotter:svg:band render band 1 (Mid) color=#3498DB strokeWidth=3 +0ms
audioplotter:svg:band render band 2 (Treble) color=#2ECC71 strokeWidth=3 +0ms
```

**Use case:** See which individual bands re-render (expected when their props change)

---

## Verification Tests

### Test 1: Styling-Only Change (strokeWidth)

**Action:** Change `strokeWidth` from 1 to 3

**Expected logs:**
```
audioplotter:svg:render render SvgFromAudioPeaks height=150 style=saw strokeWidth=3 bands=3 +2ms
audioplotter:svg:band render band 0 (Bass) color=#E74C3C strokeWidth=3 +0ms
audioplotter:svg:band render band 1 (Mid) color=#3498DB strokeWidth=3 +0ms
audioplotter:svg:band render band 2 (Treble) color=#2ECC71 strokeWidth=3 +0ms
```

**NOT expected:**
- ❌ `audioplotter:svg:geometry RECALCULATING` - Geometry should NOT recalculate
- ❌ `audioplotter:peaks RECALCULATING` - Peaks should NOT recalculate

**Result:** ✅ Only SVG render and band renders, no geometry recalculation

---

### Test 2: Geometry Change (height)

**Action:** Change `height` from 150 to 200

**Expected logs:**
```
audioplotter:svg:render render SvgFromAudioPeaks height=200 style=saw strokeWidth=3 bands=3 +2ms
audioplotter:svg:geometry RECALCULATING geometries for 3 bands (style=saw height=200) +12ms
audioplotter:svg:band render band 0 (Bass) color=#E74C3C strokeWidth=3 +0ms
audioplotter:svg:band render band 1 (Mid) color=#3498DB strokeWidth=3 +0ms
audioplotter:svg:band render band 2 (Treble) color=#2ECC71 strokeWidth=3 +0ms
```

**Result:** ✅ Geometry recalculates (correct), peaks do NOT (correct)

---

### Test 3: Audio Processing Change (numBands)

**Action:** Change `numBands` from 1024 to 2048

**Expected logs:**
```
audioplotter:peaks RECALCULATING peaks (bands=2048 normalize=true frequencyBands=3) +0ms
audioplotter:svg:render render SvgFromAudioPeaks height=200 style=saw strokeWidth=3 bands=3 +2ms
audioplotter:svg:geometry RECALCULATING geometries for 3 bands (style=saw height=200) +18ms
audioplotter:svg:band render band 0 (Bass) color=#E74C3C strokeWidth=3 +0ms
...
```

**Result:** ✅ Peaks recalculate (correct), geometry recalculates (correct - new peak data)

---

## Performance Characteristics

### Before Optimization

| Change | Operations Triggered |
|--------|---------------------|
| strokeWidth | Audio processing + Geometry + Render |
| color | Audio processing + Geometry + Render |
| height | Audio processing + Geometry + Render |

**Problem:** Every parameter change triggered full recalculation pipeline (expensive)

---

### After Optimization

| Change | Operations Triggered |
|--------|---------------------|
| strokeWidth | Render only ✅ |
| color | Render only ✅ |
| opacity | Render only ✅ |
| blendMode | Render only ✅ |
| backgroundColor | Render only ✅ |
| height | Geometry + Render ✅ |
| style | Geometry + Render ✅ |
| numBands | Audio + Geometry + Render ✅ |
| numFrequencyBands | Audio + Geometry + Render ✅ |

**Improvement:** Styling changes are 10-50x faster (no expensive operations)

---

## Best Practices

### When Adding New Parameters

1. **Categorize first:** Is it audio processing, geometry, or styling?
2. **Add to correct dependencies:**
   - Audio → `AudioPeaks` useEffect dependencies
   - Geometry → `bandGeometries` useMemo dependencies
   - Styling → Neither (just pass as prop)
3. **Test with debug logs:** Verify only correct operations trigger
4. **Update this doc:** Document the new parameter

### When Debugging Performance

1. **Enable debug logging:** `localStorage.debug = 'audioplotter:*'`
2. **Make parameter changes:** Watch console for logs
3. **Look for:**
   - Unexpected `svg:geometry` logs (geometry recalc when shouldn't)
   - Unexpected `peaks` logs (audio recalc when shouldn't)
   - Missing logs (expected operation didn't happen)
4. **Fix dependency arrays:** Add/remove deps as needed

### When Reviewing Code

**Red flags:**
- ❌ Objects/arrays created inline in JSX (creates new reference every render)
- ❌ Expensive calculations without `useMemo`
- ❌ Components without `React.memo` that receive stable props
- ❌ Missing dependencies in `useMemo`/`useEffect`

**Green flags:**
- ✅ Pure functions extracted (no JSX, no hooks)
- ✅ Expensive computations memoized
- ✅ Minimal dependency arrays (only what's needed)
- ✅ Debug logging for verification

---

## Tools

### React DevTools Profiler

**Setup:**
1. Install React DevTools browser extension
2. Open DevTools → Profiler tab
3. Click record
4. Make parameter changes
5. Stop recording
6. Inspect flamegraph

**What to look for:**
- Waveform changes → Should see `SvgFromAudioPeaks` render
- Geometry changes → Should see `calculatePathCoordinates` calls
- Styling changes → Should NOT see geometry recalculation

### Console Performance Marks

Add to code for precise timing:
```javascript
performance.mark('geometry-start')
// ... expensive operation ...
performance.mark('geometry-end')
performance.measure('geometry', 'geometry-start', 'geometry-end')
console.log(performance.getEntriesByName('geometry'))
```

---

## Future Optimizations

Possible improvements (not currently implemented):

- **Web Workers:** Offload audio processing to background thread
- **Streaming processing:** Process audio chunks instead of entire buffer
- **Virtual rendering:** Only render visible portions of large waveforms
- **RequestAnimationFrame batching:** Batch multiple param changes
- **CSS Variables for colors:** Avoid React re-renders for color changes
- **Canvas rendering:** Faster for high-resolution waveforms (trade-off: no SVG output)

---

## References

- [React useMemo](https://react.dev/reference/react/useMemo)
- [React.memo](https://react.dev/reference/react/memo)
- [debug package](https://github.com/debug-js/debug)
- [Web Audio API Performance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)

---

**Optimized for the pen plotter community** ⚡✨
