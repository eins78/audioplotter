#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SAMPLE_URL =
  'https://upload.wikimedia.org/wikipedia/en/transcoded/8/80/The_Amen_Break%2C_in_context.ogg/The_Amen_Break%2C_in_context.ogg.mp3'
const TARGET_DIR = path.join(__dirname, '..', 'tmp', 'dev')
const TARGET_FILE = path.join(TARGET_DIR, 'amen-break.mp3')

// Create directory if it doesn't exist
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true })
  console.log(`Created directory: ${TARGET_DIR}`)
}

// Check if file already exists
if (fs.existsSync(TARGET_FILE)) {
  console.log('Sample audio file already exists, skipping download')
  process.exit(0)
}

console.log('Downloading sample audio file from Wikimedia...')

try {
  // Use curl with proper user agent to avoid 403 errors
  execSync(
    `curl -L -o "${TARGET_FILE}" -H "User-Agent: Mozilla/5.0 (compatible; audioplotter/1.0)" "${SAMPLE_URL}"`,
    {
      stdio: 'inherit'
    }
  )

  if (fs.existsSync(TARGET_FILE)) {
    console.log(`Sample audio downloaded successfully to: ${TARGET_FILE}`)
  } else {
    console.error('Download failed - file not created')
    process.exit(1)
  }
} catch (error) {
  console.error('Error downloading file:', (error as Error).message)
  process.exit(1)
}
