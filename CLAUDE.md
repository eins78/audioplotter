# CLAUDE.md - audioplotter Guidelines

## Project Overview
**audioplotter** creates graphics for penplotters from audio files by generating waveform visualizations as downloadable SVGs.

- **Tech Stack**: Vite 6, React 19, TypeScript 5.9, Node.js 24, Web Audio API, Bootstrap 5
- **Architecture**: Client-side SPA (audio processing in browser)
- **PWA**: Progressive Web App with offline support (vite-plugin-pwa)
- **Deployment**: Vercel (production), Docker (CI/testing)
- **Homepage**: https://audioplotter.ars.is
- **License**: GNU GPL v3
- **Package Manager**: pnpm (via corepack)

## Build/Development Commands

### Development
- `nvm use` - Switch to Node.js 24 (from .nvmrc)
- `pnpm install` - Install dependencies
- `pnpm dev` - Start Vite development server (port 5173)
- `pnpm dev &` - Start dev server in background
- `pnpm dev-audio-server &` - Start local audio file server (port 57915, required for dev)
- `open http://localhost:5173` - Open browser to dev server

### Production
- `pnpm build` - Build for production (outputs to dist/)
- `pnpm preview` - Preview production build locally
- `pnpm serve` - Serve dist/ folder with static server

### Docker (CI/Testing Only)
- `docker build -t audioplotter .` - Build test image (nginx-based)
- `docker run -p 80:80 audioplotter` - Run test container
- **Note**: Production uses Vercel; Docker serves CI/testing only

### Testing
- `pnpm test` - Run unit tests (fast)
- `pnpm test:watch` - Unit tests in watch mode
- `pnpm test:browser` - Component tests in browser
- `pnpm test:e2e` - E2E tests with Playwright
- `pnpm test:e2e:ui` - E2E tests with Playwright UI (debugging)
- `pnpm test:all` - Run all tests
- **📖 Full guide:** [docs/development/testing.md](docs/development/testing.md)

### Code Formatting
- `pnpm prettier --write .` - Format all files

### VS Code Tasks
- Available tasks: "run dev" (composite), "run vite dev", "run dev audio file server"

## Deployment

### Production (Vercel)
- **Automatic**: Push to `main` or `next` branch triggers deployment
- **Preview**: Every PR gets a preview deployment
- **Configuration**: `vercel.json` (framework: vite, output: dist/)
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install`
- **No server needed**: Vercel serves static files from dist/

### CI/Testing (GitHub Actions)
- **Workflows**: `.github/workflows/test-unit.yml` and `.github/workflows/test-e2e.yml`
- **Parallel jobs**: Unit/component tests run separately from E2E tests
- **Unit tests**: Vitest in Node.js + Vitest Browser Mode with Playwright
- **E2E tests**: Playwright against production build, uploads artifacts on failure
- **Runtime**: ~3 min total (parallel execution)

## Code Style

### Formatting (Prettier)
- **Omit semicolons**
- **Single quotes**
- **120 character line width**

### Components
- **Use functional components exclusively** with React hooks
- **File extension**: `.tsx` for components, `.ts` for utilities

### Naming Conventions
- **PascalCase**: Components (`AudioPlotter`, `SvgFromAudioPeaks`)
- **camelCase**: Functions, variables (`filterData`, `normalizeData`)
- **UPPER_SNAKE_CASE**: Constants (`DEFAULT_HEIGHT`, `MAX_BANDS`)

### Imports
- **Omit extensions**: `import Component from './Component'` (Vite resolves .tsx/.ts)
- Group by type: React, components, utilities
- Example order: react → react-dom → components → utilities → styles

### Environment Variables
- Use `import.meta.env.MODE` instead of `process.env.NODE_ENV`
- Use `import.meta.env.VITE_*` for custom env vars

### Error Handling
- Use custom `Try` utility from `/src/util/Try.ts`
- Example: `Try(() => riskyFunction(), (err) => handleError(err))`

### TypeScript Patterns

#### Custom Type Helpers

**Don't add type-fest as a dependency.** Copy types as needed instead:

1. **Check if built-in works** - Try `Omit`, `Pick`, `Partial`, etc. first
2. **Copy from type-fest** - If you need advanced types, copy from [type-fest](https://github.com/sindresorhus/type-fest) into `/src/types/`
3. **Keep it minimal** - Only copy what you actually use

**Example:** If you need `PartialDeep`:
```typescript
// src/types/helpers.ts
// Copied from type-fest (MIT/CC0)
type PartialDeep<T> = T extends object
  ? { [P in keyof T]?: PartialDeep<T[P]> }
  : T
