# Testing Guide

Audioplotter uses a JavaScript-native testing stack (Vitest + Playwright):

1. **Unit Tests** - Pure function tests (fast, isolated)
2. **Component Tests** - React component tests (real browser rendering)
3. **E2E Tests** - User workflow tests (Playwright)

## Quick Start

```bash
# Run all tests
pnpm test:all

# Run specific layers
pnpm test              # Unit tests only (fast!)
pnpm test:browser      # Component tests in browser
pnpm test:e2e          # E2E tests

# Development mode
pnpm test:watch        # Unit tests with watch mode
pnpm test:e2e:ui       # E2E tests with Playwright UI
```

## Architecture

### Unit Tests (Vitest in Node.js)

Tests pure JavaScript/TypeScript functions without DOM overhead

**Config:** `vitest.config.ts`

**Pattern:** `src/**/*.test.ts` (TypeScript only)

**Example:**
```typescript
// src/util/Try.test.ts
import { describe, it, expect } from 'vitest'
import Try from './Try'

describe('Try', () => {
  it('returns value when function succeeds', () => {
    const result = Try(() => 42)
    expect(result).toBe(42)
  })
})
```

**When to use:**
- Pure functions (math, data transformation)
- Utilities independent of DOM/browser APIs
- Business logic

### Component Tests (Vitest Browser Mode)

Tests React components with actual DOM rendering

**Config:** `vitest.browser.config.ts`

**Pattern:** `src/**/*.test.tsx` (JSX files)

**Example:**
```typescript
// src/components/SvgFromAudioPeaks.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import SvgFromAudioPeaks from './SvgFromAudioPeaks'

describe('SvgFromAudioPeaks', () => {
  it('renders SVG element', async () => {
    const testBandPeaks = [{ name: 'Full', lowHz: 20, highHz: 20000, color: '#000000', peaks: [0.5] }]
    const { container } = await render(
      <SvgFromAudioPeaks bandPeaks={testBandPeaks} height={150} style="saw" strokeWidth={1} />
    )

    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })
})
```

**When to use:**
- React component rendering
- Component props validation
- DOM manipulation
- Browser-specific APIs

**Note:** Vitest Browser Mode makes `render()` async - always use `await render()`

### E2E Tests (Playwright)

Tests complete user workflows in real browsers

**Config:** `playwright.config.ts`

**Pattern:** `tests/e2e/**/*.spec.ts`

**Example:**
```typescript
// tests/e2e/audio-workflow.spec.ts
import { test, expect } from '@playwright/test'

test('loads audio and renders SVG', async ({ page }) => {
  await page.goto('/')
  await page.click('button:has-text("Go")')
  await page.waitForSelector('svg')

  const svg = page.locator('svg')
  await expect(svg).toBeVisible()
})
```

**When to use:**
- User workflows (click, type, navigate)
- Integration between multiple components
- Cross-browser compatibility
- PWA functionality (offline, service workers)

## Test Organization

```
/src
  /components
    AudioPlotter.tsx
    AudioPlotter.test.tsx       ← Component test (browser)
  /util
    Try.ts
    Try.test.ts                 ← Unit test (Node.js)
/tests
  /e2e
    audio-workflow.spec.ts      ← E2E test
    download.spec.ts
    pwa.spec.ts
```

**Co-location:** Unit and component tests live next to the code they test.

**Separation:** E2E tests are in `/tests/e2e/` since they test the whole app, not individual files.

## Writing Tests

### Unit Test Template

```typescript
import { describe, it, expect, vi } from 'vitest'
import { myFunction } from './myFunction'

describe('myFunction', () => {
  it('does something specific', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })

  it('handles edge cases', () => {
    expect(myFunction(null)).toBeUndefined()
  })
})
```

### Component Test Template

```typescript
import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders with props', async () => {
    const { container } = await render(
      <MyComponent title="Test" />
    )

    expect(container.textContent).toContain('Test')
  })
})
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('completes user workflow', async ({ page }) => {
    await page.goto('/')

    // Interact with the page
    await page.click('button')
    await page.fill('input', 'value')

    // Assert results
    await expect(page.locator('.result')).toBeVisible()
  })
})
```

## Running Tests

### Local Development

```bash
# Fast feedback loop
pnpm test:watch          # Unit tests re-run on file changes

# Before committing
pnpm test:all            # Run everything

# Debugging E2E tests
pnpm test:e2e:ui         # Opens Playwright UI for step-through debugging
```

### CI/CD

Tests run automatically on every push via GitHub Actions:

**Parallel Jobs:**
1. **test-unit.yml** - Unit + component tests (~1 min)
2. **test-e2e.yml** - E2E tests with artifact upload (~2 min)

**On Failure:**
- E2E tests upload Playwright reports as artifacts
- Click "Artifacts" in GitHub Actions to download traces

## Test Coverage

### Current Coverage

| Layer | Files | Tests | Status |
|-------|-------|-------|--------|
| Unit | 2 | 19 | ✅ Passing |
| Component | 1 | 17/23 | 🟡 Mostly passing |
| E2E | 3 | Created | 🟡 Needs refinement |

### Expanding Coverage

**Priority areas for new tests:**

1. **Unit tests:**
   - More audio processing edge cases
   - SVG path generation utilities

2. **Component tests:**
   - AudioPlotter form interactions
   - CheckBox toggle component
   - Error states

3. **E2E tests:**
   - Cross-browser testing (Firefox, WebKit)
   - Mobile viewport testing
   - Offline PWA scenarios

## Common Issues

### Component Tests Failing

**Problem:** `container` is undefined

**Solution:** Make sure to use `await render()`:
```typescript
// ❌ Wrong
const { container } = render(<Component />)

// ✅ Correct
const { container } = await render(<Component />)
```

### E2E Tests Timeout

**Problem:** Element not found

**Solution:** Check element selectors match actual HTML:
```bash
# Run with headed mode to see what's happening
pnpm exec playwright test --headed

# Or use Playwright UI
pnpm test:e2e:ui
```

### Playwright Browser Not Installed

**Problem:** `browserType.launch: Executable doesn't exist`

**Solution:**
```bash
pnpm exec playwright install chromium
```

## Performance

### Test Speed Comparison

| Test Type | Execution Time | Use Case |
|-----------|---------------|----------|
| Unit | ~600ms for 19 tests | Fast feedback loop |
| Component | ~5s for 23 tests | Browser startup overhead |
| E2E | ~30s for 3 tests | Full app integration |

**Optimization tip:** Write unit tests for logic, component tests for rendering, E2E tests for critical user paths only.

## Migration Notes

### From RSpec/Capybara (December 2025)

**Before:**
- 1 smoke test (checks page title)
- Ruby + Docker + Selenium
- ~3 min CI time for minimal coverage

**After:**
- 40+ tests across 3 layers
- JavaScript-only stack
- ~2 min CI time with parallel jobs
- Better debugging (traces, screenshots)

**Key Changes:**
1. Removed `/spec` directory
2. Removed `ci-integration-tests.yml` workflow
3. Added Vitest and Playwright configs
4. Exported `filterData` and `normalizeData` from AudioAnalyzer for testing

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vitest Browser Mode Guide](https://vitest.dev/guide/browser/)
- [vitest-browser-react](https://github.com/vitest-dev/vitest-browser-react)
- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

## Questions?

For test-related questions or issues, see:
- Configuration files in the repo root
- GitHub Actions workflows in `.github/workflows/`
- Existing test files for examples
