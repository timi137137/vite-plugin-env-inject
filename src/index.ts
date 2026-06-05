import { loadEnv, type Logger, type Plugin } from 'vite'
import {
  DEFAULT_CONFIG_FILE,
  DEFAULT_CONFIG_TEMPLATE,
  DEFAULT_GLOBAL_NAME,
  DEFAULT_PREFIX,
  INJECTED_SCRIPT_ATTR,
} from './constants'
import { logEnvValues } from './log'
import {
  buildScriptTag,
  generateConfigScript,
  generateConfigTemplate,
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
  const debug = options.debug ?? false

  const collectedKeys = new Set<string>(include)
  let publicConfigPath = normalizePublicPath('/', configFile)
  let resolvedRoot = process.cwd()
  let resolvedMode = 'production'
  let logger: Logger | undefined

  const addKeys = (keys: string[]) => {
    for (const key of keys) collectedKeys.add(key)
  }

  const getSortedKeys = () => [...collectedKeys].sort()

  const resolveEnv = () =>
    ({
      ...process.env,
      ...loadEnv(resolvedMode, resolvedRoot, prefix),
    }) as Record<string, string>

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
      logger = config.logger
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
        const keys = getSortedKeys()
        if (keys.length === 0) return html

        if (debug && logger) {
          logger.info(
            `[vite-plugin-env-inject] inject script into html: ${publicConfigPath}`,
          )
          logger.info(`[vite-plugin-env-inject] collected keys: ${keys.join(', ')}`)
        }

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

        const env = resolveEnv()
        const keys = getSortedKeys()

        if (debug && logger) {
          logger.info(
            `[vite-plugin-env-inject] serve runtime config: ${publicConfigPath}`,
          )
          logEnvValues(logger, 'dev env values', keys, env)
        }

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        res.end(serveConfigScript(env))
      })
    },

    generateBundle() {
      const keys = getSortedKeys()
      if (keys.length === 0) return

      const placeholderValues = Object.fromEntries(keys.map((key) => [key, '']))

      if (debug && logger) {
        logger.info('[vite-plugin-env-inject] generate runtime config assets')
        logger.info(`[vite-plugin-env-inject] collected keys: ${keys.join(', ')}`)
        logger.info(
          '[vite-plugin-env-inject] build phase: runtime env is not available (expected)',
        )
        logger.info(
          `[vite-plugin-env-inject] emit ${DEFAULT_CONFIG_TEMPLATE} for runtime injection`,
        )
        logger.info(
          `[vite-plugin-env-inject] emit ${configFile} as empty placeholder (filled at runtime)`,
        )
      }

      this.emitFile({
        type: 'asset',
        fileName: configFile,
        source: generateConfigScript(globalName, placeholderValues),
      })

      this.emitFile({
        type: 'asset',
        fileName: DEFAULT_CONFIG_TEMPLATE,
        source: generateConfigTemplate(globalName, keys),
      })
    },
  }
}
