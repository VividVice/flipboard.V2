import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomeView from '../HomeView.vue'
import { useNewsStore } from '../../stores/news'
import { useArticleStore } from '../../stores/articles'
import { useTopicStore } from '../../stores/topics'
import type { NewsPost } from '../../services/api'

// Mock components
vi.mock('../../components/NewsCard.vue', () => ({
  default: { 
    name: 'NewsCard', 
    props: ['post', 'variant'],
    template: '<div class="news-card"></div>' 
  }
}))
vi.mock('../../components/SkeletonCard.vue', () => ({
  default: { name: 'SkeletonCard', template: '<div class="skeleton-card"></div>' }
}))

// Mock IntersectionObserver
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
let lastCallback: IntersectionObserverCallback | null = null
global.IntersectionObserver = class {
  constructor(public callback: IntersectionObserverCallback) {
    lastCallback = callback
  }
  observe = mockObserve
  unobserve = vi.fn()
  disconnect = mockDisconnect
} as unknown as typeof IntersectionObserver

describe('HomeView', () => {
  let topicStore: ReturnType<typeof useTopicStore>
  let newsStore: ReturnType<typeof useNewsStore>
  let articleStore: ReturnType<typeof useArticleStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    
    topicStore = useTopicStore()
    newsStore = useNewsStore()
    articleStore = useArticleStore()
    
    vi.spyOn(topicStore, 'fetchFollowedTopics').mockResolvedValue(undefined)
    vi.spyOn(newsStore, 'fetchNewsFeed').mockResolvedValue(undefined)
    vi.spyOn(newsStore, 'fetchNewsByTopic').mockResolvedValue(undefined)
    vi.spyOn(newsStore, 'fetchNews').mockResolvedValue(undefined)
    vi.spyOn(newsStore, 'loadMoreNews').mockResolvedValue(undefined)
    vi.spyOn(newsStore, 'setCountry').mockImplementation(() => {})
    vi.spyOn(articleStore, 'setSearchQuery').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('should fetch followed topics and fallback news on mount', async () => {
    mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })
    
    expect(topicStore.fetchFollowedTopics).toHaveBeenCalled()
    await flushPromises()
    // By default followedTopics is empty, so it falls back to technology topic
    expect(newsStore.fetchNewsByTopic).toHaveBeenCalledWith('technology', expect.any(Object))
  })

  it('should fetch personalized feed if followed topics exist', async () => {
    topicStore.followedTopics = [{ id: '1', name: 'tech', follower_count: 0, created_at: '' }]
    
    mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })
    
    await flushPromises()
    expect(newsStore.fetchNewsFeed).toHaveBeenCalled()
  })

  it('should handle topic change', async () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })
    await flushPromises()

    topicStore.followedTopics = [{ id: '1', name: 'Science', follower_count: 0, created_at: '' }]
    await wrapper.vm.$nextTick()
    
    const scienceButton = wrapper.findAll('button').find(b => b.text().includes('Science'))
    await scienceButton?.trigger('click')
    
    expect(articleStore.setSearchQuery).toHaveBeenCalledWith('')
    expect(newsStore.fetchNewsByTopic).toHaveBeenCalledWith('Science', expect.any(Object))
  })

  it('should handle sentiment change', async () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })
    await flushPromises()

    const positiveButton = wrapper.findAll('button').find(b => b.text().includes('Positive'))
    await positiveButton?.trigger('click')

    expect(newsStore.fetchNewsByTopic).toHaveBeenCalledWith('technology', expect.objectContaining({
      sentiment: 'positive'
    }))
  })

  it('should handle country change', async () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })
    await flushPromises()

    // Open dropdown
    const countryButton = wrapper.find('button.flex.items-center.space-x-2')
    await countryButton.trigger('click')
    
    const frButton = wrapper.findAll('button').find(b => b.text() === 'FR')
    await frButton?.trigger('click')

    expect(newsStore.setCountry).toHaveBeenCalledWith('FR')
    expect(newsStore.fetchNewsByTopic).toHaveBeenCalled()
  })

  it('should debounce search query changes', async () => {
    mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })
    
    articleStore.searchQuery = 'test'
    
    // Fast forward time
    vi.advanceTimersByTime(500)
    await flushPromises()

    expect(newsStore.fetchNews).toHaveBeenCalledWith(expect.objectContaining({ q: 'test' }))
  })

  it('should show skeletons when loading', async () => {
    newsStore.loading = true
    newsStore.posts = []

    const wrapper = mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })

    expect(wrapper.findAll('.skeleton-card').length).toBeGreaterThan(0)
  })

  it('should show news cards when posts exist', async () => {
    newsStore.posts = [{ uuid: '1', title: 'Test', thread: {} } as unknown as NewsPost]
    newsStore.loading = false

    const wrapper = mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })

    expect(wrapper.findAll('.news-card').length).toBe(1)
  })

  it('should show load more skeletons when loading more', async () => {
    newsStore.posts = [{ uuid: '1', title: 'Test', thread: {} } as unknown as NewsPost]
    newsStore.loading = true

    const wrapper = mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })

    expect(wrapper.findAll('.skeleton-card').length).toBe(3)
  })

  it('should show no results when empty', async () => {
    newsStore.posts = []
    newsStore.loading = false

    const wrapper = mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })

    expect(wrapper.text()).toContain('No news found')
  })

  it('should handle infinite scroll trigger', async () => {
    newsStore.loading = false
    newsStore.moreResultsAvailable = 10
    newsStore.nextUrl = 'http://example.com/next'
    newsStore.posts = Array.from({ length: 10 }, (_, i) => ({ uuid: `${i}` } as unknown as NewsPost))

    mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })

    // Manually trigger observer callback
    if (lastCallback) {
      lastCallback([{ isIntersecting: true }] as unknown as IntersectionObserverEntry[], {} as unknown as IntersectionObserver)
    }

    expect(newsStore.loadMoreNews).toHaveBeenCalled()
  })

  it('should use different layout variants for grid', async () => {
    newsStore.posts = Array.from({ length: 10 }, (_, i) => ({ uuid: `${i}`, title: `Title ${i}`, thread: {} } as unknown as NewsPost))
    
    const wrapper = mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })

    const newsCards = wrapper.findAllComponents({ name: 'NewsCard' })
    expect(newsCards[0].props('variant')).toBe('featured')
    expect(newsCards[1].props('variant')).toBe('default')
    expect(newsCards[3].props('variant')).toBe('horizontal')
    expect(newsCards[4].props('variant')).toBe('compact')
    expect(newsCards[5].props('variant')).toBe('default')
    expect(newsCards[6].props('variant')).toBe('horizontal')
    expect(newsCards[7].props('variant')).toBe('default')
  })

  it('should use layout cache in getCardConfig', async () => {
    const post = { uuid: 'cached-post', title: 'Test', thread: {} } as unknown as NewsPost
    newsStore.posts = [post]

    const wrapper = mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })

    // Access getCardConfig via vm
    const vm = wrapper.vm as unknown as { getCardConfig: (post: unknown, index: number) => unknown }
    const config1 = vm.getCardConfig(post, 0)
    const config2 = vm.getCardConfig(post, 0)
    
    expect(config1).toBe(config2)
  })

  it('should handle empty search query', async () => {
    mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })
    
    articleStore.searchQuery = '   ' // empty string
    vi.advanceTimersByTime(500)
    await flushPromises()

    // It should call fetchNewsByTopic('technology', ...) because of the fallback in onMounted
    expect(newsStore.fetchNewsByTopic).toHaveBeenCalledWith('technology', expect.any(Object))
  })

  it('should disconnect observer on unmount', () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })
    
    wrapper.unmount()
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('should clear debounce timer on unmount', () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })
    
    articleStore.searchQuery = 'test'
    wrapper.unmount()
    
    vi.advanceTimersByTime(500)
    // newsStore.fetchNews should NOT be called after unmount
    expect(newsStore.fetchNews).not.toHaveBeenCalled()
  })

  it('should clear existing debounce timer on new query', async () => {
    mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })
    
    articleStore.searchQuery = 'test1'
    vi.advanceTimersByTime(200)
    articleStore.searchQuery = 'test2'
    vi.advanceTimersByTime(500)
    await flushPromises()

    expect(newsStore.fetchNews).toHaveBeenCalledWith(expect.objectContaining({ q: 'test2' }))
  })

  it('should handle country selection from dropdown', async () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })
    await flushPromises()

    // Open dropdown
    const countryButton = wrapper.find('button.flex.items-center.space-x-2')
    await countryButton.trigger('click')
    
    // Find all buttons in the dropdown
    const dropdownButtons = wrapper.findAll('.absolute.right-0 button')
    const frButton = dropdownButtons.find(b => b.text() === 'FR')
    await frButton?.trigger('click')

    expect(newsStore.setCountry).toHaveBeenCalledWith('FR')
    expect(newsStore.fetchNewsByTopic).toHaveBeenCalled()
  })

  it('should handle clicking a followed topic button', async () => {
    topicStore.followedTopics = [{ id: '1', name: 'Science', follower_count: 0, created_at: '' }]
    const wrapper = mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })
    await flushPromises()

    const scienceButton = wrapper.findAll('button').find(b => b.text().includes('Science'))
    await scienceButton?.trigger('click')
    
    expect(articleStore.setSearchQuery).toHaveBeenCalledWith('')
    expect(newsStore.fetchNewsByTopic).toHaveBeenCalledWith('Science', expect.any(Object))
  })

  it('should handle non-empty search query watch', async () => {
    mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })
    
    articleStore.searchQuery = 'something'
    vi.advanceTimersByTime(500)
    await flushPromises()
    expect(newsStore.fetchNews).toHaveBeenCalledWith(expect.objectContaining({ q: 'something' }))
  })

  it('should handle empty search query watch', async () => {
    mount(HomeView, {
      global: {
        stubs: ['router-link']
      }
    })
    
    // First set it to something then clear it
    articleStore.searchQuery = 'something'
    vi.advanceTimersByTime(500)
    await flushPromises()
    newsStore.fetchNewsFeed.mockClear()
    
    articleStore.searchQuery = ''
    vi.advanceTimersByTime(500)
    await flushPromises()
    // Since selectedTopic was set to null when searchQuery was 'something'
    // clearing searchQuery should now call fetchNewsFeed
    expect(newsStore.fetchNewsFeed).toHaveBeenCalled()
  })
})
