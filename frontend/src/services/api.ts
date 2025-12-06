import type { Comment } from '../data/articles'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Comment validation constants
const MIN_COMMENT_LENGTH = 1
const MAX_COMMENT_LENGTH = 1000

export interface CreateCommentDto {
  content: string
}

export interface UpdateCommentDto {
  content: string
}

// Validation error class
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Validate comment content
function validateCommentContent(content: string): void {
  const trimmedContent = content.trim()
  
  if (trimmedContent.length === 0) {
    throw new ValidationError('Comment cannot be empty')
  }
  
  if (trimmedContent.length < MIN_COMMENT_LENGTH) {
    throw new ValidationError(`Comment must be at least ${MIN_COMMENT_LENGTH} character${MIN_COMMENT_LENGTH > 1 ? 's' : ''}`)
  }
  
  if (trimmedContent.length > MAX_COMMENT_LENGTH) {
    throw new ValidationError(`Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`)
  }
}

class ApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('token')
  }

  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (includeAuth) {
      const token = this.getAuthToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    return headers
  }

  async getComments(articleId: string): Promise<Comment[]> {
    const response = await fetch(`${API_BASE_URL}/articles/${articleId}/comments`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch comments')
    }

    return response.json()
  }

  async createComment(articleId: string, data: CreateCommentDto): Promise<Comment> {
    // Validate content before making API call
    validateCommentContent(data.content)
    
    const response = await fetch(`${API_BASE_URL}/articles/${articleId}/comments`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to create comment')
    }

    return response.json()
  }

  async updateComment(commentId: string, data: UpdateCommentDto): Promise<Comment> {
    // Validate content before making API call
    validateCommentContent(data.content)
    
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to update comment')
    }

    return response.json()
  }

  async deleteComment(commentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    })

    if (!response.ok) {
      throw new Error('Failed to delete comment')
    }
  }
}

export const apiService = new ApiService()
