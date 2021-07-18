const AudioCtx = require('web-audio-api').AudioContext
// const AudioUtil = require('audio-buffer-utils')

const { filterData, normalizeData } = require('../../components/AudioAnalyzer')

export default async (req, res) => {
  const audioURL =
    'https://upload.wikimedia.org/wikipedia/en/transcoded/8/80/The_Amen_Break%2C_in_context.ogg/The_Amen_Break%2C_in_context.ogg.mp3'
  const audioContext = new AudioCtx()
  const bands = 100,
    trimPoints = [32.78, 20.22],
    normalize = true
  let error, errorMessage, buffer, peaks, decodeError

  console.log('fetching!')
  try {
    const response = await fetch(audioURL)
    console.log('fetched!')
    const { ok, statusText } = response
    if (!ok) throw new Error(statusText)
    buffer = await response.arrayBuffer()
  } catch (err) {
    error = true
    errorMessage = String(err)
  }

  audioContext.decodeAudioData(
    buffer.slice(),
    function onSuccess(audioData) {
      const filteredData = filterData(audioData, bands, trimPoints)
      peaks = normalize ? normalizeData(filteredData) : filteredData
      decodeError = null
      res.status(200).json({ error, errorMessage, decodeError, buffer, peaks })
    },
    function onErr(err) {
      peaks = null
      decodeError = String(err)
      res.status(500).json({ error, errorMessage, decodeError, buffer, peaks })
    }
  )

  // res.status(200).json({ error, errorMessage, decodeError, buffer, peaks })
}
