# vite-plugin-env-inject

[![npm version](https://img.shields.io/npm/v/vite-plugin-env-inject.svg)](https://www.npmjs.com/package/vite-plugin-env-inject)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Release](https://github.com/timi137137/vite-plugin-env-inject/actions/workflows/release.yml/badge.svg)](https://github.com/timi137137/vite-plugin-env-inject/actions/workflows/release.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-^5%20%7C%20^6%20%7C%20^7%20%7C%20^8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)

[English](README.md) | 简体中文

Vite 插件：在 **Node 构建** 时将 `import.meta.env.VITE_*` 替换为 `process.env.VITE_*`，使应用在运行时从系统环境变量读取配置，修改环境变量无需重新构建。

## 特性

- 构建时将 `import.meta.env.VITE_*` 转为 `process.env.VITE_*`
- 支持点号与括号访问写法
- 仅支持 Node / SSR 构建环境
- 通过 `enforce: 'pre'` 在 Vite 默认静态内联之前执行，避免值被硬编码进产物

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

构建后产物中会变为：

```ts
const apiUrl = process.env.VITE_API_URL
```

## 配置

```ts
envInject({
  // 环境变量前缀，默认 'VITE_'
  prefix: 'VITE_',
})
```

## 设置系统环境变量

在系统中设置 `VITE_` 前缀的环境变量，运行时 Node 会读取这些值。

**PowerShell：**

```powershell
$env:VITE_API_URL = "https://api.example.com"
node dist/entry.js
```

**Bash：**

```bash
export VITE_API_URL="https://api.example.com"
node dist/entry.js
```

## 与 Vite 默认行为的区别

| | Vite 默认 | 本插件 |
|---|---|---|
| 变量来源 | `.env` 文件 + 构建时 `process.env` | 运行时 Node `process.env` |
| 构建产物 | 静态字面量 | `process.env.VITE_*` 引用 |
| 修改配置 | 需重新构建 | 仅需重启进程 |

## 限制

- 仅支持 **Node / SSR 构建**，不处理浏览器 client bundle
- 仅 **构建阶段**（`apply: 'build'`）生效，开发模式（`vite dev`）不转换
- 不支持 `.vue` SFC 模板或 HTML `%VITE_*%` 占位符

## 开发

```bash
npm install
npm run build   # Vite 8 Rolldown 构建 JS + tsc 生成类型
npm test
npm run dev     # 构建插件并验证 playground
```

### 构建说明

本包使用 **Vite 8 内置 Rolldown** 进行库模式构建（`vite build` + `build.lib`），类型声明由 `tsc` 单独生成：

```bash
npm run build:js     # Rolldown 输出 ESM / CJS
npm run build:types  # 生成 .d.ts
```

## 发布

发布通过 GitHub Actions 自动完成，**仅在推送新 tag 时触发**（如 `v0.1.0`）。

### 前置条件

1. 在 [npmjs.com](https://www.npmjs.com/) 创建包并获取 Access Token
2. 在 GitHub 仓库 Settings → Secrets → Actions 中添加 `NPM_TOKEN`

### 发布步骤

```bash
# 1. 更新 package.json 中的 version
# 2. 提交并打 tag（tag 版本须与 package.json 一致）
git add package.json
git commit -m "chore: release v0.1.0"
git tag v0.1.0
git push origin main
git push origin v0.1.0
```

推送 tag 后，`.github/workflows/release.yml` 将自动执行：

1. 校验 tag 版本与 `package.json` 一致
2. 运行测试
3. 使用 Rolldown 构建
4. 发布到 NPM（含 provenance）

## License

[MIT](LICENSE)
