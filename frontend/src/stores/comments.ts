import { defineStore } from 'pinia'
import type { Comment } from '../data/articles'
import { apiService } from '../services/api'
import { useToastStore } from './toast'
import { useAuthStore } from './auth'

interface CommentsState {
  commentsByArticle: Record<string, Comment[]>
  userComments: Comment[]
  loading: boolean
  error: string | null
  useMockData: boolean
}

// Use mock data by default (no backend required)
// Change to false once your backend is ready
const USE_MOCK_DATA = false

console.log('🔧 Comments store initialized with USE_MOCK_DATA:', USE_MOCK_DATA)

const transformComment = (apiComment: any): Comment => {
  return {
    id: apiComment.id,
    articleId: apiComment.article_id,
    articleTitle: apiComment.article_title,
    author: {
      id: apiComment.user?.id || apiComment.user_id,
      name: apiComment.user?.username || 'Unknown User',
      avatarUrl: apiComment.user?.profile_pic || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    content: apiComment.content,
    createdAt: apiComment.created_at,
    updatedAt: apiComment.updated_at,
  }
}

export const useCommentsStore = defineStore('comments', {
  state: (): CommentsState => ({
    commentsByArticle: {},
    userComments: [],
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
          this.commentsByArticle[articleId] = comments.map(transformComment)
        }
      } catch (error) {
        this.error = 'Failed to load comments'
        console.error('Error fetching comments:', error)

        // If using real API and it fails, fall back to mock mode
        if (!this.useMockData) {
          console.log('Falling back to mock data mode')
          // Optionally handle real API error without falling back
        }
      } finally {
        this.loading = false
      }
    },

    async fetchUserComments() {
      this.loading = true
      this.error = null
      try {
        if (this.useMockData) {
          this.userComments = []
        } else {
          const comments = await apiService.getUserComments()
          this.userComments = comments.map(transformComment)
        }
      } catch (error) {
        this.error = 'Failed to load user comments'
        console.error('Error fetching user comments:', error)
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
          const apiComment = await apiService.createComment(articleId, { content })
          newComment = transformComment(apiComment)
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
             const existingComment = comments[index]
             if (existingComment) {
                comments[index] = {
                  ...existingComment,
                  content,
                  updatedAt: new Date().toISOString(),
                }
             }
          }
        } else {
          const apiComment = await apiService.updateComment(commentId, { content })
          const updatedComment = transformComment(apiComment)
          
          if (index !== -1) {
            comments[index] = updatedComment
          }
          
          // Also update in userComments if present
          const userCommentIndex = this.userComments.findIndex(c => c.id === commentId)
          if (userCommentIndex !== -1) {
            this.userComments[userCommentIndex] = updatedComment
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
        
        // Also remove from userComments
        this.userComments = this.userComments.filter(c => c.id !== commentId)

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
