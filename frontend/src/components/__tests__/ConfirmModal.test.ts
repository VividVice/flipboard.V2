import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ConfirmModal from '../ConfirmModal.vue'

describe('ConfirmModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should not render when closed', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: false,
        title: 'Test Title',
        message: 'Test message',
      },
    })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('should render when open', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Test Title',
        message: 'Test message',
      },
    })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('should display title', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Delete Item',
        message: 'Are you sure?',
      },
    })

    expect(wrapper.text()).toContain('Delete Item')
  })

  it('should display message', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Delete Item',
        message: 'Are you sure you want to delete this item?',
      },
    })

    expect(wrapper.text()).toContain('Are you sure you want to delete this item?')
  })

  it('should display default button text', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Test',
        message: 'Test message',
      },
    })

    expect(wrapper.text()).toContain('Confirm')
    expect(wrapper.text()).toContain('Cancel')
  })

  it('should display custom button text', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Test',
        message: 'Test message',
        confirmText: 'Delete',
        cancelText: 'Keep',
      },
    })

    expect(wrapper.text()).toContain('Delete')
    expect(wrapper.text()).toContain('Keep')
  })

  it('should emit confirm when confirm button is clicked', async () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Test',
        message: 'Test message',
      },
    })

    const confirmButton = wrapper.findAll('button').find((btn) => btn.text() === 'Confirm')
    await confirmButton?.trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.emitted('confirm')?.length).toBe(1)
  })

  it('should emit cancel when cancel button is clicked', async () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Test',
        message: 'Test message',
      },
    })

    const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel')
    await cancelButton?.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('cancel')?.length).toBe(1)
  })

  it('should emit cancel when overlay is clicked', async () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Test',
        message: 'Test message',
      },
    })

    const overlay = wrapper.find('[aria-hidden="true"]')
    await overlay.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('should apply default confirm button class', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Test',
        message: 'Test message',
      },
    })

    const confirmButton = wrapper.findAll('button').find((btn) => btn.text() === 'Confirm')
    expect(confirmButton?.classes()).toContain('bg-flipboard-red')
    expect(confirmButton?.classes()).toContain('hover:bg-red-700')
  })

  it('should apply custom confirm button class', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Test',
        message: 'Test message',
        confirmButtonClass: 'bg-blue-500 hover:bg-blue-700',
      },
    })

    const confirmButton = wrapper.findAll('button').find((btn) => btn.text() === 'Confirm')
    expect(confirmButton?.classes()).toContain('bg-blue-500')
    expect(confirmButton?.classes()).toContain('hover:bg-blue-700')
  })

  it('should have warning icon', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Test',
        message: 'Test message',
      },
    })

    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.classes()).toContain('text-flipboard-red')
  })

  it('should have proper ARIA attributes', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Test',
        message: 'Test message',
      },
    })

    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(dialog.attributes('aria-labelledby')).toBe('modal-title')
  })

  it('should have modal title with correct id', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Test Title',
        message: 'Test message',
      },
    })

    const title = wrapper.find('#modal-title')
    expect(title.exists()).toBe(true)
    expect(title.text()).toBe('Test Title')
  })

  it('should have backdrop blur effect on overlay', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Test',
        message: 'Test message',
      },
    })

    const overlay = wrapper.find('[aria-hidden="true"]')
    expect(overlay.classes()).toContain('backdrop-blur-sm')
  })

  it('should not emit multiple events on single click', async () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Test',
        message: 'Test message',
      },
    })

    const confirmButton = wrapper.findAll('button').find((btn) => btn.text() === 'Confirm')
    await confirmButton?.trigger('click')
    await confirmButton?.trigger('click')

    expect(wrapper.emitted('confirm')?.length).toBe(2)
  })

  it('should work with custom confirmText and cancelText', async () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        isOpen: true,
        title: 'Delete Comment',
        message: 'This action cannot be undone.',
        confirmText: 'Yes, Delete',
        cancelText: 'No, Keep It',
      },
    })

    const confirmButton = wrapper.findAll('button').find((btn) => btn.text() === 'Yes, Delete')
    const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'No, Keep It')

    expect(confirmButton).toBeDefined()
    expect(cancelButton).toBeDefined()

    await confirmButton?.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })
})
