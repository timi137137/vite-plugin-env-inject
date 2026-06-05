import { describe, expect, it } from 'vitest'
import { shouldTransformFile, transformCode } from '../src/transform'

describe('shouldTransformFile', () => {
  it('accepts js/ts source files', () => {
    expect(shouldTransformFile('/project/src/index.ts')).toBe(true)
    expect(shouldTransformFile('/project/src/app.js')).toBe(true)
    expect(shouldTransformFile('/project/src/app.mjs')).toBe(true)
    expect(shouldTransformFile('/project/src/app.cjs')).toBe(true)
    expect(shouldTransformFile('/project/src/app.tsx')).toBe(true)
  })

  it('rejects node_modules and non-js files', () => {
    expect(shouldTransformFile('/project/node_modules/pkg/index.js')).toBe(false)
    expect(shouldTransformFile('/project/src/App.vue')).toBe(false)
    expect(shouldTransformFile('/project/src/style.css')).toBe(false)
  })
})

describe('transformCode', () => {
  it('replaces dot notation access', () => {
    const result = transformCode(
      'const url = import.meta.env.VITE_API_URL',
      { prefix: 'VITE_' },
    )

    expect(result?.code).toBe('const url = process.env.VITE_API_URL')
  })

  it('replaces single-quoted bracket access', () => {
    const result = transformCode(
      "const key = import.meta.env['VITE_API_KEY']",
      { prefix: 'VITE_' },
    )

    expect(result?.code).toBe("const key = process.env['VITE_API_KEY']")
  })

  it('replaces double-quoted bracket access', () => {
    const result = transformCode(
      'const key = import.meta.env["VITE_API_KEY"]',
      { prefix: 'VITE_' },
    )

    expect(result?.code).toBe('const key = process.env["VITE_API_KEY"]')
  })

  it('replaces multiple occurrences in the same file', () => {
    const result = transformCode(
      [
        'const a = import.meta.env.VITE_A',
        'const b = import.meta.env["VITE_B"]',
        "const c = import.meta.env['VITE_C']",
      ].join('\n'),
      { prefix: 'VITE_' },
    )

    expect(result?.code).toBe(
      [
        'const a = process.env.VITE_A',
        'const b = process.env["VITE_B"]',
        "const c = process.env['VITE_C']",
      ].join('\n'),
    )
  })

  it('does not replace non-prefixed env keys', () => {
    const input = 'const mode = import.meta.env.MODE'
    const result = transformCode(input, { prefix: 'VITE_' })

    expect(result).toBeNull()
    expect(input).toBe('const mode = import.meta.env.MODE')
  })

  it('supports custom prefix', () => {
    const result = transformCode(
      'const value = import.meta.env.APP_FOO',
      { prefix: 'APP_' },
    )

    expect(result?.code).toBe('const value = process.env.APP_FOO')
  })

  it('returns null when no matches are found', () => {
    const result = transformCode('const value = 1', { prefix: 'VITE_' })

    expect(result).toBeNull()
  })
})
