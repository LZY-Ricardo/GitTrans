# GitTrans 需求规格文档（完整整合版）

| 字段 | 内容 |
|---|---|
| 项目名称 | GitTrans |
| 文档类型 | PRD / Requirements Specification |
| 文档版本 | v2.0 |
| 文档状态 | Draft |
| 更新日期 | 2026-03-15 |
| 适用范围 | GitTrans SaaS MVP |

---

## 1. 项目概述

### 1.1 项目名称

**GitTrans**

### 1.2 项目背景

GitTrans 是一个面向 GitHub 仓库文档场景的多语言翻译 SaaS 平台。

项目最初源于中文开源教程仓库国际化的真实需求，例如 `liyupi/ai-guide` 这类中文优先的知识仓库，希望在不依赖人工翻译的前提下，自动生成英文及其他语言版本，扩大海外访问量和国际影响力。

与仅为单个仓库编写 GitHub Workflow 的方案不同，GitTrans 目标是成为可复用、可托管、可持续同步的通用型服务。

### 1.3 项目定位

一站式 GitHub 仓库多语言翻译 SaaS 平台，帮助开源项目作者将文档自动翻译成多种语言，并在基准语言更新后自动完成增量同步。

### 1.4 目标用户

- 开源项目维护者
- 技术博客 / 教程作者
- 希望让项目国际化的开发者
- 中文项目出海需求者
- 使用 GitHub 作为文档源的开发者关系团队或内容团队

### 1.5 核心价值主张

> **零配置，一键翻译，让你的 GitHub 项目走向全球**

相比现有方案（如 `Azure/co-op-translator`、`Crowdin`、`GitLocalize` 等），GitTrans 的核心差异化价值为：

- 即开即用：无需自行配置 GitHub Actions、无需准备本地运行环境
- SaaS 服务：直接提供网页服务，在线完成仓库接入、翻译和同步
- 多模型支持：通过 OpenRouter 统一接入多种 AI 模型
- 智能同步：自动检测 GitHub 提交变更，只处理受影响文件
- 可视化配置：通过界面选择翻译范围，无需纯手工维护配置
- 面向 GitHub 文档仓库：聚焦 README、Markdown 文档和教程型仓库

### 1.6 产品目标

GitTrans MVP 的目标是让仓库维护者能够：

1. 使用 GitHub 账号登录 GitTrans
2. 连接并管理目标 GitHub 仓库
3. 配置基准语言、目标语言、翻译目录、忽略规则和模型
4. 对仓库 Markdown 文档执行首次全量翻译
5. 在基准语言发生变更后，通过 GitHub 提交记录实现自动增量翻译
6. 自动生成或更新翻译 Pull Request
7. 在 README 中自动插入多语言切换链接

---

## 2. 产品形态

### 2.1 主要形态

**在线平台 / SaaS 服务**

### 2.2 服务模式

| 模式 | 说明 | 优先级 |
|---|---|---|
| 托管模式 | 平台提供 AI 翻译服务，用户直接使用，可结合套餐、配额或计费策略 | P0 |
| 自带密钥模式 | 用户配置自己的 OpenRouter API Key，平台负责翻译流程和仓库同步 | P1 |

### 2.3 访问方式

- Web 网页应用
- GitHub OAuth 登录
- GitHub App 仓库授权与事件接收

说明：

- Web 应用是用户主入口
- GitHub OAuth 负责用户身份登录
- GitHub App 用于仓库授权、Webhook、分支写入和 PR 创建

### 2.4 平台边界

MVP 阶段：

- 优先支持 GitHub 公共仓库
- 以单仓库、单基准分支、单基准语言为主要运行模式
- 输出以 Pull Request 为主，不直接修改默认分支

---

## 3. 范围定义

### 3.1 MVP 范围内

- GitHub 登录与仓库连接
- README 和 Markdown 文档翻译
- 用户通过 UI 选择翻译目录 / 文件
- 忽略规则文件同步
- 语言标准列表选择
- OpenRouter 模型选择
- 手动触发翻译
- 基于 commits 的增量检测
- 自动生成或更新翻译 PR
- README 多语言导航区自动插入
- 翻译进度、结果和任务状态展示

