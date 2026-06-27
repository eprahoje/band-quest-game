import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SelectField from '@/components/SelectField.vue'

describe('SelectField (design system — Select/Dropdown)', () => {
  const options = ['Rock', 'Pop Rock', 'Punk']

  it('shows the current value and hides the list until opened', () => {
    const wrapper = mount(SelectField, { props: { modelValue: 'Rock', options } })
    expect(wrapper.find('.select__button').text()).toContain('Rock')
    expect(wrapper.find('.select__list').exists()).toBe(false)
  })

  it('opens the list on click and renders all options', async () => {
    const wrapper = mount(SelectField, { props: { modelValue: 'Rock', options } })
    await wrapper.find('.select__button').trigger('click')
    expect(wrapper.find('.select__list').exists()).toBe(true)
    expect(wrapper.findAll('.select__option')).toHaveLength(3)
  })

  it('emits update:modelValue and closes when an option is chosen', async () => {
    const wrapper = mount(SelectField, { props: { modelValue: 'Rock', options } })
    await wrapper.find('.select__button').trigger('click')
    const punk = wrapper.findAll('.select__option').find((b) => b.text() === 'Punk')!
    await punk.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['Punk']])
    expect(wrapper.find('.select__list').exists()).toBe(false)
  })

  it('marks the selected option as aria-selected', async () => {
    const wrapper = mount(SelectField, { props: { modelValue: 'Punk', options } })
    await wrapper.find('.select__button').trigger('click')
    const selected = wrapper.findAll('.select__option').find((b) => b.text() === 'Punk')!
    expect(selected.attributes('aria-selected')).toBe('true')
  })
})
