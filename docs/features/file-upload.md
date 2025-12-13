# Local File Upload

**Version:** 2.0
**Date:** December 2025
**Status:** Production Ready

## Overview

Upload audio files directly from your device to create waveform visualizations. All processing happens in your browser - no files are uploaded to a server, ensuring privacy and speed.

## Features

### Client-Side Processing

**100% local** - Your audio files never leave your device:

- Files are read using the browser's FileReader API
- Audio processing happens in your browser's Web Audio API
- No server upload, no network transfer (except for the app itself)
- Works offline (PWA mode)

**Privacy benefits:**
- Your audio files remain private
- No file size limits from server upload restrictions
- Faster processing (no network latency)
- Works with sensitive/confidential audio

---

### Supported Formats

**Web Audio API determines supported formats** based on your browser:

| Format | Chrome/Edge | Firefox | Safari | Notes |
|--------|-------------|---------|--------|-------|
| **MP3** | ✓ | ✓ | ✓ | Most common, widely supported |
| **WAV** | ✓ | ✓ | ✓ | Uncompressed, high quality |
| **OGG** | ✓ | ✓ | ✗ | Not supported on Safari |
| **M4A/AAC** | ✓ | Limited | ✓ | Codec-dependent |
| **FLAC** | ✓ | ✓ | ✓ | Lossless, good quality |
| **WebM** | ✓ | ✓ | ✗ | Not supported on Safari |

**Recommended format:** MP3 or WAV for maximum compatibility

**File size:** No practical limit (browser memory is the constraint)
- Small files (<10MB): Instant processing
- Medium files (10-50MB): 1-3 seconds
- Large files (>50MB): May take several seconds, especially with multiband

---

## How to Use

### Method 1: Browse Button

1. Go to **Audio File** section (top of settings)
2. Click **"Browse..."** button next to URL field
3. Select audio file from your device
4. File name appears in the field
5. Click **"Go!"** to process

### Method 2: Drag & Drop (Future)

_Not currently implemented - planned for future release._

---

## Common Workflows

### Workflow 1: Offline Waveform Generation

**Use case:** Working without internet connection

1. Enable audioplotter as PWA (install prompt or bookmark)
2. Open app (works offline)
3. Upload local audio file
4. Generate and download waveform SVG
5. All processing happens locally

### Workflow 2: Private/Confidential Audio

**Use case:** Creating visualizations of sensitive recordings

1. Upload confidential audio file (stays on your device)
2. Generate waveform with desired settings
3. Download SVG
4. No trace of audio file sent to internet

### Workflow 3: High-Quality Source Files

**Use case:** Using uncompressed WAV or FLAC files

1. Upload high-quality local file (no upload size limit)
2. Process with high resolution (2048 points, 8 bands)
3. Download detailed waveform visualization
4. Faster than uploading to a server

---

## Comparison: URL vs File Upload

| Feature | URL (Remote) | File Upload (Local) |
|---------|--------------|---------------------|
| **Privacy** | File accessible via URL | 100% private |
| **Speed** | Network latency | Instant read |
| **File size** | URL host limits | Browser memory limit |
| **Offline** | Requires internet | Works offline (PWA) |
| **Formats** | Host-dependent | Web Audio API formats |
| **Sharing** | Easy (URL in settings) | Must share file separately |
| **CORS issues** | Possible | Never |

**When to use URL:**
- Sharing visualizations (URL persists in settings)
- Audio already hosted online
- Collaborating with others

**When to use File Upload:**
- Privacy required
- Offline work
- Large files
- Audio not publicly available

---

## Technical Details

### Browser Support

**Required:**
- Modern browser with File API support
- Web Audio API (for decoding)

**Tested:**
- Chrome 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓
- Edge 90+ ✓

**Not supported:**
- Internet Explorer (deprecated)
- Very old browsers (<2020)

### How It Works

```
User selects file
    ↓
FileReader API reads file as ArrayBuffer
    ↓
Web Audio API decodes audio buffer
    ↓
Process same as URL-based audio
    ↓
Generate waveform SVG
```

**No server interaction** at any step after app loads.

### File Storage

- **In memory only:** File is read into RAM, not saved to disk
- **Temporary:** File data cleared when you generate a new waveform
- **No caching:** File must be re-uploaded if you refresh the page

---

## Troubleshooting

### "Failed to decode audio" error

**Cause:** File format not supported by your browser
**Solution:**
- Convert file to MP3 or WAV
- Try different browser (Chrome has best codec support)
- Check if file is corrupted

### File picker not opening

**Cause:** Browser permissions issue
**Solution:**
- Check browser console for errors
- Try different browser
- Ensure pop-ups not blocked

### Large file processing is slow

**Cause:** Multiband processing with large files is CPU-intensive
**Solution:**
- Use fewer frequency bands (1-3 instead of 8)
- Reduce points (512 instead of 2048)
- Use trim to process only needed portion
- Be patient - it will complete

### Can't share visualization with file upload

**Cause:** File path not stored in URL (privacy/security)
**Solution:**
- If sharing is needed, host file online and use URL instead
- Or share both SVG and original audio file separately

### File name not showing in field

**Cause:** Browser security prevents full path display
**Solution:**
- This is normal - file name shows instead of full path
- File is still loaded correctly
- Click "Go!" to process

---

## Privacy & Security

### What happens to your file?

1. **Selected:** File path accessed (browser permission)
2. **Read:** File read into browser memory (FileReader API)
3. **Decoded:** Audio decoded in browser (Web Audio API)
4. **Processed:** Waveform calculated in browser
5. **Discarded:** File data cleared from memory

**Never:**
- Uploaded to server
- Stored in database
- Sent over network
- Saved to disk (unless you download SVG)
- Shared with third parties

### Browser Permissions

**File access:**
- Granted per-session when you click "Browse..."
- Revoked when you close tab
- No persistent permission required

**No permissions needed for:**
- Reading uploaded file
- Processing audio
- Downloading SVG

---

## Future Enhancements

Possible additions (not currently implemented):

- Drag & drop file upload
- Multiple file batch processing
- File format validation/error messages
- Progress indicator for large files
- Recent files list (from localStorage)

---

## Related Documentation

- [Multiband Frequency Visualization](multiband-frequency-visualization.md) - Works with uploaded files
- [Preview Panel](preview-panel.md) - Interactive preview while processing uploads
- [CLAUDE.md](../../CLAUDE.md) - Technical implementation details

---

**Your audio, your device, your privacy** 🔒✨
