declare module 'audio-context' {
  /**
   * Creates a new AudioContext instance with browser compatibility
   */
  export default class AudioContext extends window.AudioContext {
    constructor(options?: AudioContextOptions)
  }
}
