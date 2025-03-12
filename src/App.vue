<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PauseIcon from './components/icons/pause-circle-svgrepo-com.svg'
import VolumeUpIcon from './components/icons/volume-up-svgrepo-com.svg'
import VolumeMuteIcon from './components/icons/volume-mute-svgrepo-com.svg'
import InstallPrompt from './components/InstallPrompt.vue'
import UpdateNotification from './components/UpdateNotification.vue'
import audioService from './services/AudioService'

// Initialize audio service
onMounted(() => {
  audioService.init()
})

// Check if we're in development mode
const isDevelopment = import.meta.env.MODE === 'development'

// Player timer states (now in tenths of seconds)
const player1Time = ref(30 * 60 * 10) // 30 minutes in tenths of seconds
const player2Time = ref(30 * 60 * 10) // 30 minutes in tenths of seconds
const player1Overtime = ref(8 * 60 * 10) // 8 minutes overtime in tenths of seconds
const player2Overtime = ref(8 * 60 * 10) // 8 minutes overtime in tenths of seconds
const player1OvertimeExpired = ref(false) // Track if player 1's overtime has expired
const player2OvertimeExpired = ref(false) // Track if player 2's overtime has expired
const activePlayer = ref(0) // 0: no active player, 1: player 1, 2: player 2
const timerInterval = ref<number | null>(null)
const showResetConfirmation = ref(false) // State for showing reset confirmation popup

// Format time as MM:SS (converting from tenths of seconds)
const formatTime = (timeInTenthsOfSeconds: number) => {
  const totalSeconds = Math.floor(timeInTenthsOfSeconds / 10)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Computed properties for displaying time
const player1DisplayTime = computed(() => {
  if (player1OvertimeExpired.value) return '00:00'
  return formatTime(player1Time.value > 0 ? player1Time.value : player1Overtime.value)
})

const player2DisplayTime = computed(() => {
  if (player2OvertimeExpired.value) return '00:00'
  return formatTime(player2Time.value > 0 ? player2Time.value : player2Overtime.value)
})

// Check if player is in overtime
const player1InOvertime = computed(
  () => (player1Time.value <= 0 && player1Overtime.value > 0) || player1OvertimeExpired.value,
)

const player2InOvertime = computed(
  () => (player2Time.value <= 0 && player2Overtime.value > 0) || player2OvertimeExpired.value,
)

// Calculate penalty points based on remaining overtime
// -10 points per minute of overtime used
const calculatePenaltyPoints = (overtimeInTenths: number, overtimeExpired: boolean) => {
  if (overtimeExpired) return -80 // Maximum penalty when overtime is expired

  // Total overtime is 8 minutes (480 seconds or 4800 tenths)
  // Calculate how many full minutes of overtime have been used
  const totalOvertimeTenths = 8 * 60 * 10
  const usedOvertimeTenths = totalOvertimeTenths - overtimeInTenths
  const usedOvertimeMinutes = Math.ceil(usedOvertimeTenths / (60 * 10))

  // Penalty is -10 points per minute used
  return usedOvertimeMinutes * -10
}

// Computed properties for penalty points
const player1PenaltyPoints = computed(() => {
  if (!player1InOvertime.value) return 0
  return calculatePenaltyPoints(player1Overtime.value, player1OvertimeExpired.value)
})

const player2PenaltyPoints = computed(() => {
  if (!player2InOvertime.value) return 0
  return calculatePenaltyPoints(player2Overtime.value, player2OvertimeExpired.value)
})

// Start the timer for a player
const startTimer = (player: number) => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }

  activePlayer.value = player

  timerInterval.value = setInterval(() => {
    if (player === 1) {
      if (player1Time.value > 0) {
        player1Time.value--
        // Check if regular time just ended
        if (player1Time.value === 0) {
          audioService.playSound('regular-time-end')
        }
      } else if (player1Overtime.value > 0) {
        player1Overtime.value--
        // Check if overtime just ended
        if (player1Overtime.value === 0) {
          audioService.playSound('overtime-end')
        }
      } else if (!player1OvertimeExpired.value) {
        player1OvertimeExpired.value = true
        stopTimer()
      }
    } else if (player === 2) {
      if (player2Time.value > 0) {
        player2Time.value--
        // Check if regular time just ended
        if (player2Time.value === 0) {
          audioService.playSound('regular-time-end')
        }
      } else if (player2Overtime.value > 0) {
        player2Overtime.value--
        // Check if overtime just ended
        if (player2Overtime.value === 0) {
          audioService.playSound('overtime-end')
        }
      } else if (!player2OvertimeExpired.value) {
        player2OvertimeExpired.value = true
        stopTimer()
      }
    }
  }, 100) // Now updating every 100ms (1/10th of a second)
}

