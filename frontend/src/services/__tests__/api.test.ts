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

    it('should throw generic error on failed login if no detail provided', async () => {
      const loginData: LoginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response)

      await expect(apiService.login(loginData)).rejects.toThrow('Failed to log in')
    })
  })

  describe('loginGoogle()', () => {
    it('should successfully log in with Google', async () => {
      const tokenResponse: TokenResponse = {
        access_token: 'google-token-123',
        token_type: 'bearer',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => tokenResponse,
      } as Response)

      const result = await apiService.loginGoogle('google-id-token')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/auth/google',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: 'google-id-token' }),
        })
      )
      expect(result).toEqual(tokenResponse)
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'google-token-123')
    })

    it('should throw error on failed Google login', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Invalid Google token' }),
      } as Response)

      await expect(apiService.loginGoogle('bad-token')).rejects.toThrow('Invalid Google token')
    })

    it('should throw generic error on failed Google login if no detail provided', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response)

      await expect(apiService.loginGoogle('bad-token')).rejects.toThrow('Failed to log in with Google')
    })
  })

  describe('getUserComments()', () => {
    it('should fetch current user comments', async () => {
      localStorageMock.token = 'mock-token'
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      await apiService.getUserComments()

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/users/me/comments',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer mock-token' }),
        })
      )
    })

    it('should throw error on failed fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiService.getUserComments()).rejects.toThrow('Failed to fetch user comments')
    })
  })

  describe('getUserCommentsById()', () => {
    it('should fetch comments for a specific user', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      await apiService.getUserCommentsById('user-123')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/users/user-123/comments',
        expect.any(Object)
      )
    })

    it('should throw error on failed fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiService.getUserCommentsById('user-123')).rejects.toThrow('Failed to fetch user comments')
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

    it('should throw error on failed update', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as Response)

      await expect(
        apiService.updateComment('comment-1', { content: 'test' })
      ).rejects.toThrow('Failed to update comment: 403 Forbidden')
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

    it('should throw error on failed topics fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getTopics()).rejects.toThrow('Failed to fetch topics')
    })

    it('should throw error on failed follow topic', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.followTopic('1')).rejects.toThrow('Failed to follow topic')
    })

    it('should throw error on failed bulk follow topics', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.bulkFollowTopics(['1'])).rejects.toThrow('Failed to follow topics')
    })

    it('should throw error on failed followed topics fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getFollowedTopics()).rejects.toThrow('Failed to fetch followed topics')
    })
  })

  describe('Interactions', () => {
    it('should throw error on failed like/save article', async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response)
      await expect(apiServiceExtended.likeArticle('1')).rejects.toThrow('Failed to like article')
      await expect(apiServiceExtended.saveArticle('1')).rejects.toThrow('Failed to save article')
    })

    it('should throw error on failed interaction status fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getInteractionStatus('1')).rejects.toThrow('Failed to get interaction status')
    })

    it('should throw error on failed liked/saved articles fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response)
      await expect(apiServiceExtended.getLikedArticles()).rejects.toThrow('Failed to fetch liked articles')
      await expect(apiServiceExtended.getSavedArticles()).rejects.toThrow('Failed to fetch saved articles')
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

    it('should fetch articles with no params', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      await apiServiceExtended.getArticles()
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/articles\?$/),
        expect.any(Object)
      )
    })

    it('should throw error on failed articles fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getArticles()).rejects.toThrow('Failed to fetch articles')
    })

    it('should throw error on failed article fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getArticle('1')).rejects.toThrow('Failed to fetch article')
    })

    it('should throw error on failed hero article fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getHeroArticle()).rejects.toThrow('Failed to fetch hero article')
    })

    it('should fetch feed articles with no params', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      await apiServiceExtended.getFeedArticles()
      expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/articles\/feed\?$/), expect.any(Object))
    })

    it('should throw error on failed feed fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getFeedArticles()).rejects.toThrow('Failed to fetch feed')
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

    it('should fetch news with no params', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: [] }),
      } as Response)

      await apiServiceExtended.getNews()
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('news?q=news'),
        expect.any(Object)
      )
    })

    it('should fetch news with all params', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: [] }),
      } as Response)

      await apiServiceExtended.getNews({ q: 'tech', ts: 123, size: 10, country: 'us' })
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=tech'),
        expect.any(Object)
      )
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('ts=123'),
        expect.any(Object)
      )
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('size=10'),
        expect.any(Object)
      )
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('country=us'),
        expect.any(Object)
      )
    })

    it('should throw error on failed news fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getNews()).rejects.toThrow('Failed to fetch news')
    })

    it('should fetch news by topic with no params', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: [] }),
      } as Response)

      await apiServiceExtended.getNewsByTopic('tech')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/news\/topic\/tech\?$/),
        expect.any(Object)
      )
    })

    it('should fetch news by topic with all params', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: [] }),
      } as Response)

      await apiServiceExtended.getNewsByTopic('tech', { sentiment: 'pos', ts: 1, size: 2, country: 'fr' })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('sentiment=pos')
      expect(url).toContain('ts=1')
      expect(url).toContain('size=2')
      expect(url).toContain('country=fr')
    })

    it('should throw error on failed news by topic fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getNewsByTopic('tech')).rejects.toThrow('Failed to fetch news by topic')
    })

    it('should throw error on failed next news page fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getNextNewsPage('url')).rejects.toThrow('Failed to fetch next news page')
    })

    it('should throw error on failed article content fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getArticleContent('url')).rejects.toThrow('Failed to fetch article content')
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

    it('should throw error on failed import', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.importArticle({})).rejects.toThrow('Failed to import article')
    })

    it('should get news feed with no params', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: [] }),
      } as Response)

      await apiServiceExtended.getNewsFeed()
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('news/feed'), expect.any(Object))
    })

    it('should get news feed with all params', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: [] }),
      } as Response)

      await apiServiceExtended.getNewsFeed({ sentiment: 'neutral', ts: 1, size: 2, country: 'us' })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('sentiment=neutral')
      expect(url).toContain('ts=1')
      expect(url).toContain('size=2')
      expect(url).toContain('country=us')
    })

    it('should throw error on failed news feed fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getNewsFeed()).rejects.toThrow('Failed to fetch news feed')
    })
  })

  describe('User Settings & Profiles', () => {
    it('should update current user settings', async () => {
      localStorageMock.token = 'mock-token'
      const updateData = { username: 'newname' }
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: 'newname' }),
      } as Response)

      const result = await apiServiceExtended.updateUserMe(updateData)

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/users/me',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      )
      expect(result.username).toBe('newname')
    })

    it('should handle update failure with detail', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Invalid username' }),
      } as Response)

      await expect(apiServiceExtended.updateUserMe({})).rejects.toThrow('Invalid username')
    })

    it('should handle update failure without detail', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response)

      await expect(apiServiceExtended.updateUserMe({})).rejects.toThrow('Failed to update user settings')
    })

    it('should trigger newsletter', async () => {
      localStorageMock.token = 'mock-token'
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as Response)

      await apiServiceExtended.triggerNewsletter()

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/users/newsletter/trigger',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should get user by username', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: 'test' }),
      } as Response)

      await apiServiceExtended.getUserByUsername('test')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/users/test',
        expect.any(Object)
      )
    })

    it('should handle 404 for getUserByUsername', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      await expect(apiServiceExtended.getUserByUsername('test')).rejects.toThrow('User not found')
    })

    it('should get user by id', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1' }),
      } as Response)

      await apiServiceExtended.getUserById('1')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/users/id/1',
        expect.any(Object)
      )
    })

    it('should get users by ids', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      await apiServiceExtended.getUsersByIds(['1', '2'])

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/users/list',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(['1', '2']),
        })
      )
    })

    it('should return empty array if no user ids provided', async () => {
      const result = await apiServiceExtended.getUsersByIds([])
      expect(result).toEqual([])
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should follow and unfollow user', async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response)

      await apiServiceExtended.followUser('1')
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('users/1/follow'), expect.any(Object))

      await apiServiceExtended.unfollowUser('1')
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('users/1/unfollow'), expect.any(Object))
    })

    it('should throw error on failed follow/unfollow user', async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response)
      await expect(apiServiceExtended.followUser('1')).rejects.toThrow('Failed to follow user')
      await expect(apiServiceExtended.unfollowUser('1')).rejects.toThrow('Failed to unfollow user')
    })

    it('should throw error on failed newsletter trigger', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.triggerNewsletter()).rejects.toThrow('Failed to trigger newsletter')
    })

    it('should throw error on failed getUserByUsername (generic)', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response)
      await expect(apiServiceExtended.getUserByUsername('test')).rejects.toThrow('Failed to fetch user profile')
    })

    it('should throw error on failed getUserById (404)', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      await expect(apiServiceExtended.getUserById('1')).rejects.toThrow('User not found')
    })

    it('should throw error on failed getUserById (generic)', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response)
      await expect(apiServiceExtended.getUserById('1')).rejects.toThrow('Failed to fetch user profile')
    })

    it('should throw error on failed getUsersByIds', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getUsersByIds(['1'])).rejects.toThrow('Failed to fetch users list')
    })
  })

  describe('Magazines', () => {
    it('should throw error on failed magazine fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getMagazines()).rejects.toThrow('Failed to fetch magazines')
    })

    it('should throw error on failed magazine by id fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getMagazineById('1')).rejects.toThrow('Failed to fetch magazine')
    })

    it('should throw error on failed user magazines fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getMagazinesByUserId('1')).rejects.toThrow('Failed to fetch user magazines')
    })

    it('should throw error on failed explore magazines fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getExploreMagazines()).rejects.toThrow('Failed to fetch explore magazines')
    })

    it('should throw error on failed magazine creation', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.createMagazine('name')).rejects.toThrow('Failed to create magazine')
    })

    it('should throw error on failed magazine deletion', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.deleteMagazine('1')).rejects.toThrow('Failed to delete magazine')
    })

    it('should throw error on failed add/remove article', async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response)
      await expect(apiServiceExtended.addArticleToMagazine('1', '1')).rejects.toThrow('Failed to add article to magazine')
      await expect(apiServiceExtended.removeArticleFromMagazine('1', '1')).rejects.toThrow('Failed to remove article from magazine')
    })

    it('should throw error on failed magazine articles/comments fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response)
      await expect(apiServiceExtended.getMagazineArticles('1')).rejects.toThrow('Failed to fetch magazine articles')
      await expect(apiServiceExtended.getMagazineComments('1')).rejects.toThrow('Failed to fetch magazine comments')
    })

    it('should throw error on failed magazine comment creation', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.createMagazineComment('1', { content: 'test' })).rejects.toThrow('Failed to create magazine comment')
    })

    it('should throw error on failed followed magazines fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)
      await expect(apiServiceExtended.getFollowedMagazines()).rejects.toThrow('Failed to fetch followed magazines')
    })

    it('should throw error on failed magazine follow/unfollow', async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response)
      await expect(apiServiceExtended.followMagazine('1')).rejects.toThrow('Failed to follow magazine')
      await expect(apiServiceExtended.unfollowMagazine('1')).rejects.toThrow('Failed to unfollow magazine')
    })
  })

  describe('Magazines', () => {
    it('should fetch magazines', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      await apiServiceExtended.getMagazines()
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/magazines/', expect.any(Object))
    })

    it('should fetch magazine by id', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1' }),
      } as Response)

      await apiServiceExtended.getMagazineById('1')
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/magazines/1', expect.any(Object))
    })

    it('should fetch magazines by user id', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      await apiServiceExtended.getMagazinesByUserId('user-1')
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/magazines/user/user-1', expect.any(Object))
    })

    it('should fetch explore magazines', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      await apiServiceExtended.getExploreMagazines()
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/magazines/explore', expect.any(Object))
    })

    it('should create and delete magazine', async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response)

      await apiServiceExtended.createMagazine('New Mag', 'Desc')
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/magazines/',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'New Mag', description: 'Desc' }) })
      )

      await apiServiceExtended.deleteMagazine('1')
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/magazines/1', expect.objectContaining({ method: 'DELETE' }))
    })

    it('should add/remove article from magazine', async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response)

      await apiServiceExtended.addArticleToMagazine('mag-1', 'art-1')
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('magazines/mag-1/articles/art-1'), expect.objectContaining({ method: 'POST' }))

      await apiServiceExtended.removeArticleFromMagazine('mag-1', 'art-1')
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('magazines/mag-1/articles/art-1'), expect.objectContaining({ method: 'DELETE' }))
    })

    it('should fetch magazine articles and comments', async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => [] } as Response)

      await apiServiceExtended.getMagazineArticles('1')
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/magazines/1/articles', expect.any(Object))

      await apiServiceExtended.getMagazineComments('1')
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/magazines/1/comments', expect.any(Object))
    })

    it('should create magazine comment', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response)

      await apiServiceExtended.createMagazineComment('1', { content: 'test' })
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/magazines/1/comments',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should follow and unfollow magazine', async () => {
      vi.mocked(global.fetch).mockResolvedValue({ 
        ok: true, 
        json: async () => [] 
      } as Response)

      await apiServiceExtended.getFollowedMagazines()
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/magazines/followed/me', expect.any(Object))

      await apiServiceExtended.followMagazine('1')
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('magazines/1/follow'), expect.any(Object))

      await apiServiceExtended.unfollowMagazine('1')
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('magazines/1/unfollow'), expect.any(Object))
    })
  })
})
