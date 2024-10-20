
//
// vitest does not support the `test` option in the vite config file.
// given the base/main construct (presumably) of the vite config file,
// so we need this separate file to configure vitest.
//

import { defineConfig } from 'vite'
import { coverageConfigDefaults } from 'vitest/dist/config'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue({
    template: {
      compilerOptions: {
        isCustomElement: tag => tag.startsWith('BIcon')
      }
    }
  })],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      exclude: [
        ...coverageConfigDefaults.exclude,
        '*.config.ts',
        'src/*.ts',
        'src/main/dropbox.ts',
        'src/automations/macos*.ts',
        'src/automations/robot.ts',
        'src/automations/windows.ts',
        'src/services/*worker.ts',
        'src/vendor/**/*',
      ]
    },
  },
})
