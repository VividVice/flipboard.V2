import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useArticleStore } from '../articles'
import { useToastStore } from '../toast'
import { apiServiceExtended, type Article } from '../../services/api'

vi.mock('../../services/api', () => ({
  apiServiceExtended: {
    getArticles: vi.fn(),
    getHeroArticle: vi.fn(),
    getFeedArticles: vi.fn(),
    likeArticle: vi.fn(),
    saveArticle: vi.fn(),
    getSavedArticles: vi.fn(),
  },
}))

describe('Article Store', () => {
  const mockArticle: Article = {
    id: '1',
    title: 'Test Article',
    excerpt: 'Test excerpt',
    imageUrl: 'https://example.com/image.jpg',
    publisher: 'Test Publisher',
    publisherLogoUrl: 'https://example.com/logo.jpg',
    publishedAt: '2024-01-01T00:00:00Z',
    readTime: '5 min',
    url: 'https://example.com/article',
    topics: ['Technology', 'Science'],
    liked: false,
    saved: false,
  }

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const store = useArticleStore()
      expect(store.articles).toEqual([])
      expect(store.heroArticle).toBeNull()
      expect(store.searchQuery).toBe('')
      expect(store.selectedCategory).toBe('All')
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('Getters', () => {
    describe('getArticleById', () => {
      it('should return article by id', () => {
        const store = useArticleStore()
        store.articles = [
          { ...mockArticle, id: '1', liked: false, saved: false },
          { ...mockArticle, id: '2', liked: false, saved: false },
        ]

        const article = store.getArticleById('1')
        expect(article?.id).toBe('1')
      })

      it('should return undefined if article not found', () => {
        const store = useArticleStore()
        store.articles = [{ ...mockArticle, id: '1', liked: false, saved: false }]

        const article = store.getArticleById('999')
        expect(article).toBeUndefined()
      })
    })

    describe('savedArticles', () => {
      it('should return only saved articles', () => {
        const store = useArticleStore()
        store.articles = [
          { ...mockArticle, id: '1', saved: true, liked: false },
          { ...mockArticle, id: '2', saved: false, liked: false },
          { ...mockArticle, id: '3', saved: true, liked: false },
        ]

        expect(store.savedArticles).toHaveLength(2)
        expect(store.savedArticles.every((a) => a.saved)).toBe(true)
      })

      it('should return empty array if no saved articles', () => {
        const store = useArticleStore()
        store.articles = [
          { ...mockArticle, id: '1', saved: false, liked: false },
          { ...mockArticle, id: '2', saved: false, liked: false },
        ]

        expect(store.savedArticles).toEqual([])
      })
    })

    describe('categories', () => {
      it('should extract unique categories from articles', () => {
        const store = useArticleStore()
        store.articles = [
          { ...mockArticle, id: '1', topics: ['Tech', 'Science'], liked: false, saved: false },
          { ...mockArticle, id: '2', topics: ['Tech', 'Business'], liked: false, saved: false },
          { ...mockArticle, id: '3', topics: ['Science'], liked: false, saved: false },
        ]

        const categories = store.categories
        expect(categories).toContain('All')
        expect(categories).toContain('For You')
        expect(categories).toContain('Tech')
        expect(categories).toContain('Science')
        expect(categories).toContain('Business')
      })

      it('should always include All and For You', () => {
        const store = useArticleStore()
        store.articles = []

        expect(store.categories).toEqual(['All', 'For You'])
      })
    })

    describe('gridArticles', () => {
      beforeEach(() => {
        const store = useArticleStore()
        store.articles = [
          {
            ...mockArticle,
            id: '1',
            title: 'Tech Article',
            topics: ['Technology'],
            publisher: 'TechCo',
            liked: false,
            saved: false,
          },
          {
            ...mockArticle,
            id: '2',
            title: 'Science Article',
            topics: ['Science'],
            publisher: 'SciCo',
            liked: false,
            saved: false,
          },
          {
            ...mockArticle,
            id: '3',
            title: 'Mixed Article',
            topics: ['Technology', 'Science'],
            publisher: 'MixedCo',
            liked: false,
            saved: false,
          },
        ]
      })

      it('should return all articles when category is All', () => {
        const store = useArticleStore()
        store.selectedCategory = 'All'

        expect(store.gridArticles).toHaveLength(3)
      })

      it('should return all articles when category is For You', () => {
        const store = useArticleStore()
        store.selectedCategory = 'For You'

        expect(store.gridArticles).toHaveLength(3)
      })

      it('should filter by selected category', () => {
        const store = useArticleStore()
        store.selectedCategory = 'Technology'

        expect(store.gridArticles).toHaveLength(2)
        expect(store.gridArticles.every((a) => a.topics.includes('Technology'))).toBe(true)
      })

      it('should filter by search query in title', () => {
        const store = useArticleStore()
        store.searchQuery = 'tech'

        expect(store.gridArticles).toHaveLength(1)
        expect(store.gridArticles[0].title).toBe('Tech Article')
      })

      it('should filter by search query in excerpt', () => {
        const store = useArticleStore()
        store.articles = [
          { ...mockArticle, id: '1', excerpt: 'Contains keyword', liked: false, saved: false },
          { ...mockArticle, id: '2', excerpt: 'Different content', liked: false, saved: false },
        ]
        store.searchQuery = 'keyword'

        expect(store.gridArticles).toHaveLength(1)
      })

      it('should filter by search query in publisher', () => {
        const store = useArticleStore()
        store.searchQuery = 'techco'

        expect(store.gridArticles).toHaveLength(1)
        expect(store.gridArticles[0].publisher).toBe('TechCo')
      })

      it('should combine category and search filters', () => {
        const store = useArticleStore()
        store.selectedCategory = 'Technology'
        store.searchQuery = 'mixed'

        expect(store.gridArticles).toHaveLength(1)
        expect(store.gridArticles[0].id).toBe('3')
      })
    })
  })

  describe('Actions', () => {
    describe('fetchArticles()', () => {
      it('should fetch and store articles', async () => {
        const mockArticles = [
          { ...mockArticle, id: '1', liked: true, saved: undefined },
          { ...mockArticle, id: '2', liked: undefined, saved: true },
        ]
        vi.mocked(apiServiceExtended.getArticles).mockResolvedValue(mockArticles as Article[])

        const store = useArticleStore()
        await store.fetchArticles()

        expect(store.articles).toHaveLength(2)
        expect(store.articles[0].liked).toBe(true)
        expect(store.articles[0].saved).toBe(false)
        expect(store.articles[1].liked).toBe(false)
        expect(store.articles[1].saved).toBe(true)
      })

      it('should use default error message when no error message provided', async () => {
        vi.mocked(apiServiceExtended.getArticles).mockRejectedValue({})
        const store = useArticleStore()
        await store.fetchArticles()
        expect(store.error).toBe('Failed to fetch articles')
      })

      it('should set loading state', async () => {
        vi.mocked(apiServiceExtended.getArticles).mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
        )

        const store = useArticleStore()
        const promise = store.fetchArticles()

        expect(store.loading).toBe(true)

        await promise
        expect(store.loading).toBe(false)
      })

      it('should handle errors', async () => {
        vi.mocked(apiServiceExtended.getArticles).mockRejectedValue(
          new Error('Network error')
        )

        const store = useArticleStore()
        await store.fetchArticles()

        expect(store.error).toBe('Network error')
        expect(store.loading).toBe(false)
      })

      it('should pass params to API', async () => {
        vi.mocked(apiServiceExtended.getArticles).mockResolvedValue([])

        const store = useArticleStore()
        await store.fetchArticles({ skip: 10, limit: 20, topic: 'Tech' })

        expect(apiServiceExtended.getArticles).toHaveBeenCalledWith({
          skip: 10,
          limit: 20,
          topic: 'Tech',
        })
      })
    })

    describe('fetchFeed()', () => {
      it('should fetch and store feed articles', async () => {
        const mockArticles = [{ ...mockArticle, id: 'feed-1', liked: undefined, saved: true }]
        vi.mocked(apiServiceExtended.getFeedArticles).mockResolvedValue(mockArticles as Article[])

        const store = useArticleStore()
        await store.fetchFeed()

        expect(store.articles).toHaveLength(1)
        expect(store.articles[0].liked).toBe(false)
        expect(store.articles[0].saved).toBe(true)
      })

      it('should handle feed fetch errors', async () => {
        vi.mocked(apiServiceExtended.getFeedArticles).mockRejectedValue(new Error('Feed error'))

        const store = useArticleStore()
        await store.fetchFeed()

        expect(store.error).toBe('Feed error')
      })

      it('should use default error message for feed', async () => {
        vi.mocked(apiServiceExtended.getFeedArticles).mockRejectedValue({})

        const store = useArticleStore()
        await store.fetchFeed()

        expect(store.error).toBe('Failed to fetch feed')
      })
    })

    describe('fetchHeroArticle()', () => {
      it('should fetch and store hero article', async () => {
        vi.mocked(apiServiceExtended.getHeroArticle).mockResolvedValue({ ...mockArticle, liked: true, saved: undefined } as Article)

        const store = useArticleStore()
        await store.fetchHeroArticle()

        expect(store.heroArticle).toBeDefined()
        expect(store.heroArticle?.liked).toBe(true)
        expect(store.heroArticle?.saved).toBe(false)
      })

      it('should handle errors silently', async () => {
        vi.mocked(apiServiceExtended.getHeroArticle).mockRejectedValue(
          new Error('Not found')
        )

        const store = useArticleStore()

        await expect(store.fetchHeroArticle()).resolves.not.toThrow()
        expect(store.heroArticle).toBeNull()
      })
    })

    describe('setSearchQuery()', () => {
      it('should update search query', () => {
        const store = useArticleStore()
        store.setSearchQuery('test query')

        expect(store.searchQuery).toBe('test query')
      })
    })

    describe('setCategory()', () => {
      it('should update category and clear search', () => {
        const store = useArticleStore()
        store.searchQuery = 'existing query'

        store.setCategory('Technology')

        expect(store.selectedCategory).toBe('Technology')
        expect(store.searchQuery).toBe('')
      })
    })

    describe('toggleLike()', () => {
      it('should toggle like status on article', async () => {
        vi.mocked(apiServiceExtended.likeArticle).mockResolvedValue({ is_liked: true })

        const store = useArticleStore()
        store.articles = [{ ...mockArticle, id: '1', liked: false, saved: false }]

        await store.toggleLike('1')

        expect(store.articles[0].liked).toBe(true)
      })

      it('should show toast when liked', async () => {
        vi.mocked(apiServiceExtended.likeArticle).mockResolvedValue({ is_liked: true })

        const store = useArticleStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        store.articles = [{ ...mockArticle, id: '1', liked: false, saved: false }]

        await store.toggleLike('1')

        expect(showSpy).toHaveBeenCalledWith('Liked article')
      })

      it('should handle unlike without toast', async () => {
        vi.mocked(apiServiceExtended.likeArticle).mockResolvedValue({ is_liked: false })

        const store = useArticleStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        store.articles = [{ ...mockArticle, id: '1', liked: true, saved: false }]

        await store.toggleLike('1')

        expect(store.articles[0].liked).toBe(false)
        expect(showSpy).not.toHaveBeenCalled()
      })

      it('should show error toast on failure', async () => {
        vi.mocked(apiServiceExtended.likeArticle).mockRejectedValue(
          new Error('Failed to like')
        )

        const store = useArticleStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        store.articles = [{ ...mockArticle, id: '1', liked: false, saved: false }]

        await store.toggleLike('1')

        expect(showSpy).toHaveBeenCalledWith('Failed to like', 'error')
      })

      it('should do nothing if article not found', async () => {
        const store = useArticleStore()
        store.articles = []

        await store.toggleLike('999')

        expect(apiServiceExtended.likeArticle).not.toHaveBeenCalled()
      })
    })

    describe('toggleSave()', () => {
      it('should toggle save status on article', async () => {
        vi.mocked(apiServiceExtended.saveArticle).mockResolvedValue({ is_saved: true })

        const store = useArticleStore()
        store.articles = [{ ...mockArticle, id: '1', liked: false, saved: false }]

        await store.toggleSave('1')

        expect(store.articles[0].saved).toBe(true)
      })

      it('should show "Saved to Profile" toast when saved', async () => {
        vi.mocked(apiServiceExtended.saveArticle).mockResolvedValue({ is_saved: true })

        const store = useArticleStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        store.articles = [{ ...mockArticle, id: '1', liked: false, saved: false }]

        await store.toggleSave('1')

        expect(showSpy).toHaveBeenCalledWith('Saved to Profile')
      })

      it('should show "Removed from Profile" toast when unsaved', async () => {
        vi.mocked(apiServiceExtended.saveArticle).mockResolvedValue({ is_saved: false })

        const store = useArticleStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        store.articles = [{ ...mockArticle, id: '1', liked: false, saved: true }]

        await store.toggleSave('1')

        expect(showSpy).toHaveBeenCalledWith('Removed from Profile', 'info')
      })

      it('should show error toast on failure', async () => {
        vi.mocked(apiServiceExtended.saveArticle).mockRejectedValue(
          new Error('Failed to save')
        )

        const store = useArticleStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        store.articles = [{ ...mockArticle, id: '1', liked: false, saved: false }]

        await store.toggleSave('1')

        expect(showSpy).toHaveBeenCalledWith('Failed to save', 'error')
      })
    })

    describe('fetchSavedArticles()', () => {
      it('should fetch and merge saved articles', async () => {
        const savedArticles = [
          { ...mockArticle, id: '1', saved: true },
          { ...mockArticle, id: '2', saved: true },
        ]
        vi.mocked(apiServiceExtended.getSavedArticles).mockResolvedValue(savedArticles)

        const store = useArticleStore()
        await store.fetchSavedArticles()

        expect(store.articles).toHaveLength(2)
        expect(store.articles.every((a) => a.saved)).toBe(true)
      })

      it('should update existing articles with saved status', async () => {
        const savedArticles = [{ ...mockArticle, id: '1', liked: true, saved: true }]
        vi.mocked(apiServiceExtended.getSavedArticles).mockResolvedValue(savedArticles as Article[])

        const store = useArticleStore()
        store.articles = [{ ...mockArticle, id: '1', liked: false, saved: false }]

        await store.fetchSavedArticles()

        expect(store.articles[0].saved).toBe(true)
        expect(store.articles[0].liked).toBe(true)
      })

      it('should add new articles if not existing', async () => {
        const savedArticles = [{ ...mockArticle, id: 'new-1', saved: true }]
        vi.mocked(apiServiceExtended.getSavedArticles).mockResolvedValue(savedArticles)

        const store = useArticleStore()
        store.articles = [{ ...mockArticle, id: '1', saved: true, liked: false }]

        await store.fetchSavedArticles()

        expect(store.articles).toHaveLength(2)
        expect(store.articles.some(a => a.id === 'new-1')).toBe(true)
      })

      it('should handle errors silently', async () => {
        vi.mocked(apiServiceExtended.getSavedArticles).mockRejectedValue(
          new Error('Network error')
        )

        const store = useArticleStore()

        await expect(store.fetchSavedArticles()).resolves.not.toThrow()
      })
    })

    describe('loadMoreArticles()', () => {
      it('should fetch more articles with correct skip value', async () => {
        vi.mocked(apiServiceExtended.getArticles).mockResolvedValue([])

        const store = useArticleStore()
        store.articles = Array(15)
          .fill(null)
          .map((_, i) => ({ ...mockArticle, id: `${i}`, liked: false, saved: false }))

        await store.loadMoreArticles()

        expect(apiServiceExtended.getArticles).toHaveBeenCalledWith({
          skip: 15,
          limit: 20,
        })
      })
    })
  })
})
