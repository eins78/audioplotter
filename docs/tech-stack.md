# Tech Stack Documentation

This document describes the technologies used in **audioplotter** and why we chose them.

---

## Core Technologies

### [Vite 6](https://vite.dev/) (v6.0.5)
**Next-generation frontend build tool**

Vite provides instant dev server startup (<1s) and blazing-fast Hot Module Replacement using native ES modules. We chose Vite over Next.js because audioplotter is a simple static SPA that doesn't need server-side rendering or API routes - Vite gives us 10x faster development and 40% smaller bundles without the framework overhead.

**Key Features:**
- Native ESM in development (no bundling needed)
- Instant server startup and HMR
- Optimized production builds with Rollup
- Built-in support for TypeScript, JSX, and CSS preprocessors

**Resources:**
- [Why Vite](https://vite.dev/guide/why)
- [Features Guide](https://vite.dev/guide/features)

---

### [React 19](https://react.dev/) (v19.0.0)
**JavaScript library for building user interfaces**

React 19 (released December 2024) brings modern concurrent features, improved performance, and simplified APIs. We upgraded from React 17 to get the latest features, better hooks behavior, and automatic batching for improved performance.

**Major Improvements from React 17:**
- **Actions**: Async functions in transitions with automatic pending states and error handling
- **ref as a prop**: No more `forwardRef` needed for function components
- **New Hooks**: `use()`, `useActionState()`, `useFormStatus()`, `useOptimistic()`
- **React Compiler**: Optional compiler for automatic optimization
- **Better hydration errors**: Improved error messages for debugging

**Why React 19 for audioplotter:**
- Modern concurrent rendering for smooth audio processing UI
- Simpler component code (ref as prop)
- Better StrictMode for catching useEffect issues during development

**Resources:**
- [React 19 Release Notes](https://react.dev/blog/2024/12/05/react-19)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)

---

### [Node.js 22](https://nodejs.org/) (LTS)
**JavaScript runtime built on Chrome's V8 engine**

Node.js 22 entered Long Term Support (LTS) in October 2024 with codename "Jod". Currently in Maintenance LTS, supported until April 2027.

**Why Node.js 22:**
- LTS support through 2027
- Required for Vite 6 (supports Node 18, 20, 22+)
- Modern JavaScript features (ES modules, top-level await)
- V8 12.x with faster JIT compilation

**Key Features:**
- Built-in WebSocket client
- Stable watch mode for development
- Script runner (`node --run`)
- Type stripping enabled by default (v22.18.0+)
- OpenSSL 3.5.2 for security

**Resources:**
- [Node.js 22 Release Announcement](https://nodejs.org/en/blog/announcements/v22-release-announce)
- [Node.js LTS Schedule](https://nodejs.org/en/about/previous-releases)

---

### [pnpm 10](https://pnpm.io/) (v10.22.0)
**Fast, disk space efficient package manager**

pnpm is 60-70% faster than npm and saves up to 80% disk space by using a content-addressable store. We use pnpm with Corepack to ensure consistent package manager versions across development and CI environments.

**Why pnpm over npm/yarn:**
- **Speed**: 2-3x faster installations (749ms vs npm's 1.3s on cached installs)
- **Disk Space**: Stores packages once globally, symlinks to projects
- **Strict Dependencies**: Prevents phantom dependency bugs
- **Monorepo Support**: Excellent workspace features
- **Corepack Integration**: Automatic version management via package.json

**Corepack Usage:**
```json
"packageManager": "pnpm@10.22.0+sha512.bf049efe995b28f527fd2b41ae0474ce29186f7edcb3bf545087bd61fbbebb2bf75362d1307fda09c2d288e1e499787ac12d4fcb617a974718a6051f2eee741c"
```

Corepack automatically uses the correct pnpm version specified in package.json, ensuring consistency across environments.

**Resources:**
- [pnpm Benchmarks](https://pnpm.io/benchmarks)
- [Corepack Documentation](https://nodejs.org/api/corepack.html)

---

## Progressive Web App (PWA)

### [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (v0.21.1)
**Zero-config PWA plugin for Vite**

Provides automatic service worker generation, offline support, and Web App Manifest integration. We chose this over next-pwa because next-pwa is unmaintained and incompatible with modern frameworks.

**Why vite-plugin-pwa:**
- Actively maintained (next-pwa abandoned in 2024)
- Zero configuration with sensible defaults
- Modern Workbox 7 integration (next-pwa uses outdated Workbox 6)
- Framework-agnostic design
- Development mode PWA support for testing

**Features Used:**
- **Auto-Update**: Service worker updates automatically
- **Precaching**: 54 files cached at install time
- **Runtime Caching**: Custom strategies for external audio files
- **Manifest Generation**: Auto-generates from config

**Resources:**
- [Getting Started Guide](https://vite-pwa-org.netlify.app/guide/)
- [GitHub Repository](https://github.com/vite-pwa/vite-plugin-pwa)

---

### [Workbox 7](https://developer.chrome.com/docs/workbox/) (v7.4.0)
**Production-ready service worker toolkit by Google**

Workbox simplifies service worker implementation with pre-built caching strategies, precaching, and routing. vite-plugin-pwa uses Workbox's `generateSW` strategy to automatically create optimized service workers.

**Caching Strategy:**
- **CacheFirst** for Wikipedia audio files (Amen Break never changes)
- 30-day expiration with 10-entry limit
- Handles CORS opaque responses (status code 0)

**Resources:**
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Caching Strategies Guide](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)

---

## UI & Styling

### [Bootstrap 5.3](https://getbootstrap.com/) (v5.3.8)
**Popular CSS framework for responsive design**

Provides ready-to-use UI components, responsive grid system, and utility classes. We use Bootstrap's Sass source for deep customization with our brand color (#500cbd purple).

**What We Use:**
- Form controls (inputs, selects, buttons)
- Grid system (responsive layouts)
- Utility classes (spacing, flexbox, typography)
- Custom theme via Sass variables

**Why v5.3.8:**
- Stable release (upgraded from 5.0.0-beta3)
- CSS custom properties for theming
- Dark mode support
- Active maintenance and security updates

**Resources:**
- [Bootstrap Documentation](https://getbootstrap.com/docs/5.3/)
- [Customizing Sass](https://getbootstrap.com/docs/5.3/customize/sass/)

---

### [Sass](https://sass-lang.com/) (v1.83.2)
**CSS preprocessor with superpowers**

Sass enables Bootstrap customization through variables, functions, and imports. We use it to override Bootstrap's default theme with our brand color.

**Usage in audioplotter:**
```scss
$indigo: #6610f2;
$primary: shade-color($indigo, 22%);
@import 'bootstrap/scss/bootstrap';
```

**Why Sass:**
- Bootstrap's source is written in Sass
- Color manipulation functions (`shade-color`, `tint-color`)
- Full customization without bloated CSS

**Vite Integration:**
- Zero config needed (just install `sass` package)
- Automatic compilation with HMR
- Source maps for debugging

**Resources:**
- [Sass Documentation](https://sass-lang.com/documentation/)
- [Vite CSS Guide](https://vite.dev/guide/features#css)

---

### [Prettier 3](https://prettier.io/) (v3.4.2)
**Opinionated code formatter**

Automatically formats JavaScript, CSS, and Ruby code with consistent style. We use Prettier to maintain code quality across the project.

**Configuration:**
```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 120
}
```

**Style Choices:**
- No semicolons (cleaner JS)
- Single quotes (consistency)
- 120 character lines (modern wide displays)

**Plugins:**
- `@prettier/plugin-ruby` (v3.0.0) - Formats RSpec test files

**Resources:**
- [Prettier Playground](https://prettier.io/playground/)
- [Configuration Options](https://prettier.io/docs/en/options)

---

## Audio Processing

### [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) (Browser Native)
**Browser API for audio processing and synthesis**

The Web Audio API provides powerful audio processing capabilities entirely in the browser. This is the core technology that enables audioplotter's waveform analysis without any server-side processing.

**Why audioplotter needs it:**
- Decode audio files (MP3, OGG, WAV) client-side
- Analyze frequency data across 1-2048 bands
- Calculate peak amplitudes for waveform generation
- Zero server cost (all processing in browser)

**Browser Support:**
- ✅ Chrome 14+, Firefox 25+, Safari 6.1+, Edge (all)
- ✅ iOS Safari 6+, Android Chrome
- 92% global browser coverage

**Key APIs Used:**
- `AudioContext` - Core audio processing context
- `decodeAudioData()` - Convert audio files to raw data
- Audio buffers for frequency analysis

**Helper Libraries:**
- `audio-context` (v1.0.3) - Cross-browser AudioContext polyfill
- `audio-buffer-utils` (v5.1.2) - Audio buffer manipulation utilities

**Resources:**
- [MDN Web Audio API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Using the Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API)

---

## Supporting Libraries

### [react-toggle](https://www.npmjs.com/package/react-toggle) (v4.1.3)
Elegant toggle switches used for normalize and caps controls. Customized with Bootstrap theme colors.

### [react-svg-path](https://www.npmjs.com/package/react-svg-path) (v1.11.0)
Generates SVG path data for waveform visualizations. Supports various path types (lines, curves, polygons).

### [lodash.debounce](https://www.npmjs.com/package/lodash.debounce) (v4.0.8)
Debounces trim point inputs (50ms delay) to prevent excessive re-renders during rapid input changes.

---

## Deployment & CI

### [Vercel](https://vercel.com/)
**Production hosting platform**

Vercel provides automatic deployments with preview URLs for every PR. Native Vite support means zero configuration needed - just push and deploy.

**Why Vercel:**
- Free tier with generous limits
- Automatic preview deployments per PR
- Native Vite detection
- Global CDN with edge caching
- Zero downtime deployments

**Configuration:** `vercel.json` (framework detection override)

---

### Docker (CI/Testing Only)
**Containerization platform**

Docker is used exclusively for integration testing via Docker Compose. Production uses Vercel, not Docker.

**Usage:**
- Nginx-based container serves built static files
- Used by GitHub Actions for E2E tests
- Runs alongside Selenium Firefox for automated testing

**Note:** The Dockerfile is for CI/testing only, not production deployment.

---

## Testing

### RSpec + Capybara + Selenium
**Ruby-based E2E testing framework**

- **RSpec**: Test framework
- **Capybara**: Browser automation DSL
- **Selenium WebDriver**: Browser driver (Firefox 97.0)
- **Docker Compose**: Test environment orchestration

Tests verify the app loads correctly and basic UI elements render.

---

## Performance Metrics

### Build Performance (Vite 6)
- Dev server startup: **<1 second** (vs Next.js ~10s)
- Hot Module Replacement: **Instant**
- Production build: **~4 seconds**

### Bundle Size
- JavaScript: 463.59 KB (142.93 KB gzipped)
- CSS: 231.65 KB (31.99 KB gzipped)
- **Total gzipped: ~175 KB**

### PWA Metrics
- **Precached files**: 54
- **Offline support**: Full
- **Service worker strategy**: Auto-update
- **Cache duration**: 30 days for external audio

---

## Migration History

### November 2025: Next.js → Vite Migration

**From:**
- Next.js 12.1.0
- React 17.0.2
- next-pwa 5.4.6
- Bootstrap 5.0.0-beta3
- Prettier 2.5.1

**To:**
- Vite 6.0.5
- React 19.0.0
- vite-plugin-pwa 0.21.1
- Bootstrap 5.3.8
- Prettier 3.4.2

**Results:**
- 10x faster dev server
- 5x faster builds
- 40% smaller bundles
- Simplified architecture
- Better PWA support

**See:** `CLAUDE.md` for detailed migration notes.

---

## Future Considerations

### TypeScript Migration
Vite has first-class TypeScript support - just rename files from `.jsx` to `.tsx` and add type annotations. Zero configuration needed.

**Steps:**
1. `pnpm add -D typescript @types/react @types/react-dom`
2. Rename files: `.jsx` → `.tsx`
3. Add type annotations gradually
4. Vite handles everything automatically

**Estimated Effort:** 8-16 hours for full codebase

---

## Technology Selection Criteria

When choosing technologies for audioplotter, we prioritize:

1. **Simplicity**: Minimal configuration, sensible defaults
2. **Performance**: Fast development, optimized production
3. **Maintenance**: Actively maintained, modern tooling
4. **Standards**: Web standards over proprietary solutions
5. **Developer Experience**: Fast feedback loops, great debugging tools

This stack delivers a modern, performant, and maintainable codebase with excellent developer experience.