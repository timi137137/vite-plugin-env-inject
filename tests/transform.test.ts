import { describe, expect, it } from 'vitest'
import {
  generateConfigScript,
  generateConfigTemplate,
  injectScriptIntoHtml,
  runtimeAccessor,
} from '../src/runtime'
import { collectEnvKeys, shouldTransformFile, transformCode } from '../src/transform'

const GLOBAL = '__VITE_INJECT_ENV__'

describe('shouldTransformFile', () => {
  it('accepts js/ts source files', () => {
    expect(shouldTransformFile('/project/src/index.ts')).toBe(true)
    expect(shouldTransformFile('/project/src/app.tsx')).toBe(true)
  })

  it('rejects node_modules and non-js files', () => {
    expect(shouldTransformFile('/project/node_modules/pkg/index.js')).toBe(false)
    expect(shouldTransformFile('/project/src/App.vue')).toBe(false)
  })
})

describe('transformCode', () => {
  it('replaces import.meta.env dot notation', () => {
    const result = transformCode(
      'const url = import.meta.env.VITE_API_URL',
      { prefix: 'VITE_', globalName: GLOBAL },
    )

    expect(result?.code).toBe(
      `const url = ${runtimeAccessor(GLOBAL, 'VITE_API_URL')}`,
    )
    expect(result?.keys).toEqual(['VITE_API_URL'])
  })

  it('replaces process.env dot notation', () => {
    const result = transformCode(
      'const token = process.env.VITE_API_TOKEN',
      { prefix: 'VITE_', globalName: GLOBAL },
    )

    expect(result?.code).toBe(
      `const token = ${runtimeAccessor(GLOBAL, 'VITE_API_TOKEN')}`,
    )
  })

  it('replaces bracket access', () => {
    const result = transformCode(
      'const key = import.meta.env["VITE_API_KEY"]',
      { prefix: 'VITE_', globalName: GLOBAL },
    )

    expect(result?.code).toBe(
      `const key = (globalThis.${GLOBAL}?.["VITE_API_KEY"]??'')`,
    )
  })

  it('does not replace non-prefixed env keys', () => {
    const input = 'const mode = import.meta.env.MODE'
    const result = transformCode(input, { prefix: 'VITE_', globalName: GLOBAL })

    expect(result).toBeNull()
  })

  it('does not replace process.env.DEV', () => {
    const input = 'if (!process.env.DEV) return'
    const result = transformCode(input, { prefix: 'VITE_', globalName: GLOBAL })

    expect(result).toBeNull()
  })
})

describe('collectEnvKeys', () => {
  it('collects keys from mixed sources', () => {
    const keys = collectEnvKeys(
      'const a = import.meta.env.VITE_A; const b = process.env.VITE_B',
      'VITE_',
    )

    expect(keys.sort()).toEqual(['VITE_A', 'VITE_B'])
  })
})

describe('runtime helpers', () => {
  it('generates config script', () => {
    expect(generateConfigScript(GLOBAL, { VITE_API_URL: 'https://api.test' }))
      .toBe('globalThis.__VITE_INJECT_ENV__ = {\n  "VITE_API_URL": "https://api.test"\n};\n')
  })

  it('generates envsubst template', () => {
    expect(generateConfigTemplate(GLOBAL, ['VITE_API_URL']))
      .toBe('globalThis.__VITE_INJECT_ENV__ = {\n  "VITE_API_URL": "${VITE_API_URL}"\n};\n')
  })

  it('injects script before module entry', () => {
    const html = injectScriptIntoHtml(
      '<html><head></head><body><script type="module" src="/src/main.tsx"></script></body></html>',
      '<script src="/__vite_env_config__.js"></script>',
    )

    expect(html).toContain('<script src="/__vite_env_config__.js"></script>\n    <script type="module"')
  })
})
