import { defineStore } from 'pinia'
import { useToastStore } from './toast'
import { apiService, apiServiceExtended } from '../services/api'
import router from '../router'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'


export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string
  bio?: string
  newsletter_subscribed: boolean
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isAuthenticated: false
  }),

  actions: {
    async initialize() {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (userResponse.ok) {
          const userData = await userResponse.json()
          this.user = {
            id: userData.id,
            name: userData.username,
            email: userData.email,
            avatarUrl: userData.profile_pic || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            bio: userData.bio,
            newsletter_subscribed: userData.newsletter_subscribed || false
          }
          this.isAuthenticated = true
        } else {
          localStorage.removeItem('token')
        }
      } catch (error) {
        console.error('Failed to initialize auth', error)
        localStorage.removeItem('token')
      }
    },

    async login(username: string, password: string) {
      const toast = useToastStore()
      try {
        await apiService.login({ username, password })

        const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (userResponse.ok) {
          const userData = await userResponse.json()
          this.user = {
            id: userData.id,
            name: userData.username,
            email: userData.email,
            avatarUrl: userData.profile_pic || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            bio: userData.bio,
            newsletter_subscribed: userData.newsletter_subscribed || false
          }
          this.isAuthenticated = true
          toast.show(`Welcome back, ${this.user.name}!`)
        } else {
          throw new Error('Failed to fetch user data')
        }
      } catch (error: any) {
        toast.show(error.message || 'Login failed', 'error')
        throw error
      }
    },

    async signup(username: string, email: string, password: string) {
      const toast = useToastStore()
      try {
        const userData = await apiService.signup({ username, email, password })

        await apiService.login({ username, password })

        this.user = {
          id: userData.id,
          name: userData.username,
          email: userData.email,
          avatarUrl: userData.profile_pic || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          bio: userData.bio,
          newsletter_subscribed: userData.newsletter_subscribed || false
        }
        this.isAuthenticated = true
        toast.show(`Welcome to Flipboard, ${username}!`)
      } catch (error: any) {
        toast.show(error.message || 'Signup failed', 'error')
        throw error
      }
    },

    async updateNewsletterSubscription(subscribed: boolean) {
      const toast = useToastStore()
      try {
        const userData = await apiServiceExtended.updateUserMe({ newsletter_subscribed: subscribed })
        if (this.user) {
          this.user.newsletter_subscribed = userData.newsletter_subscribed
        }
        toast.show(subscribed ? 'Subscribed to newsletter!' : 'Unsubscribed from newsletter.', 'success')
      } catch (error: any) {
        toast.show('Failed to update newsletter subscription', 'error')
        throw error
      }
    },

    async updateProfile(data: { name?: string; bio?: string; avatarUrl?: string }) {
      const toast = useToastStore()
      try {
        const userData = await apiServiceExtended.updateUserMe({
          username: data.name,
          bio: data.bio,
          profile_pic: data.avatarUrl
        })

        if (this.user) {
          this.user = {
            ...this.user,
            name: userData.username,
            email: userData.email,
            avatarUrl: userData.profile_pic || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            bio: userData.bio,
            newsletter_subscribed: userData.newsletter_subscribed
          }
        }
        toast.show('Profile updated successfully!', 'success')
      } catch (error: any) {
        toast.show(error.message || 'Failed to update profile', 'error')
        throw error
      }
    },

    async triggerNewsletter() {
      const toast = useToastStore()
      try {
        await apiServiceExtended.triggerNewsletter()
        toast.show('Newsletter processing triggered!', 'success')
      } catch (error: any) {
        toast.show('Failed to trigger newsletter', 'error')
      }
    },

    logout() {
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('token')
      const toast = useToastStore()
      toast.show('You have been logged out.', 'info')
      router.push({ name: 'login' })
    }
  }
})
