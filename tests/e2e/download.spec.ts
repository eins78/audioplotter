import { test, expect } from '@playwright/test'

test.describe('SVG Download', () => {
  test('downloads SVG with correct filename and content', async ({ page }) => {
    await page.goto('/')

    // Load audio
    await page.click('button:has-text("Go")')
    await page.waitForSelector('svg')

    // Set up download listener
    const downloadPromise = page.waitForEvent('download')

    // Click download button
    await page.click('button:has-text("Download")')

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
    await page.click('button:has-text("Go")')
    await page.waitForSelector('svg')

    // Change settings
    await page.selectOption('select#style', 'bars')
    await page.fill('input#height', '200')

    // Set up download listener
    const downloadPromise = page.waitForEvent('download')

    // Download
    await page.click('button:has-text("Download")')
    const download = await downloadPromise

    // Check filename includes settings
    const filename = download.suggestedFilename()
    expect(filename).toContain('-h200-')
  })
})
