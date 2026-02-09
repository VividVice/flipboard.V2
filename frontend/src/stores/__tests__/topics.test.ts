import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTopicStore } from '../topics'
import { useToastStore } from '../toast'
import { apiServiceExtended, type Topic } from '../../services/api'

vi.mock('../../services/api', () => ({
  apiServiceExtended: {
    getTopics: vi.fn(),
    getFollowedTopics: vi.fn(),
    followTopic: vi.fn(),
    bulkFollowTopics: vi.fn(),
  },
}))

describe('Topic Store', () => {
  const mockTopic: Topic = {
    id: '1',
    name: 'Technology',
    description: 'All about tech',
    imageUrl: 'https://example.com/tech.jpg',
  }

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const store = useTopicStore()
      expect(store.topics).toEqual([])
      expect(store.followedTopics).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('Getters', () => {
    describe('followedCount', () => {
      it('should return the count of followed topics', () => {
        const store = useTopicStore()
        store.followedTopics = [
          mockTopic,
          { ...mockTopic, id: '2' },
          { ...mockTopic, id: '3' },
        ]

        expect(store.followedCount).toBe(3)
      })

      it('should return 0 when no topics are followed', () => {
        const store = useTopicStore()
        expect(store.followedCount).toBe(0)
      })
    })

    describe('isTopicFollowed', () => {
      it('should return true if topic is followed', () => {
        const store = useTopicStore()
        store.followedTopics = [mockTopic]

        expect(store.isTopicFollowed('1')).toBe(true)
      })

      it('should return false if topic is not followed', () => {
        const store = useTopicStore()
        store.followedTopics = [mockTopic]

        expect(store.isTopicFollowed('999')).toBe(false)
      })

      it('should return false when no topics are followed', () => {
        const store = useTopicStore()
        expect(store.isTopicFollowed('1')).toBe(false)
      })
    })
  })

  describe('Actions', () => {
    describe('fetchTopics()', () => {
      it('should fetch and store topics', async () => {
        const mockTopics = [
          mockTopic,
          { ...mockTopic, id: '2', name: 'Science' },
        ]
        vi.mocked(apiServiceExtended.getTopics).mockResolvedValue(mockTopics)

        const store = useTopicStore()
        await store.fetchTopics()

        expect(store.topics).toEqual(mockTopics)
        expect(store.loading).toBe(false)
        expect(store.error).toBeNull()
      })

      it('should set loading state', async () => {
        vi.mocked(apiServiceExtended.getTopics).mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
        )

        const store = useTopicStore()
        const promise = store.fetchTopics()

        expect(store.loading).toBe(true)

        await promise
        expect(store.loading).toBe(false)
      })

      it('should handle errors', async () => {
        vi.mocked(apiServiceExtended.getTopics).mockRejectedValue(
          new Error('Network error')
        )

        const store = useTopicStore()
        await store.fetchTopics()

        expect(store.error).toBe('Network error')
        expect(store.loading).toBe(false)
      })

      it('should use default error message when error has no message', async () => {
        vi.mocked(apiServiceExtended.getTopics).mockRejectedValue({})
        const store = useTopicStore()
        await store.fetchTopics()
        expect(store.error).toBe('Failed to fetch topics')
      })
    })

    describe('fetchFollowedTopics()', () => {
      it('should fetch and store followed topics', async () => {
        const followedTopics = [mockTopic]
        vi.mocked(apiServiceExtended.getFollowedTopics).mockResolvedValue(followedTopics)

        const store = useTopicStore()
        await store.fetchFollowedTopics()

        expect(store.followedTopics).toEqual(followedTopics)
        expect(store.loading).toBe(false)
      })

      it('should handle errors', async () => {
        vi.mocked(apiServiceExtended.getFollowedTopics).mockRejectedValue(
          new Error('Failed to fetch')
        )

        const store = useTopicStore()
        await store.fetchFollowedTopics()

        expect(store.error).toBe('Failed to fetch')
      })

      it('should use default error message when error has no message', async () => {
        vi.mocked(apiServiceExtended.getFollowedTopics).mockRejectedValue({})
        const store = useTopicStore()
        await store.fetchFollowedTopics()
        expect(store.error).toBe('Failed to fetch followed topics')
      })
    })

    describe('toggleFollow()', () => {
      it('should follow a topic', async () => {
        vi.mocked(apiServiceExtended.followTopic).mockResolvedValue(undefined)

        const store = useTopicStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        store.topics = [mockTopic]
        store.followedTopics = []

        await store.toggleFollow('1')

        expect(store.followedTopics).toHaveLength(1)
        expect(store.followedTopics[0].id).toBe('1')
        expect(showSpy).toHaveBeenCalledWith('Following Technology')
      })

      it('should unfollow a topic', async () => {
        vi.mocked(apiServiceExtended.followTopic).mockResolvedValue(undefined)

        const store = useTopicStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        store.topics = [mockTopic]
        store.followedTopics = [mockTopic]

        await store.toggleFollow('1')

        expect(store.followedTopics).toHaveLength(0)
        expect(showSpy).toHaveBeenCalledWith('Unfollowed Technology', 'info')
      })

      it('should do nothing if topic not found', async () => {
        const store = useTopicStore()
        store.topics = []

        await store.toggleFollow('999')

        expect(apiServiceExtended.followTopic).not.toHaveBeenCalled()
      })

      it('should show error toast on failure', async () => {
        vi.mocked(apiServiceExtended.followTopic).mockRejectedValue(
          new Error('Failed to toggle')
        )

        const store = useTopicStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        store.topics = [mockTopic]

        await store.toggleFollow('1')

        expect(showSpy).toHaveBeenCalledWith('Failed to toggle', 'error')
      })

      it('should use default error message on failure', async () => {
        vi.mocked(apiServiceExtended.followTopic).mockRejectedValue({})
        const store = useTopicStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')
        store.topics = [mockTopic]
        await store.toggleFollow('1')
        expect(showSpy).toHaveBeenCalledWith('Failed to toggle topic', 'error')
      })
    })

    describe('bulkFollow()', () => {
      it('should follow multiple topics at once', async () => {
        vi.mocked(apiServiceExtended.bulkFollowTopics).mockResolvedValue(undefined)
        vi.mocked(apiServiceExtended.getFollowedTopics).mockResolvedValue([
          mockTopic,
          { ...mockTopic, id: '2' },
        ])

        const store = useTopicStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        await store.bulkFollow(['1', '2'])

        expect(apiServiceExtended.bulkFollowTopics).toHaveBeenCalledWith(['1', '2'])
        expect(apiServiceExtended.getFollowedTopics).toHaveBeenCalled()
        expect(showSpy).toHaveBeenCalledWith('Following 2 topics')
      })

      it('should show error toast on failure', async () => {
        vi.mocked(apiServiceExtended.bulkFollowTopics).mockRejectedValue(
          new Error('Bulk follow failed')
        )

        const store = useTopicStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')

        await store.bulkFollow(['1', '2', '3'])

        expect(showSpy).toHaveBeenCalledWith('Bulk follow failed', 'error')
      })

      it('should use default error message on failure', async () => {
        vi.mocked(apiServiceExtended.bulkFollowTopics).mockRejectedValue({})
        const store = useTopicStore()
        const toastStore = useToastStore()
        const showSpy = vi.spyOn(toastStore, 'show')
        await store.bulkFollow(['1'])
        expect(showSpy).toHaveBeenCalledWith('Failed to follow topics', 'error')
      })
    })

    describe('toggleSelection()', () => {
      it('should add topic to followed topics', () => {
        const store = useTopicStore()
        store.topics = [mockTopic]
        store.followedTopics = []

        store.toggleSelection('1')

        expect(store.followedTopics).toHaveLength(1)
        expect(store.followedTopics[0].id).toBe('1')
      })

      it('should remove topic from followed topics', () => {
        const store = useTopicStore()
        store.topics = [mockTopic]
        store.followedTopics = [mockTopic]

        store.toggleSelection('1')

        expect(store.followedTopics).toHaveLength(0)
      })

      it('should do nothing if topic not found', () => {
        const store = useTopicStore()
        store.topics = [mockTopic]
        store.followedTopics = []

        store.toggleSelection('999')

        expect(store.followedTopics).toHaveLength(0)
      })

      it('should toggle multiple topics independently', () => {
        const store = useTopicStore()
        store.topics = [
          mockTopic,
          { ...mockTopic, id: '2', name: 'Science' },
          { ...mockTopic, id: '3', name: 'Art' },
        ]
        store.followedTopics = []

        store.toggleSelection('1')
        store.toggleSelection('2')
        store.toggleSelection('3')

        expect(store.followedTopics).toHaveLength(3)

        store.toggleSelection('2')
        expect(store.followedTopics).toHaveLength(2)
        expect(store.followedTopics.some((t) => t.id === '2')).toBe(false)
      })
    })
  })
})
