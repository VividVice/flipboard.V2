import { defineStore } from 'pinia'
import { apiServiceExtended, type Article, type InteractionStatus } from '../services/api'
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
          liked: false,
          saved: false
        }))
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch articles'
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
          liked: false,
          saved: false
        }
      } catch (error: any) {
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
          liked: false,
          saved: false
        }))
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch feed'
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
      } catch (error: any) {
        toast.show(error.message || 'Failed to like article', 'error')
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
      } catch (error: any) {
        toast.show(error.message || 'Failed to save article', 'error')
      }
    },

    async loadMoreArticles() {
      const skip = this.articles.length
      await this.fetchArticles({ skip, limit: 20 })
    }
  }
})
