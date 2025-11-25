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

    searchQuery: '',

    selectedCategory: 'All'

  }),

  

  getters: {

    // Get an article by ID

    getArticleById: (state) => {

      return (id: string) => state.articles.find(a => a.id === id)

    },

    // Get all saved articles

    savedArticles: (state) => state.articles.filter(a => a.saved),

    

    // Get all unique categories

    categories: (state) => {

      const cats = new Set(state.articles.map(a => a.category))

      return ['All', 'For You', ...Array.from(cats)]

    },

    

    // Get filtered articles for the grid

    gridArticles: (state) => {

      let filtered = state.articles



      // 1. Filter by Category

      if (state.selectedCategory !== 'All' && state.selectedCategory !== 'For You') {

        filtered = filtered.filter(a => a.category === state.selectedCategory)

      }



      // 2. Filter by Search

      if (state.searchQuery.trim()) {

        const query = state.searchQuery.toLowerCase()

        return filtered.filter(a => 

          a.title.toLowerCase().includes(query) || 

          a.description.toLowerCase().includes(query) ||

          a.source.toLowerCase().includes(query)

        )

      }

      

      // 3. Default view logic (exclude hero if showing "All" or "For You" and not searching)

      // If we filtered by category, we might want to show everything in the grid including the hero article for that category,

      // unless we treat the first one as hero specifically for that category.

      // For simplicity, if we have a category selected, we just show a grid of all matching items.

      // If "All" is selected, we exclude the main Hero (index 0 of total) from the grid because it's shown in the Hero section.

      

      if (state.selectedCategory === 'All' || state.selectedCategory === 'For You') {

         return filtered.slice(1)

      }

      

      return filtered

    },

    

    // The hero article is only shown when NOT searching and when in "All" mode (or we could have per-category hero)

    // Let's keep it simple: Global Hero only on "All" / "For You".

    heroArticle: (state) => {

      if (state.searchQuery) return undefined

      if (state.selectedCategory === 'All' || state.selectedCategory === 'For You') {

        return state.articles[0]

      }

      return undefined

    }

  },

  

  actions: {

    setSearchQuery(query: string) {

      this.searchQuery = query

    },

    

    setCategory(category: string) {

      this.selectedCategory = category

      this.searchQuery = '' // Reset search when changing category

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
