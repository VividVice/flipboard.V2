import { defineStore } from 'pinia'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isAuthenticated: false
  }),
  
  actions: {
    login(email: string) {
      // Mock login logic
      this.user = {
        id: 'u1',
        name: 'Jane Doe',
        email: email,
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
      }
      this.isAuthenticated = true
    },
    
    signup(name: string, email: string) {
      // Mock signup logic
      this.user = {
        id: 'u1',
        name: name,
        email: email,
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
      }
      this.isAuthenticated = true
    },
    
    logout() {
      this.user = null
      this.isAuthenticated = false
    }
  }
})
