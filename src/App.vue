<script setup lang="ts">
import { ref, computed } from 'vue'

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
    <h1>Scrabble Clock</h1>

    <div class="clock-container">
      <div
        class="player-clock"
        :class="{
          active: activePlayer === 1,
          overtime: player1InOvertime,
        }"
        @click="handlePlayerClick(1)"
      >
        <h2>Player 1</h2>
        <div class="time">{{ player1DisplayTime }}</div>
        <div v-if="player1InOvertime" class="overtime-indicator">OVERTIME</div>
      </div>

      <div class="controls">
        <button @click="resetTimer">Reset</button>
        <button v-if="activePlayer !== 0" @click="stopTimer">Pause</button>
      </div>

      <div
        class="player-clock"
        :class="{
          active: activePlayer === 2,
          overtime: player2InOvertime,
        }"
        @click="handlePlayerClick(2)"
      >
        <h2>Player 2</h2>
        <div class="time">{{ player2DisplayTime }}</div>
        <div v-if="player2InOvertime" class="overtime-indicator">OVERTIME</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrabble-clock {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  font-family: Arial, sans-serif;
}

h1 {
  margin-bottom: 2rem;
  color: #2c3e50;
}

.clock-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.player-clock {
  flex: 1;
  padding: 2rem;
  border-radius: 8px;
  background-color: #f5f5f5;
  cursor: pointer;
  transition: all 0.3s ease;
}

.player-clock.active {
  background-color: #4caf50;
  color: white;
  transform: scale(1.05);
}

.player-clock.overtime {
  background-color: #ff9800;
}

.player-clock.active.overtime {
  background-color: #f44336;
}

.time {
  font-size: 3rem;
  font-weight: bold;
  margin: 1rem 0;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background-color: #2c3e50;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #1a2530;
}

.overtime-indicator {
  font-weight: bold;
  color: white;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

@media (max-width: 768px) {
  .clock-container {
    flex-direction: column;
  }

  .player-clock {
    width: 100%;
  }

  .controls {
    flex-direction: row;
    margin: 1rem 0;
  }
}
</style>
