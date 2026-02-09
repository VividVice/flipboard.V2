import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import { useToastStore } from '../toast'
import { apiService, apiServiceExtended, type User } from '../../services/api'

vi.mock('../../services/api', () => ({
  apiService: {
    login: vi.fn(),
    signup: vi.fn(),
    loginGoogle: vi.fn(),
  },
  apiServiceExtended: {
    updateUserMe: vi.fn(),
    triggerNewsletter: vi.fn(),
    followUser: vi.fn(),
    unfollowUser: vi.fn(),
    followMagazine: vi.fn(),
    unfollowMagazine: vi.fn(),
  }
}))

// Mock other stores
vi.mock('../articles', () => ({ useArticleStore: () => ({ $reset: vi.fn() }) }))
vi.mock('../magazines', () => ({ useMagazineStore: () => ({ $reset: vi.fn(), fetchFollowedMagazines: vi.fn() }) }))
vi.mock('../comments', () => ({ useCommentsStore: () => ({ $reset: vi.fn() }) }))
vi.mock('../topics', () => ({ useTopicStore: () => ({ $reset: vi.fn() }) }))
vi.mock('../news', () => ({ useNewsStore: () => ({ $reset: vi.fn() }) }))
vi.mock('../../router', () => ({ default: { push: vi.fn() } }))

// Mock fetch globally
global.fetch = vi.fn()

