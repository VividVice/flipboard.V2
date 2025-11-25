import { defineStore } from 'pinia'
import { articles as mockArticles, type Article } from '../data/articles'

// Extend the Article interface to include local state
export interface ArticleState extends Article {
  liked: boolean
  saved: boolean
}

export const useArticleStore = defineStore('articles', {
  state: () => ({
    articles: mockArticles.map(a => ({ ...a, liked: false, saved: false })) as ArticleState[]
  }),
  
  getters: {
    // Get an article by ID
    getArticleById: (state) => {
      return (id: string) => state.articles.find(a => a.id === id)
    },
    // Get all saved articles
    savedArticles: (state) => state.articles.filter(a => a.saved),
    // Get all featured articles (excluding hero, e.g. index 0 if we keep that pattern)
    gridArticles: (state) => state.articles.slice(1),
    // Get the hero article
    heroArticle: (state) => state.articles[0]
  },
  
  actions: {
    toggleLike(id: string) {
      const article = this.articles.find(a => a.id === id)
      if (article) {
        article.liked = !article.liked
      }
    },
    toggleSave(id: string) {
      const article = this.articles.find(a => a.id === id)
      if (article) {
        article.saved = !article.saved
      }
    }
  }
})