### 3.2 MVP 不包含

- 图片文字识别与图片翻译
- Jupyter Notebook 翻译
- Wiki / Issues / Release Notes / Discussions 翻译
- 术语库、翻译记忆、人工审核工作台
- 任意非 Markdown 文档格式
- 多模型网关以外的原生 Anthropic / Gemini / Ollama 接入
- 团队协作权限系统
- 直接写入默认分支

---

## 4. 产品假设与约束

### 4.1 产品假设

- 仓库使用 GitHub 作为唯一源
- 仓库存在可识别的基准语言内容
- 用户愿意通过 Pull Request 审查翻译结果
- 主要翻译对象为 Markdown 文档与 README
- 用户可以从标准语言列表中选择目标语言，而不是自由输入

### 4.2 技术约束

- MVP 技术栈：`Node.js / TypeScript`
- 模型接入：`OpenRouter`
- 增量同步依据：`GitHub commits / compare API / webhook`
- 输出结构：`translations/{lang}/...`

### 4.3 范围控制原则

为了避免 SaaS MVP 过重，以下能力必须严格后置：

- 图片翻译
- Notebook 翻译
- 翻译人工编辑器
- 复杂协作审核工作流
- 自定义任意输出模板
- 非 OpenRouter 多模型原生适配

---

## 5. 用户角色

### 5.1 普通用户

使用 GitHub 登录、导入仓库、配置翻译任务、查看结果。

### 5.2 仓库管理员 / 维护者

安装 GitHub App、审核翻译 Pull Request、管理仓库级配置。

### 5.3 GitTrans 平台系统

负责：

- 接收 GitHub 事件
- 管理任务队列
- 调用 OpenRouter 模型
- 写入翻译文件
- 创建或更新 Pull Request
- 记录同步状态和运行日志

---

## 6. 功能需求

### 6.1 MVP 核心功能清单

#### 6.1.1 用户认证模块

| 功能 | 优先级 | 说明 |
|---|---|---|
| GitHub OAuth 登录 | P0 | 使用 GitHub 账号登录，建立用户身份 |
| GitHub App 授权 | P0 | 获取仓库访问权限、Webhook 和 PR 操作权限 |
| 用户配置管理 | P0 | 管理 OpenRouter API Key、默认语言设置等 |

#### 6.1.2 仓库管理模块

| 功能 | 优先级 | 说明 |
|---|---|---|
| 导入 GitHub 仓库 | P0 | 输入仓库 URL 或从已授权仓库列表中选择 |
| 仓库列表展示 | P0 | 展示已导入仓库、状态、最近任务和 PR 信息 |
| 仓库配置 | P0 | 配置基准语言、目标语言、翻译范围、模型等 |

#### 6.1.3 翻译配置模块

| 功能 | 优先级 | 说明 |
|---|---|---|
| 语言选择 | P0 | 从标准化语言列表中选择目标语言 |
| 翻译范围选择 | P0 | 可视化选择要翻译的目录 / 文件 |
| 忽略规则配置 | P0 | 支持 `.github-global-ignore` 文件配置并与 UI 同步 |
| AI 模型选择 | P0 | 选择 OpenRouter 下的模型 |
| 基准语言配置 | P0 | 设置源语言代码 |
| 基准分支配置 | P0 | 设置需要监听和翻译的分支 |

#### 6.1.4 翻译执行模块

| 功能 | 优先级 | 说明 |
|---|---|---|
| 手动触发翻译 | P0 | 用户点击按钮触发全量或增量翻译 |
| 翻译进度展示 | P0 | 展示当前任务进度、文件数量、语言数量、状态 |
| 翻译结果预览 | P0 | 预览翻译后的文件内容和 README 导航区 |
| 提交到仓库 | P0 | 将翻译结果提交到 GitHub 翻译分支并创建 / 更新 PR |

#### 6.1.5 变更检测与同步模块

