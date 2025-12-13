# audioplotter

create graphics for penplotters from audio files, aka waveforms, soundwaves.

## Features

- **Audio Analysis:** Calculate "peaks" (volume per time slot for N numbers of slots)
- **Multiple Visualization Styles:**
  - `zigzag`: alternates drawing points above and below the horizontal centerline.
    looks like a standard waveform from far, and like a frequency graph up close.
    _Asymmetric_
  - `saw`: follows a [Sawtooth wave](https://en.wikipedia.org/wiki/Sawtooth_wave) pattern.
    _Is symmetric but has more line density per bands._
  - `bars`: vertical bars centered on the horizontal centerline.
    _Symmetric, great for pen plotters._
- **Multiband Frequency Visualization:** Split audio into 1-8 frequency bands (bass, mid, treble) with customizable colors and opacity ([docs](docs/features/multiband-frequency-visualization.md))
- **Local File Upload:** Process audio files directly from your device (no server upload required)
- **Sticky/Resizable Preview Panel:** Pan, zoom, and resize the preview panel with persistent state ([docs](docs/features/preview-panel.md))
- **URL State Persistence:** All settings saved to URL for easy sharing
- **Blend Modes:** Realistic ink simulation with 6 blend modes (multiply, screen, darken, lighten, overlay, normal)
- **Dark Mode:** Automatic theme detection based on system preferences ([docs](docs/features/dark-mode.md))
- **PWA Support:** Works offline as a Progressive Web App
- **SVG Export:** Download high-quality vector graphics for plotting

## Ideas

- playback of the audio
- show audio file info
- better download option (with preview of settings)

## Credits

Thanks to Matthew Ström for writing the article ["Making an Audio Waveform Visualizer with Vanilla JavaScript" on css-tricks.com](https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/) and [open-sourcing the example code](https://codepen.io/matthewstrom/pen/mddOWWg), on which the initial prototype of this tool is based.

## Testing

- **Unit Tests** - Vitest for pure functions (fast, isolated)
- **Component Tests** - Vitest Browser Mode for React components
- **E2E Tests** - Playwright for user workflows

```bash
pnpm test          # Unit tests
pnpm test:browser  # Component tests
pnpm test:e2e      # E2E tests
pnpm test:all      # Run all tests
```

**📖 Full testing guide:** [docs/development/testing.md](docs/development/testing.md)

## Development

audioplotter uses [Vite](https://vite.dev/), React 19, and TypeScript.

### Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start local audio file server (required for dev)
pnpm dev-audio-server
```

Open [http://localhost:5173](http://localhost:5173) with your browser.

### Build for Production

```bash
pnpm build     # Type-check and build
pnpm preview   # Preview production build
```

### Deployment

Automatic deployment via Vercel:
- **Production:** Push to `main` or `next` branch
- **Preview:** Every pull request gets a preview URL

See [CLAUDE.md](CLAUDE.md) for complete development guidelines.
