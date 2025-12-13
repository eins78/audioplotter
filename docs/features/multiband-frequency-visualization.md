# Multiband Frequency Visualization

**Version:** 1.0
**Date:** 2025-11-20
**Status:** Production Ready

## Overview

The multiband frequency visualization feature allows you to create stunning pen plotter graphics by splitting audio into separate frequency bands (bass, mid, treble, etc.) and rendering each band in a different color. This creates layered, multi-colored waveforms that represent different aspects of the audio spectrum.

Perfect for:
- Creating artistic representations of music
- Visualizing drum breaks with frequency separation
- Generating unique pen plotter artwork from audio
- Exploring the frequency content of recordings

## Features

### Core Functionality

**Frequency Band Splitting (1-8 bands)**
- Split audio into 1-8 frequency bands using Web Audio API filters
- Scientifically accurate Hz ranges based on audio engineering standards
- Preset configurations for bass, mid, treble, and sub-divisions
- True frequency-domain filtering (not just time-domain sampling)

**Per-Band Customization**
- **Color:** Choose any color for each frequency band
- **Opacity:** Adjust transparency (0-100%) per band
- **Default Colors:** 8 penplotter-friendly colors included

**Visual Preview Controls**
- **Background Color:** Customize canvas background (default white)
- **Blend Modes:** 6 modes for realistic ink simulation
  - `normal` - Standard overlay
  - `multiply` - Ink darkening/accumulation (recommended for pen plotting)
  - `screen` - Light ink on dark backgrounds
  - `darken`, `lighten`, `overlay` - Creative effects
- **Stroke Width:** Control line thickness (0.1-100, dynamic max)

**Spread Peaks Mode**
- **Normal mode (default):** All frequency bands render at the same X positions, creating overlaid/stacked visualization
- **Spread mode:** Bands are interleaved horizontally across the timeline, creating a wider, separated visualization
- **Use case:** When you want to see each frequency band distinctly without overlap
- **Toggle:** Enable "spread peaks" checkbox in Frequency Bands section

**URL State Persistence**
- All settings automatically saved to URL
- Share exact configurations via link
- Reload page with settings intact
- Clean URL parameter management

### SVG Output

**Pen Plotter Compatibility**
- Each frequency band in separate SVG `<g>` group
- Descriptive group IDs: `band-1-bass-20-250hz`
- Compatible with vpype, Inkscape, AxiDraw
- Groups map to physical pen colors in plotter software

**File Naming**
- Descriptive filenames with all settings
- Format: `audioplot-{name}-h{height}-p{points}-{numBands}band-ts{start}-te{end}-norm{yes/no}-caps{yes/no}.svg`
- Example: `audioplot-amen-break-h150-p1024-3band-ts32.78-te20.22-normyes-capsyes.svg`

## Usage Guide

### Basic Multiband Setup

1. **Load Audio**
   - Enter URL or upload file
   - Click "Go!" to load and process

2. **Configure Frequency Bands**
   - Expand "🎵 Frequency Bands" section
   - Adjust "number of bands" slider (1-8)
   - Customize color for each band
   - Adjust opacity per band (0-100%)

3. **Fine-Tune Waveform**
   - Expand "⚙️ Waveform Settings"
   - Choose style (zigzag, saw, bars)
   - Set height and points (resolution)
   - Adjust trim to isolate sections
   - Toggle normalize and caps

4. **Customize Preview**
   - Expand "🎨 Preview Settings"
   - Adjust stroke width
   - Select blend mode
   - Change background color

5. **Download SVG**
   - Click "Download SVG" button
   - Import to plotter software (vpype, Inkscape)
   - Map SVG groups to physical pens

### Frequency Band Presets

#### 1 Band (Full Spectrum)
- **Full:** 20-20,000 Hz (entire audible range)

#### 2 Bands
- **Bass:** 20-250 Hz
- **Treble:** 250-20,000 Hz

#### 3 Bands (Most Common)
- **Bass:** 20-250 Hz (kick drums, bass guitar, low rumble)
- **Mid:** 250-4,000 Hz (vocals, guitars, most instruments)
- **Treble:** 4,000-20,000 Hz (cymbals, hi-hats, air, harmonics)

#### 4 Bands
- **Sub-Bass:** 20-60 Hz (deepest bass, sub-woofer territory)
- **Bass:** 60-250 Hz
- **Mid:** 250-4,000 Hz
- **Treble:** 4,000-20,000 Hz

#### 5 Bands
- **Sub-Bass:** 20-60 Hz
- **Bass:** 60-250 Hz
- **Low-Mid:** 250-1,000 Hz (body, warmth)
- **High-Mid:** 1,000-4,000 Hz (presence, clarity)
- **Treble:** 4,000-20,000 Hz

