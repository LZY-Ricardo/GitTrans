# Task Plan: GitTrans MVP 后端开发与运行验证

## Goal
基于现有需求文档、技术方案文档和已确认的接口文档，完成 GitTrans MVP 后端实现，并补齐人工配置文档、快速启动说明以及可执行的运行验证。

## Current Phase
Phase 6

## Phases
### Phase 1: Environment & Scope
- [x] 检查仓库现状与运行环境
- [x] 确认当前仓库只有文档，需要从零搭建项目
- [x] 继续遵循 GitHub App + OpenRouter + MySQL + Worker 的 MVP 方案
- **Status:** complete

### Phase 2: Project Bootstrap
- [x] 搭建 Next.js + TypeScript + Prisma 工程骨架
- [x] 创建环境变量、日志、加密、会话、数据库基础设施
- [x] 配置 Docker 与 Prisma schema
- **Status:** complete

### Phase 3: Backend Implementation
- [x] 实现认证、仓库导入、配置、文件树、任务接口
- [x] 实现 GitHub App 集成、OpenRouter 翻译、README 导航、PR 写回
- [x] 实现 Worker 轮询与 webhook 入队
- **Status:** complete

### Phase 4: Docs & Migration
- [x] 生成 Prisma 初始化迁移
- [x] 输出《人工进行的配置文档》
- [x] 输出《快速启动说明文档》
- **Status:** complete

### Phase 5: Verification
- [x] 执行 Prisma schema 校验
- [x] 执行生产构建
- [x] 启动生产服务并探活 `/api/health`
- **Status:** complete

### Phase 6: Integration Testing & Bug Fixing
- [x] 重新核对需求/方案/API 文档与现有代码
- [x] 确认后端 API 路由已基本齐备
- [x] 确认前端页面仍由 `src/modules/mvp/mock-data.ts` 驱动
- [x] 启动真实服务并独立测试后端接口
- [x] 启动前端页面并验证主流程
- [x] 修复 MVP 关键断点并回归验证
- **Status:** complete

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 保持 Next.js 作为 API 宿主 | 与既定方案一致，便于后续前端接入 |
| GitHub / OpenRouter 统一由后端代理 | 满足安全边界，避免前端直接持有敏感凭据 |
| 任务执行采用独立 Worker + 数据库轮询 | 满足 MVP 可恢复性，不引入 Redis |
| 由于当前机器已有 dev 进程占用默认 `.next` 目录，验证时使用 `.next-prod` | 避免开发产物覆盖生产构建产物 |
| Docker 守护进程未启动时，迁移文件改用 Prisma 离线 diff 生成 | 不阻塞交付，保留可执行迁移文件 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `next build` 在沙箱内报 `spawn EPERM` | 1 | 通过提权重新执行构建 |
| GitHub 安装对象联合类型导致 TS 报错 | 1 | 改为显式收窄 account 字段 |
| 当前机器存在 `next dev` 占用默认 `.next` 目录，导致 `next start` 找不到 `BUILD_ID` | 1 | 为验证引入 `NEXT_DIST_DIR=.next-prod` |
| Docker 守护进程未启动，无法本机拉起 MySQL 容器 | 1 | 使用 Prisma diff 离线生成初始化迁移 |

## Notes
- 生产构建与健康检查已经通过。
- 由于 GitHub App 和 OpenRouter 还未配置，集成能力处于未激活状态，但服务本身可启动。
- 若下一步继续推进，应优先做真实 MySQL + GitHub App + OpenRouter 联调。
- 2026-03-17 复核发现：MySQL80 服务已运行且 3306 端口可用，本地 `.env` 已配置完整键集合。
- 2026-03-17 复核发现：前端首页、仓库页、配置页、任务页、设置页目前均未接真实后端接口，而是直接消费 `mock-data`。
- 2026-03-17 已完成前端页面接线：页面改为读取真实会话 / 仓库 / 任务 / 配置数据，配置保存与任务创建改为真实 API 调用。
- 2026-03-17 已完成本地种子数据联调：`session`、`repos`、`config`、`tasks`、`progress`、`preview`、`task conflict` 均已验证。
- 2026-03-17 补充了 GitHub 安装 ID 的服务层校验：无效安装信息现在返回明确的 `GITHUB_INSTALLATION_INVALID`，不再把底层 SDK 错误直接暴露给页面。
