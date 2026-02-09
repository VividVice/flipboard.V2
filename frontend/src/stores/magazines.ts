import { defineStore } from 'pinia'
import { apiServiceExtended, type Magazine } from '../services/api'

export const useMagazineStore = defineStore('magazines', {
  state: () => ({
    magazines: [] as Magazine[],
    followedMagazines: [] as Magazine[],
    exploreMagazines: [] as Magazine[],
    userMagazinesLoading: false,
    exploreMagazinesLoading: false,
    followedMagazinesLoading: false,
    error: null as string | null
  }),
  
  actions: {
    async fetchUserMagazines() {
      this.userMagazinesLoading = true
      try {
        this.magazines = await apiServiceExtended.getMagazines()
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Failed to fetch magazines'
      } finally {
        this.userMagazinesLoading = false
      }
    },

    async fetchExploreMagazines() {
      this.exploreMagazinesLoading = true
      try {
        this.exploreMagazines = await apiServiceExtended.getExploreMagazines()
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Failed to fetch explore magazines'
      } finally {
        this.exploreMagazinesLoading = false
      }
    },

    async fetchFollowedMagazines() {
      this.followedMagazinesLoading = true
      try {
        this.followedMagazines = await apiServiceExtended.getFollowedMagazines()
      } catch (err: unknown) {
        console.error('Failed to fetch followed magazines:', err)
      } finally {
        this.followedMagazinesLoading = false
      }
    },

    async createMagazine(name: string, description?: string) {
      try {
        const newMagazine = await apiServiceExtended.createMagazine(name, description)
        this.magazines.push(newMagazine)
        return newMagazine
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Failed to create magazine'
        throw err
      }
    },
    
    async addToMagazine(magazineId: string, articleId: string) {
      try {
        await apiServiceExtended.addArticleToMagazine(magazineId, articleId)
        const mag = this.magazines.find(m => m.id === magazineId)
        if (mag && !mag.article_ids.includes(articleId)) {
          mag.article_ids.push(articleId)
        }
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Failed to add article to magazine'
        throw err
      }
    },
    
    async removeFromMagazine(magazineId: string, articleId: string) {
      try {
        await apiServiceExtended.removeArticleFromMagazine(magazineId, articleId)
        const mag = this.magazines.find(m => m.id === magazineId)
        if (mag) {
          mag.article_ids = mag.article_ids.filter(id => id !== articleId)
        }
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Failed to remove article from magazine'
        throw err
      }
    }
  }
})