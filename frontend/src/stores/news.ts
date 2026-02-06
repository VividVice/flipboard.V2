import { defineStore } from 'pinia'
import { apiServiceExtended, type NewsPost, type NewsResponse } from '../services/api'
import { useToastStore } from './toast'

export const useNewsStore = defineStore('news', {
  state: () => ({
    posts: [] as NewsPost[],
    totalResults: 0,
    moreResultsAvailable: 0,
    nextUrl: null as string | null,
    requestsLeft: 0,
    loading: false,
    error: null as string | null,
    currentQuery: 'news',
    currentTopic: null as string | null,
    currentSentiment: null as string | null,
    isPersonalizedFeed: false,
    currentCountry: 'US' as string // Default to US
  }),

  getters: {
    hasMoreResults: (state) => state.moreResultsAvailable > 0 && state.nextUrl !== null,

    getPostById: (state) => {
      return (uuid: string) => state.posts.find(p => p.uuid === uuid)
    },

    postsBySentiment: (state) => {
      return (sentiment: string) => state.posts.filter(p => p.sentiment === sentiment)
    },

    postsByCategory: (state) => {
      return (category: string) => state.posts.filter(p => p.categories.includes(category))
    }
  },

  actions: {
    async fetchNews(params?: {
      q?: string
      ts?: number
      size?: number
    }) {
      this.loading = true
      this.posts = []
      this.error = null
      const toastStore = useToastStore()

      try {
        const response: NewsResponse = await apiServiceExtended.getNews({
          ...params,
          country: this.currentCountry
        })

        // Reset posts when fetching new query
        this.posts = response.posts
        this.totalResults = response.totalResults
        this.moreResultsAvailable = response.moreResultsAvailable
        this.nextUrl = response.next || null
        this.requestsLeft = response.requestsLeft
        this.currentQuery = params?.q || 'news'
        this.currentTopic = null
        this.currentSentiment = null
        this.isPersonalizedFeed = false

        // Warning if running low on API requests
        if (response.requestsLeft < 100) {
          toastStore.show(`Warning: Only ${response.requestsLeft} API requests left this month`, 'info')
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch news'
        toastStore.show(this.error, 'error')
      } finally {
        this.loading = false
      }
    },

    async fetchNewsByTopic(
      topic: string,
      params?: {
        sentiment?: string
        ts?: number
        size?: number
      }
    ) {
      this.loading = true
      this.posts = []
      this.error = null
      const toastStore = useToastStore()

      try {
        const response: NewsResponse = await apiServiceExtended.getNewsByTopic(topic, {
          ...params,
          country: this.currentCountry
        })

        this.posts = response.posts
        this.totalResults = response.totalResults
        this.moreResultsAvailable = response.moreResultsAvailable
        this.nextUrl = response.next || null
        this.requestsLeft = response.requestsLeft
        this.currentTopic = topic
        this.currentSentiment = params?.sentiment || null
        this.currentQuery = `topic:"${topic}"${params?.sentiment ? ` sentiment:${params.sentiment}` : ''}`
        this.isPersonalizedFeed = false

        if (response.requestsLeft < 100) {
          toastStore.show(`Warning: Only ${response.requestsLeft} API requests left this month`, 'info')
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch news by topic'
        toastStore.show(this.error, 'error')
      } finally {
        this.loading = false
      }
    },

    async fetchNewsFeed(params?: {
      sentiment?: string
      ts?: number
      size?: number
    }) {
      this.loading = true
      this.posts = []
      this.error = null
      const toastStore = useToastStore()

      try {
        const response: NewsResponse = await apiServiceExtended.getNewsFeed({
          ...params,
          country: this.currentCountry
        })

        this.posts = response.posts
        this.totalResults = response.totalResults
        this.moreResultsAvailable = response.moreResultsAvailable
        this.nextUrl = response.next || null
        this.requestsLeft = response.requestsLeft
        this.currentTopic = null
        this.currentSentiment = params?.sentiment || null
        this.currentQuery = `personalized-feed${params?.sentiment ? ` sentiment:${params.sentiment}` : ''}`
        this.isPersonalizedFeed = true

        if (response.requestsLeft < 100) {
          toastStore.show(`Warning: Only ${response.requestsLeft} API requests left this month`, 'info')
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch news feed'
        toastStore.show(this.error, 'error')
      } finally {
        this.loading = false
      }
    },

    setCountry(country: string) {
      this.currentCountry = country
    },

    async loadMoreNews() {
      if (!this.nextUrl || this.loading) {
        return
      }

      this.loading = true
      this.error = null
      const toastStore = useToastStore()

      try {
        const response: NewsResponse = await apiServiceExtended.getNextNewsPage(this.nextUrl)

        // Append new posts to existing ones
        this.posts = [...this.posts, ...response.posts]
        this.totalResults = response.totalResults
        this.moreResultsAvailable = response.moreResultsAvailable
        this.nextUrl = response.next || null
        this.requestsLeft = response.requestsLeft

        if (response.requestsLeft < 100) {
          toastStore.show(`Warning: Only ${response.requestsLeft} API requests left this month`, 'info')
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load more news'
        toastStore.show(this.error, 'error')
      } finally {
        this.loading = false
      }
    },

    clearNews() {
      this.posts = []
      this.totalResults = 0
      this.moreResultsAvailable = 0
      this.nextUrl = null
      this.currentQuery = 'news'
      this.currentTopic = null
      this.currentSentiment = null
      this.error = null
    },

    updatePostStatus(uuid: string, status: { liked?: boolean; saved?: boolean }) {
      const post = this.posts.find(p => p.uuid === uuid)
      if (post) {
        if (status.liked !== undefined) post.liked = status.liked
        if (status.saved !== undefined) post.saved = status.saved
      }
    }
  }
})
