# vite-plugin-env-inject

[![npm version](https://img.shields.io/npm/v/vite-plugin-env-inject.svg)](https://www.npmjs.com/package/vite-plugin-env-inject)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Release](https://github.com/timi137137/vite-plugin-env-inject/actions/workflows/release.yml/badge.svg)](https://github.com/timi137137/vite-plugin-env-inject/actions/workflows/release.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-^5%20%7C%20^6%20%7C%20^7%20%7C%20^8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)

English | [简体中文](README.zh-cn.md)

A Vite plugin that injects **runtime** environment variables into browser builds.

## Motivation

Vite inlines `import.meta.env.VITE_*` at build time by default. That works for static deployments, but not when you need the **same Docker image** to run with different configuration per environment.

This plugin keeps your source code unchanged while switching env access to a runtime config script. **Environment variables are not read at build time** — they are injected when the container or dev server starts.

## Features

- Auto-transforms `import.meta.env.VITE_*` and `process.env.VITE_*` to runtime global access
- Auto-injects config script into `index.html`
- Serves live config in `vite dev`
- Emits runtime config template (`__vite_env_config__.js.template`) on build

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
})
```

Use env vars as usual in source code:

```ts
const apiUrl = import.meta.env.VITE_API_URL
const token = process.env.VITE_API_TOKEN
```

At build time the plugin only transforms code and emits a config **template**. At runtime, the config script is populated with actual `VITE_*` values before your app bundle loads.

| Phase | What happens |
|-------|----------------|
| `vite build` | Transform env access, inject script tag, emit empty placeholder + `.template` |
| Container startup | Render `.template` → `__vite_env_config__.js` via `envsubst` (see your Dockerfile) |
| `vite dev` | Dev server serves live config from current environment |

### Options

```ts
envInject({
  prefix: 'VITE_',
  globalName: '__VITE_INJECT_ENV__',
  configFile: '__vite_env_config__.js',
  include: ['VITE_EXTRA_KEY'],
  debug: true,
})
```

## Development

```bash
npm install
npm run build
npm test
npm run dev
```

## License

[MIT](LICENSE)
