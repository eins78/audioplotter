declare module 'audio-buffer-utils' {
  /**
   * Fills an audio buffer with values
   */
  export function fill(buffer: AudioBuffer, value: number | Float32Array | ((value: number, channel: number, offset: number) => number), channel?: number, start?: number, end?: number): AudioBuffer

  /**
   * Copies data from one buffer to another
   */
  export function copy(fromBuffer: AudioBuffer, toBuffer: AudioBuffer, offset?: number, start?: number, end?: number): AudioBuffer

  /**
   * Slices an audio buffer
   */
  export function slice(buffer: AudioBuffer, start?: number, end?: number): AudioBuffer

  /**
   * Concatenates multiple audio buffers
   */
  export function concat(...buffers: AudioBuffer[]): AudioBuffer

  /**
   * Resizes an audio buffer
   */
  export function resize(buffer: AudioBuffer, length: number): AudioBuffer

  /**
   * Pads an audio buffer
   */
  export function pad(buffer: AudioBuffer, lengthBefore: number, lengthAfter?: number): AudioBuffer | number

  /**
   * Creates a subbuffer (slice) from an audio buffer
   */
  export function subbuffer(buffer: AudioBuffer, start: number, end?: number): AudioBuffer

  /**
   * Shifts audio buffer in time
   */
  export function shift(buffer: AudioBuffer, offset: number): AudioBuffer

  /**
   * Normalizes audio buffer values
   */
  export function normalize(buffer: AudioBuffer, target?: number, start?: number, end?: number): AudioBuffer

  /**
   * Removes DC offset
   */
  export function removeStatic(buffer: AudioBuffer, start?: number, end?: number): AudioBuffer

  /**
   * Trims silence from audio buffer
   */
  export function trim(buffer: AudioBuffer, threshold?: number): AudioBuffer

  /**
   * Mixes multiple audio buffers
   */
  export function mix(buffer: AudioBuffer, ...buffers: AudioBuffer[]): AudioBuffer

  /**
   * Gets the size in bytes of an audio buffer
   */
  export function size(buffer: AudioBuffer): number

  /**
   * Reverses an audio buffer
   */
  export function reverse(buffer: AudioBuffer, start?: number, end?: number): AudioBuffer

  /**
   * Inverts audio buffer values
   */
  export function invert(buffer: AudioBuffer, start?: number, end?: number): AudioBuffer

  /**
   * Sets the number of channels
   */
  export function channels(buffer: AudioBuffer, count: number): AudioBuffer

  export default {
    fill,
    copy,
    slice,
    concat,
    resize,
    pad,
    subbuffer,
    shift,
    normalize,
    removeStatic,
    trim,
    mix,
    size,
    reverse,
    invert,
    channels,
  }
}
