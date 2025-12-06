import { defineStore } from 'pinia'
import type { Comment } from '../data/articles'
import { apiService } from '../services/api'
import { useToastStore } from './toast'
import { useAuthStore } from './auth'

interface CommentsState {
  commentsByArticle: Record<string, Comment[]>
  loading: boolean
  error: string | null
  useMockData: boolean
}

// Use mock data by default (no backend required)
// Change to false once your backend is ready
const USE_MOCK_DATA = true

console.log('🔧 Comments store initialized with USE_MOCK_DATA:', USE_MOCK_DATA)

export const useCommentsStore = defineStore('comments', {
  state: (): CommentsState => ({
    commentsByArticle: {},
    loading: false,
    error: null,
    useMockData: USE_MOCK_DATA,
  }),

  getters: {
    getCommentsByArticleId: (state) => {
      return (articleId: string): Comment[] => {
        return state.commentsByArticle[articleId] || []
      }
    },

    getCommentsCount: (state) => {
      return (articleId: string): number => {
        return (state.commentsByArticle[articleId] || []).length
      }
    },
  },

  actions: {
    async fetchComments(articleId: string) {
      console.log('📝 Fetching comments, useMockData:', this.useMockData)
      this.loading = true
      this.error = null

      try {
        if (this.useMockData) {
          // Use mock data
          console.log('✅ Using mock data for comments')
          await new Promise(resolve => setTimeout(resolve, 300)) // Simulate network delay
          if (!this.commentsByArticle[articleId]) {
            this.commentsByArticle[articleId] = []
          }
        } else {
          const comments = await apiService.getComments(articleId)
          this.commentsByArticle[articleId] = comments
        }
      } catch (error) {
        this.error = 'Failed to load comments'
        console.error('Error fetching comments:', error)

        // If using real API and it fails, fall back to mock mode
        if (!this.useMockData) {
          console.log('Falling back to mock data mode')
          this.useMockData = true
          if (!this.commentsByArticle[articleId]) {
            this.commentsByArticle[articleId] = []
          }
        }
      } finally {
        this.loading = false
      }
    },

    async createComment(articleId: string, content: string) {
      console.log('💬 Creating comment, useMockData:', this.useMockData)
      const authStore = useAuthStore()
      const toast = useToastStore()

      if (!authStore.user) {
        toast.show('Please login to comment', 'error')
        return
      }

      const { id, name, avatarUrl } = authStore.user

      this.loading = true
      this.error = null

      try {
        let newComment: Comment

        if (this.useMockData) {
          // Create mock comment
          console.log('✅ Creating mock comment')
          await new Promise(resolve => setTimeout(resolve, 300)) // Simulate network delay
          newComment = {
            id: `comment-${Date.now()}`,
            articleId,
            author: {
              id,
              name,
              avatarUrl,
            },
            content,
            createdAt: new Date().toISOString(),
          }
          console.log('✅ Mock comment created:', newComment)
        } else {
          console.log('🌐 Calling API to create comment')
          newComment = await apiService.createComment(articleId, { content })
        }

        if (!this.commentsByArticle[articleId]) {
          this.commentsByArticle[articleId] = []
        }

        this.commentsByArticle[articleId].unshift(newComment)
        console.log('✅ Comment added to store, total comments:', this.commentsByArticle[articleId].length)
        toast.show('Comment added successfully')
      } catch (error) {
        this.error = 'Failed to create comment'
        console.error('❌ Error creating comment:', error)
        toast.show('Failed to add comment', 'error')
      } finally {
        this.loading = false
      }
    },

    async updateComment(commentId: string, articleId: string, content: string) {
      this.loading = true
      this.error = null

      try {
        const comments = this.commentsByArticle[articleId] || []
        const index = comments.findIndex((c) => c.id === commentId)

        if (this.useMockData) {
          // Update mock comment
          await new Promise(resolve => setTimeout(resolve, 200))
          if (index !== -1) {
            comments[index] = {
              ...comments[index],
              content,
              updatedAt: new Date().toISOString(),
            }
          }
        } else {
          const updatedComment = await apiService.updateComment(commentId, { content })
          if (index !== -1) {
            comments[index] = updatedComment
          }
        }

        const toast = useToastStore()
        toast.show('Comment updated successfully')
      } catch (error) {
        this.error = 'Failed to update comment'
        console.error('Error updating comment:', error)

        const toast = useToastStore()
        toast.show('Failed to update comment', 'error')
      } finally {
        this.loading = false
      }
    },

    async deleteComment(commentId: string, articleId: string) {
      this.loading = true
      this.error = null

      try {
        if (this.useMockData) {
          // Delete mock comment
          await new Promise(resolve => setTimeout(resolve, 200))
        } else {
          await apiService.deleteComment(commentId)
        }

        const comments = this.commentsByArticle[articleId] || []
        this.commentsByArticle[articleId] = comments.filter((c) => c.id !== commentId)

        const toast = useToastStore()
        toast.show('Comment deleted successfully', 'info')
      } catch (error) {
        this.error = 'Failed to delete comment'
        console.error('Error deleting comment:', error)

        const toast = useToastStore()
        toast.show('Failed to delete comment', 'error')
      } finally {
        this.loading = false
      }
    },
  },
})