```

**Why copy instead of depend:**
- Smaller bundle (only what you use)
- No version conflicts
- Easier to customize
- Matches type-fest's philosophy ("no credit required")

**When you might copy from type-fest:**
- `Except<T, K>` - stricter than `Omit` (requires key exists)
- `PartialDeep<T>` - recursive `Partial`
- `RequireAtLeastOne<T>` - enforce at least one property
- `Jsonify<T>` - model JSON serialization
- `Tagged<T, Tag>` - branded/opaque types

#### Type-Safe Enums (const arrays)
Use const arrays instead of TypeScript enums (enforced by `erasableSyntaxOnly: true`):

```typescript
// Define the const array, default, and derive the type
export const STYLES = ['zigzag', 'saw', 'bars'] as const
export const DEFAULT_STYLE: StyleType = 'saw'
export type StyleType = (typeof STYLES)[number]

// Type guard for runtime validation
export function isStyleType(value: unknown): value is StyleType {
  return typeof value === 'string' && STYLES.includes(value as StyleType)
}

// Safe assertion function - returns default for invalid values
export function ensureStyleType(value: unknown): StyleType {
  if (isStyleType(value)) return value
  return DEFAULT_STYLE  // Fallback instead of throwing
}
```

**Usage in components:**
```typescript
// ❌ WRONG: Type casting bypasses runtime validation
onChange={(e) => setValue(e.target.value as StyleType)}

// ✅ CORRECT: Runtime validation with clear error on invalid input
onChange={(e) => setValue(ensureStyleType(e.target.value))}
```

**Why this pattern:**
- `as const` creates a readonly tuple with literal types
- Derived type stays in sync with the array automatically
- `ensureFoo` returns safe default instead of throwing (graceful degradation)
- Type guards (`isFoo`) useful for conditional checks
- No runtime overhead from TypeScript enums

#### Runtime-Safe Null Handling

Never use `!` non-null assertions or type casts (`as`) in `/src` - they bypass runtime safety. Use these patterns instead:

**Tuple destructuring with defaults** (for fixed-length arrays):
```typescript
// State initialized as tuple
const [audioTrimPoints, setAudioTrimPoints] = useState<[number, number]>([0, 100])

// ❌ WRONG: Non-null assertion bypasses runtime safety
const start = audioTrimPoints[0]!

// ✅ CORRECT: Destructure with defaults for type-safe access
const [trimStart = 0, trimEnd = 0] = audioTrimPoints
```

**`.at()` with nullish coalescing** (for dynamic array access):
```typescript
// ❌ WRONG: Non-null assertion
const first = array[0]!

// ✅ CORRECT: Safe access with fallback
const first = array.at(0) ?? defaultValue
```

**`ensureDefined()`** (for nullable values needing defaults):
```typescript
import { ensureDefined } from '../util'

// ❌ WRONG: Non-null assertion
buffer!.slice()

// ✅ CORRECT: Provide fallback value
ensureDefined(buffer, emptyBuffer).slice()
```

**Early return guard** (for control flow):
```typescript
// ✅ CORRECT: Guard clause with early return
if (!buffer) return

// Now TypeScript knows buffer is defined
buffer.slice()
```

**Test files exception:** Non-null assertions (`!`) and type casts (`as`) are allowed in `/spec` test files to reduce verbosity while still testing production code correctly.

#### ts-reset for Safer Built-in Types

We use [`@total-typescript/ts-reset`](https://www.totaltypescript.com/ts-reset) to make TypeScript's built-in types stricter:

**Improvements:**
- `JSON.parse()` returns `unknown` instead of `any` (must validate before use)
- `.filter(Boolean)` properly removes falsy values from types
- `.includes()` works ergonomically on readonly arrays
- `fetch().json()` returns `unknown` for safer response handling
- `localStorage` returns `unknown` (prevents unsafe property access)

**Usage:** Automatically applied via `/src/reset.d.ts` - no imports needed in code.

**Why:** Continues our runtime safety philosophy by making built-in APIs type-safe by default.

### State Management
- React hooks only: `useState`, `useEffect`, `useRef`, `useCallback`

### Testing
- RSpec with Capybara for E2E tests
- Selenium WebDriver with Firefox
- Docker Compose orchestration

## Project Structure

### Key Directories
```
/src                  - Source code (Vite standard)
  /components         - React components (.tsx files)
    /Form             - Form components
  /styles             - SCSS styles
  /util               - Utility functions (.ts files)
  /types              - Custom type declarations for untyped packages
