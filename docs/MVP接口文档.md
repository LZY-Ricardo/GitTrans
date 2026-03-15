# GitTrans MVP 接口文档

| 字段 | 内容 |
|---|---|
| 项目 | GitTrans |
| 文档类型 | 前端对接接口文档 |
| 版本 | v1.0 |
| 适用范围 | GitTrans SaaS MVP |
| 更新日期 | 2026-03-15 |

## 1. 文档说明

本接口文档只覆盖前端开发当前必须对接的 MVP 接口。

范围说明：

- 仅支持 GitHub 公共仓库
- 仅支持 Markdown / README 翻译
- 仅支持平台托管 OpenRouter Key
- 翻译结果通过 PR 提交，不直接写默认分支
- 增量翻译先支持手动触发；Webhook 自动触发属于系统内部能力

已按最新官方约束校验的设计前提：

- GitHub 统一采用 GitHub App 体系，前端不直接持有 GitHub token
- GitHub 安装令牌由后端短期获取和刷新，前端无需感知
- OpenRouter 由后端统一调用，前端不直接请求 OpenRouter
- OpenRouter 模型列表由后端 allowlist 输出，前端不直接展示全量模型

## 2. 通用约定

### 2.1 Base URL

```text
/api
```

### 2.2 认证方式

- 登录态使用 HttpOnly Session Cookie
- 前端不保存 GitHub token / OpenRouter Key
- 除登录入口、GitHub 回调外，其余接口默认都需要登录

### 2.3 通用响应格式

```json
{
  "success": true,
  "data": {},
  "error": null,
  "requestId": "req_123456"
}
```

