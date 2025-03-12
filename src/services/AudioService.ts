import { ref } from 'vue'

/**
 * Audio Service for playing sound effects
 */
class AudioService {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private initialized: boolean = false
  public isMuted = ref(false)

  /**
   * Initialize the audio service with sound files
   */
  public init(): void {
    if (this.initialized) return

    // Register sounds
    this.registerSound('regular-time-end', '/sounds/regular-time-end.mp3')
    this.registerSound('overtime-end', '/sounds/overtime-end.mp3')

    // Check if mute preference is stored in localStorage
    const storedMute = localStorage.getItem('scrabbleClock.isMuted')
    if (storedMute !== null) {
      this.isMuted.value = storedMute === 'true'
    }

    this.initialized = true
  }

  /**
   * Register a sound with the service
   * @param id Unique identifier for the sound
   * @param url URL to the sound file
   */
  private registerSound(id: string, url: string): void {
    const audio = new Audio(url)
    audio.preload = 'auto'
    this.sounds.set(id, audio)
  }

  /**
   * Play a sound by its ID
   * @param id The ID of the sound to play
   */
  public playSound(id: string): void {
    if (!this.initialized) {
      this.init()
    }

    // Don't play sounds if muted
    if (this.isMuted.value) {
      return
    }

    const sound = this.sounds.get(id)
    if (sound) {
      // Reset the audio to the beginning if it's already playing
      sound.currentTime = 0
      sound.play().catch((error) => {
        console.error(`Error playing sound ${id}:`, error)
      })
    } else {
      console.warn(`Sound with ID ${id} not found`)
    }
  }

  /**
   * Toggle mute state
   */
  public toggleMute(): void {
    this.isMuted.value = !this.isMuted.value
    // Save preference to localStorage
    localStorage.setItem('scrabbleClock.isMuted', this.isMuted.value.toString())
  }
}

// Create a singleton instance
const audioService = new AudioService()

export default audioService
