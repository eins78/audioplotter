# CLAUDE.md - Guidelines for audioplotter

## Project Overview
**audioplotter** creates graphics for penplotters from audio files by generating waveform visualizations as downloadable SVGs.

- **Tech Stack**: Next.js 12, React 17, Node.js 22, Web Audio API, Bootstrap 5
- **Architecture**: Client-side processing (no backend audio processing)
- **PWA**: Progressive Web App with offline support
- **Homepage**: https://audioplotter.ars.is
- **License**: GNU GPL v3
- **Package Manager**: yarn 1.22.22

## Build/Development Commands

### Development
- `nvm use` - Switch to Node.js 22 (from .nvmrc)
- `yarn install` - Install dependencies
- `yarn dev` - Start Next.js development server (port 3000)
- `yarn dev &` - Start dev server in background
- `yarn dev-audio-server &` - Start local audio file server (port 57915, required for dev)
- `open http://localhost:3000` - Open browser to dev server

### Production
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn serve` - Static file server with CORS

### Docker
- `docker build -t audioplotter .` - Build production image
- `docker run -p 3000:3000 audioplotter` - Run production container

### Testing
- `cd spec && bin/build` - Build test Docker images
- `cd spec && bin/rspec features/example_spec.rb` - Run specific test
- `cd spec && bin/run-tests` - Build and run all tests
- VNC access to test browser: `localhost:5901` (VNC) or `localhost:7901` (noVNC web viewer)

### Code Formatting
- `yarn prettier --write .` - Format all files

### VS Code Tasks
- Available tasks: "run dev" (composite), "run next dev", "run dev audio file server"

## Code Style

### Formatting (Prettier)
- **No semicolons**
- **Single quotes**
- **120 character line width**

### Components
- **Functional components only** with React hooks
- **No class components**

### Naming Conventions
- **PascalCase**: Components (`AudioPlotter`, `SvgFromAudioPeaks`)
- **camelCase**: Functions, variables (`filterData`, `normalizeData`)
- **UPPER_SNAKE_CASE**: Constants (`DEFAULT_HEIGHT`, `MAX_BANDS`)

### Imports
- Group by type: React, components, utilities
- Example order: react → react-dom → components → utilities → styles

### Error Handling
- Use custom `Try` utility from `/util/Try.js`
- Example: `Try(() => riskyFunction(), (err) => handleError(err))`

### State Management
- React hooks only: `useState`, `useEffect`, `useRef`, `useCallback`
- No external state management libraries

### Testing
- RSpec with Capybara for E2E tests
- Selenium WebDriver with Firefox
- Docker Compose orchestration

## Project Structure

### Key Directories
```
/components       - React components
/pages           - Next.js pages (routes)
  /api           - API routes (currently unused)
/util            - Utility functions
/spec            - Test files (RSpec + Capybara)
  /bin           - Test runner scripts
  /config        - Test configuration
  /features      - Test scenarios
/styles          - SCSS styles
/public          - Static assets
  /icons         - PWA icons (multiple sizes)
