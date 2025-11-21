declare module 'audio-buffer-utils' {
  /**
   * Extract a subrange from an AudioBuffer
   * @param buffer - Source AudioBuffer
   * @param start - Starting sample offset
   * @param end - Ending sample offset (negative counts from end)
   * @returns New AudioBuffer containing the subrange
   */
  export function subbuffer(buffer: AudioBuffer, start: number, end: number): AudioBuffer

  export default { subbuffer }
}
