<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Define the BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

// Define the Navigator interface extension for Safari
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

const showInstallPrompt = ref(false)
const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)

// Check if the app is already installed
const isAppInstalled = () => {
  // Check if in standalone mode or display-mode is standalone (PWA installed)
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      (window.navigator as NavigatorWithStandalone).standalone === true)
  )
}

// Check if the user has previously dismissed the prompt
const hasUserDismissedPrompt = () => {
  return localStorage.getItem('pwaInstallPromptDismissed') === 'true'
}

onMounted(() => {
  // Don't show the prompt if the app is already installed or user dismissed it
  if (isAppInstalled() || hasUserDismissedPrompt()) {
    return
  }

  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default browser prompt
    e.preventDefault()
    // Store the event for later use
    deferredPrompt.value = e as BeforeInstallPromptEvent
    // Show our custom prompt
    showInstallPrompt.value = true
  })
})

// Install the app
const installApp = () => {
  if (!deferredPrompt.value) {
    return
  }

  // Show the browser's install prompt
  deferredPrompt.value.prompt()

  // Wait for the user to respond to the prompt
  deferredPrompt.value.userChoice.then((choiceResult: { outcome: string }) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    // Clear the saved prompt
    deferredPrompt.value = null
    // Hide our custom prompt
    showInstallPrompt.value = false
  })
}

// Dismiss the prompt
const dismissPrompt = () => {
  showInstallPrompt.value = false
  // Remember that the user dismissed the prompt
  localStorage.setItem('pwaInstallPromptDismissed', 'true')
}
</script>

<template>
  <div v-if="showInstallPrompt" class="install-prompt">
    <div class="install-prompt-content">
      <div class="install-prompt-text">
        <p>Install Scrabble Clock for a better experience!</p>
      </div>
      <div class="install-prompt-buttons">
        <button @click="installApp" class="install-btn">Install</button>
        <button @click="dismissPrompt" class="dismiss-btn">Not Now</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.install-prompt {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #212121;
  color: #e0e0e0;
  padding: 1rem;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.install-prompt-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
}

.install-prompt-text {
  flex: 1;
}

.install-prompt-text p {
  margin: 0;
  font-size: 1rem;
}

.install-prompt-buttons {
  display: flex;
  gap: 0.5rem;
}

.install-btn {
  background-color: #2e7d32;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.install-btn:hover {
  background-color: #1b5e20;
}

.dismiss-btn {
  background-color: transparent;
  color: #e0e0e0;
  border: 1px solid #424242;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.dismiss-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

@media (max-width: 600px) {
  .install-prompt-content {
    flex-direction: column;
    gap: 0.5rem;
  }

  .install-prompt-buttons {
    width: 100%;
    justify-content: center;
  }

  .install-btn,
  .dismiss-btn {
    flex: 1;
  }
}
</style>
