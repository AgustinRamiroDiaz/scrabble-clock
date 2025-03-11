<script setup lang="ts">
import { ref, computed } from 'vue'
import PauseIcon from './components/icons/pause-circle-svgrepo-com.svg'

// Player timer states
const player1Time = ref(30 * 60) // 30 minutes in seconds
const player2Time = ref(30 * 60) // 30 minutes in seconds
const player1Overtime = ref(8 * 60) // 8 minutes overtime in seconds
const player2Overtime = ref(8 * 60) // 8 minutes overtime in seconds
const activePlayer = ref(0) // 0: no active player, 1: player 1, 2: player 2
const timerInterval = ref<number | null>(null)

// Format time as MM:SS
const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = timeInSeconds % 60
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
  }, 1000)
}

// Stop the timer
const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
  activePlayer.value = 0
}

// Reset the timer
const resetTimer = () => {
  stopTimer()
  player1Time.value = 30 * 60
  player2Time.value = 30 * 60
  player1Overtime.value = 8 * 60
  player2Overtime.value = 8 * 60
}

// Handle player button click
const handlePlayerClick = (player: number) => {
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
    <div class="clock-container">
      <div
        class="player-clock player-2"
        :class="{
          active: activePlayer === 2,
          overtime: player2InOvertime,
        }"
        @click="handlePlayerClick(2)"
      >
        <div class="time">{{ player2DisplayTime }}</div>
        <div v-if="player2InOvertime" class="overtime-indicator">OVERTIME</div>
      </div>

      <div class="controls">
        <button @click="resetTimer" class="reset-btn">Reset</button>
        <button v-if="activePlayer !== 0" @click="stopTimer" class="pause-btn">
          <img :src="PauseIcon" alt="Pause" class="pause-icon" />
        </button>
      </div>

      <div
        class="player-clock player-1"
        :class="{
          active: activePlayer === 1,
          overtime: player1InOvertime,
        }"
        @click="handlePlayerClick(1)"
      >
        <div class="time">{{ player1DisplayTime }}</div>
        <div v-if="player1InOvertime" class="overtime-indicator">OVERTIME</div>
      </div>
    </div>
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
  padding: 1rem;
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

.time {
  font-size: 3.5rem;
  font-weight: bold;
  margin: 0.5rem 0;
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
    font-size: 2.5rem;
    margin: 0.25rem 0;
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
</style>
