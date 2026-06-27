import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

// O ConfirmDialog usa <Teleport to="body">, então o DOM vai para document.body.
describe('ConfirmDialog (design system — Confirm dialog)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders nothing while closed', () => {
    mount(ConfirmDialog, { props: { open: false, title: 'Descartar?' } })
    expect(document.body.querySelector('.dialog')).toBeNull()
  })

  it('renders title, message and actions when open', () => {
    mount(ConfirmDialog, {
      props: { open: true, title: 'Descartar música?', message: 'Não dá para desfazer.', confirmLabel: 'Descartar' },
    })
    const dialog = document.body.querySelector('.dialog')!
    expect(dialog).not.toBeNull()
    expect(dialog.textContent).toContain('Descartar música?')
    expect(dialog.textContent).toContain('Não dá para desfazer.')
    expect(dialog.textContent).toContain('Descartar')
  })

  it('emits confirm and cancel from the buttons', async () => {
    const wrapper = mount(ConfirmDialog, { props: { open: true, title: 'Descartar?', confirmLabel: 'Descartar' } })
    const buttons = Array.from(document.body.querySelectorAll<HTMLButtonElement>('.dlg-btn'))
    const cancel = buttons.find((b) => b.textContent?.includes('Cancelar'))!
    const confirm = buttons.find((b) => b.textContent?.includes('Descartar'))!
    confirm.click()
    cancel.click()
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})
