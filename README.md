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
- **Dark Mode:** Automatic theme detection based on system preferences ([docs](docs/features/dark-mode.md))
- **PWA Support:** Works offline as a Progressive Web App
- **SVG Export:** Download high-quality vector graphics for plotting

## Ideas

- addCaps: add horizontal lines of configurable length to start and end
- playback of the audio
- show audio file info
- enhanced download: format selection, quality settings
- trim audio start and end points (needed for Amen Break demo: the Wikimedia file has audio before and after the break)
- separate frequencies, create 1 graph per band in different colors (low/red,mid/green,high/yellow)

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
