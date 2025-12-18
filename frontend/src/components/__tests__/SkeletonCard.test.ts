import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkeletonCard from '../SkeletonCard.vue'

describe('SkeletonCard', () => {
  it('should render correctly', () => {
    const wrapper = mount(SkeletonCard)
    expect(wrapper.exists()).toBe(true)
  })

  it('should have animate-pulse class', () => {
    const wrapper = mount(SkeletonCard)
    const container = wrapper.find('.flex')
    expect(container.classes()).toContain('animate-pulse')
  })

  it('should have dark background', () => {
    const wrapper = mount(SkeletonCard)
    const container = wrapper.find('.flex')
    expect(container.classes()).toContain('bg-gray-900')
  })

  it('should have border', () => {
    const wrapper = mount(SkeletonCard)
    const container = wrapper.find('.flex')
    expect(container.classes()).toContain('border')
    expect(container.classes()).toContain('border-gray-800')
  })

  it('should render image placeholder', () => {
    const wrapper = mount(SkeletonCard)
    const imagePlaceholder = wrapper.find('.aspect-\\[4\\/3\\]')
    expect(imagePlaceholder.exists()).toBe(true)
    expect(imagePlaceholder.classes()).toContain('bg-gray-800')
  })

  it('should render source placeholder elements', () => {
    const wrapper = mount(SkeletonCard)
    const skeletonElements = wrapper.findAll('.bg-gray-800')

    // Should have multiple skeleton elements (image, logo, source name, time, etc.)
    expect(skeletonElements.length).toBeGreaterThan(5)
  })

  it('should render title placeholder lines', () => {
    const wrapper = mount(SkeletonCard)
    const titleLines = wrapper.findAll('.h-6')

    // Should have 2 title placeholder lines
    expect(titleLines.length).toBeGreaterThanOrEqual(2)
  })

  it('should render excerpt placeholder lines', () => {
    const wrapper = mount(SkeletonCard)
    const excerptLines = wrapper.findAll('.h-3')

    // Should have multiple small text placeholders
    expect(excerptLines.length).toBeGreaterThan(3)
  })

  it('should have footer with border', () => {
    const wrapper = mount(SkeletonCard)
    const footer = wrapper.find('.border-t')
    expect(footer.exists()).toBe(true)
    expect(footer.classes()).toContain('border-gray-800')
  })

  it('should render footer action placeholders', () => {
    const wrapper = mount(SkeletonCard)
    const footer = wrapper.find('.border-t')
    const actionPlaceholders = footer.findAll('.h-5.w-5')

    // Should have at least 3 action button placeholders
    expect(actionPlaceholders.length).toBeGreaterThanOrEqual(3)
  })

  it('should have consistent spacing', () => {
    const wrapper = mount(SkeletonCard)

    // Check for padding classes
    const content = wrapper.find('.p-4')
    expect(content.exists()).toBe(true)

    // Check for margin classes
    const elements = wrapper.findAll('.mb-2, .mb-4')
    expect(elements.length).toBeGreaterThan(0)
  })

  it('should be full height', () => {
    const wrapper = mount(SkeletonCard)
    const container = wrapper.find('.flex')
    expect(container.classes()).toContain('h-full')
  })

  it('should use flex layout', () => {
    const wrapper = mount(SkeletonCard)
    const container = wrapper.find('.flex')
    expect(container.classes()).toContain('flex-col')
  })
})
