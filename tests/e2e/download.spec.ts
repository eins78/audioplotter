import { test, expect } from '@playwright/test'

test.describe('SVG Download', () => {
  test('downloads SVG with correct filename and content', async ({ page }) => {
    await page.goto('/')

    // Load audio
    await page.click('button:has-text("Generate Waveform")')
    await page.waitForSelector('svg[width="1000"]')

    // Set up download listener
    const downloadPromise = page.waitForEvent('download')

    // Click download button
    await page.click('button:has-text("Download SVG")')

    // Wait for download to complete
    const download = await downloadPromise

    // Check filename format
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/\.svg$/)
    expect(filename).toContain('-h')
    expect(filename).toContain('-b')

    // Download the file and check content
    const path = await download.path()
    expect(path).toBeTruthy()

    // Read file content
    const fs = require('fs')
    const content = fs.readFileSync(path, 'utf-8')

    // Verify it's valid SVG
    expect(content).toContain('<svg')
    expect(content).toContain('</svg>')
    expect(content).toContain('width="1000"')
  })

  test('filename reflects current settings', async ({ page }) => {
    await page.goto('/')

    // Load audio
    await page.click('button:has-text("Generate Waveform")')
    await page.waitForSelector('svg[width="1000"]')

    // Expand Waveform Settings (div with role=button, not actual button)
    await page.click('[role="button"]:has-text("Waveform Settings")')

    // Change settings (select has no id, height input is inputHeightNr)
    await page.selectOption('select', 'bars')
    await page.fill('input#inputHeightNr', '200')

    // Set up download listener
    const downloadPromise = page.waitForEvent('download')

    // Download
    await page.click('button:has-text("Download SVG")')
    const download = await downloadPromise

    // Check filename includes settings
    const filename = download.suggestedFilename()
    expect(filename).toContain('-h200-')
  })
})
