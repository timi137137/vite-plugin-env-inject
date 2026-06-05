import MagicString from 'magic-string'
import type { TransformOptions } from './types'

const JS_TS_PATTERN = /\.(?:[cm]?[jt]sx?)$/

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildPatterns(prefix: string) {
  const escapedPrefix = escapeRegExp(prefix)
  const varName = `${escapedPrefix}[A-Z0-9_]+`

  return {
    dot: new RegExp(`import\\.meta\\.env\\.(${varName})\\b`, 'g'),
    bracketSingle: new RegExp(
      `import\\.meta\\.env\\[['"](${varName})['"]\\]`,
      'g',
    ),
    bracketDouble: new RegExp(
      `import\\.meta\\.env\\[\\"(${varName})\\"\\]`,
      'g',
    ),
  }
}

export function shouldTransformFile(id: string): boolean {
  if (id.includes('node_modules')) return false
  return JS_TS_PATTERN.test(id)
}

export function transformCode(
  code: string,
  options: TransformOptions,
): { code: string; map: ReturnType<MagicString['generateMap']> } | null {
  const patterns = buildPatterns(options.prefix)
  const hasMatch =
    patterns.dot.test(code) ||
    patterns.bracketSingle.test(code) ||
    patterns.bracketDouble.test(code)

  if (!hasMatch) return null

  patterns.dot.lastIndex = 0
  patterns.bracketSingle.lastIndex = 0
  patterns.bracketDouble.lastIndex = 0

  const s = new MagicString(code)

  s.replace(patterns.dot, 'process.env.$1')
  s.replace(patterns.bracketSingle, 'process.env[\'$1\']')
  s.replace(patterns.bracketDouble, 'process.env["$1"]')

  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
  }
}
