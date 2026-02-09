import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCommentsStore } from '../comments'
import { useAuthStore } from '../auth'
import { useToastStore } from '../toast'
import { apiService, apiServiceExtended } from '../../services/api'
import type { Comment } from '../../data/articles'

vi.mock('../../services/api', () => ({
  apiService: {
    getComments: vi.fn(),
    createComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
    getUserComments: vi.fn(),
  },
  apiServiceExtended: {
    getMagazineComments: vi.fn(),
    createMagazineComment: vi.fn(),
  }
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

  const mockApiComment = {
    id: 'comment-1',
    article_id: 'article-1',
    user: {
      id: 'user-1',
      username: 'Test User',
      profile_pic: 'https://example.com/avatar.jpg'
    },
    content: 'Test comment content',
    created_at: '2024-01-01T00:00:00Z'
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
      expect(store.useMockData).toBe(false)
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

    describe('getCommentsByMagazineId', () => {
      it('should return comments for a specific magazine', () => {
        const store = useCommentsStore()
        store.commentsByMagazine = { 'mag-1': [mockComment] }
        expect(store.getCommentsByMagazineId('mag-1')).toHaveLength(1)
      })

      it('should return empty array if no comments for magazine', () => {
        const store = useCommentsStore()
        expect(store.getCommentsByMagazineId('non-existent')).toEqual([])
      })
    })

    describe('getMagazineCommentsCount', () => {
      it('should return the count of comments for a magazine', () => {
        const store = useCommentsStore()
        store.commentsByMagazine = { 'mag-1': [mockComment] }
        expect(store.getMagazineCommentsCount('mag-1')).toBe(1)
      })

      it('should return 0 if no comments for magazine', () => {
        const store = useCommentsStore()
        expect(store.getMagazineCommentsCount('non-existent')).toBe(0)
      })
    })
  })

  describe('Actions', () => {
    describe('fetchMagazineComments()', () => {
      it('should fetch magazine comments from API', async () => {
        const store = useCommentsStore()
        const apiComment = { ...mockApiComment, magazine_id: 'mag-1', article_id: undefined }
        vi.mocked(apiServiceExtended.getMagazineComments).mockResolvedValue([apiComment] as unknown as Comment[])

        await store.fetchMagazineComments('mag-1')

        expect(apiServiceExtended.getMagazineComments).toHaveBeenCalledWith('mag-1')
        expect(store.commentsByMagazine['mag-1']).toHaveLength(1)
        expect(store.commentsByMagazine['mag-1'][0].articleId).toBe('mag-1')
      })

      it('should handle magazine comments fetch failure', async () => {
        const store = useCommentsStore()
        vi.mocked(apiServiceExtended.getMagazineComments).mockRejectedValue(new Error('fail'))
        await store.fetchMagazineComments('mag-1')
        expect(store.error).toBe('Failed to load magazine comments')
      })

      it('should initialize empty comments array in mock mode', async () => {
        const store = useCommentsStore()
        store.useMockData = true

        const promise = store.fetchMagazineComments('mag-1')
        await vi.advanceTimersByTimeAsync(300)
        await promise

        expect(store.commentsByMagazine['mag-1']).toEqual([])
      })

      it('should NOT reinitialize if comments already exist in mock mode', async () => {
        const store = useCommentsStore()
        store.useMockData = true
        store.commentsByMagazine['mag-1'] = [mockComment]

        const promise = store.fetchMagazineComments('mag-1')
        await vi.advanceTimersByTimeAsync(300)
        await promise

        expect(store.commentsByMagazine['mag-1']).toHaveLength(1)
      })
    })

    describe('fetchUserComments()', () => {
      it('should fetch current user comments', async () => {
        const store = useCommentsStore()
        vi.mocked(apiService.getUserComments).mockResolvedValue([mockApiComment] as unknown as Comment[])
        await store.fetchUserComments()
        expect(store.userComments).toHaveLength(1)
      })

      it('should handle user comments fetch failure', async () => {
        const store = useCommentsStore()
        vi.mocked(apiService.getUserComments).mockRejectedValue(new Error('fail'))
        await store.fetchUserComments()
        expect(store.error).toBe('Failed to load user comments')
      })

      it('should use mock data for user comments if enabled', async () => {
        const store = useCommentsStore()
        store.useMockData = true
        await store.fetchUserComments()
        expect(store.userComments).toEqual([])
      })
    })

    describe('createMagazineComment()', () => {
      it('should create magazine comment via API', async () => {
        const authStore = useAuthStore()
        authStore.user = { id: '1', name: 'test', email: 't@t.com', avatarUrl: '', newsletter_subscribed: false, followers: [], following: [], followed_magazines: [] }
        const store = useCommentsStore()
        const apiComment = { ...mockApiComment, magazine_id: 'mag-1', article_id: undefined }
        vi.mocked(apiServiceExtended.createMagazineComment).mockResolvedValue(apiComment as unknown as Comment)

        await store.createMagazineComment('mag-1', 'content')

        expect(apiServiceExtended.createMagazineComment).toHaveBeenCalledWith('mag-1', { content: 'content' })
        expect(store.commentsByMagazine['mag-1']).toHaveLength(1)
      })

      it('should initialize empty comments array if not exists in createMagazineComment', async () => {
        const authStore = useAuthStore()
        authStore.user = { id: '1', name: 'test', email: 't@t.com', avatarUrl: '', newsletter_subscribed: false, followers: [], following: [], followed_magazines: [] }
        const store = useCommentsStore()
        const apiComment = { ...mockApiComment, magazine_id: 'mag-1', article_id: undefined }
        vi.mocked(apiServiceExtended.createMagazineComment).mockResolvedValue(apiComment as unknown as Comment)

        // Ensure array is not initialized
        delete store.commentsByMagazine['mag-1']
        await store.createMagazineComment('mag-1', 'content')
        expect(store.commentsByMagazine['mag-1']).toHaveLength(1)
      })

      it('should NOT reinitialize empty comments array if ALREADY exists in createMagazineComment', async () => {
        const authStore = useAuthStore()
        authStore.user = { id: '1', name: 'test', email: 't@t.com', avatarUrl: '', newsletter_subscribed: false, followers: [], following: [], followed_magazines: [] }
        const store = useCommentsStore()
        const apiComment = { ...mockApiComment, magazine_id: 'mag-1', article_id: undefined }
        vi.mocked(apiServiceExtended.createMagazineComment).mockResolvedValue(apiComment as unknown as Comment)

        store.commentsByMagazine['mag-1'] = [{ ...mockComment, id: 'existing' }]
        await store.createMagazineComment('mag-1', 'content')
        expect(store.commentsByMagazine['mag-1']).toHaveLength(2)
        expect(store.commentsByMagazine['mag-1'][1].id).toBe('existing')
      })

      it('should show error if not logged in', async () => {
        const store = useCommentsStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')
        await store.createMagazineComment('mag-1', 'c')
        expect(showSpy).toHaveBeenCalledWith('Please login to comment', 'error')
      })

      it('should handle magazine comment creation failure', async () => {
        const authStore = useAuthStore()
        authStore.user = { id: '1', name: 'test', email: 't@t.com', avatarUrl: '', newsletter_subscribed: false, followers: [], following: [], followed_magazines: [] }
        const store = useCommentsStore()
        vi.mocked(apiServiceExtended.createMagazineComment).mockRejectedValue(new Error('fail'))
        await store.createMagazineComment('mag-1', 'c')
        expect(store.error).toBe('Failed to create comment')
      })
    })

    describe('transformComment branches', () => {
      it('should handle missing user object and use unknown name', async () => {
        const store = useCommentsStore()
        const apiComment = {
          id: '1',
          article_id: 'a1',
          user_id: 'u1',
          content: 'c',
          created_at: '2024'
        }
        vi.mocked(apiService.getComments).mockResolvedValue([apiComment] as unknown as Comment[])
        await store.fetchComments('a1')
        const comment = store.commentsByArticle['a1'][0]
        expect(comment.author.id).toBe('u1')
        expect(comment.author.name).toBe('Unknown User')
      })
    })

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

        const mockApiComments = [{
          id: 'comment-1',
          article_id: 'article-1',
          user: {
            id: 'user-1',
            username: 'Test User',
            profile_pic: 'https://example.com/avatar.jpg'
          },
          content: 'Test comment content',
          created_at: '2024-01-01T00:00:00Z'
        }]
        vi.mocked(apiService.getComments).mockResolvedValue(mockApiComments as unknown as Comment[])

        await store.fetchComments('article-1')

        expect(apiService.getComments).toHaveBeenCalledWith('article-1')
        expect(store.commentsByArticle['article-1']).toEqual([mockComment])
      })

      it('should handle API error without falling back to mock mode', async () => {
        const store = useCommentsStore()
        store.useMockData = false

        vi.mocked(apiService.getComments).mockRejectedValue(new Error('Network error'))

        await store.fetchComments('article-1')

        expect(store.useMockData).toBe(false)
        expect(store.error).toBe('Failed to load comments')
        expect(store.commentsByArticle['article-1']).toBeUndefined()
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
          bio: undefined,
          newsletter_subscribed: false
        }

        const store = useCommentsStore()
        store.useMockData = false

        const newCommentContent = 'API comment'
        const mockApiComment = {
          id: 'comment-1',
          article_id: 'article-1',
          user: {
            id: 'user-1',
            username: 'Test User',
            profile_pic: 'https://example.com/avatar.jpg'
          },
          content: newCommentContent,
          created_at: '2024-01-01T00:00:00Z'
        }
        
        vi.mocked(apiService.createComment).mockResolvedValue(mockApiComment as unknown as Comment)

        await store.createComment('article-1', newCommentContent)

        expect(apiService.createComment).toHaveBeenCalledWith('article-1', {
          content: newCommentContent,
        })
        expect(store.commentsByArticle['article-1'][0]).toEqual({
             ...mockComment,
             content: newCommentContent 
        })
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

      it('should handle index === -1 in mock mode update', async () => {
        const store = useCommentsStore()
        store.useMockData = true
        store.commentsByArticle['article-1'] = [mockComment]

        const promise = store.updateComment('non-existent', 'article-1', 'Updated')
        await vi.advanceTimersByTimeAsync(200)
        await promise

        expect(store.commentsByArticle['article-1'][0].content).toBe(mockComment.content)
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

      it('should update magazine comment via API', async () => {
        const store = useCommentsStore()
        store.commentsByMagazine['mag-1'] = [mockComment]
        vi.mocked(apiService.updateComment).mockResolvedValue({ ...mockComment, content: 'updated' })

        await store.updateComment('comment-1', 'mag-1', 'updated', true)
        expect(store.commentsByMagazine['mag-1'][0].content).toBe('updated')
      })

      it('should handle non-existent magazine comments array in update', async () => {
        const store = useCommentsStore()
        vi.mocked(apiService.updateComment).mockResolvedValue({ ...mockComment, content: 'updated' })

        await store.updateComment('comment-1', 'mag-1', 'updated', true)
        expect(store.commentsByMagazine['mag-1']).toBeUndefined()
      })

      it('should handle non-existent article comments array in update', async () => {
        const store = useCommentsStore()
        vi.mocked(apiService.updateComment).mockResolvedValue({ ...mockComment, content: 'updated' })

        await store.updateComment('comment-1', 'art-1', 'updated', false)
        expect(store.commentsByArticle['art-1']).toBeUndefined()
      })

      it('should update in userComments if present', async () => {
        const store = useCommentsStore()
        store.userComments = [mockComment]
        vi.mocked(apiService.updateComment).mockResolvedValue({ ...mockComment, content: 'updated' })

        await store.updateComment('comment-1', 'article-1', 'updated')
        expect(store.userComments[0].content).toBe('updated')
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

      it('should delete magazine comment via API', async () => {
        const store = useCommentsStore()
        store.commentsByMagazine['mag-1'] = [mockComment]
        vi.mocked(apiService.deleteComment).mockResolvedValue(undefined)

        await store.deleteComment('comment-1', 'mag-1', true)
        expect(store.commentsByMagazine['mag-1']).toHaveLength(0)
      })

      it('should handle non-existent magazine comments array in delete', async () => {
        const store = useCommentsStore()
        vi.mocked(apiService.deleteComment).mockResolvedValue(undefined)

        await store.deleteComment('comment-1', 'mag-1', true)
        expect(store.commentsByMagazine['mag-1']).toEqual([])
      })

      it('should handle non-existent article comments array in delete', async () => {
        const store = useCommentsStore()
        vi.mocked(apiService.deleteComment).mockResolvedValue(undefined)

        await store.deleteComment('comment-1', 'art-1', false)
        expect(store.commentsByArticle['art-1']).toEqual([])
      })

      it('should also remove from userComments', async () => {
        const store = useCommentsStore()
        store.userComments = [mockComment]
        vi.mocked(apiService.deleteComment).mockResolvedValue(undefined)

        await store.deleteComment('comment-1', 'article-1')
        expect(store.userComments).toHaveLength(0)
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
