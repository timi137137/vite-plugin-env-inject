import { DEFAULT_CONFIG_FILE, DEFAULT_CONFIG_TEMPLATE, DEFAULT_GLOBAL_NAME } from './constants'

export function normalizePublicPath(base: string, file: string): string {
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const normalizedFile = file.startsWith('/') ? file : `/${file}`

  if (!normalizedBase || normalizedBase === '/') {
    return normalizedFile
  }

  return `${normalizedBase}${normalizedFile}`
}

export function runtimeAccessor(globalName: string, key: string): string {
  return `(globalThis.${globalName}?.${key}??'')`
}

export function runtimeBracketAccessor(globalName: string, key: string): string {
  return `(globalThis.${globalName}?.[${JSON.stringify(key)}]??'')`
}

export function generateConfigScript(
  globalName: string,
  values: Record<string, string>,
): string {
  const entries = Object.keys(values)
    .sort()
    .map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(values[key] ?? '')}`)
    .join(',\n')

  return `globalThis.${globalName} = {\n${entries}\n};\n`
}

export function generateConfigTemplate(
  globalName: string,
  keys: string[],
): string {
  const values = Object.fromEntries(
    keys.map((key) => [key, `\${${key}}`]),
  )

  return generateConfigScript(globalName, values)
}

export function buildScriptTag(src: string): string {
  return `<script src="${src}"></script>`
}

export function injectScriptIntoHtml(html: string, scriptTag: string): string {
  if (html.includes(scriptTag)) return html

  const moduleScriptMatch = html.match(/<script[^>]*type=["']module["'][^>]*>/i)
  if (moduleScriptMatch?.index !== undefined) {
    return `${html.slice(0, moduleScriptMatch.index)}${scriptTag}\n    ${html.slice(moduleScriptMatch.index)}`
  }

  const headClose = html.lastIndexOf('</head>')
  if (headClose !== -1) {
    return `${html.slice(0, headClose)}    ${scriptTag}\n  ${html.slice(headClose)}`
  }

  return `${scriptTag}\n${html}`
}

export {
  DEFAULT_CONFIG_FILE,
  DEFAULT_CONFIG_TEMPLATE,
  DEFAULT_GLOBAL_NAME,
}
