import type { Logger } from 'vite'

export function formatEnvValue(value: string | undefined): string {
  if (value === undefined || value === '') return '(empty)'
  return `(set, ${value.length} chars)`
}

export function logEnvValues(
  logger: Logger,
  label: string,
  keys: string[],
  env: Record<string, string | undefined>,
): void {
  logger.info(`[vite-plugin-env-inject] ${label}`)
  for (const key of keys) {
    logger.info(`  ${key}=${formatEnvValue(env[key])}`)
  }
}
