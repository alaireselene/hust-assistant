import { mount } from 'svelte'
import './style.css'
import SidePanel from './SidePanel.svelte'

const app = mount(SidePanel, {
    target: document.getElementById('app')!,
})

export default app
