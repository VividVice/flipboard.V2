import { defineStore } from 'pinia'
import { useToastStore } from './toast'
import { useArticleStore } from './articles'
import { useMagazineStore } from './magazines'
import { useCommentsStore } from './comments'
import { useTopicStore } from './topics'
import { useNewsStore } from './news'
import { useNotificationStore } from './notifications'
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
  followers: string[]
  following: string[]
  followed_magazines: string[]
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
            newsletter_subscribed: userData.newsletter_subscribed || false,
            followers: userData.followers || [],
            following: userData.following || [],
            followed_magazines: userData.followed_magazines || []
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
            newsletter_subscribed: userData.newsletter_subscribed || false,
            followers: userData.followers || [],
            following: userData.following || [],
            followed_magazines: userData.followed_magazines || []
          }
          this.isAuthenticated = true
          toast.show(`Welcome back, ${this.user.name}!`)
        } else {
          throw new Error('Failed to fetch user data')
        }
      } catch (error: unknown) {
        toast.show(error instanceof Error ? error.message : 'Login failed', 'error')
        throw error
      }
    },

    async loginWithGoogle(token: string) {
      const toast = useToastStore()
      try {
        await apiService.loginGoogle(token)

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
            newsletter_subscribed: userData.newsletter_subscribed || false,
            followers: userData.followers || [],
            following: userData.following || [],
            followed_magazines: userData.followed_magazines || []
          }
          this.isAuthenticated = true
          toast.show(`Welcome back, ${this.user.name}!`)
        } else {
          throw new Error('Failed to fetch user data')
        }
      } catch (error: unknown) {
        toast.show(error instanceof Error ? error.message : 'Google login failed', 'error')
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
          newsletter_subscribed: userData.newsletter_subscribed || false,
          followers: userData.followers || [],
          following: userData.following || [],
          followed_magazines: userData.followed_magazines || []
        }
        this.isAuthenticated = true
        toast.show(`Welcome to Flipboard, ${username}!`)
      } catch (error: unknown) {
        toast.show(error instanceof Error ? error.message : 'Signup failed', 'error')
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
      } catch (error: unknown) {
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
      } catch (error: unknown) {
        toast.show(error instanceof Error ? error.message : 'Failed to update profile', 'error')
        throw error
      }
    },

    async triggerNewsletter() {
      const toast = useToastStore()
      try {
        await apiServiceExtended.triggerNewsletter()
        toast.show('Newsletter processing triggered!', 'success')
      } catch {
        toast.show('Failed to trigger newsletter', 'error')
      }
    },

    async followUser(userId: string) {
      const toast = useToastStore()
      try {
        await apiServiceExtended.followUser(userId)
        if (this.user) {
          if (!this.user.following.includes(userId)) {
            this.user.following.push(userId)
          }
        }
      } catch (error) {
        toast.show('Failed to follow user', 'error')
        throw error
      }
    },

    async unfollowUser(userId: string) {
      const toast = useToastStore()
      try {
        await apiServiceExtended.unfollowUser(userId)
        if (this.user) {
          this.user.following = this.user.following.filter(id => id !== userId)
        }
      } catch (error) {
        toast.show('Failed to unfollow user', 'error')
        throw error
      }
    },

    async followMagazine(magazineId: string) {
      const toast = useToastStore()
      try {
        await apiServiceExtended.followMagazine(magazineId)
        if (this.user) {
          if (!this.user.followed_magazines.includes(magazineId)) {
            this.user.followed_magazines.push(magazineId)
          }
        }
        const magazineStore = useMagazineStore()
        await magazineStore.fetchFollowedMagazines()
      } catch (error) {
        toast.show('Failed to follow magazine', 'error')
        throw error
      }
    },

    async unfollowMagazine(magazineId: string) {
      const toast = useToastStore()
      try {
        await apiServiceExtended.unfollowMagazine(magazineId)
        if (this.user) {
          this.user.followed_magazines = this.user.followed_magazines.filter(id => id !== magazineId)
        }
        const magazineStore = useMagazineStore()
        await magazineStore.fetchFollowedMagazines()
      } catch (error) {
        toast.show('Failed to unfollow magazine', 'error')
        throw error
      }
    },

    logout() {
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('token')
      
      // Reset all other stores to clear user-specific data
      const articleStore = useArticleStore()
      const magazineStore = useMagazineStore()
      const commentsStore = useCommentsStore()
      const topicStore = useTopicStore()
      const newsStore = useNewsStore()
      const notificationStore = useNotificationStore()

      articleStore.$reset()
      magazineStore.$reset()
      commentsStore.$reset()
      topicStore.$reset()
      newsStore.$reset()
      notificationStore.$reset()
      
      const toast = useToastStore()
      toast.show('You have been logged out.', 'info')
      router.push({ name: 'login' })
    }
  }
})