// Stop the timer
const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
  activePlayer.value = 0
}

// Show reset confirmation
const showResetConfirmationDialog = () => {
  // Pause the timer while showing confirmation
  const wasActive = activePlayer.value
  if (wasActive) {
    stopTimer()
  }
  showResetConfirmation.value = true
}

// Reset the timer
const resetTimer = () => {
  stopTimer()
  player1Time.value = 30 * 60 * 10
  player2Time.value = 30 * 60 * 10
  player1Overtime.value = 8 * 60 * 10
  player2Overtime.value = 8 * 60 * 10
  player1OvertimeExpired.value = false
  player2OvertimeExpired.value = false
  showResetConfirmation.value = false
}

// Cancel reset
const cancelReset = () => {
  showResetConfirmation.value = false
}

// Handle player button click
const handlePlayerClick = (player: number) => {
  // Don't allow player clicks when confirmation is showing
  if (showResetConfirmation.value) return

  if (activePlayer.value === 0) {
    // Start the timer for the clicked player
    startTimer(player)
  } else if (activePlayer.value === player) {
    // Do nothing if the same player clicks again
    return
  } else {
    // Switch to the other player
    startTimer(player)
  }
}

// Debug function to reduce player time by 1 minute (only in development mode)
const reduceTimeByOneMinute = (player: number, event: Event) => {
  // Stop event propagation to prevent triggering the parent click handler
  event.stopPropagation()

  if (player === 1) {
    if (player1Time.value > 0) {
      // Reduce by 1 minute (600 tenths of seconds), but don't go below 0
      player1Time.value = Math.max(0, player1Time.value - 600)
    } else if (player1Overtime.value > 0) {
      // If already in overtime, reduce overtime
      player1Overtime.value = Math.max(0, player1Overtime.value - 600)
    }
  } else if (player === 2) {
    if (player2Time.value > 0) {
      // Reduce by 1 minute (600 tenths of seconds), but don't go below 0
      player2Time.value = Math.max(0, player2Time.value - 600)
    } else if (player2Overtime.value > 0) {
      // If already in overtime, reduce overtime
      player2Overtime.value = Math.max(0, player2Overtime.value - 600)
    }
  }
}

// Toggle sound mute
const toggleMute = () => {
  audioService.toggleMute()
}
</script>

<template>
  <div class="scrabble-clock">
    <!-- Update Notification -->
    <UpdateNotification />

    <div class="clock-container">
      <div
        class="player-clock player-2"
        :class="{
          active: activePlayer === 2,
          overtime: player2InOvertime,
          disabled: showResetConfirmation,
          expired: player2OvertimeExpired,
        }"
        @click="handlePlayerClick(2)"
      >
        <div class="time">{{ player2DisplayTime }}</div>
        <div v-if="player2InOvertime" class="overtime-container">
          <span class="overtime-indicator">OVERTIME</span>
          <span class="penalty-indicator">{{ player2PenaltyPoints }} pts</span>
        </div>
        <button v-if="isDevelopment" @click="(e) => reduceTimeByOneMinute(2, e)" class="debug-btn">
          -1 min
        </button>
      </div>

      <div class="controls">
        <button @click="showResetConfirmationDialog" class="reset-btn">Reset</button>
        <button v-if="activePlayer !== 0" @click="stopTimer" class="pause-btn">
          <img :src="PauseIcon" alt="Pause" class="pause-icon" />
        </button>
        <button @click="toggleMute" class="sound-btn">
          <img
            v-if="audioService.isMuted.value"
            :src="VolumeMuteIcon"
            alt="Unmute"
            class="sound-icon"
          />
          <img v-else :src="VolumeUpIcon" alt="Mute" class="sound-icon" />
        </button>
      </div>

      <div
        class="player-clock player-1"
        :class="{
          active: activePlayer === 1,
          overtime: player1InOvertime,
          disabled: showResetConfirmation,
          expired: player1OvertimeExpired,
        }"
        @click="handlePlayerClick(1)"
      >
        <div class="time">{{ player1DisplayTime }}</div>
        <div v-if="player1InOvertime" class="overtime-container">
          <span class="overtime-indicator">OVERTIME</span>
          <span class="penalty-indicator">{{ player1PenaltyPoints }} pts</span>
        </div>
        <button v-if="isDevelopment" @click="(e) => reduceTimeByOneMinute(1, e)" class="debug-btn">
          -1 min
        </button>
      </div>
    </div>

    <!-- Reset Confirmation Modal -->
    <div v-if="showResetConfirmation" class="modal-overlay">
      <div class="modal-content">
        <h2>Reset Timer?</h2>
        <p>Are you sure you want to reset the timer?</p>
        <div class="modal-buttons">
          <button @click="cancelReset" class="cancel-btn">Cancel</button>
          <button @click="resetTimer" class="confirm-btn">Reset</button>
        </div>
      </div>
    </div>

    <!-- Install Prompt -->
    <InstallPrompt />
  </div>
