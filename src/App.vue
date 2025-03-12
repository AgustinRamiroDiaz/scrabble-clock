<script setup lang="ts">
import { ref, computed } from 'vue'
import PauseIcon from './components/icons/pause-circle-svgrepo-com.svg'
import InstallPrompt from './components/InstallPrompt.vue'
import UpdateNotification from './components/UpdateNotification.vue'

// Player timer states (now in tenths of seconds)
const player1Time = ref(30 * 60 * 10) // 30 minutes in tenths of seconds
const player2Time = ref(30 * 60 * 10) // 30 minutes in tenths of seconds
const player1Overtime = ref(8 * 60 * 10) // 8 minutes overtime in tenths of seconds
const player2Overtime = ref(8 * 60 * 10) // 8 minutes overtime in tenths of seconds
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
  return formatTime(player1Time.value > 0 ? player1Time.value : player1Overtime.value)
})

const player2DisplayTime = computed(() => {
  return formatTime(player2Time.value > 0 ? player2Time.value : player2Overtime.value)
})

// Check if player is in overtime
const player1InOvertime = computed(() => player1Time.value <= 0 && player1Overtime.value > 0)
const player2InOvertime = computed(() => player2Time.value <= 0 && player2Overtime.value > 0)

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
      } else if (player1Overtime.value > 0) {
        player1Overtime.value--
      } else {
        stopTimer()
      }
    } else if (player === 2) {
      if (player2Time.value > 0) {
        player2Time.value--
      } else if (player2Overtime.value > 0) {
        player2Overtime.value--
      } else {
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
        }"
        @click="handlePlayerClick(2)"
      >
        <div class="time">{{ player2DisplayTime }}</div>
        <div v-if="player2InOvertime" class="overtime-indicator">OVERTIME</div>
      </div>

      <div class="controls">
        <button @click="showResetConfirmationDialog" class="reset-btn">Reset</button>
        <button v-if="activePlayer !== 0" @click="stopTimer" class="pause-btn">
          <img :src="PauseIcon" alt="Pause" class="pause-icon" />
        </button>
      </div>

      <div
        class="player-clock player-1"
        :class="{
          active: activePlayer === 1,
          overtime: player1InOvertime,
          disabled: showResetConfirmation,
        }"
        @click="handlePlayerClick(1)"
      >
        <div class="time">{{ player1DisplayTime }}</div>
        <div v-if="player1InOvertime" class="overtime-indicator">OVERTIME</div>
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
}

.player-clock {
  width: 100%;
  padding: 0.5rem 0;
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
  background-color: #e65100;
}

.player-clock.active.overtime {
  background-color: #c62828;
}

.player-clock.disabled {
  pointer-events: none;
  opacity: 0.7;
}

.time {
  font-size: 8vw;
  font-weight: bold;
  margin: 0;
  line-height: 1;
  width: 100%;
  text-align: center;
  letter-spacing: -0.02em;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem;
  width: 100%;
  z-index: 10;
  background-color: #212121;
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

.overtime-indicator {
  font-weight: bold;
  color: white;
  background-color: rgba(255, 255, 255, 0.15);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
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
    padding: 0.5rem;
  }

  .time {
    font-size: 12vw;
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
}

/* Additional responsive adjustments for different screen sizes */
@media (min-height: 601px) and (max-height: 800px) {
  .time {
    font-size: 14vw;
  }
}

@media (min-height: 801px) {
  .time {
    font-size: 16vw;
  }
}

@media (orientation: landscape) {
  .time {
    font-size: 16vh;
  }
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
</style>
