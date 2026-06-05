import { loadEnv, type Plugin } from 'vite'
import {
  DEFAULT_CONFIG_FILE,
  DEFAULT_CONFIG_TEMPLATE,
  DEFAULT_DOCKER_ENTRYPOINT,
  DEFAULT_GLOBAL_NAME,
  DEFAULT_PREFIX,
  INJECTED_SCRIPT_ATTR,
} from './constants'
import {
  buildScriptTag,
  generateConfigScript,
  generateConfigTemplate,
  generateDockerEntrypoint,
  injectScriptIntoHtml,
  normalizePublicPath,
} from './runtime'
import { shouldTransformFile, transformCode } from './transform'
import type { EnvInjectOptions } from './types'

export type { EnvInjectOptions } from './types'

export function envInject(options: EnvInjectOptions = {}): Plugin {
  const prefix = options.prefix ?? DEFAULT_PREFIX
  const globalName = options.globalName ?? DEFAULT_GLOBAL_NAME
  const configFile = options.configFile ?? DEFAULT_CONFIG_FILE
  const include = options.include ?? []
  const dockerEntrypoint = options.dockerEntrypoint ?? true

  const collectedKeys = new Set<string>(include)
  let publicConfigPath = normalizePublicPath('/', configFile)
  let resolvedRoot = process.cwd()
  let resolvedMode = 'production'

  const addKeys = (keys: string[]) => {
    for (const key of keys) collectedKeys.add(key)
  }

  const getSortedKeys = () => [...collectedKeys].sort()

  const serveConfigScript = (env: Record<string, string>) => {
    const values = Object.fromEntries(
      getSortedKeys().map((key) => [key, env[key] ?? '']),
    )

    return generateConfigScript(globalName, values)
  }

  return {
    name: 'vite-plugin-env-inject',
    enforce: 'pre',

    configResolved(config) {
      resolvedRoot = config.root
      resolvedMode = config.mode
      publicConfigPath = normalizePublicPath(config.base, configFile)
    },

    transform(code, id) {
      if (!shouldTransformFile(id)) return

      const result = transformCode(code, { prefix, globalName })
      if (!result) return

      addKeys(result.keys)
      return { code: result.code, map: result.map }
    },

    transformIndexHtml: {
      order: 'post',
      handler(html) {
        if (getSortedKeys().length === 0) return html

        const scriptTag = buildScriptTag(publicConfigPath).replace(
          '<script ',
          `<script ${INJECTED_SCRIPT_ATTR} `,
        )

        return injectScriptIntoHtml(html, scriptTag)
      },
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestPath = req.url?.split('?')[0]
        if (requestPath !== publicConfigPath) {
          next()
          return
        }

        const env = {
          ...process.env,
          ...loadEnv(resolvedMode, resolvedRoot, prefix),
        } as Record<string, string>

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        res.end(serveConfigScript(env))
      })
    },

    generateBundle() {
      const keys = getSortedKeys()
      if (keys.length === 0) return

      const buildEnv = {
        ...process.env,
        ...loadEnv(resolvedMode, resolvedRoot, prefix),
      } as Record<string, string>

      this.emitFile({
        type: 'asset',
        fileName: configFile,
        source: serveConfigScript(buildEnv),
      })

      this.emitFile({
        type: 'asset',
        fileName: DEFAULT_CONFIG_TEMPLATE,
        source: generateConfigTemplate(globalName, keys),
      })

      if (dockerEntrypoint) {
        this.emitFile({
          type: 'asset',
          fileName: DEFAULT_DOCKER_ENTRYPOINT,
          source: generateDockerEntrypoint(
            configFile,
            DEFAULT_CONFIG_TEMPLATE,
            DEFAULT_DOCKER_ENTRYPOINT,
          ),
        })
      }
    },
  }
}
