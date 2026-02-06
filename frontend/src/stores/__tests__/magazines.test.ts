import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMagazineStore } from '../magazines'
import { apiServiceExtended } from '../../services/api'

vi.mock('../../services/api', () => ({
  apiServiceExtended: {
    getMagazines: vi.fn(),
    getFollowedMagazines: vi.fn(),
    createMagazine: vi.fn(),
    addArticleToMagazine: vi.fn(),
    removeArticleFromMagazine: vi.fn(),
  },
}))

describe('Magazine Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have empty magazines array', () => {
      const store = useMagazineStore()
      expect(store.magazines).toEqual([])
    })

    it('should have empty followedMagazines array', () => {
      const store = useMagazineStore()
      expect(store.followedMagazines).toEqual([])
    })

    it('should have loading set to false', () => {
      const store = useMagazineStore()
      expect(store.loading).toBe(false)
    })

    it('should have error set to null', () => {
      const store = useMagazineStore()
      expect(store.error).toBeNull()
    })
  })

  describe('Actions', () => {
    describe('fetchUserMagazines()', () => {
      it('should fetch magazines successfully', async () => {
        const mockMagazines = [
          { id: 'mag-1', name: 'Tech', description: 'Tech articles', article_ids: [], owner_id: 'user-1' },
          { id: 'mag-2', name: 'Sports', description: 'Sports news', article_ids: [], owner_id: 'user-1' },
        ]
        vi.mocked(apiServiceExtended.getMagazines).mockResolvedValue(mockMagazines)

        const store = useMagazineStore()
        await store.fetchUserMagazines()

        expect(store.magazines).toEqual(mockMagazines)
        expect(store.loading).toBe(false)
        expect(store.error).toBeNull()
      })

      it('should set loading to true while fetching', async () => {
        vi.mocked(apiServiceExtended.getMagazines).mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
        )

        const store = useMagazineStore()
        const promise = store.fetchUserMagazines()

        expect(store.loading).toBe(true)
        await promise
        expect(store.loading).toBe(false)
      })

      it('should handle errors', async () => {
        vi.mocked(apiServiceExtended.getMagazines).mockRejectedValue(new Error('Network error'))

        const store = useMagazineStore()
        await store.fetchUserMagazines()

        expect(store.error).toBe('Network error')
        expect(store.loading).toBe(false)
      })

      it('should use default error message when error has no message', async () => {
        vi.mocked(apiServiceExtended.getMagazines).mockRejectedValue({})

        const store = useMagazineStore()
        await store.fetchUserMagazines()

        expect(store.error).toBe('Failed to fetch magazines')
      })
    })

    describe('fetchFollowedMagazines()', () => {
      it('should fetch followed magazines successfully', async () => {
        const mockFollowed = [
          { id: 'mag-3', name: 'Art', description: 'Art collection', article_ids: [], owner_id: 'user-2' },
        ]
        vi.mocked(apiServiceExtended.getFollowedMagazines).mockResolvedValue(mockFollowed)

        const store = useMagazineStore()
        await store.fetchFollowedMagazines()

        expect(store.followedMagazines).toEqual(mockFollowed)
      })

      it('should handle errors silently', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.mocked(apiServiceExtended.getFollowedMagazines).mockRejectedValue(new Error('Failed'))

        const store = useMagazineStore()
        await store.fetchFollowedMagazines()

        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch followed magazines:', expect.any(Error))
        consoleSpy.mockRestore()
      })
    })

    describe('createMagazine()', () => {
      it('should create a magazine successfully', async () => {
        const newMagazine = { id: 'mag-new', name: 'New Mag', description: 'Test', article_ids: [], owner_id: 'user-1' }
        vi.mocked(apiServiceExtended.createMagazine).mockResolvedValue(newMagazine)

        const store = useMagazineStore()
        const result = await store.createMagazine('New Mag', 'Test')

        expect(result).toEqual(newMagazine)
        expect(store.magazines).toContainEqual(newMagazine)
      })

      it('should create a magazine without description', async () => {
        const newMagazine = { id: 'mag-new', name: 'New Mag', description: '', article_ids: [], owner_id: 'user-1' }
        vi.mocked(apiServiceExtended.createMagazine).mockResolvedValue(newMagazine)

        const store = useMagazineStore()
        const result = await store.createMagazine('New Mag')

        expect(apiServiceExtended.createMagazine).toHaveBeenCalledWith('New Mag', undefined)
        expect(result).toEqual(newMagazine)
      })

      it('should handle errors when creating magazine', async () => {
        vi.mocked(apiServiceExtended.createMagazine).mockRejectedValue(new Error('Creation failed'))

        const store = useMagazineStore()

        await expect(store.createMagazine('New Mag')).rejects.toThrow('Creation failed')
        expect(store.error).toBe('Creation failed')
      })

      it('should use default error message when error has no message', async () => {
        vi.mocked(apiServiceExtended.createMagazine).mockRejectedValue({})

        const store = useMagazineStore()

        await expect(store.createMagazine('New Mag')).rejects.toBeDefined()
        expect(store.error).toBe('Failed to create magazine')
      })
    })

    describe('addToMagazine()', () => {
      it('should add article to magazine successfully', async () => {
        vi.mocked(apiServiceExtended.addArticleToMagazine).mockResolvedValue(undefined)

        const store = useMagazineStore()
        store.magazines = [
          { id: 'mag-1', name: 'Tech', description: '', article_ids: ['art-1'], owner_id: 'user-1' },
        ]

        await store.addToMagazine('mag-1', 'art-2')

        expect(store.magazines[0].article_ids).toContain('art-2')
      })

      it('should not add duplicate article', async () => {
        vi.mocked(apiServiceExtended.addArticleToMagazine).mockResolvedValue(undefined)

        const store = useMagazineStore()
        store.magazines = [
          { id: 'mag-1', name: 'Tech', description: '', article_ids: ['art-1'], owner_id: 'user-1' },
        ]

        await store.addToMagazine('mag-1', 'art-1')

        expect(store.magazines[0].article_ids).toEqual(['art-1'])
      })

      it('should handle non-existent magazine gracefully', async () => {
        vi.mocked(apiServiceExtended.addArticleToMagazine).mockResolvedValue(undefined)

        const store = useMagazineStore()
        store.magazines = []

        await store.addToMagazine('non-existent', 'art-1')

        // Should not throw, just do nothing
        expect(store.magazines).toEqual([])
      })

      it('should handle errors when adding to magazine', async () => {
        vi.mocked(apiServiceExtended.addArticleToMagazine).mockRejectedValue(new Error('Add failed'))

        const store = useMagazineStore()
        store.magazines = [
          { id: 'mag-1', name: 'Tech', description: '', article_ids: [], owner_id: 'user-1' },
        ]

        await expect(store.addToMagazine('mag-1', 'art-1')).rejects.toThrow('Add failed')
        expect(store.error).toBe('Add failed')
      })

      it('should use default error message', async () => {
        vi.mocked(apiServiceExtended.addArticleToMagazine).mockRejectedValue({})

        const store = useMagazineStore()

        await expect(store.addToMagazine('mag-1', 'art-1')).rejects.toBeDefined()
        expect(store.error).toBe('Failed to add article to magazine')
      })
    })

    describe('removeFromMagazine()', () => {
      it('should remove article from magazine successfully', async () => {
        vi.mocked(apiServiceExtended.removeArticleFromMagazine).mockResolvedValue(undefined)

        const store = useMagazineStore()
        store.magazines = [
          { id: 'mag-1', name: 'Tech', description: '', article_ids: ['art-1', 'art-2'], owner_id: 'user-1' },
        ]

        await store.removeFromMagazine('mag-1', 'art-1')

        expect(store.magazines[0].article_ids).toEqual(['art-2'])
      })

      it('should handle non-existent magazine gracefully', async () => {
        vi.mocked(apiServiceExtended.removeArticleFromMagazine).mockResolvedValue(undefined)

        const store = useMagazineStore()
        store.magazines = []

        await store.removeFromMagazine('non-existent', 'art-1')

        expect(store.magazines).toEqual([])
      })

      it('should handle errors when removing from magazine', async () => {
        vi.mocked(apiServiceExtended.removeArticleFromMagazine).mockRejectedValue(new Error('Remove failed'))

        const store = useMagazineStore()
        store.magazines = [
          { id: 'mag-1', name: 'Tech', description: '', article_ids: ['art-1'], owner_id: 'user-1' },
        ]

        await expect(store.removeFromMagazine('mag-1', 'art-1')).rejects.toThrow('Remove failed')
        expect(store.error).toBe('Remove failed')
      })

      it('should use default error message', async () => {
        vi.mocked(apiServiceExtended.removeArticleFromMagazine).mockRejectedValue({})

        const store = useMagazineStore()

        await expect(store.removeFromMagazine('mag-1', 'art-1')).rejects.toBeDefined()
        expect(store.error).toBe('Failed to remove article from magazine')
      })
    })
  })
})
