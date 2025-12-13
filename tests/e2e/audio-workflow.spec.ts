import { test, expect } from '@playwright/test'

test.describe('Audio Workflow', () => {
  test('loads default Amen Break and renders SVG', async ({ page }) => {
    await page.goto('/')

    // Check main heading exists (in header banner, not main)
    await expect(page.locator('h1')).toContainText('audioplotter')

    // Click the Generate Waveform button to load audio
    await page.click('button:has-text("Generate Waveform")')

    // Wait for waveform SVG to render (not Bootstrap icons)
    await page.waitForSelector('svg[width="1000"]', { timeout: 10000 })

    // Check waveform SVG is visible
    const svg = page.locator('svg[width="1000"]')
    await expect(svg).toBeVisible()

    // Check SVG has expected dimensions
    const width = await svg.getAttribute('width')
    expect(width).toBe('1000')
  })

  test('changes waveform style and updates SVG', async ({ page }) => {
    await page.goto('/')

    // Load audio
    await page.click('button:has-text("Generate Waveform")')
    await page.waitForSelector('svg[width="1000"]')

    // Expand Waveform Settings section
    await page.click('button:has-text("Waveform Settings")')

    // Find style select (no id, just select element)
    const styleSelect = page.locator('select')
    await styleSelect.selectOption('zigzag')

    // Wait for waveform SVG to still be visible
    await expect(page.locator('svg[width="1000"]')).toBeVisible()
  })

  test('adjusts trim points and visualization changes', async ({ page }) => {
    await page.goto('/')

    // Load audio
    await page.click('button:has-text("Generate Waveform")')
    await page.waitForSelector('svg[width="1000"]')

    // Get initial waveform SVG content
    const initialSvg = await page.locator('svg[width="1000"]').innerHTML()

    // Expand Waveform Settings section
    await page.click('button:has-text("Waveform Settings")')

    // Adjust trim start using the correct ID (now inputTrimStartNr)
    const trimStart = page.locator('input#inputTrimStartNr')
    await trimStart.fill('10')
    await trimStart.blur()

    // Wait for waveform SVG to update
    await expect(page.locator('svg[width="1000"]')).toBeVisible()

    // SVG content should have changed
    const updatedSvg = await page.locator('svg[width="1000"]').innerHTML()
    expect(updatedSvg).not.toBe(initialSvg)
  })
})
