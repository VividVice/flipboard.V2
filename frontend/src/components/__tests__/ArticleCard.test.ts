import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ArticleCard from '../ArticleCard.vue'
import { useArticleStore } from '../../stores/articles'

// Mock SaveModal component
vi.mock('../SaveModal.vue', () => ({
  default: {
    name: 'SaveModal',
    template: '<div class="save-modal-mock"></div>',
  },
}))

const mockArticle = {
  id: '1',
  title: 'Test Article Title',
  excerpt: 'This is a test article excerpt',
  image_url: 'https://example.com/image.jpg',
  publisher: 'TestPublisher',
  author: 'Test Author',
  liked: false,
  saved: false,
}

describe('ArticleCard', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/article/:id', component: { template: '<div>Article</div>' } },
      ],
    })
  })

  it('should render article information correctly', () => {
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Test Article Title')
    expect(wrapper.text()).toContain('This is a test article excerpt')
    expect(wrapper.text()).toContain('TestPublisher')
  })

  it('should display article image', () => {
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe('https://example.com/image.jpg')
    expect(img.attributes('alt')).toBe('Test Article Title')
  })

  it('should use default image when image_url is not provided', () => {
    const articleWithoutImage = { ...mockArticle, image_url: undefined }

    const wrapper = mount(ArticleCard, {
      props: {
        article: articleWithoutImage,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    const img = wrapper.find('img')
    expect(img.attributes('src')).toContain('unsplash.com')
  })

  it('should display publisher initial', () => {
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.text()).toContain('T') // First letter of TestPublisher
  })

  it('should call toggleLike when like button is clicked', async () => {
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    const store = useArticleStore()
    const toggleLikeSpy = vi.spyOn(store, 'toggleLike')

    const likeButtons = wrapper.findAll('button')
    const likeButton = likeButtons[0] // First button is the like button

    await likeButton.trigger('click')

    expect(toggleLikeSpy).toHaveBeenCalledWith('1')
  })

  it('should show filled heart when article is liked', () => {
    const likedArticle = { ...mockArticle, liked: true }

    const wrapper = mount(ArticleCard, {
      props: {
        article: likedArticle,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    const allSvgs = wrapper.findAll('svg')
    const heartSvg = allSvgs.find(svg => svg.attributes('viewBox') === '0 0 24 24' && svg.attributes('fill') === 'currentColor')
    expect(heartSvg).toBeDefined()
    expect(heartSvg?.attributes('fill')).toBe('currentColor')
  })

  it('should show outlined heart when article is not liked', () => {
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    const heartSvg = wrapper.findAll('svg')[1] // Second SVG is the heart icon
    expect(heartSvg.attributes('fill')).toBe('none')
  })

  it('should call toggleSave when save button is clicked', async () => {
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    const store = useArticleStore()
    const toggleSaveSpy = vi.spyOn(store, 'toggleSave')

    const buttons = wrapper.findAll('button')
    const saveButton = buttons[buttons.length - 1] // Last button is the save button

    await saveButton.trigger('click')

    expect(toggleSaveSpy).toHaveBeenCalledWith('1')
  })

  it('should show filled bookmark when article is saved', () => {
    const savedArticle = { ...mockArticle, saved: true }

    const wrapper = mount(ArticleCard, {
      props: {
        article: savedArticle,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    const bookmarkSvg = wrapper.findAll('svg').at(-1) // Last SVG is the bookmark
    expect(bookmarkSvg?.attributes('fill')).toBe('currentColor')
  })

  it('should open save modal when add button is clicked', async () => {
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    const buttons = wrapper.findAll('button')
    const addButton = buttons[buttons.length - 2] // Second to last button is the add button

    expect(wrapper.vm.isSaveModalOpen).toBe(false)

    await addButton.trigger('click')

    expect(wrapper.vm.isSaveModalOpen).toBe(true)
  })

  it('should prevent event propagation on button clicks', async () => {
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    const cardClickHandler = vi.fn()
    wrapper.element.addEventListener('click', cardClickHandler)

    const likeButton = wrapper.findAll('button')[0]
    await likeButton.trigger('click')

    // The card click handler should not be called due to stopPropagation
    expect(cardClickHandler).not.toHaveBeenCalled()
  })

  it('should have hover effects', () => {
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    const card = wrapper.find('.group')
    expect(card.classes()).toContain('hover:bg-gray-800')
  })

  it('should link to article detail page', () => {
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    })

    const links = wrapper.findAllComponents({ name: 'RouterLink' })
    expect(links.length).toBeGreaterThan(0)
    expect(links[0].props('to')).toBe('/article/1')
  })
})
