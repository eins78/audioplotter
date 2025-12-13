import { test, expect } from '@playwright/test'

test.describe('PWA Functionality', () => {
  test('service worker registers and activates', async ({ page }) => {
    await page.goto('/')

    // Wait for service worker to register
    const swReady = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        return registration.active !== null
      }
      return false
    })

    expect(swReady).toBe(true)
  })

  test('app works offline after initial load', async ({ page, context }) => {
    await page.goto('/')

    // Wait for app to fully load
    await expect(page.locator('h1')).toContainText('audioplotter')

    // Wait for service worker
    await page.evaluate(() => navigator.serviceWorker.ready)

    // Load the default audio to cache it
    await page.click('button:has-text("Generate Waveform")')
    await page.waitForSelector('svg[width="1000"]', { timeout: 10000 })

    // Wait for network to be idle (assets cached)
    await page.waitForLoadState('networkidle')

    // Go offline
    await context.setOffline(true)

    // Reload page - should work from cache
    await page.reload()

    // Verify app still works
    await expect(page.locator('h1')).toContainText('audioplotter')

    // Verify we can still interact with UI (check for Generate Waveform button)
    await expect(page.locator('button:has-text("Generate Waveform")')).toBeVisible()

    // Go back online
    await context.setOffline(false)
  })

  test('manifest.json is accessible', async ({ page }) => {
    await page.goto('/')

    // Check manifest link exists (link elements are not "visible" in Playwright)
    const manifestLink = page.locator('link[rel="manifest"]').first()
    await expect(manifestLink).toHaveAttribute('href')

    // Get manifest URL
    const href = await manifestLink.getAttribute('href')
    expect(href).toBeTruthy()

    // Fetch manifest
    const response = await page.goto(href!)
    expect(response?.status()).toBe(200)

    // Parse manifest
    const manifest = await response?.json()
    expect(manifest.name).toBeTruthy()
    expect(manifest.theme_color).toBe('#500cbd')
  })
})
