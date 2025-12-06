import { test, expect } from '@playwright/test'

test.describe('Audio Workflow', () => {
  test('loads default Amen Break and renders SVG', async ({ page }) => {
    await page.goto('/')

    // Check main heading exists
    await expect(page.locator('main h1')).toContainText('audioplotter')

    // Click the Go button to load audio
    await page.click('button:has-text("Go")')

    // Wait for SVG to render
    await page.waitForSelector('svg', { timeout: 10000 })

    // Check SVG is visible
    const svg = page.locator('svg')
    await expect(svg).toBeVisible()

    // Check SVG has expected dimensions
    const width = await svg.getAttribute('width')
    expect(width).toBe('1000')
  })

  test('changes waveform style and updates SVG', async ({ page }) => {
    await page.goto('/')

    // Load audio
    await page.click('button:has-text("Go")')
    await page.waitForSelector('svg')

    // Find style select (it's the first select on the page)
    const styleSelect = page.locator('select').first()
    await styleSelect.selectOption('zigzag')

    // Wait a bit for the SVG to update
    await page.waitForTimeout(500)

    // SVG should still be visible
    await expect(page.locator('svg')).toBeVisible()
  })

  test('adjusts trim points and visualization changes', async ({ page }) => {
    await page.goto('/')

    // Load audio
    await page.click('button:has-text("Go")')
    await page.waitForSelector('svg')

    // Get initial SVG content
    const initialSvg = await page.locator('svg').innerHTML()

    // Adjust trim start using the correct ID
    const trimStart = page.locator('input#inputTrimStart')
    await trimStart.fill('10')
    await trimStart.blur()

    // Wait for debounce and re-render
    await page.waitForTimeout(200)

    // SVG content should have changed
    const updatedSvg = await page.locator('svg').innerHTML()
    expect(updatedSvg).not.toBe(initialSvg)
  })
})
