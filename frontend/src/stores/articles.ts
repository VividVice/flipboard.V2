import { defineStore } from 'pinia'
import { apiServiceExtended, type Article } from '../services/api'
import { useToastStore } from './toast'

// Extend Article with local interaction state
export interface ArticleState extends Article {
  liked: boolean
  saved: boolean
}

export const useArticleStore = defineStore('articles', {
  state: () => ({
    articles: [] as ArticleState[],
    heroArticle: null as ArticleState | null,
    searchQuery: '',
    selectedCategory: 'All',
    loading: false,
    error: null as string | null
  }),

  getters: {
    getArticleById: (state) => {
      return (id: string) => state.articles.find(a => a.id === id)
    },

    savedArticles: (state) => state.articles.filter(a => a.saved),

    categories: (state) => {
      // Get unique topic names from articles
      const topicSet = new Set<string>()
      state.articles.forEach(a => a.topics.forEach(t => topicSet.add(t)))
      return ['All', 'For You', ...Array.from(topicSet)]
    },

    gridArticles: (state) => {
      let filtered = state.articles

      // Filter by category (topic)
      if (state.selectedCategory !== 'All' && state.selectedCategory !== 'For You') {
        filtered = filtered.filter(a => a.topics.includes(state.selectedCategory))
      }

      // Filter by search
      if (state.searchQuery.trim()) {
        const query = state.searchQuery.toLowerCase()
        filtered = filtered.filter(a => 
          a.title.toLowerCase().includes(query) || 
          a.excerpt.toLowerCase().includes(query) ||
          a.publisher.toLowerCase().includes(query)
        )
      }

      return filtered
    }
  },

  actions: {
    async fetchArticles(params?: {
      skip?: number
      limit?: number
      topic?: string
      search?: string
    }) {
      this.loading = true
      this.error = null
      try {
        const articles = await apiServiceExtended.getArticles(params)
        this.articles = articles.map(a => ({
          ...a,
          liked: a.liked ?? false,
          saved: a.saved ?? false
        }))
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch articles'
        console.error('Error fetching articles:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchHeroArticle() {
      try {
        const article = await apiServiceExtended.getHeroArticle()
        this.heroArticle = {
          ...article,
          liked: article.liked ?? false,
          saved: article.saved ?? false
        }
      } catch (error: unknown) {
        console.error('Error fetching hero article:', error)
      }
    },

    async fetchFeed(params?: { skip?: number; limit?: number }) {
      this.loading = true
      this.error = null
      try {
        const articles = await apiServiceExtended.getFeedArticles(params)
        this.articles = articles.map(a => ({
          ...a,
          liked: a.liked ?? false,
          saved: a.saved ?? false
        }))
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch feed'
        console.error('Error fetching feed:', error)
      } finally {
        this.loading = false
      }
    },

    setSearchQuery(query: string) {
      this.searchQuery = query
    },

    setCategory(category: string) {
      this.selectedCategory = category
      this.searchQuery = ''
    },

    async toggleLike(id: string) {
      const article = this.articles.find(a => a.id === id)
      if (!article) return

      const toast = useToastStore()
      try {
        const status = await apiServiceExtended.likeArticle(id)
        article.liked = status.is_liked
        
        if (article.liked) {
          toast.show('Liked article')
        }
      } catch (error: unknown) {
        toast.show(error instanceof Error ? error.message : 'Failed to like article', 'error')
      }
    },

    async toggleSave(id: string) {
      const article = this.articles.find(a => a.id === id)
      if (!article) return

      const toast = useToastStore()
      try {
        const status = await apiServiceExtended.saveArticle(id)
        article.saved = status.is_saved

        if (article.saved) {
          toast.show('Saved to Profile')
        } else {
          toast.show('Removed from Profile', 'info')
        }
      } catch (error: unknown) {
        toast.show(error instanceof Error ? error.message : 'Failed to save article', 'error')
      }
    },

    async fetchSavedArticles() {
      this.loading = true
      try {
        const articles = await apiServiceExtended.getSavedArticles()
        
        // Merge with existing articles
        const newArticles = articles.map(a => ({
          ...a,
          liked: a.liked ?? false,
          saved: true // Explicitly true as they came from saved endpoint
        }))
        
        // Update existing ones
        newArticles.forEach(na => {
            const existing = this.articles.find(a => a.id === na.id)
            if (existing) {
                existing.saved = true
                // Don't overwrite other fields to preserve state if needed, 
                // but usually API data is fresher.
                Object.assign(existing, na) 
            } else {
                this.articles.push(na)
            }
        })
      } catch (error: unknown) {
        console.error('Error fetching saved articles:', error)
      } finally {
        this.loading = false
      }
    },

    async loadMoreArticles() {
      const skip = this.articles.length
      await this.fetchArticles({ skip, limit: 20 })
    }
  }
})
