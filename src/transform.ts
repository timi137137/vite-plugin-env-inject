import MagicString from 'magic-string'
import type { TransformOptions } from './types'
import { runtimeAccessor, runtimeBracketAccessor } from './runtime'

const JS_TS_PATTERN = /\.(?:[cm]?[jt]sx?)$/

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildPatterns(prefix: string) {
  const escapedPrefix = escapeRegExp(prefix)
  const varName = `${escapedPrefix}[A-Z0-9_]+`
  const sources = ['import\\.meta\\.env', 'process\\.env']

  const dot = new RegExp(
    `(?:${sources.join('|')})\\.(${varName})\\b`,
    'g',
  )
  const bracketSingle = new RegExp(
    `(?:${sources.join('|')})\\[['"](${varName})['"]\\]`,
    'g',
  )
  const bracketDouble = new RegExp(
    `(?:${sources.join('|')})\\[\\"(${varName})\\"\\]`,
    'g',
  )

  return { dot, bracketSingle, bracketDouble, varName }
}

export function shouldTransformFile(id: string): boolean {
  if (id.includes('node_modules')) return false
  return JS_TS_PATTERN.test(id)
}

export function collectEnvKeys(code: string, prefix: string): string[] {
  const { varName } = buildPatterns(prefix)
  const keyPattern = new RegExp(`(${varName})`, 'g')
  const keys = new Set<string>()

  for (const match of code.matchAll(keyPattern)) {
    if (match[1]) keys.add(match[1])
  }

  return [...keys]
}

export function transformCode(
  code: string,
  options: TransformOptions,
): { code: string; map: ReturnType<MagicString['generateMap']>; keys: string[] } | null {
  const patterns = buildPatterns(options.prefix)
  const keys = collectEnvKeys(code, options.prefix)

  const hasMatch =
    patterns.dot.test(code) ||
    patterns.bracketSingle.test(code) ||
    patterns.bracketDouble.test(code)

  if (!hasMatch) return null

  patterns.dot.lastIndex = 0
  patterns.bracketSingle.lastIndex = 0
  patterns.bracketDouble.lastIndex = 0

  const s = new MagicString(code)

  s.replace(patterns.dot, (_match, key: string) =>
    runtimeAccessor(options.globalName, key),
  )
  s.replace(patterns.bracketSingle, (_match, key: string) =>
    runtimeBracketAccessor(options.globalName, key),
  )
  s.replace(patterns.bracketDouble, (_match, key: string) =>
    runtimeBracketAccessor(options.globalName, key),
  )

  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
    keys,
  }
}
