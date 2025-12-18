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
  await authStore.initialize()

  app.use(router)
  app.mount('#app')
}

init()
