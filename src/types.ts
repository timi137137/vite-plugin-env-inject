export interface EnvInjectOptions {
  /** Environment variable prefix, defaults to 'VITE_' */
  prefix?: string
  /** Global object name on globalThis, defaults to '__VITE_INJECT_ENV__' */
  globalName?: string
  /** Runtime config script path (relative to base), defaults to '/__vite_env_config__.js' */
  configFile?: string
  /** Extra env keys to include in generated config (e.g. only referenced in HTML) */
  include?: string[]
  /** Emit docker-entrypoint.sh into dist, defaults to true */
  dockerEntrypoint?: boolean
}

export interface TransformOptions {
  prefix: string
  globalName: string
}