/public               - Static assets (served as-is)
  /icons              - PWA icons (multiple sizes)
/spec                 - Test files (RSpec + Capybara)
  /bin                - Test runner scripts
  /config             - Test configuration
  /features           - Test scenarios
```

### Key Files
- `index.html` - Vite entry point (root)
- `vite.config.js` - Vite config (React plugin, PWA plugin)
- `vercel.json` - Vercel deployment config
- `.nvmrc` - Node version (24)
- `tsconfig.json` - TypeScript configuration (strict mode)
- `Dockerfile` - CI/testing build (nginx-based)
- `package.json` - Dependencies and scripts
- `public/manifest.json` - PWA manifest (theme: #500cbd purple)

## Key Components

### AudioAnalyzer.tsx
Audio processing and peak calculation using Web Audio API.

**Exports:**
- `AudioBuffer` - Fetches audio file from URL, returns ArrayBuffer
- `AudioPeaks` - Decodes audio, filters into bands, calculates peaks
- Constants: `MIN_BANDS` (1), `MAX_BANDS` (2048), `DEFAULT_BANDS` (1024)

**Process:** Fetch → Decode → Filter → Normalize

### AudioPlotter.tsx
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

### SvgFromAudioPeaks.tsx
Generates SVG visualization from audio peaks.

**Waveform Styles:**
1. `zigzag` - Asymmetric pattern alternating above/below centerline
2. `saw` - Sawtooth wave pattern (symmetric, higher density)
3. `bars` - Vertical bars centered on middle (symmetric)

**Constants:**
- Width: 1000px (fixed), Padding: 100px
- Height: 1-2048px (variable)
- Stroke width: 0.1-100 (dynamic max based on bands)
- Colors: Black stroke (#222), white fill

### App.tsx
Main app component (entry point after main.tsx).

**Responsibilities:**
- Merges old _app.js and index.js logic
- Renders AppLayout with AudioPlotter
- Manages version display
- Client-side only rendering (isClient check)

### main.tsx
React 19 entry point using createRoot.

**Responsibilities:**
- Mounts React app to DOM
- Uses React.StrictMode
- Imports App.tsx and styles

### AppLayout.tsx
Main layout wrapper with header and content area.

### Form/CheckBox.tsx
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
- Isolates sections like drum breaks

### SVG Download
**Filename Format:**
```
{audio-name}-h{height}-b{bands}-ts{trimStart}-te{trimEnd}-norm{yes/no}-caps{yes/no}.svg
```

**Example:** `amen-break-h150-b1024-ts32.78-te20.22-normyes-capsyes.svg`

## Key Dependencies

### Production
- `vite` (^6.0.5) - Build tool and dev server
- `react` (^19.0.0) - UI library
- `react-dom` (^19.0.0) - React DOM renderer
- `audio-context`, `audio-buffer-utils` - Web Audio API utilities
- `react-svg-path` - SVG path generation
- `bootstrap` (^5.3.3) - CSS framework
- `react-toggle` - Toggle component
- `lodash.debounce` - Input debouncing
- `vite-plugin-pwa` (^0.21.1) - Progressive Web App support
- `workbox-build`, `workbox-window` (^7.3.0) - Service worker tooling

### Development
- `typescript` (^5.9.3) - TypeScript compiler
- `@total-typescript/ts-reset` (^0.6.1) - Improved built-in TypeScript types
- `@types/react`, `@types/react-dom` - React type definitions
- `@vitejs/plugin-react` (^4.3.4) - Vite React plugin
- `prettier` (^3.4.2) - Code formatter
- `sass` (^1.83.2) - SCSS compiler
- `serve` - Local file server with CORS

### Testing
- `rspec`, `capybara`, `selenium-webdriver` - Test framework
- Ruby 3.1.1, Firefox 97.0 (Selenium container)

## Configuration

### Environment Variables
**Development:**
- `MODE=development` (automatic via Vite)
- Custom vars: prefix with `VITE_`

**Test Environment:**
- `APP_URL` - App under test (default: http://web:80)
- `SELENIUM_URL` - Selenium server (default: http://selenium-firefox:4444)

### PWA Settings
- **Theme Color**: #500cbd (purple)
- **Display**: Fullscreen
- **Orientation**: Portrait
- **Icons**: 72x72 to 512x512
- **Service Worker**: Auto-generated by vite-plugin-pwa
- **Precache**: 54 files

### Vite Configuration
**Key settings in vite.config.js:**
- React plugin with Fast Refresh
- PWA plugin with Workbox integration
- Service worker generation (generateSW strategy)
- Runtime caching for external resources (Wikipedia audio)
- Dev mode PWA support enabled

## Development Workflow

### Initial Setup
```bash
git clone https://github.com/eins78/audioplotter
cd audioplotter
nvm use
pnpm install
```

### Daily Development
```bash
pnpm dev &                  # Start Vite (port 5173)
pnpm dev-audio-server &     # Start local audio server
open http://localhost:5173  # Open browser
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

