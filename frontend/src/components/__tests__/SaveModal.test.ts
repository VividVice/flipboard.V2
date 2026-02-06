import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SaveModal from '../SaveModal.vue'
import { useMagazineStore } from '../../stores/magazines'
import { useToastStore } from '../../stores/toast'

// Mock the API service
vi.mock('../../services/api', () => ({
  apiServiceExtended: {
    importArticle: vi.fn().mockResolvedValue({ id: 'imported-article-id' }),
  },
}))

const mockArticle = {
  id: 'article-1',
  title: 'Test Article',
  excerpt: 'Test excerpt',
}

const mockMagazines = [
  { id: 'mag-1', name: 'Magazine One', article_ids: ['a1', 'a2'] },
  { id: 'mag-2', name: 'Magazine Two', article_ids: [] },
]

describe('SaveModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should not render when closed', () => {
    const wrapper = mount(SaveModal, {
      props: {
        isOpen: false,
        articleData: mockArticle,
      },
    })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('should render when open', () => {
    const wrapper = mount(SaveModal, {
      props: {
        isOpen: true,
        articleData: mockArticle,
      },
    })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Save to Magazine')
  })

  it('should display existing magazines', async () => {
    const magazineStore = useMagazineStore()
    magazineStore.magazines = mockMagazines

    const wrapper = mount(SaveModal, {
      props: {
        isOpen: true,
        articleData: mockArticle,
      },
    })

    expect(wrapper.text()).toContain('Magazine One')
    expect(wrapper.text()).toContain('Magazine Two')
    expect(wrapper.text()).toContain('2 stories')
    expect(wrapper.text()).toContain('0 stories')
  })

  it('should show empty state when no magazines', () => {
    const magazineStore = useMagazineStore()
    magazineStore.magazines = []

    const wrapper = mount(SaveModal, {
      props: {
        isOpen: true,
        articleData: mockArticle,
      },
    })

    expect(wrapper.text()).toContain('No magazines found')
  })

  it('should emit close when cancel button is clicked', async () => {
    const wrapper = mount(SaveModal, {
      props: {
        isOpen: true,
        articleData: mockArticle,
      },
    })

    const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel')
    await cancelButton?.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should emit close when overlay is clicked', async () => {
    const wrapper = mount(SaveModal, {
      props: {
        isOpen: true,
        articleData: mockArticle,
      },
    })

    const overlay = wrapper.find('[aria-hidden="true"]')
    await overlay.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should show create magazine input when button is clicked', async () => {
    const wrapper = mount(SaveModal, {
      props: {
        isOpen: true,
        articleData: mockArticle,
      },
    })

    expect(wrapper.find('input[placeholder="Magazine Name"]').exists()).toBe(false)

    const createButton = wrapper.findAll('button').find((btn) => btn.text().includes('Create New Magazine'))
    await createButton?.trigger('click')

    expect(wrapper.find('input[placeholder="Magazine Name"]').exists()).toBe(true)
  })

  it('should call saveToMagazine when magazine is selected', async () => {
    const magazineStore = useMagazineStore()
    magazineStore.magazines = mockMagazines
    const addToMagazineSpy = vi.spyOn(magazineStore, 'addToMagazine').mockResolvedValue(undefined)

    const toastStore = useToastStore()
    const showToastSpy = vi.spyOn(toastStore, 'show')

    const wrapper = mount(SaveModal, {
      props: {
        isOpen: true,
        articleData: mockArticle,
        shouldImport: false,
      },
    })

    const magazineButton = wrapper.findAll('button').find((btn) => btn.text().includes('Magazine One'))
    await magazineButton?.trigger('click')

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(addToMagazineSpy).toHaveBeenCalledWith('mag-1', 'article-1')
    expect(showToastSpy).toHaveBeenCalledWith('Saved to magazine')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should import article before saving when shouldImport is true', async () => {
    const { apiServiceExtended } = await import('../../services/api')

    const magazineStore = useMagazineStore()
    magazineStore.magazines = mockMagazines
    const addToMagazineSpy = vi.spyOn(magazineStore, 'addToMagazine').mockResolvedValue(undefined)

    const wrapper = mount(SaveModal, {
      props: {
        isOpen: true,
        articleData: mockArticle,
        shouldImport: true,
      },
    })

    const magazineButton = wrapper.findAll('button').find((btn) => btn.text().includes('Magazine One'))
    await magazineButton?.trigger('click')

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(apiServiceExtended.importArticle).toHaveBeenCalledWith(mockArticle)
    expect(addToMagazineSpy).toHaveBeenCalledWith('mag-1', 'imported-article-id')
  })

  it('should create new magazine and save article', async () => {
    const magazineStore = useMagazineStore()
    magazineStore.magazines = []
    const createMagazineSpy = vi.spyOn(magazineStore, 'createMagazine').mockResolvedValue({
      id: 'new-mag-id',
      name: 'New Magazine',
      article_ids: [],
    })
    const addToMagazineSpy = vi.spyOn(magazineStore, 'addToMagazine').mockResolvedValue(undefined)

    const wrapper = mount(SaveModal, {
      props: {
        isOpen: true,
        articleData: mockArticle,
        shouldImport: false,
      },
    })

    // Show create input
    const createButton = wrapper.findAll('button').find((btn) => btn.text().includes('Create New Magazine'))
    await createButton?.trigger('click')

    // Enter magazine name
    const input = wrapper.find('input[placeholder="Magazine Name"]')
    await input.setValue('New Magazine')

    // Click create button
    const submitButton = wrapper.findAll('button').find((btn) => btn.text() === 'Create')
    await submitButton?.trigger('click')

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(createMagazineSpy).toHaveBeenCalledWith('New Magazine')
    expect(addToMagazineSpy).toHaveBeenCalledWith('new-mag-id', 'article-1')
  })

  it('should create magazine on Enter key press', async () => {
    const magazineStore = useMagazineStore()
    magazineStore.magazines = []
    const createMagazineSpy = vi.spyOn(magazineStore, 'createMagazine').mockResolvedValue({
      id: 'new-mag-id',
      name: 'New Magazine',
      article_ids: [],
    })
    vi.spyOn(magazineStore, 'addToMagazine').mockResolvedValue(undefined)

    const wrapper = mount(SaveModal, {
      props: {
        isOpen: true,
        articleData: mockArticle,
        shouldImport: false,
      },
    })

    // Show create input
    const createButton = wrapper.findAll('button').find((btn) => btn.text().includes('Create New Magazine'))
    await createButton?.trigger('click')

    // Enter magazine name and press Enter
    const input = wrapper.find('input[placeholder="Magazine Name"]')
    await input.setValue('New Magazine')
    await input.trigger('keyup.enter')

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(createMagazineSpy).toHaveBeenCalledWith('New Magazine')
  })

  it('should not create magazine with empty name', async () => {
    const magazineStore = useMagazineStore()
    magazineStore.magazines = []
    const createMagazineSpy = vi.spyOn(magazineStore, 'createMagazine')

    const wrapper = mount(SaveModal, {
      props: {
        isOpen: true,
        articleData: mockArticle,
      },
    })

    // Show create input
    const createButton = wrapper.findAll('button').find((btn) => btn.text().includes('Create New Magazine'))
    await createButton?.trigger('click')

    // Enter empty name
    const input = wrapper.find('input[placeholder="Magazine Name"]')
    await input.setValue('   ')

    // Click create button
    const submitButton = wrapper.findAll('button').find((btn) => btn.text() === 'Create')
    await submitButton?.trigger('click')

    expect(createMagazineSpy).not.toHaveBeenCalled()
  })

  it('should show toast error when save fails', async () => {
    const magazineStore = useMagazineStore()
    magazineStore.magazines = mockMagazines
    vi.spyOn(magazineStore, 'addToMagazine').mockRejectedValue(new Error('Save failed'))

    const toastStore = useToastStore()
    const showToastSpy = vi.spyOn(toastStore, 'show')

    const wrapper = mount(SaveModal, {
      props: {
        isOpen: true,
        articleData: mockArticle,
        shouldImport: false,
      },
    })

    const magazineButton = wrapper.findAll('button').find((btn) => btn.text().includes('Magazine One'))
    await magazineButton?.trigger('click')

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(showToastSpy).toHaveBeenCalledWith('Failed to save to magazine')
  })

  it('should disable buttons while saving', async () => {
    const magazineStore = useMagazineStore()
    magazineStore.magazines = mockMagazines

    // Make addToMagazine take some time
    vi.spyOn(magazineStore, 'addToMagazine').mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    const wrapper = mount(SaveModal, {
      props: {
        isOpen: true,
        articleData: mockArticle,
        shouldImport: false,
      },
    })

    const magazineButton = wrapper.findAll('button').find((btn) => btn.text().includes('Magazine One'))
    await magazineButton?.trigger('click')

    // Check that isSaving is true during the operation
    expect(wrapper.vm.isSaving).toBe(true)
  })
})
