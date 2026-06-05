# vite-plugin-env-inject

[![npm version](https://img.shields.io/npm/v/vite-plugin-env-inject.svg)](https://www.npmjs.com/package/vite-plugin-env-inject)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Release](https://github.com/timi137137/vite-plugin-env-inject/actions/workflows/release.yml/badge.svg)](https://github.com/timi137137/vite-plugin-env-inject/actions/workflows/release.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-^5%20%7C%20^6%20%7C%20^7%20%7C%20^8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)

[English](README.md) | 简体中文

为浏览器构建注入**运行时**环境变量的 Vite 插件。

## 动机

Vite 默认在构建时将 `import.meta.env.VITE_*` 静态内联进产物，适合固定配置部署，但不适合「同一 Docker 镜像在不同环境使用不同配置」的场景。

本插件在不改动业务代码写法的前提下，将环境变量访问切换为运行时配置脚本，容器启动时即可注入 `VITE_*` 值，无需重新构建。

## 特性

- 自动将 `import.meta.env.VITE_*` 和 `process.env.VITE_*` 转为运行时全局变量访问
- 自动向 `index.html` 注入配置脚本
- `vite dev` 时通过 dev server 提供实时配置
- 构建时输出运行时配置模板（`__vite_env_config__.js.template`）

## 安装

```bash
npm install -D vite-plugin-env-inject
```

## 用法

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { envInject } from 'vite-plugin-env-inject'

export default defineConfig({
  plugins: [envInject()],
})
```

源码中照常使用环境变量：

```ts
const apiUrl = import.meta.env.VITE_API_URL
const token = process.env.VITE_API_TOKEN
```

插件在构建时自动完成转换，并在应用 bundle 加载前注入配置脚本。

### 配置项

```ts
envInject({
  prefix: 'VITE_',
  globalName: '__VITE_INJECT_ENV__',
  configFile: '__vite_env_config__.js',
  include: ['VITE_EXTRA_KEY'],
  debug: true,
})
```

## 开发

```bash
npm install
npm run build
npm test
npm run dev
```

## License

[MIT](LICENSE)