| 功能 | 优先级 | 说明 |
|---|---|---|
| Commits 变更检测 | P0 | 通过 GitHub API 获取最新提交并检测基准语言文件变更 |
| 增量翻译 | P0 | 仅翻译发生变更的文件 |
| 自动同步 | P1 | 通过 Webhook 监听仓库变更并自动触发翻译 |
| 去重处理 | P1 | 避免重复 webhook 或重复任务导致重复 PR |

#### 6.1.6 README 智能处理模块

| 功能 | 优先级 | 说明 |
|---|---|---|
| 多语言链接生成 | P0 | 自动在 README 中插入多语言版本切换链接 |
| 智能位置识别 | P0 | AI + 规则分析 README 结构，选择合适插入位置 |
| 重复插入防护 | P0 | 多次同步时只更新已有语言导航区，不重复追加 |

#### 6.1.7 任务与状态模块

| 功能 | 优先级 | 说明 |
|---|---|---|
| 任务详情 | P0 | 查看任务状态、耗时、变更文件、错误信息 |
| 历史记录 | P1 | 查看历史翻译任务和最近 PR |
| 失败重试 | P1 | 支持失败任务重试 |

---

## 7. 功能详细说明

### 7.1 语言选择

系统必须提供标准化语言列表，防止用户输入无效内容或不规范代码。

首批标准语言表示例：

| 语言代码 | 语言名称 | 英文名称 |
|---|---|---|
| en | 英语 | English |
| zh-CN | 简体中文 | Simplified Chinese |
| zh-TW | 繁体中文 | Traditional Chinese |
| ja | 日语 | Japanese |
| ko | 韩语 | Korean |
| es | 西班牙语 | Spanish |
| fr | 法语 | French |
| de | 德语 | German |
| pt | 葡萄牙语 | Portuguese |
| ru | 俄语 | Russian |
| ar | 阿拉伯语 | Arabic |
| hi | 印地语 | Hindi |
| it | 意大利语 | Italian |
| nl | 荷兰语 | Dutch |
| pl | 波兰语 | Polish |
| tr | 土耳其语 | Turkish |
| vi | 越南语 | Vietnamese |
| th | 泰语 | Thai |
| id | 印尼语 | Indonesian |
| ms | 马来语 | Malay |

要求：

- UI 使用下拉或多选组件展示标准语言列表
- 存储层使用标准语言代码
- 禁止自由文本直接作为语言代码

### 7.2 翻译范围配置

#### 7.2.1 可视化配置界面

系统应支持：

- 展示仓库文件树结构
- 通过复选框选择要翻译的目录 / 文件
- 支持全选 / 反选
- 自动识别 Markdown 文件
- 对非 Markdown 文件进行禁用或标识

#### 7.2.2 配置文件同步

系统需要保证界面配置和仓库配置同步。

整合方案：

- 仓库主配置文件：`.gittrans.yml`
- 忽略规则文件：`.github-global-ignore`
- UI 的路径选择结果写入 `.gittrans.yml`
- UI 的忽略规则写入 `.github-global-ignore`
- 修改仓库中的上述配置后，界面应自动反映最新内容

#### 7.2.3 `.github-global-ignore` 文件格式

```gitignore
# 忽略 node_modules
node_modules/

# 忽略特定文件
CHANGELOG.md
CONTRIBUTING.md

# 忽略特定目录
docs/internal/
.vuepress/
```

要求：

- 忽略规则应采用类似 `.gitignore` 的模式匹配
- UI 中应可见哪些目录 / 文件因为 ignore 规则被排除

### 7.3 翻译存储结构

翻译后的文件存储在 `translations/` 目录下，按语言分目录：

```text
repository/
├── README.md
├── docs/
│   └── guide.md
├── translations/
│   ├── en/
│   │   ├── README.md
│   │   └── docs/
│   │       └── guide.md
│   ├── ja/
│   │   ├── README.md
│   │   └── docs/
│   │       └── guide.md
│   └── ...
├── .gittrans.yml
└── .github-global-ignore
```

输出规则：

- 输出路径固定为 `translations/{lang}/{original-relative-path}`
- 保留原目录层级结构
- 删除源文件时，对应译文应在 PR 中一并删除或标记处理

