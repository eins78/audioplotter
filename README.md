# audioplotter

create graphics for penplotters from audio files, aka waveforms, soundwaves.

## Features

- **Audio Analysis:** Calculate "peaks" (volume per time slot for N numbers of slots)
- **Multiple Visualization Styles:**
  - `zigzag`: alternates drawing points above and below the horizontal centerline.
    looks like a standard waveform from far, and like a frequency graph up close.
    _Not symmetric_
  - `saw`: follows a [Sawtooth wave](https://en.wikipedia.org/wiki/Sawtooth_wave) pattern.
    _Is symmetric but has more line density per bands._
  - `bars`: vertical bars centered on the horizontal centerline.
    _Symmetric, great for pen plotters._
- **Multiband Frequency Visualization:** Split audio into 1-8 frequency bands (bass, mid, treble) with customizable colors and opacity ([docs](docs/features/multiband-frequency-visualization.md))
- **Local File Upload:** Process audio files directly from your device (no server upload required)
- **Sticky/Resizable Preview Panel:** Pan, zoom, and resize the preview panel with persistent state ([docs](docs/features/preview-panel.md))
- **URL State Persistence:** All settings saved to URL for easy sharing
- **Blend Modes:** Realistic ink simulation with 6 blend modes (multiply, screen, darken, lighten, overlay, normal)
- **Dark Mode:** Automatic theme detection based on system preferences ([docs](docs/features/dark-mode.md))
- **PWA Support:** Works offline as a Progressive Web App
- **SVG Export:** Download high-quality vector graphics for plotting

## Ideas

- playback of the audio
- show audio file info
- better download option (with preview of settings)

## Credits

Thanks to Matthew Ström for writing the article ["Making an Audio Waveform Visualizer with Vanilla JavaScript" on css-tricks.com](https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/) and [open-sourcing the example code](https://codepen.io/matthewstrom/pen/mddOWWg), on which the initial prototype of this tool is based.

## tests

_Work In Progress, only 1 "smoke" scenario implemented so far_

- Written using RSpec, run with Docker.
- Setup based on examples:
  - <https://github.com/vercel/next.js/tree/79016b879f200c99cc3c3b69b2b84dee14b6615e/examples/with-docker>
  - <https://www.plymouthsoftware.com/articles/rails-on-docker-system-specs-in-containers-with-rspec-capybara-chrome-and-selenium>

```bash
cd spec
bin/build
bin/rspec features/example_spec.rb
```

## Development

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

### Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

### Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
