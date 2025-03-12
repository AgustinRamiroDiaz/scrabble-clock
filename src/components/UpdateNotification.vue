<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showUpdateNotification = ref(false)

onMounted(() => {
  // Listen for messages from the service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_UPDATED') {
      showUpdateNotification.value = true
    }
  })
})

// Refresh the page to apply updates
const refreshApp = () => {
  window.location.reload()
}
</script>

<template>
  <div v-if="showUpdateNotification" class="update-notification">
    <div class="update-notification-content">
      <p>New version available! Click to update.</p>
      <button @click="refreshApp" class="update-btn">Update</button>
    </div>
  </div>
</template>

<style scoped>
.update-notification {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #2e7d32;
  color: white;
  padding: 0.75rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

.update-notification-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
}

.update-notification-content p {
  margin: 0;
  font-size: 1rem;
}

.update-btn {
  background-color: white;
  color: #2e7d32;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  transition: background-color 0.3s;
}

.update-btn:hover {
  background-color: #f0f0f0;
}

@media (max-width: 600px) {
  .update-notification-content {
    flex-direction: column;
    gap: 0.5rem;
  }

  .update-btn {
    width: 100%;
  }
}
</style>