### 7.4 多语言链接生成

系统应自动分析 README 结构，在合适位置插入多语言切换链接。

生成格式示例：

```markdown
## 🌐 多语言版本 / Translations

[English](./translations/en/README.md) | [日本語](./translations/ja/README.md) | [한국어](./translations/ko/README.md)

---
```

插入位置策略：

1. 如果存在现有语言切换区域，则更新该区域
2. 如果存在项目标题后的介绍区域，则在介绍后插入
3. 如果存在目录（TOC），则在目录之前插入
4. 兜底方案：在文件开头插入

增强规则：

- 若仓库配置了显式标记位，优先按标记位插入
- 多次同步不可重复插入多段导航区
- 如果某些目标语言译文尚未生成，不应生成失效链接

### 7.5 OpenRouter 模型接入

MVP 仅通过 OpenRouter 提供模型能力。

要求：

- 模型列表应来自 OpenRouter allowlist 或受控配置
- 仓库级可选择一个默认模型
- 平台托管模式下由平台统一管理 OpenRouter 密钥
- 自带密钥模式下允许用户保存自己的 OpenRouter Key

说明：

- 该设计用于避免 `co-op-translator` 那类仅支持 Azure/OpenAI 双 provider 的限制
- OpenRouter 统一入口能够更好覆盖多模型场景

### 7.6 基于 commits 的增量同步

系统必须以 GitHub 提交信息为基础实现增量翻译。

推荐实现：

1. 为每个仓库记录最近一次成功同步的基准提交 SHA
2. 接收到新提交事件后，对比 `lastSyncedSha...currentHeadSha`
3. 获取变更文件列表
4. 筛选：
   - 位于翻译范围内
   - 非 ignore 排除
   - 扩展名为支持的 Markdown 类型
5. 仅对受影响文件执行重翻译

这既满足你提出的“利用网络请求获取 GitHub commits 自动判断更新哪些”的要求，也比简单全量扫描更节省成本。

---

## 8. 核心流程

### 8.1 翻译执行流程

```text
用户点击“开始翻译”
        │
        ▼
┌────────────────────┐
│ 1. 获取仓库信息     │ ──► GitHub API 获取文件树和配置
└────────────────────┘
        │
        ▼
┌────────────────────┐
│ 2. 筛选待翻译文件   │ ──► 根据 include / ignore 过滤 Markdown
└────────────────────┘
        │
        ▼
┌────────────────────┐
│ 3. 检测变更文件     │ ──► 对比 commits，找出变更文件
└────────────────────┘
        │
        ▼
┌────────────────────┐
│ 4. 调用 AI 翻译     │ ──► OpenRouter API 翻译内容
└────────────────────┘
        │
        ▼
┌────────────────────┐
│ 5. 生成翻译文件     │ ──► 保存到 translations/{lang}/
└────────────────────┘
        │
        ▼
┌────────────────────┐
│ 6. 更新 README      │ ──► 插入或更新多语言切换链接
└────────────────────┘
        │
        ▼
┌────────────────────┐
│ 7. 提交到 GitHub    │ ──► 创建 commit / branch / PR
└────────────────────┘
```

### 8.2 变更检测流程

```text
接收 GitHub 事件或用户手动触发
        │
        ▼
┌────────────────────┐
│ 1. 获取最近 commits │
└────────────────────┘
        │
        ▼
┌────────────────────┐
│ 2. 解析变更文件列表 │
└────────────────────┘
        │
        ▼
┌────────────────────┐
│ 3. 过滤基准语言下   │
│    的 Markdown 文件 │
└────────────────────┘
        │
        ▼
┌────────────────────┐
│ 4. 检查对应语言版本 │
│    是否需要更新     │
└────────────────────┘
        │
        ▼
┌────────────────────┐
│ 5. 返回待翻译文件   │
│    列表             │
└────────────────────┘
```

### 8.3 初始接入流程

```text
GitHub 登录
  → 安装 / 授权 GitHub App
  → 选择仓库
  → 配置语言、范围、模型
  → 保存配置
  → 执行首次全量翻译
  → 创建翻译 PR
```

