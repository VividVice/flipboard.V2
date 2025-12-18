import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCommentsStore } from '../comments'
import { useAuthStore } from '../auth'
import { useToastStore } from '../toast'
import { apiService } from '../../services/api'
import type { Comment } from '../../data/articles'

vi.mock('../../services/api', () => ({
  apiService: {
    getComments: vi.fn(),
    createComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
  },
}))

describe('Comments Store', () => {
  const mockComment: Comment = {
    id: 'comment-1',
    articleId: 'article-1',
    author: {
      id: 'user-1',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
    content: 'Test comment content',
    createdAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const store = useCommentsStore()
      expect(store.commentsByArticle).toEqual({})
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.useMockData).toBe(true)
    })
  })

  describe('Getters', () => {
    describe('getCommentsByArticleId', () => {
      it('should return comments for a specific article', () => {
        const store = useCommentsStore()
        store.commentsByArticle = {
          'article-1': [mockComment],
          'article-2': [{ ...mockComment, id: 'comment-2' }],
        }

        const comments = store.getCommentsByArticleId('article-1')
        expect(comments).toHaveLength(1)
        expect(comments[0].id).toBe('comment-1')
      })

      it('should return empty array if no comments for article', () => {
        const store = useCommentsStore()
        const comments = store.getCommentsByArticleId('article-999')
        expect(comments).toEqual([])
      })
    })

    describe('getCommentsCount', () => {
      it('should return the count of comments for an article', () => {
        const store = useCommentsStore()
        store.commentsByArticle = {
          'article-1': [mockComment, { ...mockComment, id: 'comment-2' }],
        }

        expect(store.getCommentsCount('article-1')).toBe(2)
      })

      it('should return 0 if no comments', () => {
        const store = useCommentsStore()
        expect(store.getCommentsCount('article-999')).toBe(0)
      })
    })
  })

  describe('Actions', () => {
    describe('fetchComments() - Mock Mode', () => {
      it('should initialize empty comments array in mock mode', async () => {
        const store = useCommentsStore()
        store.useMockData = true

        const promise = store.fetchComments('article-1')
        await vi.advanceTimersByTimeAsync(300)
        await promise

        expect(store.commentsByArticle['article-1']).toEqual([])
        expect(store.loading).toBe(false)
        expect(store.error).toBeNull()
      })

      it('should simulate network delay', async () => {
        const store = useCommentsStore()
        store.useMockData = true

        const promise = store.fetchComments('article-1')
        expect(store.loading).toBe(true)

        await vi.advanceTimersByTimeAsync(300)
        await promise

        expect(store.loading).toBe(false)
      })

      it('should not reinitialize if comments already exist', async () => {
        const store = useCommentsStore()
        store.useMockData = true
        store.commentsByArticle['article-1'] = [mockComment]

        const promise = store.fetchComments('article-1')
        await vi.advanceTimersByTimeAsync(300)
        await promise

        expect(store.commentsByArticle['article-1']).toHaveLength(1)
      })
    })

    describe('fetchComments() - API Mode', () => {
      it('should fetch comments from API', async () => {
        const store = useCommentsStore()
        store.useMockData = false

        const mockComments = [mockComment]
        vi.mocked(apiService.getComments).mockResolvedValue(mockComments)

        await store.fetchComments('article-1')

        expect(apiService.getComments).toHaveBeenCalledWith('article-1')
        expect(store.commentsByArticle['article-1']).toEqual(mockComments)
      })

      it('should fall back to mock mode on API error', async () => {
        const store = useCommentsStore()
        store.useMockData = false

        vi.mocked(apiService.getComments).mockRejectedValue(new Error('Network error'))

        await store.fetchComments('article-1')

        expect(store.useMockData).toBe(true)
        expect(store.commentsByArticle['article-1']).toEqual([])
      })
    })

    describe('createComment() - Mock Mode', () => {
      it('should create a mock comment', async () => {
        const authStore = useAuthStore()
        authStore.user = {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          avatarUrl: 'https://example.com/avatar.jpg',
        }

        const store = useCommentsStore()
        store.useMockData = true

        const promise = store.createComment('article-1', 'New comment content')
        await vi.advanceTimersByTimeAsync(300)
        await promise

        expect(store.commentsByArticle['article-1']).toHaveLength(1)
        expect(store.commentsByArticle['article-1'][0].content).toBe('New comment content')
        expect(store.commentsByArticle['article-1'][0].author.name).toBe('Test User')
      })

      it('should add comment at the beginning of the array', async () => {
        const authStore = useAuthStore()
        authStore.user = {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          avatarUrl: 'https://example.com/avatar.jpg',
        }

        const store = useCommentsStore()
        store.useMockData = true
        store.commentsByArticle['article-1'] = [mockComment]

        const promise = store.createComment('article-1', 'Newest comment')
        await vi.advanceTimersByTimeAsync(300)
        await promise

        expect(store.commentsByArticle['article-1']).toHaveLength(2)
        expect(store.commentsByArticle['article-1'][0].content).toBe('Newest comment')
      })

      it('should show success toast', async () => {
        const authStore = useAuthStore()
        authStore.user = {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          avatarUrl: 'https://example.com/avatar.jpg',
        }

        const store = useCommentsStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        store.useMockData = true

        const promise = store.createComment('article-1', 'New comment')
        await vi.advanceTimersByTimeAsync(300)
        await promise

        expect(showSpy).toHaveBeenCalledWith('Comment added successfully')
      })

      it('should show error if user is not logged in', async () => {
        const store = useCommentsStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        await store.createComment('article-1', 'New comment')

        expect(showSpy).toHaveBeenCalledWith('Please login to comment', 'error')
        expect(store.commentsByArticle['article-1']).toBeUndefined()
      })
    })

    describe('createComment() - API Mode', () => {
      it('should create comment via API', async () => {
        const authStore = useAuthStore()
        authStore.user = {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          avatarUrl: 'https://example.com/avatar.jpg',
        }

        const store = useCommentsStore()
        store.useMockData = false

        const newComment = { ...mockComment, content: 'API comment' }
        vi.mocked(apiService.createComment).mockResolvedValue(newComment)

        await store.createComment('article-1', 'API comment')

        expect(apiService.createComment).toHaveBeenCalledWith('article-1', {
          content: 'API comment',
        })
        expect(store.commentsByArticle['article-1'][0]).toEqual(newComment)
      })

      it('should show error toast on API failure', async () => {
        const authStore = useAuthStore()
        authStore.user = {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          avatarUrl: 'https://example.com/avatar.jpg',
        }

        const store = useCommentsStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        store.useMockData = false

        vi.mocked(apiService.createComment).mockRejectedValue(new Error('API error'))

        await store.createComment('article-1', 'New comment')

        expect(showSpy).toHaveBeenCalledWith('Failed to add comment', 'error')
      })
    })

    describe('updateComment()', () => {
      it('should update comment in mock mode', async () => {
        const store = useCommentsStore()
        store.useMockData = true
        store.commentsByArticle['article-1'] = [mockComment]

        const promise = store.updateComment('comment-1', 'article-1', 'Updated content')
        await vi.advanceTimersByTimeAsync(200)
        await promise

        expect(store.commentsByArticle['article-1'][0].content).toBe('Updated content')
        expect(store.commentsByArticle['article-1'][0].updatedAt).toBeDefined()
      })

      it('should update comment via API', async () => {
        const store = useCommentsStore()
        store.useMockData = false
        store.commentsByArticle['article-1'] = [mockComment]

        const updatedComment = { ...mockComment, content: 'Updated via API' }
        vi.mocked(apiService.updateComment).mockResolvedValue(updatedComment)

        await store.updateComment('comment-1', 'article-1', 'Updated via API')

        expect(apiService.updateComment).toHaveBeenCalledWith('comment-1', {
          content: 'Updated via API',
        })
        expect(store.commentsByArticle['article-1'][0].content).toBe('Updated via API')
      })

      it('should show success toast', async () => {
        const store = useCommentsStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        store.useMockData = true
        store.commentsByArticle['article-1'] = [mockComment]

        const promise = store.updateComment('comment-1', 'article-1', 'Updated')
        await vi.advanceTimersByTimeAsync(200)
        await promise

        expect(showSpy).toHaveBeenCalledWith('Comment updated successfully')
      })

      it('should show error toast on failure', async () => {
        const store = useCommentsStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        store.useMockData = false
        store.commentsByArticle['article-1'] = [mockComment]

        vi.mocked(apiService.updateComment).mockRejectedValue(new Error('Update failed'))

        await store.updateComment('comment-1', 'article-1', 'Updated')

        expect(showSpy).toHaveBeenCalledWith('Failed to update comment', 'error')
      })
    })

    describe('deleteComment()', () => {
      it('should delete comment in mock mode', async () => {
        const store = useCommentsStore()
        store.useMockData = true
        store.commentsByArticle['article-1'] = [
          mockComment,
          { ...mockComment, id: 'comment-2' },
        ]

        const promise = store.deleteComment('comment-1', 'article-1')
        await vi.advanceTimersByTimeAsync(200)
        await promise

        expect(store.commentsByArticle['article-1']).toHaveLength(1)
        expect(store.commentsByArticle['article-1'][0].id).toBe('comment-2')
      })

      it('should delete comment via API', async () => {
        const store = useCommentsStore()
        store.useMockData = false
        store.commentsByArticle['article-1'] = [mockComment]

        vi.mocked(apiService.deleteComment).mockResolvedValue(undefined)

        await store.deleteComment('comment-1', 'article-1')

        expect(apiService.deleteComment).toHaveBeenCalledWith('comment-1')
        expect(store.commentsByArticle['article-1']).toHaveLength(0)
      })

      it('should show success toast', async () => {
        const store = useCommentsStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        store.useMockData = true
        store.commentsByArticle['article-1'] = [mockComment]

        const promise = store.deleteComment('comment-1', 'article-1')
        await vi.advanceTimersByTimeAsync(200)
        await promise

        expect(showSpy).toHaveBeenCalledWith('Comment deleted successfully', 'info')
      })

      it('should show error toast on failure', async () => {
        const store = useCommentsStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        store.useMockData = false
        store.commentsByArticle['article-1'] = [mockComment]

        vi.mocked(apiService.deleteComment).mockRejectedValue(new Error('Delete failed'))

        await store.deleteComment('comment-1', 'article-1')

        expect(showSpy).toHaveBeenCalledWith('Failed to delete comment', 'error')
      })
    })
  })
})
