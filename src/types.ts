export interface EnvInjectOptions {
  /** Environment variable prefix, defaults to 'VITE_' */
  prefix?: string
  /** Global object name on globalThis, defaults to '__VITE_INJECT_ENV__' */
  globalName?: string
  /** Runtime config script path (relative to base), defaults to '__vite_env_config__.js' */
  configFile?: string
  /** Extra env keys to include in generated config (e.g. only referenced in HTML) */
  include?: string[]
  /** Log collected keys and env values during build/dev, defaults to false */
  debug?: boolean
}

export interface TransformOptions {
  prefix: string
  globalName: string
}