---

## 9. UI / UX 设计要点

### 9.1 主要页面

| 页面 | 路径 | 功能 |
|---|---|---|
| 首页 | `/` | 产品介绍、登录入口 |
| 仪表盘 | `/dashboard` | 仓库列表、快速操作 |
| 仓库详情 | `/repo/:id` | 仓库配置、翻译操作、历史记录 |
| 翻译配置 | `/repo/:id/config` | 语言选择、范围选择、ignore 和模型配置 |
| 任务详情 | `/task/:id` | 翻译进度、结果预览、错误信息 |
| 设置 | `/settings` | API Key 配置、账户设置 |

### 9.2 核心交互流程

```text
登录
→ 导入仓库
→ 配置翻译（语言 + 范围 + 模型）
→ 开始翻译
→ 查看进度
→ 预览结果
→ 提交到 GitHub
```

### 9.3 UX 原则

- 新用户应在 10 分钟内完成首次接入
- 不要求用户理解 GitHub Actions、CI 或复杂命令行
- 翻译范围和 ignore 配置必须可视化、可理解
- README 导航预览应清晰展示插入结果

---

## 10. 数据与配置模型

### 10.1 仓库主配置 `.gittrans.yml`

建议字段：

- `repo`
- `baseBranch`
- `baseLanguage`
- `targetLanguages`
- `include`
- `ignoreFile`
- `outputRoot`
- `model.provider`
- `model.id`
- `readmeNavigation.enabled`
- `pullRequest.branch`
- `pullRequest.titleTemplate`

### 10.2 Ignore 配置 `.github-global-ignore`

用于表达路径级排除规则。

### 10.3 同步状态

建议字段：

- 仓库 ID
- 基准分支
- 最近同步成功的 commit SHA
- 最近处理的 webhook delivery ID
- 当前翻译 PR 编号
- 最近一次成功翻译时间

### 10.4 任务记录

建议字段：

- 任务 ID
- 仓库 ID
- 触发方式
- commit 范围
- 变更文件列表
- 目标语言列表
- 模型 ID
- 状态
- 错误摘要
- PR 链接

---

## 11. 非功能需求

### 11.1 性能要求

- 支持并发翻译多个文件
- 初始全量翻译应支持中等规模文档仓库
- 增量同步应明显快于全量翻译
- 大文件或大批量任务应采用异步处理、队列化执行

### 11.2 安全要求

- GitHub Token / 安装令牌加密存储
- OpenRouter API Key 加密存储
- 支持用户删除数据
- GitHub 权限遵循最小授权原则

### 11.3 可用性要求

- 支持翻译任务失败重试
- 同一 webhook 重复投递时系统应具备幂等处理能力
- 单文件翻译失败不应必然导致整个任务失败

### 11.4 可观测性要求

- 记录任务开始 / 结束 / 错误日志
- 记录 webhook 接收、commit diff、翻译调用和 PR 更新
- 每次任务必须具备可追踪 ID

### 11.5 可靠性要求

- 不能因重复 webhook 创建重复 PR
- 不能因部分文件失败而丢失整个任务上下文
- 需要保留最近任务和错误信息供用户查看

---

## 12. 外部集成需求

### 12.1 GitHub

MVP 至少需要：

- GitHub OAuth 登录
- GitHub App 安装授权
- 读取仓库文件树和配置
- 读取 commits 和 compare 结果
- 创建分支、提交内容
- 创建和更新 Pull Request
- 接收 webhook 事件

### 12.2 OpenRouter

MVP 至少需要：

- 模型列表或平台 allowlist
- Chat Completions 接口
- 错误码与限流识别
- 账单 / 配额相关策略对接

---

## 13. MVP 成功标准

MVP 成功的最低标准：

