import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const init = async () => {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  
  const authStore = useAuthStore()
  try {
    await authStore.initialize()
  } catch (error) {
    console.error('Failed to initialize authentication store:', error)
  }

  app.use(router)
  app.mount('#app')
}

init()
