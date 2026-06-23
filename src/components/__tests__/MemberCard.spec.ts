import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MemberCard from '@/components/MemberCard.vue'
import { createMember, getCharacter } from '@/data/cast'

describe('MemberCard', () => {
  it('renders name, role label and four attribute bars', () => {
    const member = createMember(getCharacter('lila-tavares'))
    const wrapper = mount(MemberCard, { props: { member } })

    expect(wrapper.text()).toContain('Lila Tavares')
    expect(wrapper.text()).toContain('Vocal')
    expect(wrapper.findAll('.attr')).toHaveLength(4)
  })

  it('highlights the strongest attribute', () => {
    // Lila: Carisma 90 é o maior atributo.
    const member = createMember(getCharacter('lila-tavares'))
    const wrapper = mount(MemberCard, { props: { member } })
    expect(wrapper.find('.member-card__top').text()).toContain('Carisma')
  })
})