1. 用户可以通过网页完成 GitHub 登录和仓库接入
2. 用户可以配置基准语言、目标语言、翻译范围、ignore 规则和模型
3. 用户可以执行首次全量翻译
4. 翻译结果以 `translations/{lang}/...` 写入仓库
5. README 可自动生成稳定的多语言导航区
6. 系统可以根据 commits 识别变更文件并增量更新译文
7. 系统可以自动创建或更新翻译 Pull Request
8. 用户可以在 UI 中查看任务状态、预览结果和错误信息

---

## 14. 项目里程碑（开发步骤）

### Phase 1: MVP 基础闭环

- [ ] 项目初始化、技术架构搭建
- [ ] GitHub OAuth 登录
- [ ] GitHub App 仓库授权
- [ ] 仓库导入和列表展示
- [ ] 基础翻译配置（语言选择、模型选择）
- [ ] 手动触发翻译（全量）
- [ ] 翻译结果提交到 GitHub

### Phase 2: 核心功能完善

- [ ] 可视化翻译范围选择
- [ ] `.github-global-ignore` 配置同步
- [ ] 基于 commits 的变更检测与增量翻译
- [ ] README 多语言链接自动生成
- [ ] 翻译进度实时展示

### Phase 3: 体验优化

- [ ] 翻译结果预览
- [ ] 翻译历史记录
- [ ] 错误处理和重试机制
- [ ] UI / UX 优化
- [ ] 仓库配置读写一致性校验

### Phase 4: 扩展功能

- [ ] Webhook 自动触发全面启用
- [ ] 自带密钥模式
- [ ] 翻译质量评估
- [ ] 更多文件格式支持
- [ ] 团队协作功能

---

## 15. 风险与应对

| 风险 | 影响 | 应对策略 |
|---|---|---|
| OpenRouter API 限流 | 翻译速度变慢或任务失败 | 支持请求队列、重试机制、自带 API Key 模式 |
| GitHub API 限流 | 无法获取仓库信息或提交信息 | 缓存 API 响应、减少无效请求、优化 compare 调用 |
| AI 翻译质量不稳定 | 用户体验下降 | 提供预览、支持后续人工编辑能力、优先选择高质量模型 |
| 大文件翻译超时 | 任务失败 | 分块翻译、异步任务、任务超时重试 |
| README 智能插入位置不准确 | 导航区位置不理想 | 规则优先 + AI 辅助，并提供预览 |
| 重复 webhook 导致重复任务 | 重复翻译、重复 PR | 引入幂等键与 delivery 去重 |
| SaaS 运维复杂度高 | 首版上线风险增加 | 严格控制 MVP 范围，只支持 Markdown 与公共仓库 |

---

## 16. 参考项目与参考资料

### 16.1 参考项目

- [Azure/co-op-translator](https://github.com/Azure/co-op-translator) - 微软文档翻译工具
- [OpenAiTx](https://github.com/OpenAiTx/OpenAiTx) - GitHub 多语言翻译平台
- [action-continuous-translation](https://github.com/pelikhan/action-continuous-translation) - 持续翻译 Action
- [GitLocalize](https://gitlocalize.com/) - GitHub 项目持续本地化平台
- [Crowdin GitHub Integration](https://store.crowdin.com/github) - GitHub 与翻译平台同步方案

### 16.2 外部参考依据

本需求文档同时吸收了以下输入：

- 用户对产品形态、技术栈、模型接入、翻译范围和同步机制的确认
- `docs/对比需求文档.md` 中的全部功能条目、流程、页面和里程碑内容
- 对 GitHub webhook、commits、PR、contents 能力的调研
- 对 `Azure/co-op-translator` 和 `semantic-kernel` 的代码级分析

---

## 17. 最终结论

GitTrans 的正确 MVP 不是 CLI，也不是单仓库脚本，而是：

> 一个以 GitHub 为源、以 OpenRouter 为模型入口、以 Markdown 文档为首要对象、以 commits 增量检测为核心同步机制的 GitHub 仓库翻译 SaaS。

该版本已经覆盖：

- `docs/对比需求文档.md` 中的全部核心内容
- 之前 `docs/requirements-spec.md` 中关于范围控制、系统约束、集成能力和验收标准的补充内容

它可以直接作为下一阶段系统设计、数据库设计、架构设计和开发拆解的依据。
