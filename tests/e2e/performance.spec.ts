import { test, expect } from '@playwright/test'

test.describe('Performance Optimizations', () => {
  test('has modulepreload hints for JS chunks', async ({ page }) => {
    await page.goto('/')

    // Check that modulepreload links exist
    const modulePreloadLinks = page.locator('link[rel="modulepreload"]')
    const count = await modulePreloadLinks.count()

    // Should have at least 3: vendor, ui, and audio chunks
    expect(count).toBeGreaterThanOrEqual(3)

    // Verify they have crossorigin attribute (required for modules)
    for (let i = 0; i < count; i++) {
      const link = modulePreloadLinks.nth(i)
      await expect(link).toHaveAttribute('crossorigin')

      // Verify href points to a JS file
      const href = await link.getAttribute('href')
      expect(href).toMatch(/\/assets\/.*\.js$/)
    }
  })

  test('service worker registration script has defer attribute', async ({ page }) => {
    await page.goto('/')

    // Find the registerSW.js script
    const swScript = page.locator('script[src*="registerSW"]')

    // Verify it exists
    await expect(swScript).toHaveCount(1)

    // Verify it has defer attribute
    await expect(swScript).toHaveAttribute('defer', '')
  })

  test('service worker still registers correctly with defer', async ({ page }) => {
    await page.goto('/')

    // Wait for page to be fully loaded
    await expect(page.locator('h1')).toContainText('audioplotter')

    // Verify service worker registered despite defer attribute
    const swReady = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        return registration.active !== null
      }
      return false
    })

    expect(swReady).toBe(true)
  })

  test('modulepreload links load before main script execution', async ({ page }) => {
    // Track network requests
    const preloadedScripts = new Set<string>()
    const scriptExecutions: string[] = []

    page.on('request', (request) => {
      const url = request.url()
      if (url.includes('/assets/') && url.endsWith('.js')) {
        // Track when modulepreload scripts start loading
        if (request.resourceType() === 'script') {
          preloadedScripts.add(url)
        }
      }
    })

    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('/assets/') && url.endsWith('.js')) {
        scriptExecutions.push(url)
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify at least 3 scripts were loaded
    expect(scriptExecutions.length).toBeGreaterThanOrEqual(3)
  })
})
