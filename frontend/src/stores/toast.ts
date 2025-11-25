import { defineStore } from 'pinia'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [] as Toast[]
  }),
  
  actions: {
    show(message: string, type: 'success' | 'error' | 'info' = 'success') {
      const id = Date.now().toString()
      const toast = { id, message, type }
      this.toasts.push(toast)
      
      // Auto remove after 3 seconds
      setTimeout(() => {
        this.remove(id)
      }, 3000)
    },
    
    remove(id: string) {
      const index = this.toasts.findIndex(t => t.id === id)
      if (index !== -1) {
        this.toasts.splice(index, 1)
      }
    }
  }
})
