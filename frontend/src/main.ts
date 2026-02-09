import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vue3GoogleLogin from 'vue3-google-login'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useNotificationStore } from './stores/notifications'
import { watch } from 'vue'

const init = async () => {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(vue3GoogleLogin, {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  })
  
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()
  
  try {
    await authStore.initialize()
    if (authStore.isAuthenticated) {
      notificationStore.startPolling()
      notificationStore.fetchUnreadCount() // Fetch initial count
    }
  } catch (error) {
    console.error('Failed to initialize authentication store:', error)
  }

  // Watch for authentication changes to start/stop polling
  watch(() => authStore.isAuthenticated, (newVal) => {
    if (newVal) {
      notificationStore.startPolling()
      notificationStore.fetchUnreadCount()
    } else {
      notificationStore.stopPolling()
    }
  })

  app.use(router)
  app.mount('#app')
}

init()