#### 6-8 Bands
Progressive subdivisions for fine-grained frequency analysis. See `FREQUENCY_PRESETS` in `src/components/AudioAnalyzer.tsx` for exact ranges.

### Default Color Palette

Carefully chosen for pen plotter compatibility:

1. **Black** (#000000) - Classic, high contrast
2. **Red** (#E74C3C) - Vibrant, stands out
3. **Blue** (#3498DB) - Cool tone, great contrast with red
4. **Green** (#2ECC71) - Natural, earthy
5. **Orange** (#F39C12) - Warm, energetic
6. **Purple** (#9B59B6) - Rich, creative
7. **Turquoise** (#00BCD4) - Lamy ink color, unique
8. **Pink/Magenta** (#E91E63) - Bold, striking

All colors tested for visibility and plotter pen availability.

## Technical Details

### Audio Processing Pipeline

```
1. Fetch/Upload Audio File
   ↓
2. Decode with Web Audio API
   ↓
3. For Each Frequency Band:
   a. Apply BiquadFilter (lowpass/highpass/bandpass)
   b. Extract filtered audio data
   c. Sample timeline (time-domain)
   d. Calculate average amplitude per sample
   e. Optional: Normalize to 0-1 range
   ↓
4. Combine Band Data
   ↓
5. Render SVG
   - Background rect (with background color)
   - Frequency band groups (with blend modes + opacity)
   - Each group contains waveform path/lines
   ↓
6. Download SVG
```

### Frequency Filtering

Uses Web Audio API's `BiquadFilterNode` with `OfflineAudioContext`:

- **Lowpass Filter:** Removes frequencies above cutoff (for high bands)
- **Highpass Filter:** Removes frequencies below cutoff (for low bands)
- **Bandpass Filter:** Chain of highpass + lowpass (for mid bands)
- **Full Range:** No filtering for single-band mode

**Filter Characteristics:**
- Type: Biquad IIR filters
- Default Q: 1.0 (standard slope)
- Processing: Offline (non-blocking)

### SVG Structure

```svg
<svg width="1000" height="250" viewBox="...">
  <!-- Background -->
  <rect fill="#FFFFFF" width="1000" height="250" />

  <!-- Frequency Bands -->
  <g id="band-1-bass-20-250hz" opacity="1" style="mix-blend-mode: multiply">
    <polyline stroke="#000000" points="..." />
  </g>

  <g id="band-2-mid-250-4000hz" opacity="0.8" style="mix-blend-mode: multiply">
    <polyline stroke="#E74C3C" points="..." />
  </g>

  <g id="band-3-treble-4000-20000hz" opacity="0.8" style="mix-blend-mode: multiply">
    <polyline stroke="#3498DB" points="..." />
  </g>
</svg>
```

**Group IDs:** `band-{index}-{name}-{lowHz}-{highHz}hz`

**Plotter Software Workflow:**
1. Import SVG to vpype or Inkscape
2. Map groups to physical pens (by group ID or layer)
3. Set pen colors to match SVG colors
4. Plot!

## Common Use Cases

### Use Case 1: Classic 3-Band Drum Break

**Goal:** Visualize bass, snare, and hi-hats separately

**Settings:**
- Bands: 3 (Bass 20-250, Mid 250-4000, Treble 4000-20000)
- Colors: Black (bass), Red (mid/snare), Blue (treble/hi-hats)
- Opacity: 100% all bands
- Blend Mode: multiply (for ink darkening)
- Background: White
- Trim: Isolate the break (e.g., 32.78% start, 20.22% end for Amen Break)

**Result:** Three overlaid waveforms showing frequency distribution across the drum pattern.

### Use Case 2: Dark Background with Light Inks

**Goal:** Create ethereal, light-on-dark artwork

**Settings:**
- Bands: 3-5
- Colors: Bright/pastel colors (#00ff7b, #fbff00, #ff00ff)
- Opacity: 60-80% for subtle transparency
- Blend Mode: screen (lightens where colors overlap)
- Background: Dark gray (#333333) or black (#000000)

**Result:** Glowing, luminous waveforms on dark canvas.

### Use Case 3: High-Resolution Single Band

**Goal:** Maximum detail waveform

**Settings:**
- Bands: 1 (full spectrum)
- Points: 2048 (maximum resolution)
- Color: Black
- Opacity: 100%
- Blend Mode: normal
- Background: White
- Normalize: Yes

**Result:** Ultra-detailed traditional waveform.

### Use Case 4: 8-Band Spectrum Analysis

**Goal:** Detailed frequency breakdown

**Settings:**
- Bands: 8 (full spectrum split)
- Colors: All 8 default colors
- Opacity: 70-90% (slight transparency for layering)
- Blend Mode: multiply
- Background: Light gray (#f5f5f5)

**Result:** Rainbow spectrum showing exact frequency content.

## URL Parameters Reference

### Global Settings

| Parameter | Type | Range/Values | Default | Description |
|-----------|------|--------------|---------|-------------|
| `url` | string | Any audio URL | - | Audio file URL |
| `height` | integer | 1-2048 | 150 | SVG height in pixels |
| `points` | integer | 1-2048 | 1024 | Time-domain sample count |
| `trimStart` | float | 0-99.99 | 0 | Trim % from beginning |
| `trimEnd` | float | 0-99.99 | 0 | Trim % from end |
| `normalize` | boolean | true/false | true | Normalize amplitude to 0-1 |
| `style` | enum | zigzag/saw/bars | saw | Waveform visualization style |
| `caps` | boolean | true/false | true | Add endpoint caps |

### Multiband Settings

| Parameter | Type | Range/Values | Default | Description |
|-----------|------|--------------|---------|-------------|
| `numBands` | integer | 1-8 | 1 | Number of frequency bands |
| `bands` | JSON array | Array of band configs | - | Per-band colors and opacity |

**Bands Array Format:**
```json
[
  {"color": "#000000", "opacity": 1},
  {"color": "#E74C3C", "opacity": 0.8},
  {"color": "#3498DB", "opacity": 0.8}
]
```

### Preview Settings

| Parameter | Type | Range/Values | Default | Description |
|-----------|------|--------------|---------|-------------|
| `strokeWidth` | float | 0.1-100 (dynamic) | 1 | Line thickness |
| `blendMode` | enum | normal/multiply/screen/darken/lighten/overlay | normal | Color blending mode |
| `bgColor` | hex color | #000000-#FFFFFF | #FFFFFF | Background color |

### Example URLs

**Simple 3-band:**
```
?numBands=3&bands=[{"color":"#000000"},{"color":"#ff0000"},{"color":"#0000ff"}]
```

**Advanced with opacity and blend:**
```
?height=200&points=1024&numBands=3
&bands=[{"color":"#000000","opacity":1},{"color":"#E74C3C","opacity":0.5},{"color":"#3498DB","opacity":0.8}]
&blendMode=multiply&bgColor=%23ffffff&style=saw
```

**Dark theme:**
```
?numBands=5&blendMode=screen&bgColor=%23222222
&bands=[{"color":"#00ff7b","opacity":0.7},{"color":"#fbff00","opacity":0.6}...]
```

## Tips & Best Practices

### For Realistic Pen Plotting Preview

1. **Use multiply blend mode** - Simulates ink accumulation where colors overlap
2. **Set background to paper color** - White for standard paper, cream for vintage
3. **Adjust opacity** - 80-100% for solid inks, 50-70% for transparent/watercolor effects
4. **Test with your actual pens** - Match SVG colors to your physical pen colors

### For Artistic Effects

1. **Dark backgrounds + screen blend** - Creates glowing, ethereal effects
2. **High opacity variance** - Make some bands subtle, others bold
3. **Complementary colors** - Use color theory for visually pleasing combinations
4. **More bands = more detail** - But also more complexity

### For Clean SVG Output

1. **Keep points reasonable** - 512-1024 is usually optimal (1024 default)
2. **Use trim** - Isolate the interesting part of the audio
3. **Normalize** - Ensures waveforms use full height range
4. **Add caps** - Cleaner endpoints for continuous lines

### For Different Audio Types

**Drum Breaks (e.g., Amen Break):**
- 3 bands: Bass (kick), Mid (snare), Treble (hi-hats)
- High contrast colors (black, red, blue)
- Multiply blend mode
- Trim to isolate the break

**Vocal Tracks:**
- 2-3 bands: Bass (backing), Mid (vocals), Treble (air)
- Subtle colors
- Higher opacity on mid band (emphasize vocals)

**Electronic Music:**
- 4-5 bands: Sub-bass, bass, mids, highs, ultra-highs
- Vibrant colors
- Creative blend modes

**White Noise / Ambient:**
- 6-8 bands: Maximum frequency detail
- Rainbow spectrum or monochrome gradient
- Lower opacity for subtle layering

## Troubleshooting

### Debug Logging

Enable debug logging to see detailed information about audio processing and rendering:

1. Open browser console (F12 / Cmd+Opt+I)
2. Run: `localStorage.debug = 'audioplotter:*'`
3. Reload page and generate waveform
4. View detailed logs in console

**Log namespaces:**
- `audioplotter:peaks` - Audio peak calculation timing
- `audioplotter:frequencyBands` - Frequency band configuration changes
- `audioplotter:svg:render` - SVG rendering
- `audioplotter:svg:geometry` - Path coordinate recalculation (expensive)
- `audioplotter:svg:band` - Individual band rendering

**Useful for diagnosing:**
- Performance issues (excessive recalculations)
- Frequency band configuration problems
- Rendering issues

To disable: `localStorage.debug = ''`

### Waveform looks empty or flat

**Cause:** Audio might be mostly in one frequency range
**Solution:**
- Try different band counts
- Check if normalize is enabled
- Verify audio file has content in expected frequency ranges
- Enable debug logging to see peak values

### Colors look washed out

**Cause:** Opacity too low or blend mode not suited to background
**Solution:**
- Increase opacity (90-100%)
- Try multiply blend on white background
- Try screen blend on dark background

### SVG file is huge

**Cause:** Too many points (high resolution)
**Solution:**
- Reduce points to 512-1024
- Use vpype to optimize/simplify paths after export

### Blend modes don't show effect

**Cause:** Blend modes need contrasting background or overlapping areas
**Solution:**
- Use non-white background for multiply/darken
- Use non-black background for screen/lighten
- Ensure frequency bands actually overlap (they should with most audio)

### Page crashes or errors

**Cause:** Invalid URL parameters
**Solution:**
- All parameters are now validated
- Invalid values automatically clamped to safe ranges
- If still seeing errors, clear URL and start fresh

## Advanced Techniques

### Creating "Ghost" Layers

Set one band to very low opacity (10-30%) to create a subtle background layer that adds depth without overwhelming the main waveforms.

### Simulating Overprinting

Use multiply blend with 100% opacity on all bands to see exactly how inks will accumulate when plotting multiple passes.

### Frequency Isolation

Use single-band mode with different audio files filtered externally (e.g., in DAW) to create perfectly isolated frequency visualizations.

### Color Theory for Plotters

**Triadic:** Bass (Red), Mid (Yellow), Treble (Blue) - balanced, vibrant
**Analogous:** Bass (Blue), Mid (Cyan), Treble (Green) - harmonious
**Monochrome:** Different opacities of same color - subtle, elegant

## Browser Compatibility

- **Required:** Modern browser with Web Audio API support
- **Tested:** Chrome, Firefox, Safari, Edge
- **Note:** Uses OfflineAudioContext for filtering (all modern browsers)

## Performance Notes

- **Processing time:** Linear with number of bands (3 bands ≈ 3x processing time)
- **Large files:** May take several seconds with 8 bands
- **Recommended:** Use trim to work with smaller audio sections
- **Memory:** Minimal - processing is non-blocking and cleaned up automatically

## Future Enhancements

Possible additions (not currently implemented):

- Manual frequency range configuration (currently preset only)
- Adjustable filter slopes (Q factor)
- Phase compensation
- Real-time audio playback with visualization
- Export individual bands as separate SVG files
- Band soloing/muting in preview
- Preset color schemes (save/load)
- Gradient fills instead of solid colors

## Technical Implementation Details

### Files Modified

- `src/components/AudioAnalyzer.tsx` - Frequency filtering, band processing
- `src/components/AudioPlotter.tsx` - UI, state management, URL persistence
- `src/components/SvgFromAudioPeaks.tsx` - Multi-band SVG rendering

### Key Functions

**`filterAudioByFrequency(audioContext, audioBuffer, lowHz, highHz)`**
- Filters audio to specific frequency range
- Returns Float32Array of filtered audio data
- Uses OfflineAudioContext + BiquadFilterNode

**`AudioPeaks` component**
- Processes frequency bands
- Returns `bandPeaks` array with peaks per band
- Handles both single and multi-band modes

**`SvgFromAudioPeaks` component**
- Renders multiple SVG groups
- Applies blend modes and opacity
- Generates background rect

### Dependencies

**New:**
- `nuqs@2.x` - URL state management (framework-agnostic)
- `zod@4.x` - Schema validation for bands array

**Existing:**
- `audio-context` - Web Audio API wrapper
- `audio-buffer-utils` - Audio buffer utilities
- `react-svg-path` - SVG path generation

## Support & Feedback

- **Issues:** [GitHub Issues](https://github.com/eins78/audioplotter/issues)
- **Documentation:** [CLAUDE.md](../../CLAUDE.md)
- **License:** GNU GPL v3

---

**Built with love for the pen plotter community** 🖊️✨
