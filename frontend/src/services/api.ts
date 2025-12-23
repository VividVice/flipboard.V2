import type { Comment } from '../data/articles'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface CreateCommentDto {
  content: string
}

export interface UpdateCommentDto {
  content: string
}

export interface SignupDto {
  username: string
  email: string
  password: string
}

export interface LoginDto {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: string
  username: string
  email: string
  bio?: string
  profile_pic?: string
  followed_topics: string[]
  newsletter_subscribed: boolean
  created_at: string
}

export interface UserUpdateDto {
  username?: string
  bio?: string
  profile_pic?: string
  followed_topics?: string[]
  newsletter_subscribed?: boolean
}

class ApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('token')
  }

  protected getHeaders(includeAuth = false): HeadersInit {
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

  async signup(data: SignupDto): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to sign up')
    }

    return response.json()
  }

  async login(data: LoginDto): Promise<TokenResponse> {
    const formData = new URLSearchParams()
    formData.append('username', data.username)
    formData.append('password', data.password)

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to log in')
    }

    const tokenData = await response.json()
    localStorage.setItem('token', tokenData.access_token)
    return tokenData
  }

  async loginGoogle(token: string): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to log in with Google')
    }

    const tokenData = await response.json()
    localStorage.setItem('token', tokenData.access_token)
    return tokenData
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

  async getUserComments(): Promise<Comment[]> {
    const response = await fetch(`${API_BASE_URL}/users/me/comments`, {
      headers: this.getHeaders(true),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user comments')
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
      throw new Error(`Failed to create comment: ${response.status} ${response.statusText}`)
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
      throw new Error(`Failed to update comment: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async deleteComment(commentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    })

    if (!response.ok) {
      throw new Error(`Failed to delete comment: ${response.status} ${response.statusText}`)
    }
  }
}

export const apiService = new ApiService()


export interface Topic {
  id: string
  name: string
  description?: string
  icon?: string
  follower_count: number
  created_at: string
}

export interface Article {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  publisher: string
  source_url: string
  image_url?: string
  published_at: string
  topics: string[]
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  liked?: boolean
  saved?: boolean
}

export interface InteractionStatus {
  is_liked: boolean
  is_saved: boolean
}

export interface Magazine {
  id: string
  user_id: string
  name: string
  description?: string
  article_ids: string[]
  created_at: string
  updated_at: string
}

// News API Types
export interface FacebookStats {
  likes: number
  comments: number
  shares: number
}

export interface VKStats {
  shares: number
}

export interface SocialStats {
  updated?: string
  facebook?: FacebookStats
  vk?: VKStats
}

export interface NewsThread {
  uuid: string
  url: string
  site_full: string
  site: string
  site_section?: string
  site_categories: string[]
  section_title?: string
  title: string
  title_full: string
  published: string
  replies_count: number
  participants_count: number
  site_type: string
  country?: string
  main_image?: string
  performance_score: number
  domain_rank?: number
  domain_rank_updated?: string
  social?: SocialStats
}

export interface Entity {
  name: string
  sentiment?: string
}

export interface Entities {
  persons: Entity[]
  organizations: Entity[]
  locations: Entity[]
}

export interface NewsPost {
  thread: NewsThread
  uuid: string
  url: string
  ord_in_thread: number
  parent_url?: string
  author?: string
  published: string
  title: string
  text: string
  highlightText: string
  highlightTitle: string
  highlightThreadTitle: string
  language: string
  sentiment?: string
  categories: string[]
  external_links: string[]
  external_images: string[]
  entities?: Entities
  rating?: number
  crawled: string
  updated?: string
  liked?: boolean
  saved?: boolean
}

export interface NewsResponse {
  posts: NewsPost[]
  totalResults: number
  moreResultsAvailable: number
  next?: string
  requestsLeft: number
  warnings?: string
}

class ApiServiceExtended extends ApiService {
  // Topics
  async getTopics(): Promise<Topic[]> {
    const response = await fetch(`${API_BASE_URL}/topics`, {
      headers: this.getHeaders(),
    })
    if (!response.ok) throw new Error('Failed to fetch topics')
    return response.json()
  }

  async followTopic(topicId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/topics/${topicId}/follow`, {
      method: 'POST',
      headers: this.getHeaders(true),
    })
    if (!response.ok) throw new Error('Failed to follow topic')
  }

  async bulkFollowTopics(topicIds: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/topics/bulk-follow`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ topic_ids: topicIds }),
    })
    if (!response.ok) throw new Error('Failed to follow topics')
  }

  async getFollowedTopics(): Promise<Topic[]> {
    const response = await fetch(`${API_BASE_URL}/topics/me/followed`, {
      headers: this.getHeaders(true),
    })
    if (!response.ok) throw new Error('Failed to fetch followed topics')
    return response.json()
  }

  // Articles
  async getArticles(params?: {
    skip?: number
    limit?: number
    topic?: string
    search?: string
  }): Promise<Article[]> {
    const queryParams = new URLSearchParams()
    if (params?.skip) queryParams.append('skip', params.skip.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.topic) queryParams.append('topic', params.topic)
    if (params?.search) queryParams.append('search', params.search)

    const url = `${API_BASE_URL}/articles?${queryParams.toString()}`
    const response = await fetch(url, { headers: this.getHeaders(true) })
    if (!response.ok) throw new Error('Failed to fetch articles')
    return response.json()
  }

  async getArticle(articleId: string): Promise<Article> {
    const response = await fetch(`${API_BASE_URL}/articles/${articleId}`, {
      headers: this.getHeaders(true),
    })
    if (!response.ok) throw new Error('Failed to fetch article')
    return response.json()
  }

  async getHeroArticle(): Promise<Article> {
    const response = await fetch(`${API_BASE_URL}/articles/hero`, {
      headers: this.getHeaders(true),
    })
    if (!response.ok) throw new Error('Failed to fetch hero article')
    return response.json()
  }

  async getFeedArticles(params?: { skip?: number; limit?: number }): Promise<Article[]> {
    const queryParams = new URLSearchParams()
    if (params?.skip) queryParams.append('skip', params.skip.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const url = `${API_BASE_URL}/articles/feed?${queryParams.toString()}`
    const response = await fetch(url, { headers: this.getHeaders(true) })
    if (!response.ok) throw new Error('Failed to fetch feed')
    return response.json()
  }

  // Interactions
  async likeArticle(articleId: string): Promise<InteractionStatus> {
    const response = await fetch(`${API_BASE_URL}/articles/${articleId}/like`, {
      method: 'POST',
      headers: this.getHeaders(true),
    })
    if (!response.ok) throw new Error('Failed to like article')
    return response.json()
  }

  async saveArticle(articleId: string): Promise<InteractionStatus> {
    const response = await fetch(`${API_BASE_URL}/articles/${articleId}/save`, {
      method: 'POST',
      headers: this.getHeaders(true),
    })
    if (!response.ok) throw new Error('Failed to save article')
    return response.json()
  }

  async getInteractionStatus(articleId: string): Promise<InteractionStatus> {
    const response = await fetch(`${API_BASE_URL}/articles/${articleId}/status`, {
      headers: this.getHeaders(true),
    })
    if (!response.ok) throw new Error('Failed to get interaction status')
    return response.json()
  }

  async getLikedArticles(): Promise<Article[]> {
    const response = await fetch(`${API_BASE_URL}/me/liked`, {
      headers: this.getHeaders(true),
    })
    if (!response.ok) throw new Error('Failed to fetch liked articles')
    return response.json()
  }

  async getSavedArticles(): Promise<Article[]> {
    const response = await fetch(`${API_BASE_URL}/me/saved`, {
      headers: this.getHeaders(true),
    })
    if (!response.ok) throw new Error('Failed to fetch saved articles')
    return response.json()
  }

  // News API
  async getNews(params?: {
    q?: string
    ts?: number
    size?: number
    country?: string
  }): Promise<NewsResponse> {
    const queryParams = new URLSearchParams()
    queryParams.append('q', params?.q || 'news')
    if (params?.ts) queryParams.append('ts', params.ts.toString())
    if (params?.size) queryParams.append('size', params.size.toString())
    if (params?.country) queryParams.append('country', params.country)

    const url = `${API_BASE_URL}/news?${queryParams.toString()}`
    const response = await fetch(url, { headers: this.getHeaders(true) })
    if (!response.ok) throw new Error('Failed to fetch news')
    return response.json()
  }

  async getNewsByTopic(
    topic: string,
    params?: {
      sentiment?: string
      ts?: number
      size?: number
      country?: string
    }
  ): Promise<NewsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.sentiment) queryParams.append('sentiment', params.sentiment)
    if (params?.ts) queryParams.append('ts', params.ts.toString())
    if (params?.size) queryParams.append('size', params.size.toString())
    if (params?.country) queryParams.append('country', params.country)

    const url = `${API_BASE_URL}/news/topic/${encodeURIComponent(topic)}?${queryParams.toString()}`
    const response = await fetch(url, { headers: this.getHeaders(true) })
    if (!response.ok) throw new Error('Failed to fetch news by topic')
    return response.json()
  }

  async getNextNewsPage(nextUrl: string): Promise<NewsResponse> {
    const url = `${API_BASE_URL}/news/next?next_url=${encodeURIComponent(nextUrl)}`
    const response = await fetch(url, { headers: this.getHeaders(true) })
    if (!response.ok) throw new Error('Failed to fetch next news page')
    return response.json()
  }

  async getNewsFeed(params?: {
    ts?: number
    size?: number
    country?: string
  }): Promise<NewsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.ts) queryParams.append('ts', params.ts.toString())
    if (params?.size) queryParams.append('size', params.size.toString())
    if (params?.country) queryParams.append('country', params.country)

    const url = `${API_BASE_URL}/news/feed?${queryParams.toString()}`
    const response = await fetch(url, { headers: this.getHeaders(true) })
    if (!response.ok) throw new Error('Failed to fetch news feed')
    return response.json()
  }

  async getArticleContent(url: string): Promise<{ content: string }> {
    const response = await fetch(`${API_BASE_URL}/news/content?url=${encodeURIComponent(url)}`, {
      headers: this.getHeaders(true),
    })
    if (!response.ok) throw new Error('Failed to fetch article content')
    return response.json()
  }

  async importArticle(articleData: any): Promise<Article> {
    const response = await fetch(`${API_BASE_URL}/articles/import`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(articleData),
    })
    if (!response.ok) throw new Error('Failed to import article')
    return response.json()
  }

  // User settings
  async updateUserMe(data: UserUpdateDto): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to update user settings')
    }
    return response.json()
  }

  async triggerNewsletter(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/newsletter/trigger`, {
      method: 'POST',
      headers: this.getHeaders(true),
    })
    if (!response.ok) throw new Error('Failed to trigger newsletter')
  }

  // Magazines
  async getMagazines(): Promise<Magazine[]> {
    const response = await fetch(`${API_BASE_URL}/magazines/`, {
      headers: this.getHeaders(true),
    })
    if (!response.ok) throw new Error('Failed to fetch magazines')
    return response.json()
  }

  async createMagazine(name: string, description?: string): Promise<Magazine> {
    const response = await fetch(`${API_BASE_URL}/magazines/`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ name, description }),
    })
    if (!response.ok) throw new Error('Failed to create magazine')
    return response.json()
  }

  async deleteMagazine(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/magazines/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    })
    if (!response.ok) throw new Error('Failed to delete magazine')
  }

  async addArticleToMagazine(magazineId: string, articleId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/magazines/${magazineId}/articles/${articleId}`, {
      method: 'POST',
      headers: this.getHeaders(true),
    })
    if (!response.ok) throw new Error('Failed to add article to magazine')
  }

  async removeArticleFromMagazine(magazineId: string, articleId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/magazines/${magazineId}/articles/${articleId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    })
    if (!response.ok) throw new Error('Failed to remove article from magazine')
  }

  async getMagazineArticles(magazineId: string): Promise<Article[]> {
    const response = await fetch(`${API_BASE_URL}/magazines/${magazineId}/articles`, {
      headers: this.getHeaders(true),
    })
    if (!response.ok) throw new Error('Failed to fetch magazine articles')
    return response.json()
  }
}

export const apiServiceExtended = new ApiServiceExtended()
