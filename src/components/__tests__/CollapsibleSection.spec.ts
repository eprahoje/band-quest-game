import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CollapsibleSection from '@/components/CollapsibleSection.vue'

describe('CollapsibleSection', () => {
  function render(props: Record<string, unknown> = {}) {
    return mount(CollapsibleSection, {
      props: { title: 'Custos', ...props },
      slots: { default: '<p class="slotted">conteúdo</p>' },
    })
  }

  it('renders the title and starts open by default', () => {
    const wrapper = render()
    expect(wrapper.text()).toContain('Custos')
    expect(wrapper.find('.collapsible__head').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.collapsible__body').isVisible()).toBe(true)
  })

  it('toggles open/closed state when the header is clicked', async () => {
    const wrapper = render()
    const head = wrapper.find('.collapsible__head')
    await head.trigger('click')
    expect(head.attributes('aria-expanded')).toBe('false')
    await head.trigger('click')
    expect(head.attributes('aria-expanded')).toBe('true')
  })

  it('honors defaultOpen=false and shows the hint', () => {
    const wrapper = render({ defaultOpen: false, hint: '3 itens' })
    expect(wrapper.find('.collapsible__head').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.collapsible__body').isVisible()).toBe(false)
    expect(wrapper.text()).toContain('3 itens')
  })
})