</template>

<style scoped>
.scrabble-clock {
  max-width: 100%;
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  text-align: center;
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  background-color: #121212;
  color: #e0e0e0;
}

h1 {
  margin: 0.5rem 0;
  color: #e0e0e0;
  font-size: 1.5rem;
}

.clock-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  width: 100%;
  max-height: 100vh;
}

.player-clock {
  width: 100%;
  padding: 0;
  border-radius: 0;
  background-color: #1e1e1e;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0;
  color: #e0e0e0;
  position: relative;
}

/* Player 2 is upside down for face-to-face play */
.player-clock.player-2 {
  transform: rotate(180deg);
}

.player-clock.active {
  background-color: #2e7d32;
  color: white;
  box-shadow: 0 0 15px rgba(46, 125, 50, 0.5);
}

.player-clock.overtime {
  background-color: #b26b0055;
}

.player-clock.active.overtime {
  background-color: #c62828;
}

.player-clock.disabled {
  pointer-events: none;
  opacity: 0.7;
}

.player-clock.overtime.expired {
  background-color: #b26b00; /* Solid color for expired overtime */
}

.time {
  font-size: 20vw; /* Much larger font size */
  font-weight: bold;
  margin: 0;
  line-height: 1;
  width: 100%;
  text-align: center;
  letter-spacing: -0.05em; /* Tighter letter spacing */
}

.controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem;
  width: 100%;
  z-index: 10;
  background-color: #212121;
  min-height: 60px; /* Ensure controls have a minimum height */
}

button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background-color: #424242;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

button:hover {
  background-color: #616161;
  transform: scale(1.05);
}

.reset-btn {
  padding: 0.75rem 1.5rem;
}

.pause-btn {
  padding: 0.75rem;
  aspect-ratio: 1/1;
}

.pause-icon {
  width: 24px;
  height: 24px;
}

.overtime-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
  width: 100%;
}

.overtime-indicator {
  font-weight: bold;
  color: white;
  background-color: rgba(255, 255, 255, 0.15);
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  display: inline-block;
  font-size: 1.2rem;
}

.penalty-indicator {
  font-weight: bold;
  color: #ff6b6b;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  display: inline-block;
  font-size: 1.2rem;
}

h2 {
  color: #e0e0e0;
  margin: 0.5rem 0;
}

/* Make sure the app takes full height on mobile */
@media (max-height: 600px) {
  .scrabble-clock {
    height: 100vh;
    padding: 0;
  }

  h1 {
    font-size: 1.25rem;
    margin: 0.25rem 0;
  }

  .player-clock {
    padding: 0;
  }

  .time {
    font-size: 18vw;
  }

  .overtime-indicator,
  .penalty-indicator {
    font-size: 1rem;
    padding: 0.3rem 0.5rem;
  }

  button {
    padding: 0.5rem;
  }

  .reset-btn {
    padding: 0.5rem 1rem;
  }

  .pause-icon {
    width: 20px;
    height: 20px;
  }

  .sound-icon {
    width: 20px;
    height: 20px;
  }
}

/* Additional responsive adjustments for different screen sizes */
@media (min-height: 601px) and (max-height: 800px) {
  .time {
    font-size: 22vw;
  }
}

@media (min-height: 801px) {
  .time {
    font-size: 24vw;
  }
}

@media (orientation: landscape) {
  .time {
    font-size: 20vh;
  }

  .clock-container {
    flex-direction: row;
    height: 100vh;
  }

  .player-clock {
    height: 100%;
  }

  .player-clock.player-2 {
    transform: none;
  }

  .controls {
    flex-direction: column;
    height: 100%;
    width: auto;
    min-width: 80px;
  }
}

/* Debug button adjustments */
.debug-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: #c62828;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s;
  z-index: 5;
}

.debug-btn:hover {
  opacity: 1;
}

.player-2 .debug-btn {
  transform: rotate(180deg); /* Rotate the button for player 2 */
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background-color: #212121;
  padding: 1.5rem;
  border-radius: 8px;
  width: 80%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.modal-content h2 {
  margin-top: 0;
  color: #e0e0e0;
}

.modal-content p {
  margin-bottom: 1.5rem;
  color: #e0e0e0;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn {
  background-color: #424242;
}

.confirm-btn {
  background-color: #c62828;
}

.sound-btn {
  padding: 0.75rem;
  aspect-ratio: 1/1;
}

.sound-icon {
  width: 24px;
  height: 24px;
}
</style>