describe('Auth Store', () => {
  let localStorageMock: { [key: string]: string }

  beforeEach(() => {
    setActivePinia(createPinia())

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

    // Reset apiServiceExtended mocks
    vi.mocked(apiServiceExtended.updateUserMe).mockReset()
    vi.mocked(apiServiceExtended.triggerNewsletter).mockReset()
    vi.mocked(apiServiceExtended.followUser).mockReset()
    vi.mocked(apiServiceExtended.unfollowUser).mockReset()
    vi.mocked(apiServiceExtended.followMagazine).mockReset()
    vi.mocked(apiServiceExtended.unfollowMagazine).mockReset()
    
    // Set default success implementations
    vi.mocked(apiServiceExtended.followUser).mockResolvedValue(undefined)
    vi.mocked(apiServiceExtended.unfollowUser).mockResolvedValue(undefined)
    vi.mocked(apiServiceExtended.followMagazine).mockResolvedValue(undefined)
    vi.mocked(apiServiceExtended.unfollowMagazine).mockResolvedValue(undefined)
    vi.mocked(apiServiceExtended.triggerNewsletter).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with no user and not authenticated', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('initialize()', () => {
    it('should do nothing if no token in localStorage', async () => {
      const store = useAuthStore()
      await store.initialize()
      expect(store.isAuthenticated).toBe(false)
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should fetch user data if token exists', async () => {
      localStorageMock.token = 'mock-token'
      const mockUserData = { id: '1', username: 'testuser', email: 'test@example.com' }
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      } as Response)

      const store = useAuthStore()
      await store.initialize()

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/me'), expect.any(Object))
      expect(store.isAuthenticated).toBe(true)
      expect(store.user?.name).toBe('testuser')
    })

    it('should remove token if fetch fails', async () => {
      localStorageMock.token = 'bad-token'
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)

      const store = useAuthStore()
      await store.initialize()

      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
      expect(store.isAuthenticated).toBe(false)
    })

    it('should handle network error during initialization', async () => {
      localStorageMock.token = 'token'
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

      const store = useAuthStore()
      await store.initialize()

      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
    })
  })

  describe('loginWithGoogle()', () => {
    it('should successfully login with Google', async () => {
      vi.mocked(apiService.loginGoogle).mockResolvedValue({ access_token: 't', token_type: 'b' })
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', username: 'googleuser' }),
      } as Response)

      localStorageMock.token = 't'

      const store = useAuthStore()
      await store.loginWithGoogle('google-token')

      expect(apiService.loginGoogle).toHaveBeenCalledWith('google-token')
      expect(store.isAuthenticated).toBe(true)
      expect(store.user?.name).toBe('googleuser')
    })

    it('should show error on Google login failure', async () => {
      vi.mocked(apiService.loginGoogle).mockRejectedValue(new Error('Google failed'))

      const store = useAuthStore()
      await expect(store.loginWithGoogle('token')).rejects.toThrow('Google failed')
    })

    it('should handle user fetch failure after Google auth', async () => {
      vi.mocked(apiService.loginGoogle).mockResolvedValue({ access_token: 't', token_type: 'b' })
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response)

      const store = useAuthStore()
      await expect(store.loginWithGoogle('token')).rejects.toThrow('Failed to fetch user data')
    })
  })

  describe('login()', () => {
    it('should successfully login a user', async () => {
      const mockUserData = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        profile_pic: 'https://example.com/pic.jpg',
      }

      vi.mocked(apiService.login).mockResolvedValue(undefined)
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      } as Response)

      localStorageMock.token = 'mock-token'

      const store = useAuthStore()
      await store.login('testuser', 'password123')

      expect(apiService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      })
      expect(store.user).toEqual({
        id: '1',
        name: 'testuser',
        email: 'test@example.com',
        avatarUrl: 'https://example.com/pic.jpg',
        bio: undefined,
        newsletter_subscribed: false,
        followers: [],
        following: [],
        followed_magazines: [],
      })
      expect(store.isAuthenticated).toBe(true)
    })

    it('should use default avatar if profile_pic is not provided', async () => {
      const mockUserData = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        profile_pic: null,
      }

      vi.mocked(apiService.login).mockResolvedValue(undefined)
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      } as Response)

      localStorageMock.token = 'mock-token'

      const store = useAuthStore()
      await store.login('testuser', 'password123')

      expect(store.user?.avatarUrl).toContain('unsplash.com')
    })

    it('should show success toast on successful login', async () => {
      const mockUserData = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      }

      vi.mocked(apiService.login).mockResolvedValue(undefined)
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      } as Response)

      localStorageMock.token = 'mock-token'

      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')

      await store.login('testuser', 'password123')

      expect(showSpy).toHaveBeenCalledWith('Welcome back, testuser!')
    })

    it('should show error toast and throw on login failure', async () => {
      vi.mocked(apiService.login).mockRejectedValue(new Error('Invalid credentials'))

      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')

      await expect(store.login('testuser', 'wrongpassword')).rejects.toThrow('Invalid credentials')

      expect(showSpy).toHaveBeenCalledWith('Invalid credentials', 'error')
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('should handle user fetch failure after successful auth', async () => {
      vi.mocked(apiService.login).mockResolvedValue(undefined)
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)

      localStorageMock.token = 'mock-token'

      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')

      await expect(store.login('testuser', 'password123')).rejects.toThrow('Failed to fetch user data')
      expect(showSpy).toHaveBeenCalledWith('Failed to fetch user data', 'error')
    })
  })

  describe('signup()', () => {
    it('should successfully signup a new user', async () => {
      const mockUserData = {
        id: '1',
        username: 'newuser',
        email: 'new@example.com',
        profile_pic: null,
      }

      vi.mocked(apiService.signup).mockResolvedValue(mockUserData)
      vi.mocked(apiService.login).mockResolvedValue(undefined)

      const store = useAuthStore()
      await store.signup('newuser', 'new@example.com', 'password123')

      expect(apiService.signup).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      })
      expect(apiService.login).toHaveBeenCalledWith({
        username: 'newuser',
        password: 'password123',
      })
      expect(store.user).toEqual({
        id: '1',
        name: 'newuser',
        email: 'new@example.com',
        avatarUrl: expect.stringContaining('unsplash.com'),
        bio: undefined,
        newsletter_subscribed: false,
        followers: [],
        following: [],
        followed_magazines: [],
      })
      expect(store.isAuthenticated).toBe(true)
    })

    it('should show welcome toast on successful signup', async () => {
      const mockUserData = {
        id: '1',
        username: 'newuser',
        email: 'new@example.com',
      }

      vi.mocked(apiService.signup).mockResolvedValue(mockUserData)
      vi.mocked(apiService.login).mockResolvedValue(undefined)

      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')

      await store.signup('newuser', 'new@example.com', 'password123')

      expect(showSpy).toHaveBeenCalledWith('Welcome to Flipboard, newuser!')
    })

    it('should show error toast and throw on signup failure', async () => {
      vi.mocked(apiService.signup).mockRejectedValue(new Error('Email already exists'))

      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')

      await expect(
        store.signup('newuser', 'existing@example.com', 'password123')
      ).rejects.toThrow('Email already exists')

      expect(showSpy).toHaveBeenCalledWith('Email already exists', 'error')
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('should handle login failure after successful signup', async () => {
      const mockUserData = {
        id: '1',
        username: 'newuser',
        email: 'new@example.com',
      }

      vi.mocked(apiService.signup).mockResolvedValue(mockUserData)
      vi.mocked(apiService.login).mockRejectedValue(new Error('Auto-login failed'))

      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')

      await expect(
        store.signup('newuser', 'new@example.com', 'password123')
      ).rejects.toThrow('Auto-login failed')

      expect(showSpy).toHaveBeenCalledWith('Auto-login failed', 'error')
    })
  })

  describe('logout()', () => {
    it('should clear user data and token', () => {
      const store = useAuthStore()

      // Set up authenticated state
      store.user = {
        id: '1',
        name: 'testuser',
        email: 'test@example.com',
        avatarUrl: 'https://example.com/pic.jpg',
        newsletter_subscribed: false,
        followers: [],
        following: [],
        followed_magazines: []
      }
      store.isAuthenticated = true
      localStorageMock.token = 'some-token'

      store.logout()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
    })

    it('should show logout toast', () => {
      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')

      store.user = {
        id: '1',
        name: 'testuser',
        email: 'test@example.com',
        avatarUrl: 'https://example.com/pic.jpg',
        newsletter_subscribed: false,
        followers: [],
        following: [],
        followed_magazines: []
      }
      store.isAuthenticated = true

      store.logout()

      expect(showSpy).toHaveBeenCalledWith('You have been logged out.', 'info')
    })

    it('should work when already logged out', () => {
      const store = useAuthStore()

      expect(() => store.logout()).not.toThrow()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('Profile and Social Actions', () => {
    beforeEach(() => {
      const store = useAuthStore()
      store.user = {
        id: '1',
        name: 'test',
        email: 'test@test.com',
        avatarUrl: '',
        newsletter_subscribed: false,
        followers: [],
        following: [],
        followed_magazines: []
      }
      store.isAuthenticated = true
    })

    it('should update newsletter subscription', async () => {
      vi.mocked(apiServiceExtended.updateUserMe).mockResolvedValue({ newsletter_subscribed: true } as unknown as User)
      const store = useAuthStore()
      await store.updateNewsletterSubscription(true)
      expect(store.user?.newsletter_subscribed).toBe(true)
    })

    it('should update newsletter subscription to false', async () => {
      vi.mocked(apiServiceExtended.updateUserMe).mockResolvedValue({ newsletter_subscribed: false } as unknown as User)
      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')
      await store.updateNewsletterSubscription(false)
      expect(store.user?.newsletter_subscribed).toBe(false)
      expect(showSpy).toHaveBeenCalledWith('Unsubscribed from newsletter.', 'success')
    })

    it('should show default error on login failure without message', async () => {
      vi.mocked(apiService.login).mockRejectedValue({})
      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')
      await expect(store.login('u', 'p')).rejects.toBeDefined()
      expect(showSpy).toHaveBeenCalledWith('Login failed', 'error')
    })

    it('should show default error on Google login failure without message', async () => {
      vi.mocked(apiService.loginGoogle).mockRejectedValue({})
      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')
      await expect(store.loginWithGoogle('t')).rejects.toBeDefined()
      expect(showSpy).toHaveBeenCalledWith('Google login failed', 'error')
    })

    it('should show default error on signup failure without message', async () => {
      vi.mocked(apiService.signup).mockRejectedValue({})
      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')
      await expect(store.signup('u', 'e', 'p')).rejects.toBeDefined()
      expect(showSpy).toHaveBeenCalledWith('Signup failed', 'error')
    })

    it('should update profile with default avatar', async () => {
      vi.mocked(apiServiceExtended.updateUserMe).mockResolvedValue({
        username: 'newname',
        email: 'test@test.com',
        bio: 'newbio',
        profile_pic: null,
        newsletter_subscribed: false
      } as unknown as User)

      const store = useAuthStore()
      await store.updateProfile({ name: 'newname' })
      expect(store.user?.avatarUrl).toContain('unsplash.com')
    })

    it('should handle newsletter subscription failure', async () => {
      vi.mocked(apiServiceExtended.updateUserMe).mockRejectedValue(new Error('fail'))
      const store = useAuthStore()
      await expect(store.updateNewsletterSubscription(true)).rejects.toThrow()
    })

    it('should handle newsletter update when user is null', async () => {
      vi.mocked(apiServiceExtended.updateUserMe).mockResolvedValue({ newsletter_subscribed: true } as unknown as User)
      const store = useAuthStore()
      store.user = null
      await store.updateNewsletterSubscription(true)
      expect(store.user).toBeNull()
    })

    it('should update profile', async () => {
      vi.mocked(apiServiceExtended.updateUserMe).mockResolvedValue({
        username: 'newname',
        email: 'test@test.com',
        bio: 'newbio',
        profile_pic: 'newpic',
        newsletter_subscribed: false
      } as unknown as User)

      const store = useAuthStore()
      await store.updateProfile({ name: 'newname', bio: 'newbio' })
      
      expect(store.user?.name).toBe('newname')
      expect(store.user?.bio).toBe('newbio')
      expect(store.user?.avatarUrl).toBe('newpic')
    })

    it('should handle profile update failure', async () => {
      vi.mocked(apiServiceExtended.updateUserMe).mockRejectedValue(new Error('fail'))
      const store = useAuthStore()
      await expect(store.updateProfile({})).rejects.toThrow()
    })

    it('should handle profile update failure without message', async () => {
      vi.mocked(apiServiceExtended.updateUserMe).mockRejectedValue({})
      const store = useAuthStore()
      await expect(store.updateProfile({})).rejects.toBeDefined()
    })

    it('should handle profile update when user is null', async () => {
      vi.mocked(apiServiceExtended.updateUserMe).mockResolvedValue({ username: 'n' } as unknown as User)
      const store = useAuthStore()
      store.user = null
      await store.updateProfile({ name: 'n' })
      expect(store.user).toBeNull()
    })

    it('should trigger newsletter', async () => {
      const store = useAuthStore()
      await store.triggerNewsletter()
      expect(apiServiceExtended.triggerNewsletter).toHaveBeenCalled()
    })

    it('should handle trigger newsletter failure silently', async () => {
      vi.mocked(apiServiceExtended.triggerNewsletter).mockRejectedValue(new Error('fail'))
      const store = useAuthStore()
      await store.triggerNewsletter() // Should not throw because of try-catch in store
    })

    it('should follow and unfollow user', async () => {
      const store = useAuthStore()
      await store.followUser('user-2')
      expect(apiServiceExtended.followUser).toHaveBeenCalledWith('user-2')
      expect(store.user?.following).toContain('user-2')

      await store.unfollowUser('user-2')
      expect(apiServiceExtended.unfollowUser).toHaveBeenCalledWith('user-2')
      expect(store.user?.following).not.toContain('user-2')
    })

    it('should handle follow/unfollow user failure', async () => {
      vi.mocked(apiServiceExtended.followUser).mockRejectedValue(new Error('fail'))
      vi.mocked(apiServiceExtended.unfollowUser).mockRejectedValue(new Error('fail'))
      const store = useAuthStore()
      await expect(store.followUser('2')).rejects.toThrow()
      await expect(store.unfollowUser('2')).rejects.toThrow()
    })

    it('should handle follow user when user is null', async () => {
      const store = useAuthStore()
      store.user = null
      await store.followUser('2')
      expect(apiServiceExtended.followUser).toHaveBeenCalledWith('2')
    })

    it('should handle unfollow user when user is null', async () => {
      const store = useAuthStore()
      store.user = null
      await store.unfollowUser('2')
      expect(apiServiceExtended.unfollowUser).toHaveBeenCalledWith('2')
    })

    it('should NOT add duplicate follow user', async () => {
      const store = useAuthStore()
      store.user!.following = ['2']
      await store.followUser('2')
      expect(store.user!.following).toHaveLength(1)
    })

    it('should follow and unfollow magazine', async () => {
      const store = useAuthStore()
      await store.followMagazine('mag-1')
      expect(apiServiceExtended.followMagazine).toHaveBeenCalledWith('mag-1')
      expect(store.user?.followed_magazines).toContain('mag-1')

      await store.unfollowMagazine('mag-1')
      expect(apiServiceExtended.unfollowMagazine).toHaveBeenCalledWith('mag-1')
      expect(store.user?.followed_magazines).not.toContain('mag-1')
    })

    it('should handle follow/unfollow magazine failure', async () => {
      vi.mocked(apiServiceExtended.followMagazine).mockRejectedValue(new Error('fail'))
      vi.mocked(apiServiceExtended.unfollowMagazine).mockRejectedValue(new Error('fail'))
      const store = useAuthStore()
      await expect(store.followMagazine('1')).rejects.toThrow()
      await expect(store.unfollowMagazine('1')).rejects.toThrow()
    })

    it('should handle follow magazine when user is null', async () => {
      const store = useAuthStore()
      store.user = null
      await store.followMagazine('m')
      expect(apiServiceExtended.followMagazine).toHaveBeenCalledWith('m')
    })

    it('should handle unfollow magazine when user is null', async () => {
      const store = useAuthStore()
      store.user = null
      await store.unfollowMagazine('m')
      expect(apiServiceExtended.unfollowMagazine).toHaveBeenCalledWith('m')
    })

    it('should NOT add duplicate follow magazine', async () => {
      const store = useAuthStore()
      store.user!.followed_magazines = ['m']
      await store.followMagazine('m')
      expect(store.user!.followed_magazines).toHaveLength(1)
    })
  })
})