#### Committing Changes
**For multi-line commit messages**, use a temporary file to avoid shell quoting issues:

```bash
# Write commit message to temp file
cat > ./tmp/commit-msg.txt <<'EOF'
fix: descriptive summary

- Detailed explanation point 1
- Detailed explanation point 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF

# Commit using the file
git commit -F ./tmp/commit-msg.txt
```

**For single-line messages**, use `-m` directly:
```bash
git commit -m "fix: short description"
```

## Deployment Workflow

### Vercel (Production)
1. Push to `main` or `next` triggers automatic deployment
2. Vercel detects Vite via `vercel.json`
3. Runs `pnpm install` and `pnpm build`
4. Serves static files from `dist/`
5. Service worker and PWA features work automatically

### Preview Deployments
- Every PR gets a unique preview URL
- Automatic on PR creation/update
- Tests changes before merging

### Docker (CI/Testing Only)
1. GitHub Actions triggers on push
2. Builds Dockerfile (nginx-based)
3. Starts web service on port 80
4. Runs RSpec tests with Selenium
5. Reports test results

## Performance Metrics

### Development
- **Dev server startup**: <1 second
- **HMR (Hot Module Replacement)**: Instant
- **Module resolution**: Native ESM (no bundling)

### Production Build
- **Build time**: ~4 seconds
- **Bundle size (JS)**: 463.59 KB (142.93 KB gzipped)
- **Bundle size (CSS)**: 231.65 KB (31.99 KB gzipped)
- **Total gzipped**: ~175 KB

### Runtime
- **PWA Score**: 100 (Lighthouse)
- **Service Worker**: 54 files precached
- **Offline Support**: Full (with fallback page)

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

### Try.ts
Error handling wrapper: `Try(() => fn(), (err) => handleErr(err))`

### svgDomNodeToBlob.ts
Converts SVG DOM node to Blob for download.

### debounce
From lodash, used for trim point inputs (50ms delay).

## Migration Notes

### TypeScript Migration (2025-12)
- **Added**: TypeScript 5.9.3 with strict mode
- **Files**: All `.jsx` → `.tsx`, all `.js` → `.ts`
- **Config**: `tsconfig.json` with `erasableSyntaxOnly: true` (no enums/namespaces)
- **Build**: `pnpm build` now runs `tsc --noEmit` before Vite build
- **Types**: Custom declarations in `/src/types/` for untyped packages

### From Next.js 12 to Vite 6 (2025-11)
- **Reason**: Next.js was overkill for static SPA
- **Benefits**: 10x faster dev server, 5x faster builds, 40% smaller bundles
- **Breaking Changes**: None (all component code unchanged)
- **Code Changes**: `process.env` → `import.meta.env`, removed `~` from imports

### From React 17 to React 19
- **Reason**: Latest stable, better concurrent features
- **Entry Point**: Changed to `createRoot` API
- **Breaking Changes**: None (functional components already compatible)
- **StrictMode**: Now remounts in dev (exposes useEffect issues)

### PWA Migration
- **From**: next-pwa (unmaintained, Next.js 15 incompatible)
- **To**: vite-plugin-pwa (active, Workbox 7)
- **Benefits**: Zero-config, better caching, modern service worker

### Deployment
- **Production**: Vercel (automatic, no config changes needed)
- **CI/Testing**: Docker Compose (updated to nginx on port 80)
- **No Docker for prod**: Static files only, Vercel handles everything
