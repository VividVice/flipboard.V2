import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ToastContainer from '../ToastContainer.vue'
import { useToastStore } from '../../stores/toast'

describe('ToastContainer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should render no toasts initially', () => {
    const wrapper = mount(ToastContainer)
    expect(wrapper.findAll('[class*="pointer-events-auto"]')).toHaveLength(0)
  })

  it('should render a success toast', async () => {
    const wrapper = mount(ToastContainer)
    const store = useToastStore()

    store.show('Test success message', 'success')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Test success message')
    expect(wrapper.find('.bg-flipboard-red').exists()).toBe(true)
  })

  it('should render an error toast', async () => {
    const wrapper = mount(ToastContainer)
    const store = useToastStore()

    store.show('Test error message', 'error')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Test error message')
    expect(wrapper.find('.bg-red-800').exists()).toBe(true)
  })

  it('should render an info toast', async () => {
    const wrapper = mount(ToastContainer)
    const store = useToastStore()

    store.show('Test info message', 'info')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Test info message')
    expect(wrapper.find('.bg-gray-800').exists()).toBe(true)
  })

  it('should render multiple toasts', async () => {
    const wrapper = mount(ToastContainer)
    const store = useToastStore()

    store.show('First message', 'success')
    store.show('Second message', 'error')
    store.show('Third message', 'info')
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('[class*="pointer-events-auto"]')).toHaveLength(3)
    expect(wrapper.text()).toContain('First message')
    expect(wrapper.text()).toContain('Second message')
    expect(wrapper.text()).toContain('Third message')
  })

  it('should remove toast when close button is clicked', async () => {
    const wrapper = mount(ToastContainer)
    const store = useToastStore()

    store.show('Test message', 'success')
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('[class*="pointer-events-auto"]')).toHaveLength(1)

    const closeButton = wrapper.find('button')
    await closeButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('[class*="pointer-events-auto"]')).toHaveLength(0)
  })

  it('should remove correct toast when multiple exist', async () => {
    const wrapper = mount(ToastContainer)
    const store = useToastStore()

    store.show('First message')
    store.show('Second message')
    store.show('Third message')
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('[class*="pointer-events-auto"]')).toHaveLength(3)

    const closeButtons = wrapper.findAll('button')
    await closeButtons[1].trigger('click') // Close second toast
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('[class*="pointer-events-auto"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('First message')
    expect(wrapper.text()).not.toContain('Second message')
    expect(wrapper.text()).toContain('Third message')
  })

  it('should have correct positioning classes', () => {
    const wrapper = mount(ToastContainer)
    const container = wrapper.find('.fixed')

    expect(container.classes()).toContain('bottom-5')
    expect(container.classes()).toContain('right-5')
    expect(container.classes()).toContain('z-[100]')
  })

  it('should render close icon SVG', async () => {
    const wrapper = mount(ToastContainer)
    const store = useToastStore()

    store.show('Test message')
    await wrapper.vm.$nextTick()

    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('viewBox')).toBe('0 0 24 24')
  })
})
