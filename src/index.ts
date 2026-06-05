import type { Plugin, TransformOptions as ViteTransformOptions } from 'vite'
import { shouldTransformFile, transformCode } from './transform'
import type { EnvInjectOptions } from './types'

const DEFAULT_PREFIX = 'VITE_'

function isNodeEnvironment(
  options: ViteTransformOptions | undefined,
  pluginContext: { environment?: { config?: { consumer?: string } } },
): boolean {
  if (options?.ssr) return true
  return pluginContext.environment?.config?.consumer === 'server'
}

export type { EnvInjectOptions } from './types'

export function envInject(options: EnvInjectOptions = {}): Plugin {
  const prefix = options.prefix ?? DEFAULT_PREFIX

  return {
    name: 'vite-plugin-env-inject',
    enforce: 'pre',
    apply: 'build',
    transform(code, id, options) {
      if (!shouldTransformFile(id)) return
      if (!isNodeEnvironment(options, this)) return

      return transformCode(code, { prefix }) ?? undefined
    },
  }
}
