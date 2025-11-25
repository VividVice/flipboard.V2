import { defineStore } from 'pinia'

export interface Magazine {
  id: string
  name: string
  articleIds: string[]
}

export const useMagazineStore = defineStore('magazines', {
  state: () => ({
    magazines: [
      { id: 'm1', name: 'Read Later', articleIds: [] },
      { id: 'm2', name: 'Tech News', articleIds: [] },
      { id: 'm3', name: 'Design Inspiration', articleIds: [] }
    ] as Magazine[]
  }),
  
  actions: {
    createMagazine(name: string) {
      const id = Date.now().toString()
      this.magazines.push({ id, name, articleIds: [] })
    },
    
    addToMagazine(magazineId: string, articleId: string) {
      const mag = this.magazines.find(m => m.id === magazineId)
      if (mag && !mag.articleIds.includes(articleId)) {
        mag.articleIds.push(articleId)
      }
    },
    
    removeFromMagazine(magazineId: string, articleId: string) {
      const mag = this.magazines.find(m => m.id === magazineId)
      if (mag) {
        mag.articleIds = mag.articleIds.filter(id => id !== articleId)
      }
    }
  }
})
