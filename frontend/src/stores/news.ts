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
    currentCountry: 'US' as string, // Default to US
    seenUuids: new Set<string>((() => {
      try {
        const stored = localStorage.getItem('seen_news_uuids')
        if (!stored) {
          return []
        }
        const parsed = JSON.parse(stored)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    })())
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
    persistSeenUuids() {
      if (typeof localStorage === 'undefined') {
        // In non-browser environments, skip persistence
        return
      }
      const uuidsArray = Array.from(this.seenUuids)
      // Keep only last 1000 to prevent localStorage bloat
      const limitedArray = uuidsArray.slice(-1000)
      try {
        localStorage.setItem('seen_news_uuids', JSON.stringify(limitedArray))
      } catch (error) {
        // If localStorage is unavailable or quota is exceeded, skip persistence
        console.warn('Failed to persist seen_news_uuids to localStorage', error)
      }
    },

    markAsSeen(uuids: string[]) {
      uuids.forEach(uuid => this.seenUuids.add(uuid))
      this.persistSeenUuids()
    },

    filterFreshPosts(newPosts: NewsPost[]): NewsPost[] {
      return newPosts.filter(post => !this.seenUuids.has(post.uuid))
    },

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
        let response: NewsResponse = await apiServiceExtended.getNews({
          ...params,
          country: this.currentCountry
        })

        let freshPosts = this.filterFreshPosts(response.posts)
        
        // If everything was seen, try one more page automatically
        if (freshPosts.length === 0 && response.next) {
          const nextResponse = await apiServiceExtended.getNextNewsPage(response.next)
          response = nextResponse
          freshPosts = this.filterFreshPosts(response.posts)
        }

        this.posts = freshPosts
        this.totalResults = response.totalResults
        this.moreResultsAvailable = response.moreResultsAvailable
        this.nextUrl = response.next || null
        this.requestsLeft = response.requestsLeft
        this.currentQuery = params?.q || 'news'
        this.currentTopic = null
        this.currentSentiment = null
        this.isPersonalizedFeed = false

        this.markAsSeen(this.posts.map(p => p.uuid))

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
        let response: NewsResponse = await apiServiceExtended.getNewsByTopic(topic, {
          ...params,
          country: this.currentCountry
        })

        let freshPosts = this.filterFreshPosts(response.posts)

        if (freshPosts.length === 0 && response.next) {
          const nextResponse = await apiServiceExtended.getNextNewsPage(response.next)
          response = nextResponse
          freshPosts = this.filterFreshPosts(response.posts)
        }

        this.posts = freshPosts
        this.totalResults = response.totalResults
        this.moreResultsAvailable = response.moreResultsAvailable
        this.nextUrl = response.next || null
        this.requestsLeft = response.requestsLeft
        this.currentTopic = topic
        this.currentSentiment = params?.sentiment || null
        this.currentQuery = `topic:"${topic}"${params?.sentiment ? ` sentiment:${params.sentiment}` : ''}`
        this.isPersonalizedFeed = false

        this.markAsSeen(this.posts.map(p => p.uuid))

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
      ts?: number
      size?: number
    }) {
      this.loading = true
      this.posts = []
      this.error = null
      const toastStore = useToastStore()

      try {
        let response: NewsResponse = await apiServiceExtended.getNewsFeed({
          ...params,
          country: this.currentCountry
        })

        let freshPosts = this.filterFreshPosts(response.posts)

        if (freshPosts.length === 0 && response.next) {
          const nextResponse = await apiServiceExtended.getNextNewsPage(response.next)
          response = nextResponse
          freshPosts = this.filterFreshPosts(response.posts)
        }

        this.posts = freshPosts
        this.totalResults = response.totalResults
        this.moreResultsAvailable = response.moreResultsAvailable
        this.nextUrl = response.next || null
        this.requestsLeft = response.requestsLeft
        this.currentTopic = null
        this.currentSentiment = null
        this.currentQuery = 'personalized-feed'
        this.isPersonalizedFeed = true

        this.markAsSeen(this.posts.map(p => p.uuid))

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

        // Filter out any already seen posts
        const freshPosts = this.filterFreshPosts(response.posts)
        
        // Also ensure no duplicates with what's already in the current view
        const uniqueFreshPosts = freshPosts.filter(
          p => !this.posts.some(existing => existing.uuid === p.uuid)
        )

        this.posts = [...this.posts, ...uniqueFreshPosts]
        this.totalResults = response.totalResults
        this.moreResultsAvailable = response.moreResultsAvailable
        this.nextUrl = response.next || null
        this.requestsLeft = response.requestsLeft

        this.markAsSeen(uniqueFreshPosts.map(p => p.uuid))

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
