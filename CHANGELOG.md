# audioplotter

## 2.0.0

### Major Changes

- Migrate from Next.js 12 to Vite 6 with React 19
- Migrate entire codebase to TypeScript with strict mode
- Add multiband frequency visualization (1–8 bands with per-band colors, opacity, and blend modes)

### Features

- Add automatic dark mode support based on system preference
- Add sticky resizable preview panel with pan/zoom controls
- Add URL state persistence for all settings via `nuqs`
- Add client-side file upload for audio processing
- Add 'bars' waveform style with vertical lines
- Add descriptive output filenames including all settings
- Add JS fallback content and SEO meta tags
- Add ts-reset for safer built-in TypeScript types
- Add lint and CI scripts to package.json
- Auto-collapse Audio File panel on waveform generation

### Bug Fixes

- Fix React 19 async useEffect crash
- Fix download to export correct waveform SVG instead of Bootstrap icon
- Enable offline navigation with navigateFallback
- Fix panzoom state preservation when waveform parameters change
- Fix multiband color initialization and 8-band support
- Fix E2E test selectors for multiband UI
- Upgrade react-svg-path to 2.0.0 for React 19 compatibility
- Modernize Sass and silence deprecation warnings

### Performance

- Optimize waveform rendering with memoization
- Optimize initial page load performance

### Refactoring

- Eliminate non-null assertions for 100% runtime safety
- Replace type casts with `ensureFoo` pattern for runtime safety
- Separate sticky vs inline preview modes
- Convert multiband feature to TypeScript
- Migrate to pnpm

### CI/Testing

- Migrate from RSpec/Selenium to Vitest + Playwright
- Add unit, component, browser, and E2E test suites
- Add GitHub Actions workflows for unit and E2E tests
- Pin Docker base image and Node.js version

## 1.2.0

### Features

- Add Progressive Web App (PWA) support with offline capabilities
- Add favicon and PWA icons (multiple sizes)

## 1.1.1

### Changes

- Make the primary color dark indigo
- Add checkbox toggle component with Sass styling
- Improve default settings for height and trim points
- Upgrade all dependencies

## 1.1.0

### Features

- Initial release as a web application
- Generate SVG waveform visualizations from audio files for pen plotters
- Waveform styles: zigzag, saw
- Configurable stroke width, height, number of bands
- Audio trimming (start/end percentage)
- Normalize and line caps options
- SVG download
- Default audio: Amen Break
