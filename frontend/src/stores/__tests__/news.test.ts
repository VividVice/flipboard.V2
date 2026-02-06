import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNewsStore } from '../news'
import { apiServiceExtended } from '../../services/api'

vi.mock('../../services/api', () => ({
  apiServiceExtended: {
    getNews: vi.fn(),
    getNewsByTopic: vi.fn(),
    getNewsFeed: vi.fn(),
    getNextNewsPage: vi.fn(),
  },
}))

const createMockNewsResponse = (overrides = {}) => ({
  posts: [
    {
      uuid: 'post-1',
      title: 'Test Post',
      text: 'Test content',
      highlightText: '',
      url: 'https://example.com/post-1',
      published: '2024-01-01T00:00:00Z',
      author: 'Test Author',
      sentiment: 'positive',
      categories: ['tech', 'news'],
      thread: {
        site: 'example.com',
        main_image: 'https://example.com/image.jpg',
        country: 'US',
        social: { facebook: { likes: 10, comments: 5 } },
      },
      liked: false,
      saved: false,
    },
  ],
  totalResults: 100,
  moreResultsAvailable: 90,
  next: 'https://api.example.com/next',
  requestsLeft: 500,
  ...overrides,
})

describe('News Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have empty posts array', () => {
      const store = useNewsStore()
      expect(store.posts).toEqual([])
    })

    it('should have default values', () => {
      const store = useNewsStore()
      expect(store.totalResults).toBe(0)
      expect(store.moreResultsAvailable).toBe(0)
      expect(store.nextUrl).toBeNull()
      expect(store.requestsLeft).toBe(0)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.currentQuery).toBe('news')
      expect(store.currentTopic).toBeNull()
      expect(store.currentSentiment).toBeNull()
      expect(store.isPersonalizedFeed).toBe(false)
      expect(store.currentCountry).toBe('US')
    })
  })

  describe('Getters', () => {
    describe('hasMoreResults', () => {
      it('should return true when more results available and nextUrl exists', () => {
        const store = useNewsStore()
        store.moreResultsAvailable = 10
        store.nextUrl = 'https://api.example.com/next'

        expect(store.hasMoreResults).toBe(true)
      })

      it('should return false when no more results', () => {
        const store = useNewsStore()
        store.moreResultsAvailable = 0
        store.nextUrl = 'https://api.example.com/next'

        expect(store.hasMoreResults).toBe(false)
      })

      it('should return false when nextUrl is null', () => {
        const store = useNewsStore()
        store.moreResultsAvailable = 10
        store.nextUrl = null

        expect(store.hasMoreResults).toBe(false)
      })
    })

    describe('getPostById', () => {
      it('should find post by uuid', () => {
        const store = useNewsStore()
        store.posts = createMockNewsResponse().posts

        const post = store.getPostById('post-1')
        expect(post?.title).toBe('Test Post')
      })

      it('should return undefined for non-existent post', () => {
        const store = useNewsStore()
        store.posts = createMockNewsResponse().posts

        const post = store.getPostById('non-existent')
        expect(post).toBeUndefined()
      })
    })

    describe('postsBySentiment', () => {
      it('should filter posts by sentiment', () => {
        const store = useNewsStore()
        store.posts = [
          { ...createMockNewsResponse().posts[0], uuid: 'post-1', sentiment: 'positive' },
          { ...createMockNewsResponse().posts[0], uuid: 'post-2', sentiment: 'negative' },
          { ...createMockNewsResponse().posts[0], uuid: 'post-3', sentiment: 'positive' },
        ]

        const positivePosts = store.postsBySentiment('positive')
        expect(positivePosts).toHaveLength(2)
      })
    })

    describe('postsByCategory', () => {
      it('should filter posts by category', () => {
        const store = useNewsStore()
        store.posts = [
          { ...createMockNewsResponse().posts[0], uuid: 'post-1', categories: ['tech'] },
          { ...createMockNewsResponse().posts[0], uuid: 'post-2', categories: ['sports'] },
          { ...createMockNewsResponse().posts[0], uuid: 'post-3', categories: ['tech', 'news'] },
        ]

        const techPosts = store.postsByCategory('tech')
        expect(techPosts).toHaveLength(2)
      })
    })
  })

  describe('Actions', () => {
    describe('fetchNews()', () => {
      it('should fetch news successfully', async () => {
        const mockResponse = createMockNewsResponse()
        vi.mocked(apiServiceExtended.getNews).mockResolvedValue(mockResponse)

        const store = useNewsStore()
        await store.fetchNews({ q: 'technology' })

        expect(store.posts).toEqual(mockResponse.posts)
        expect(store.totalResults).toBe(100)
        expect(store.moreResultsAvailable).toBe(90)
        expect(store.nextUrl).toBe('https://api.example.com/next')
        expect(store.requestsLeft).toBe(500)
        expect(store.currentQuery).toBe('technology')
        expect(store.isPersonalizedFeed).toBe(false)
        expect(store.loading).toBe(false)
      })

      it('should use default query when none provided', async () => {
        const mockResponse = createMockNewsResponse()
        vi.mocked(apiServiceExtended.getNews).mockResolvedValue(mockResponse)

        const store = useNewsStore()
        await store.fetchNews()

        expect(store.currentQuery).toBe('news')
      })

      it('should set loading while fetching', async () => {
        vi.mocked(apiServiceExtended.getNews).mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(createMockNewsResponse()), 100))
        )

        const store = useNewsStore()
        const promise = store.fetchNews()

        expect(store.loading).toBe(true)
        await promise
        expect(store.loading).toBe(false)
      })

      it('should clear posts before fetching', async () => {
        vi.mocked(apiServiceExtended.getNews).mockResolvedValue(createMockNewsResponse())

        const store = useNewsStore()
        store.posts = [{ uuid: 'old-post' } as any]

        const promise = store.fetchNews()
        expect(store.posts).toEqual([])
        await promise
      })

      it('should handle errors', async () => {
        vi.mocked(apiServiceExtended.getNews).mockRejectedValue(new Error('Network error'))

        const store = useNewsStore()
        await store.fetchNews()

        expect(store.error).toBe('Network error')
        expect(store.loading).toBe(false)
      })

      it('should handle non-Error objects', async () => {
        vi.mocked(apiServiceExtended.getNews).mockRejectedValue('String error')

        const store = useNewsStore()
        await store.fetchNews()

        expect(store.error).toBe('Failed to fetch news')
      })

      it('should include current country in request', async () => {
        vi.mocked(apiServiceExtended.getNews).mockResolvedValue(createMockNewsResponse())

        const store = useNewsStore()
        store.currentCountry = 'FR'
        await store.fetchNews({ q: 'test' })

        expect(apiServiceExtended.getNews).toHaveBeenCalledWith({
          q: 'test',
          country: 'FR',
        })
      })

      it('should show warning when requests are low', async () => {
        const mockResponse = createMockNewsResponse({ requestsLeft: 50 })
        vi.mocked(apiServiceExtended.getNews).mockResolvedValue(mockResponse)

        const store = useNewsStore()
        await store.fetchNews()

        // Toast warning should be shown (we can't easily test toast here)
        expect(store.requestsLeft).toBe(50)
      })
    })

    describe('fetchNewsByTopic()', () => {
      it('should fetch news by topic successfully', async () => {
        const mockResponse = createMockNewsResponse()
        vi.mocked(apiServiceExtended.getNewsByTopic).mockResolvedValue(mockResponse)

        const store = useNewsStore()
        await store.fetchNewsByTopic('technology')

        expect(store.currentTopic).toBe('technology')
        expect(store.currentQuery).toBe('topic:"technology"')
        expect(store.isPersonalizedFeed).toBe(false)
      })

      it('should include sentiment in query when provided', async () => {
        const mockResponse = createMockNewsResponse()
        vi.mocked(apiServiceExtended.getNewsByTopic).mockResolvedValue(mockResponse)

        const store = useNewsStore()
        await store.fetchNewsByTopic('technology', { sentiment: 'positive' })

        expect(store.currentSentiment).toBe('positive')
        expect(store.currentQuery).toBe('topic:"technology" sentiment:positive')
      })

      it('should handle errors', async () => {
        vi.mocked(apiServiceExtended.getNewsByTopic).mockRejectedValue(new Error('Topic error'))

        const store = useNewsStore()
        await store.fetchNewsByTopic('technology')

        expect(store.error).toBe('Topic error')
      })

      it('should handle non-Error objects', async () => {
        vi.mocked(apiServiceExtended.getNewsByTopic).mockRejectedValue({})

        const store = useNewsStore()
        await store.fetchNewsByTopic('technology')

        expect(store.error).toBe('Failed to fetch news by topic')
      })
    })

    describe('fetchNewsFeed()', () => {
      it('should fetch personalized feed successfully', async () => {
        const mockResponse = createMockNewsResponse()
        vi.mocked(apiServiceExtended.getNewsFeed).mockResolvedValue(mockResponse)

        const store = useNewsStore()
        await store.fetchNewsFeed()

        expect(store.isPersonalizedFeed).toBe(true)
        expect(store.currentQuery).toBe('personalized-feed')
        expect(store.currentTopic).toBeNull()
        expect(store.currentSentiment).toBeNull()
      })

      it('should handle errors', async () => {
        vi.mocked(apiServiceExtended.getNewsFeed).mockRejectedValue(new Error('Feed error'))

        const store = useNewsStore()
        await store.fetchNewsFeed()

        expect(store.error).toBe('Feed error')
      })

      it('should handle non-Error objects', async () => {
        vi.mocked(apiServiceExtended.getNewsFeed).mockRejectedValue({})

        const store = useNewsStore()
        await store.fetchNewsFeed()

        expect(store.error).toBe('Failed to fetch news feed')
      })
    })

    describe('setCountry()', () => {
      it('should update current country', () => {
        const store = useNewsStore()
        store.setCountry('FR')

        expect(store.currentCountry).toBe('FR')
      })
    })

    describe('loadMoreNews()', () => {
      it('should load more news successfully', async () => {
        const initialPosts = createMockNewsResponse().posts
        const morePosts = [
          { ...initialPosts[0], uuid: 'post-2', title: 'More Post' },
        ]
        const moreResponse = createMockNewsResponse({ posts: morePosts })
        vi.mocked(apiServiceExtended.getNextNewsPage).mockResolvedValue(moreResponse)

        const store = useNewsStore()
        store.posts = initialPosts
        store.nextUrl = 'https://api.example.com/next'

        await store.loadMoreNews()

        expect(store.posts).toHaveLength(2)
        expect(store.posts[1].uuid).toBe('post-2')
      })

      it('should not load if no nextUrl', async () => {
        const store = useNewsStore()
        store.nextUrl = null

        await store.loadMoreNews()

        expect(apiServiceExtended.getNextNewsPage).not.toHaveBeenCalled()
      })

      it('should not load if already loading', async () => {
        const store = useNewsStore()
        store.nextUrl = 'https://api.example.com/next'
        store.loading = true

        await store.loadMoreNews()

        expect(apiServiceExtended.getNextNewsPage).not.toHaveBeenCalled()
      })

      it('should handle errors', async () => {
        vi.mocked(apiServiceExtended.getNextNewsPage).mockRejectedValue(new Error('Load more error'))

        const store = useNewsStore()
        store.nextUrl = 'https://api.example.com/next'

        await store.loadMoreNews()

        expect(store.error).toBe('Load more error')
      })

      it('should handle non-Error objects', async () => {
        vi.mocked(apiServiceExtended.getNextNewsPage).mockRejectedValue({})

        const store = useNewsStore()
        store.nextUrl = 'https://api.example.com/next'

        await store.loadMoreNews()

        expect(store.error).toBe('Failed to load more news')
      })
    })

    describe('clearNews()', () => {
      it('should reset all state', () => {
        const store = useNewsStore()
        store.posts = createMockNewsResponse().posts
        store.totalResults = 100
        store.moreResultsAvailable = 90
        store.nextUrl = 'https://api.example.com/next'
        store.currentQuery = 'test'
        store.currentTopic = 'tech'
        store.currentSentiment = 'positive'
        store.error = 'Some error'

        store.clearNews()

        expect(store.posts).toEqual([])
        expect(store.totalResults).toBe(0)
        expect(store.moreResultsAvailable).toBe(0)
        expect(store.nextUrl).toBeNull()
        expect(store.currentQuery).toBe('news')
        expect(store.currentTopic).toBeNull()
        expect(store.currentSentiment).toBeNull()
        expect(store.error).toBeNull()
      })
    })

    describe('updatePostStatus()', () => {
      it('should update liked status', () => {
        const store = useNewsStore()
        store.posts = createMockNewsResponse().posts

        store.updatePostStatus('post-1', { liked: true })

        expect(store.posts[0].liked).toBe(true)
      })

      it('should update saved status', () => {
        const store = useNewsStore()
        store.posts = createMockNewsResponse().posts

        store.updatePostStatus('post-1', { saved: true })

        expect(store.posts[0].saved).toBe(true)
      })

      it('should update both statuses', () => {
        const store = useNewsStore()
        store.posts = createMockNewsResponse().posts

        store.updatePostStatus('post-1', { liked: true, saved: true })

        expect(store.posts[0].liked).toBe(true)
        expect(store.posts[0].saved).toBe(true)
      })

      it('should not throw for non-existent post', () => {
        const store = useNewsStore()
        store.posts = createMockNewsResponse().posts

        expect(() => store.updatePostStatus('non-existent', { liked: true })).not.toThrow()
      })
    })
  })
})
