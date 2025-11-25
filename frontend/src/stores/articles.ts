import { defineStore } from 'pinia'
import { articles as mockArticles, type Article } from '../data/articles'
import { useToastStore } from './toast'

// Extend the Article interface to include local state
export interface ArticleState extends Article {
  liked: boolean
  saved: boolean
}

export const useArticleStore = defineStore('articles', {
  state: () => ({
    articles: mockArticles.map(a => ({ ...a, liked: false, saved: false })) as ArticleState[],
    searchQuery: ''
  }),
  
  getters: {
    // Get an article by ID
    getArticleById: (state) => {
      return (id: string) => state.articles.find(a => a.id === id)
    },
    // Get all saved articles
    savedArticles: (state) => state.articles.filter(a => a.saved),
    
    // Get filtered articles for the grid (excluding the very first "hero" article from the base set, unless searching)
    // If searching, we search EVERYTHING including the hero, but display them all in the grid.
    gridArticles: (state) => {
      if (state.searchQuery.trim()) {
        const query = state.searchQuery.toLowerCase()
        return state.articles.filter(a => 
          a.title.toLowerCase().includes(query) || 
          a.description.toLowerCase().includes(query) ||
          a.source.toLowerCase().includes(query)
        )
      }
      // Default view: slice(1) because index 0 is the Hero
      return state.articles.slice(1)
    },
    
    // The hero article is only shown when NOT searching
    heroArticle: (state) => {
      return state.searchQuery ? undefined : state.articles[0]
    }
  },
  
  actions: {
    setSearchQuery(query: string) {
      this.searchQuery = query
    },
    
    toggleLike(id: string) {
      const article = this.articles.find(a => a.id === id)
      if (article) {
        article.liked = !article.liked
        const toast = useToastStore()
        if (article.liked) {
           toast.show('Liked article')
        }
      }
    },
    
    toggleSave(id: string) {
      const article = this.articles.find(a => a.id === id)
      if (article) {
        article.saved = !article.saved
        const toast = useToastStore()
        if (article.saved) {
           toast.show('Saved to Profile')
        } else {
           toast.show('Removed from Profile', 'info')
        }
      }
    },

    loadMoreArticles() {
      // Simulate fetching more data by duplicating existing mock data with new IDs
      const currentLength = this.articles.length
      const moreArticles = mockArticles.map((a, index) => ({
        ...a,
        id: `${currentLength + index}`, // Generate unique string ID
        liked: false,
        saved: false
      }))
      
      this.articles.push(...moreArticles)
    }
  }
})