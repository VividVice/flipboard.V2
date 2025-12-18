import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { apiService, apiServiceExtended } from '../api'
import type {
  SignupDto,
  LoginDto,
  CreateCommentDto,
  UpdateCommentDto,
  TokenResponse,
  User,
  Comment,
} from '../api'

// Mock fetch globally
global.fetch = vi.fn()

describe('API Service', () => {
  let localStorageMock: { [key: string]: string }

  beforeEach(() => {
    // Reset fetch mock
    vi.clearAllMocks()

    // Mock localStorage
    localStorageMock = {}
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key]
      }),
      clear: vi.fn(() => {
        localStorageMock = {}
      }),
      length: 0,
      key: vi.fn(),
    } as Storage
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('signup()', () => {
    it('should successfully sign up a new user', async () => {
      const signupData: SignupDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }

      const mockUser: User = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        followed_topics: [],
        created_at: '2024-01-01T00:00:00Z',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response)

      const result = await apiService.signup(signupData)

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/auth/signup',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(signupData),
        })
      )
      expect(result).toEqual(mockUser)
    })

    it('should throw error on failed signup', async () => {
      const signupData: SignupDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Email already exists' }),
      } as Response)

      await expect(apiService.signup(signupData)).rejects.toThrow('Email already exists')
    })

    it('should throw generic error if no detail provided', async () => {
      const signupData: SignupDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response)

      await expect(apiService.signup(signupData)).rejects.toThrow('Failed to sign up')
    })
  })

  describe('login()', () => {
    it('should successfully log in a user', async () => {
      const loginData: LoginDto = {
        username: 'testuser',
        password: 'password123',
      }

      const tokenResponse: TokenResponse = {
        access_token: 'mock-token-123',
        token_type: 'bearer',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => tokenResponse,
      } as Response)

      const result = await apiService.login(loginData)

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      )
      expect(result).toEqual(tokenResponse)
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token-123')
    })

    it('should send credentials as URLSearchParams', async () => {
      const loginData: LoginDto = {
        username: 'testuser',
        password: 'password123',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token', token_type: 'bearer' }),
      } as Response)

      await apiService.login(loginData)

      const callArgs = vi.mocked(fetch).mock.calls[0]
      const body = callArgs[1]?.body as URLSearchParams
      expect(body.get('username')).toBe('testuser')
      expect(body.get('password')).toBe('password123')
    })

    it('should throw error on failed login', async () => {
      const loginData: LoginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Invalid credentials' }),
      } as Response)

      await expect(apiService.login(loginData)).rejects.toThrow('Invalid credentials')
    })
  })

  describe('getComments()', () => {
    it('should fetch comments for an article', async () => {
      const mockComments: Comment[] = [
        {
          id: '1',
          articleId: 'article-1',
          author: {
            id: 'user-1',
            name: 'Test User',
            avatarUrl: 'https://example.com/avatar.jpg',
          },
          content: 'Test comment',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComments,
      } as Response)

      const result = await apiService.getComments('article-1')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/articles/article-1/comments',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(result).toEqual(mockComments)
    })

    it('should throw error on failed fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      await expect(apiService.getComments('article-1')).rejects.toThrow(
        'Failed to fetch comments'
      )
    })
  })

  describe('createComment()', () => {
    it('should create a new comment', async () => {
      const commentData: CreateCommentDto = {
        content: 'New comment',
      }

      const mockComment: Comment = {
        id: '1',
        articleId: 'article-1',
        author: {
          id: 'user-1',
          name: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        content: 'New comment',
        createdAt: '2024-01-01T00:00:00Z',
      }

      localStorageMock.token = 'mock-token'

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComment,
      } as Response)

      const result = await apiService.createComment('article-1', commentData)

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/articles/article-1/comments',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
          body: JSON.stringify(commentData),
        })
      )
      expect(result).toEqual(mockComment)
    })

    it('should include auth token in headers', async () => {
      localStorageMock.token = 'test-token-123'

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response)

      await apiService.createComment('article-1', { content: 'Test' })

      const callArgs = vi.mocked(fetch).mock.calls[0]
      const headers = callArgs[1]?.headers as Record<string, string>
      expect(headers.Authorization).toBe('Bearer test-token-123')
    })

    it('should throw error with status on failure', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as Response)

      await expect(
        apiService.createComment('article-1', { content: 'Test' })
      ).rejects.toThrow('Failed to create comment: 403 Forbidden')
    })
  })

  describe('updateComment()', () => {
    it('should update an existing comment', async () => {
      const updateData: UpdateCommentDto = {
        content: 'Updated content',
      }

      const mockComment: Comment = {
        id: 'comment-1',
        articleId: 'article-1',
        author: {
          id: 'user-1',
          name: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        content: 'Updated content',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      }

      localStorageMock.token = 'mock-token'

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComment,
      } as Response)

      const result = await apiService.updateComment('comment-1', updateData)

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/comments/comment-1',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
          body: JSON.stringify(updateData),
        })
      )
      expect(result).toEqual(mockComment)
    })
  })

  describe('deleteComment()', () => {
    it('should delete a comment', async () => {
      localStorageMock.token = 'mock-token'

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
      } as Response)

      await apiService.deleteComment('comment-1')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/comments/comment-1',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
        })
      )
    })

    it('should throw error on failed delete', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      await expect(apiService.deleteComment('comment-1')).rejects.toThrow(
        'Failed to delete comment: 404 Not Found'
      )
    })
  })
})