```

### Key Files
- `next.config.js` - Next.js config (PWA, standalone output)
- `.nvmrc` - Node version (22)
- `Dockerfile` - Multi-stage production build
- `package.json` - Dependencies and scripts
- `manifest.json` - PWA manifest (theme: #500cbd purple)

## Key Components

### AudioAnalyzer.js
Audio processing and peak calculation using Web Audio API.

**Exports:**
- `AudioBuffer` - Fetches audio file from URL, returns ArrayBuffer
- `AudioPeaks` - Decodes audio, filters into bands, calculates peaks
- Constants: `MIN_BANDS` (1), `MAX_BANDS` (2048), `DEFAULT_BANDS` (1024)

**Process:** Fetch → Decode → Filter → Normalize

### AudioPlotter.js
Main application component with UI controls.

**Features:**
- User interaction required for Web Audio API ("Go" button)
- Default audio: Amen Break (Wikipedia MP3 in prod, local in dev)
- Controls: URL, style, height, bands, trim, stroke width, normalize, caps
- Debounced trim inputs (50ms)
- SVG download with descriptive filename

**Default Settings:**
- Height: 150px, Bands: 1024
- Trim: [32.78, 20.22] for Amen Break
- Style: 'saw', Normalize: true, Caps: true

### SvgFromAudioPeaks.js
Generates SVG visualization from audio peaks.

**Waveform Styles:**
1. `zigzag` - Alternates above/below centerline (not symmetric)
2. `saw` - Sawtooth wave pattern (symmetric, higher density)
3. `bars` - Vertical bars centered on middle (symmetric)
4. `circle` - Circles above/below centerline (radius = amplitude)

**Constants:**
- Width: 1000px (fixed), Padding: 100px
- Height: 1-2048px (variable)
- Stroke width: 0.1-100 (dynamic max based on bands)
- Colors: Black stroke (#222), white fill

### AppLayout.js
Main layout wrapper with header and content area.

### Form/CheckBox.js
Toggle switch component using react-toggle with custom I/O icons.

## Core Features

### Audio Processing Workflow
1. **Fetch**: Load audio file from URL (client-side)
2. **Decode**: Web Audio API decodes to audio buffer
3. **Filter**: Divide into bands (1-2048), calculate average amplitude per band
4. **Normalize**: Optional 0-1 range normalization
5. **Visualize**: Generate SVG with selected style

### Trimming
- **Trim Start**: Remove % from beginning (0-99.99%)
- **Trim End**: Remove % from end (0-99.99%)
- Useful for isolating specific sections (e.g., drum breaks)

### SVG Download
**Filename Format:**
```
{audio-name}-h{height}-b{bands}-ts{trimStart}-te{trimEnd}-norm{yes/no}-caps{yes/no}.svg
```

**Example:** `amen-break-h150-b1024-ts32.78-te20.22-normyes-capsyes.svg`

## Key Dependencies

### Production
- `next` (^12.1.0) - React framework with SSR/SSG
- `react` (17.0.2) - UI library
- `audio-context`, `audio-buffer-utils` - Web Audio API utilities
- `react-svg-path` - SVG path generation
- `bootstrap` (^5.0.0-beta3) - CSS framework
- `react-toggle` - Toggle component
- `lodash.debounce` - Input debouncing
- `next-pwa` - Progressive Web App support

### Development
- `prettier` (^2.5.1) - Code formatter
- `sass` (^1.35.2) - SCSS compiler
- `serve` - Local file server with CORS

### Testing
- `rspec`, `capybara`, `selenium-webdriver` - Test framework
- Ruby 3.1.1, Firefox 97.0 (Selenium container)

## Configuration

### Environment Variables
**Test Environment:**
- `APP_URL` - App under test (default: http://web:3000)
- `SELENIUM_URL` - Selenium server (default: http://selenium-firefox:4444)

**Build:**
- `NODE_ENV` - 'development' or 'production'
- `NEXT_TELEMETRY_DISABLED=1` - Disables Next.js telemetry (set in Dockerfile)

### PWA Settings
- **Theme Color**: #500cbd (purple)
- **Display**: Fullscreen
- **Orientation**: Portrait
- **Icons**: 72x72 to 512x512

## Development Workflow

### Initial Setup
```bash
git clone https://github.com/eins78/audioplotter
cd audioplotter
nvm use
yarn install
```

### Daily Development
```bash
yarn dev &                  # Start Next.js
yarn dev-audio-server &     # Start local audio server
open http://localhost:3000  # Open browser
```

### Local Audio Server
- **Port**: 57915
- **CORS**: Enabled
- **Purpose**: Serves audio file for development without CORS issues
- **Required**: Yes, for development mode

### Testing Workflow
```bash
cd spec
bin/build                   # First time only
bin/run-tests              # Run all tests
```

**View Browser During Tests:**
- VNC: `open vnc://localhost:5901` (no password)
- noVNC: `open http://localhost:7901` (web viewer)

### Git Workflow
- **Current Branch**: `main` (development)
- **PR Target**: `next` (main branch for pull requests)

## Deployment

### Docker Production
```bash
docker build -t audioplotter .
docker run -p 3000:3000 audioplotter
```

**Dockerfile Features:**
- Multi-stage build (deps → builder → runner)
- Node 22 Alpine base
- Non-root user (nodejs:1001)
- Standalone output mode
- Optimized for size

### Vercel
Recommended deployment platform (configured for Next.js).

## Constants & Limits

### Audio Processing
- **Bands**: 1-2048 (default: 1024)
- **Trim**: 0-99.99% (start/end)
- **Normalization**: Optional (default: true)

### SVG Output
- **Width**: 1000px (fixed)
- **Height**: 1-2048px (default: 150px)
- **Padding**: 100px
- **Stroke Width**: 0.1-100 (step: 0.1, dynamic max)
- **Caps**: Optional line caps (default: true)

## Utilities

### Try.js
Error handling wrapper: `Try(() => fn(), (err) => handleErr(err))`

### svgDomNodeToBlob.js
Converts SVG DOM node to Blob for download.

### debounce
From lodash, used for trim point inputs (50ms delay).
