# audioplotter

create graphics for penplotters from audio files, aka waveforms, soundwaves.

- analyses audio: calculate "peaks" (volume per time slot for N numbers of slots)
- visualize peaks styles:
  - `zigzag`: alternates drawing points above and below the horizontal centerline.
    looks like a standard waveform from far, and like a frequency graph up close.
    _Not symmetric_
  - `saw`: follows a [Sawtooth wave](https://en.wikipedia.org/wiki/Sawtooth_wave) pattern.
    _Is symmetric but has more line density per bands._

## Ideas

- addCaps: also add line of configurable length to start and end (like starting with silence, but just a horixontal line)
- playback of the audio
- show audio file info
- better download option
- options to trim start/endpoint of audio (needed for amen break demo, wikimedia hosted file hast context around it)
- separate frequencies, create 1 graph per band in different colors (low/red,mid/green,high/yellow)

## Credits

Thanks to Matthew Ström for writing the article ["Making an Audio Waveform Visualizer with Vanilla JavaScript" on css-tricks.com](https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/) and [open-sourcing the example code](https://codepen.io/matthewstrom/pen/mddOWWg), on which the initial prototype of this tool is based.

## Development

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

### Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
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
