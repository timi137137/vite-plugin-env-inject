# vite-plugin-env-inject

[![npm version](https://img.shields.io/npm/v/vite-plugin-env-inject.svg)](https://www.npmjs.com/package/vite-plugin-env-inject)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Release](https://github.com/timi137137/vite-plugin-env-inject/actions/workflows/release.yml/badge.svg)](https://github.com/timi137137/vite-plugin-env-inject/actions/workflows/release.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-^5%20%7C%20^6%20%7C%20^7%20%7C%20^8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)

English | [简体中文](README.zh-cn.md)

A Vite plugin that replaces `import.meta.env.VITE_*` with `process.env.VITE_*` during **Node builds**, so your application reads configuration from system environment variables at runtime — no rebuild required when env values change.

## Features

- Transforms `import.meta.env.VITE_*` to `process.env.VITE_*` at build time
- Supports dot notation and bracket notation access
- Node / SSR builds only
- Runs with `enforce: 'pre'` before Vite's default static inlining, preventing values from being baked into the output

## Installation

```bash
npm install -D vite-plugin-env-inject
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { envInject } from 'vite-plugin-env-inject'

export default defineConfig({
  plugins: [envInject()],
  build: {
    ssr: 'src/entry.ts',
    rollupOptions: {
      output: { format: 'esm' },
    },
  },
})
```

```ts
// src/entry.ts
const apiUrl = import.meta.env.VITE_API_URL
console.log(apiUrl)
```

After building, the output becomes:

```ts
const apiUrl = process.env.VITE_API_URL
```

## Configuration

```ts
envInject({
  // Environment variable prefix, defaults to 'VITE_'
  prefix: 'VITE_',
})
```

## Setting Environment Variables

Set `VITE_`-prefixed variables in your system environment. Node reads them at runtime.

**PowerShell:**

```powershell
$env:VITE_API_URL = "https://api.example.com"
node dist/entry.js
```

**Bash:**

```bash
export VITE_API_URL="https://api.example.com"
node dist/entry.js
```

## Comparison with Vite Defaults

| | Vite default | This plugin |
|---|---|---|
| Variable source | `.env` files + build-time `process.env` | Runtime Node `process.env` |
| Build output | Static literals | `process.env.VITE_*` references |
| Changing config | Requires rebuild | Restart process only |

## Limitations

- **Node / SSR builds only** — browser client bundles are not handled
- **Build phase only** (`apply: 'build'`) — `vite dev` does not transform
- Does not support `.vue` SFC templates or HTML `%VITE_*%` placeholders

## Development

```bash
npm install
npm run build   # Vite 8 Rolldown JS build + tsc type generation
npm test
npm run dev     # Build plugin and verify playground
```

### Build Details

This package is built with **Vite 8's built-in Rolldown** in library mode (`vite build` + `build.lib`). Type declarations are generated separately by `tsc`:

```bash
npm run build:js     # Rolldown outputs ESM / CJS
npm run build:types  # Generate .d.ts
```

## Publishing

Releases are automated via GitHub Actions and **triggered only when a new tag is pushed** (e.g. `v0.1.0`).

### Prerequisites

1. Create the package on [npmjs.com](https://www.npmjs.com/) and obtain an Access Token
2. Add `NPM_TOKEN` to your GitHub repository: Settings → Secrets → Actions

### Release Steps

```bash
# 1. Update the version in package.json
# 2. Commit and tag (tag version must match package.json)
git add package.json
git commit -m "chore: release v0.1.0"
git tag v0.1.0
git push origin main
git push origin v0.1.0
```

After pushing the tag, `.github/workflows/release.yml` will:

1. Verify the tag version matches `package.json`
2. Run tests
3. Build with Rolldown
4. Publish to NPM (with provenance)

## License

[MIT](LICENSE)
