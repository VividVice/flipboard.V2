import type { Comment } from '../data/articles'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface CreateCommentDto {
  content: string
}

export interface UpdateCommentDto {
  content: string
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