失败示例：

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "TASK_CONFLICT",
    "message": "当前仓库已有运行中的任务"
  },
  "requestId": "req_123456"
}
```

### 2.4 通用状态码

| 状态码 | 说明 |
|---|---|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 参数错误 |
| 401 | 未登录或登录失效 |
| 403 | 无权限访问该仓库 |
| 404 | 资源不存在 |
| 409 | 存在冲突，例如已有运行中任务 |
| 429 | 触发频率限制或额度不足 |
| 500 | 服务内部错误 |

### 2.5 关键枚举

`repoStatus`

- `ready`
- `running`
- `error`
- `disconnected`

`taskType`

- `full`
- `incremental`

`taskStatus`

- `pending`
- `running`
- `succeeded`
- `failed`
- `cancelled`

## 3. 页面与接口映射

| 页面 | 主要接口 |
|---|---|
| 登录页 | `GET /api/auth/session` `GET /api/auth/github/start` |
| 仪表盘 | `GET /api/repos` |
| 导入仓库弹窗 | `GET /api/meta/bootstrap` `GET /api/github/installations` `GET /api/github/installations/:installationId/repositories` `POST /api/repos/import` |
| 仓库详情页 | `GET /api/repos/:repoId` `GET /api/repos/:repoId/tasks` |
| 翻译配置页 | `GET /api/repos/:repoId/config` `PUT /api/repos/:repoId/config` `GET /api/repos/:repoId/files` `GET /api/meta/bootstrap` |
| 任务详情页 | `GET /api/tasks/:taskId` `GET /api/tasks/:taskId/progress` `GET /api/tasks/:taskId/preview` |

## 4. 接口列表

### 4.1 获取当前登录态

`GET /api/auth/session`

用途：

- 页面初始化时判断是否已登录
- 获取当前用户基础信息
- 获取 GitHub App 安装引导地址

返回 `data`

```json
{
  "authenticated": true,
  "user": {
    "id": "u_123",
    "name": "Yupi",
    "githubLogin": "liyupi",
    "avatarUrl": "https://avatars.githubusercontent.com/u/1"
  },
  "githubApp": {
    "installUrl": "https://github.com/apps/gittrans/installations/new"
  }
}
```

### 4.2 发起 GitHub 登录

`GET /api/auth/github/start`

用途：

- 跳转 GitHub App 用户授权页

前端处理：

- 直接浏览器跳转即可
- 不需要 Ajax 调用

### 4.3 退出登录

`POST /api/auth/logout`

返回 `data`

```json
{
  "loggedOut": true
}
```

### 4.4 获取页面基础元数据

`GET /api/meta/bootstrap`

用途：

- 获取语言列表
- 获取模型 allowlist
- 获取前端功能开关

返回 `data`

```json
{
  "languages": [
    { "code": "en", "name": "英语", "englishName": "English" },
    { "code": "ja", "name": "日语", "englishName": "Japanese" }
  ],
  "models": [
    {
      "id": "openai/gpt-5.2",
      "name": "GPT-5.2",
      "provider": "openrouter",
      "recommended": true
    }
  ],
  "features": {
    "byokEnabled": false,
    "autoSyncEnabled": false
  }
}
```

### 4.5 获取用户可见的 GitHub 安装列表

`GET /api/github/installations`

用途：

- 导入仓库前先选择 GitHub App 安装

返回 `data`

```json
{
  "items": [
    {
      "installationId": 10001,
      "accountLogin": "liyupi",
      "accountType": "User",
      "repositoriesCount": 12,
      "installUrl": "https://github.com/apps/gittrans/installations/10001"
    }
  ]
}
```

### 4.6 获取安装下的仓库列表

`GET /api/github/installations/:installationId/repositories?page=1&pageSize=50&query=`

用途：

- 在已安装范围内选择要导入的仓库

返回 `data`

```json
{
  "items": [
    {
      "githubRepoId": 123456,
      "owner": "liyupi",
      "name": "ai-guide",
      "fullName": "liyupi/ai-guide",
      "defaultBranch": "main",
      "private": false,
      "alreadyImported": false
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 1
  }
}
```

### 4.7 导入仓库

`POST /api/repos/import`

请求体

```json
{
  "installationId": 10001,
  "owner": "liyupi",
  "name": "ai-guide"
}
```

返回 `data`

```json
{
  "repo": {
    "id": "repo_123",
    "fullName": "liyupi/ai-guide",
    "defaultBranch": "main",
    "status": "ready"
  }
}
```

### 4.8 获取已导入仓库列表

`GET /api/repos`

用途：

- 仪表盘展示仓库卡片

返回 `data`

```json
{
  "items": [
    {
      "id": "repo_123",
      "fullName": "liyupi/ai-guide",
      "defaultBranch": "main",
      "baseBranch": "main",
      "baseLanguage": "zh-CN",
      "targetLanguages": ["en", "ja"],
      "status": "ready",
      "currentTask": null,
      "currentPrUrl": "https://github.com/liyupi/ai-guide/pull/10",
      "lastSyncedAt": "2026-03-15T08:00:00Z"
    }
  ]
}
```

### 4.9 获取仓库详情

`GET /api/repos/:repoId`

用途：

- 仓库详情页顶部信息
- 展示当前 PR、最近同步、最近任务概览

返回 `data`

```json
{
  "id": "repo_123",
  "fullName": "liyupi/ai-guide",
  "defaultBranch": "main",
  "baseBranch": "main",
  "baseLanguage": "zh-CN",
  "targetLanguages": ["en", "ja"],
  "status": "ready",
  "translationBranch": "gittrans/main",
  "currentPr": {
    "number": 10,
    "url": "https://github.com/liyupi/ai-guide/pull/10",
    "state": "open"
  },
  "syncState": {
    "lastSyncedSha": "abc123",
    "lastSyncedAt": "2026-03-15T08:00:00Z"
  },
  "latestTask": {
    "id": "task_123",
    "type": "full",
    "status": "succeeded",
    "createdAt": "2026-03-15T07:50:00Z"
  }
}
```

### 4.10 获取仓库配置

`GET /api/repos/:repoId/config`

用途：

- 配置页初始化

返回 `data`

```json
{
  "repoId": "repo_123",
  "baseBranch": "main",
  "baseLanguage": "zh-CN",
  "targetLanguages": ["en", "ja"],
  "includePaths": ["README.md", "docs/**"],
  "ignoreRulesText": "CHANGELOG.md\ndocs/internal/\n",
  "modelId": "openai/gpt-5.2",
  "outputRoot": "translations",
  "readmeNavigationEnabled": true,
  "usePlatformKey": true
}
```

### 4.11 更新仓库配置

`PUT /api/repos/:repoId/config`

请求体

```json
{
  "baseBranch": "main",
  "baseLanguage": "zh-CN",
  "targetLanguages": ["en", "ja"],
  "includePaths": ["README.md", "docs/**"],
  "ignoreRulesText": "CHANGELOG.md\ndocs/internal/\n",
  "modelId": "openai/gpt-5.2",
  "readmeNavigationEnabled": true
}
```

说明：

- `targetLanguages` 至少 1 个
- `includePaths` 至少 1 项
- `ignoreRulesText` 为完整文本，前端按纯文本编辑即可
- MVP 固定使用平台托管 Key，因此不需要前端传 OpenRouter Key

返回 `data`

```json
{
  "saved": true,
  "configVersion": 2
}
```

### 4.12 获取可选文件树

`GET /api/repos/:repoId/files?ref=main`

用途：

- 配置页展示可翻译文件树

返回 `data`

```json
{
  "summary": {
    "totalFiles": 30,
    "translatableFiles": 12,
    "ignoredFiles": 3
  },
  "items": [
    {
      "path": "README.md",
      "type": "file",
      "translatable": true,
      "selected": true,
      "ignored": false
    },
    {
      "path": "docs/internal/plan.md",
      "type": "file",
      "translatable": true,
      "selected": false,
      "ignored": true,
      "reason": "matched_ignore_rule"
    }
  ]
}
```

### 4.13 获取仓库任务列表

`GET /api/repos/:repoId/tasks?page=1&pageSize=20`

用途：

- 仓库详情页查看最近任务

返回 `data`

```json
{
  "items": [
    {
      "id": "task_123",
      "type": "full",
      "status": "succeeded",
      "progressTotal": 20,
      "progressDone": 20,
      "createdAt": "2026-03-15T07:50:00Z",
      "finishedAt": "2026-03-15T08:05:00Z",
      "prUrl": "https://github.com/liyupi/ai-guide/pull/10"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

### 4.14 创建翻译任务

`POST /api/repos/:repoId/tasks`

请求体

```json
{
  "type": "full"
}
```

或

```json
{
  "type": "incremental"
}
```

用途：

- 手动触发全量翻译
- 手动触发增量翻译

返回 `data`

```json
{
  "taskId": "task_456",
  "status": "pending"
}
```

冲突场景：

- 若当前仓库已有运行中任务，返回 `409`

### 4.15 获取任务详情

`GET /api/tasks/:taskId`

用途：

- 任务详情页完整信息

返回 `data`

```json
{
  "id": "task_456",
  "repoId": "repo_123",
  "type": "incremental",
  "status": "running",
  "triggerSource": "manual",
  "progressTotal": 8,
  "progressDone": 3,
  "progressFailed": 0,
  "targetLanguages": ["en", "ja"],
  "changedFiles": [
    "README.md",
    "docs/guide.md"
  ],
  "currentLanguage": "en",
  "currentFile": "docs/guide.md",
  "prUrl": "https://github.com/liyupi/ai-guide/pull/10",
  "readmeNavigationPreview": "## 🌐 Translations\n[English](./translations/en/README.md)",
  "errorSummary": null,
  "createdAt": "2026-03-15T08:10:00Z",
  "startedAt": "2026-03-15T08:10:05Z",
  "finishedAt": null
}
```

### 4.16 获取任务进度

`GET /api/tasks/:taskId/progress`

用途：

- 前端轮询任务进度

返回 `data`

```json
{
  "taskId": "task_456",
  "status": "running",
  "percent": 37,
  "progressTotal": 8,
  "progressDone": 3,
  "progressFailed": 0,
  "currentLanguage": "en",
  "currentFile": "docs/guide.md",
  "prUrl": "https://github.com/liyupi/ai-guide/pull/10"
}
```

说明：

- MVP 先按短轮询实现
- SSE 可在后续版本兼容扩展，当前前端按轮询开发即可

### 4.17 获取任务结果预览

`GET /api/tasks/:taskId/preview?path=README.md&lang=en`

用途：

- 任务详情页查看单文件预览

返回 `data`

```json
{
  "sourcePath": "README.md",
  "targetLanguage": "en",
  "targetPath": "translations/en/README.md",
  "sourceContent": "# 原始标题\n原始内容",
  "translatedContent": "# Title\nTranslated content"
}
```

## 5. 前端无需对接的系统接口

以下接口是系统内部必要能力，但前端通常不直接调用：

| 接口 | 作用 |
|---|---|
| `GET /api/auth/github/callback` | GitHub App 用户授权回调 |
| `POST /api/github/webhooks` | 接收 GitHub App Webhook |

前端只需要处理：

- 浏览器跳转登录
- 登录成功后的页面跳转
- 常规业务 API 调用

## 6. 当前不进入 MVP 的接口

以下能力暂不进入当前前端对接范围：

- 用户自带 OpenRouter Key 管理
- Webhook 自动同步开关
- 失败任务重试
- 历史版本对比
- `.mdx` 文件支持

## 7. 前端开发建议

- 所有任务创建接口都按异步任务处理，不要等待同步完成
- 任务详情页优先轮询 `GET /api/tasks/:taskId/progress`
- 模型、语言、安装列表都以服务端返回为准，不在前端写死
- GitHub PR 链接直接使用后端返回的 `prUrl`
- 配置页保存成功后，前端只更新本地状态，不假设仓库远端文件已立即写回