describe('API Service Extended', () => {
  let localStorageMock: { [key: string]: string }

  beforeEach(() => {
    vi.clearAllMocks()

    localStorageMock = {}
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key]
      }),
      clear: vi.fn(() => {
        localStorageMock = {}
      }),
      length: 0,
      key: vi.fn(),
    } as Storage
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Topics', () => {
    it('should fetch topics', async () => {
      const mockTopics = [
        {
          id: '1',
          name: 'Technology',
          follower_count: 100,
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTopics,
      } as Response)

      const result = await apiServiceExtended.getTopics()

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/topics',
        expect.any(Object)
      )
      expect(result).toEqual(mockTopics)
    })

    it('should follow a topic', async () => {
      localStorageMock.token = 'mock-token'

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
      } as Response)

      await apiServiceExtended.followTopic('topic-1')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/topics/topic-1/follow',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      )
    })

    it('should bulk follow topics', async () => {
      localStorageMock.token = 'mock-token'

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
      } as Response)

      await apiServiceExtended.bulkFollowTopics(['1', '2', '3'])

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/topics/bulk-follow',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ topic_ids: ['1', '2', '3'] }),
        })
      )
    })

    it('should fetch followed topics', async () => {
      localStorageMock.token = 'mock-token'

      const mockTopics = [{ id: '1', name: 'Tech', follower_count: 10, created_at: '2024-01-01' }]

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTopics,
      } as Response)

      const result = await apiServiceExtended.getFollowedTopics()

      expect(result).toEqual(mockTopics)
    })
  })

  describe('Articles', () => {
    it('should fetch articles with query params', async () => {
      const mockArticles = [
        {
          id: '1',
          title: 'Test Article',
          excerpt: 'Excerpt',
          content: 'Content',
          author: 'Author',
          publisher: 'Publisher',
          source_url: 'https://example.com',
          published_at: '2024-01-01',
          topics: ['Tech'],
          view_count: 0,
          like_count: 0,
          comment_count: 0,
          created_at: '2024-01-01',
        },
      ]

      localStorageMock.token = 'mock-token'

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockArticles,
      } as Response)

      const result = await apiServiceExtended.getArticles({
        skip: 10,
        limit: 20,
        topic: 'Technology',
        search: 'test',
      })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('skip=10&limit=20&topic=Technology&search=test'),
        expect.any(Object)
      )
      expect(result).toEqual(mockArticles)
    })

    it('should fetch single article', async () => {
      const mockArticle = {
        id: '1',
        title: 'Test',
        excerpt: 'Excerpt',
        content: 'Content',
        author: 'Author',
        publisher: 'Publisher',
        source_url: 'https://example.com',
        published_at: '2024-01-01',
        topics: [],
        view_count: 0,
        like_count: 0,
        comment_count: 0,
        created_at: '2024-01-01',
      }

      localStorageMock.token = 'mock-token'

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockArticle,
      } as Response)

      const result = await apiServiceExtended.getArticle('1')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/articles/1',
        expect.any(Object)
      )
      expect(result).toEqual(mockArticle)
    })

    it('should fetch hero article', async () => {
      localStorageMock.token = 'mock-token'

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response)

      await apiServiceExtended.getHeroArticle()

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/articles/hero',
        expect.any(Object)
      )
    })

    it('should fetch feed articles', async () => {
      localStorageMock.token = 'mock-token'

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      await apiServiceExtended.getFeedArticles({ skip: 5, limit: 10 })

      const callArgs = vi.mocked(fetch).mock.calls[0]
      expect(callArgs[0]).toContain('articles/feed')
      expect(callArgs[0]).toContain('skip=5')
      expect(callArgs[0]).toContain('limit=10')
    })
  })

  describe('Interactions', () => {
    it('should like an article', async () => {
      localStorageMock.token = 'mock-token'

      const mockStatus = { is_liked: true, is_saved: false }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      } as Response)

      const result = await apiServiceExtended.likeArticle('article-1')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/articles/article-1/like',
        expect.objectContaining({ method: 'POST' })
      )
      expect(result).toEqual(mockStatus)
    })

    it('should save an article', async () => {
      localStorageMock.token = 'mock-token'

      const mockStatus = { is_liked: false, is_saved: true }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      } as Response)

      const result = await apiServiceExtended.saveArticle('article-1')

      expect(result).toEqual(mockStatus)
    })

    it('should get interaction status', async () => {
      localStorageMock.token = 'mock-token'

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ is_liked: true, is_saved: true }),
      } as Response)

      await apiServiceExtended.getInteractionStatus('article-1')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/articles/article-1/status',
        expect.any(Object)
      )
    })

    it('should fetch liked articles', async () => {
      localStorageMock.token = 'mock-token'

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      await apiServiceExtended.getLikedArticles()

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/me/liked',
        expect.any(Object)
      )
    })

    it('should fetch saved articles', async () => {
      localStorageMock.token = 'mock-token'

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      await apiServiceExtended.getSavedArticles()

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/me/saved',
        expect.any(Object)
      )
    })
  })

  describe('News', () => {
    it('should fetch news', async () => {
      localStorageMock.token = 'mock-token'

      const mockNews = {
        posts: [],
        totalResults: 0,
        moreResultsAvailable: 0,
        requestsLeft: 100,
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNews,
      } as Response)

      const result = await apiServiceExtended.getNews({ q: 'tech', size: 10 })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('news?q=tech&size=10'),
        expect.any(Object)
      )
      expect(result).toEqual(mockNews)
    })

    it('should fetch news by topic', async () => {
      localStorageMock.token = 'mock-token'

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: [], totalResults: 0, moreResultsAvailable: 0, requestsLeft: 100 }),
      } as Response)

      await apiServiceExtended.getNewsByTopic('technology', {
        sentiment: 'positive',
        size: 20,
      })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('news/topic/technology'),
        expect.any(Object)
      )
    })

    it('should get next news page', async () => {
      localStorageMock.token = 'mock-token'

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: [], totalResults: 0, moreResultsAvailable: 0, requestsLeft: 100 }),
      } as Response)

      await apiServiceExtended.getNextNewsPage('https://example.com/next')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('news/next?next_url='),
        expect.any(Object)
      )
    })

    it('should get article content', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: 'Article content' }),
      } as Response)

      const result = await apiServiceExtended.getArticleContent(
        'https://example.com/article'
      )

      expect(result).toEqual({ content: 'Article content' })
    })

    it('should import article', async () => {
      localStorageMock.token = 'mock-token'

      const articleData = {
        title: 'Imported Article',
        content: 'Content',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', ...articleData }),
      } as Response)

      const result = await apiServiceExtended.importArticle(articleData)

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/articles/import',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(articleData),
        })
      )
      expect(result).toHaveProperty('id')
    })
  })
})
