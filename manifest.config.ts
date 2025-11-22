import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: "Trợ lý HUST",
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [{
    js: ['src/content/main.ts'],
    matches: ['https://*/*', 'https://*.hust.edu.vn/*'],
  }],
  permissions: [
    'sidePanel',
    'contentSettings',
    'storage',
    'identity',
    'downloads'
  ],
  host_permissions: [
    'https://*.hust.edu.vn/*'
  ],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  description: 'Tiện ích hỗ trợ xuất lịch học vào Google Calendar',
})
