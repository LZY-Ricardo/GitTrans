# Findings & Decisions

## Current Outcome
- GitTrans MVP 后端已从零搭建完成，包含 Next.js API、Prisma、Worker、GitHub App 集成骨架、OpenRouter 翻译链路和 Docker 配置。
- 当前仓库内已存在可执行的后端代码、初始化迁移、环境变量模板与运行文档。
- 已完成生产构建与健康检查验证。

## Implementation Findings
- 仓库原本没有任何业务代码，只有需求和方案文档，因此本次交付本质上是一次从零初始化。
- Next.js 15 作为 API 宿主是可行的，Route Handlers 足以承接当前 MVP 接口。
- Prisma + MySQL 的组合适合当前数据模型，且可通过离线 diff 先产出初始迁移文件。
- GitHub App 用户授权流与 installation token 模式可以同时满足登录和仓库操作的边界要求。
- OpenRouter 只需要后端统一调用 `chat/completions`，前端不需要直接接触任何模型 Key。
- Worker 当前通过数据库轮询领取任务，已经满足 MVP 的最小可靠性要求。

## Verification Findings
- Prisma schema 校验已通过。
- Prisma Client 已成功生成。
- 生产构建已通过。
- 生产服务可在独立构建目录 `.next-prod` 下成功启动，并返回 `/api/health` 成功响应。
- 当前机器未启动 Docker 守护进程，因此无法在本地进一步完成 MySQL 容器联调。
- 当前机器的 `MySQL80` Windows 服务处于运行状态，3306 端口已监听，因此本轮可以直接做本机数据库联调，不依赖 Docker。

## External Constraints
- 未配置 GitHub App 时，认证、安装、仓库导入、PR 写回能力不会真正工作。
- 未配置 OpenRouter Key 时，翻译任务无法真正调用模型。
- 未启动 MySQL 时，除健康检查和静态元信息接口外，其它依赖数据库的接口无法完整联调。
- 当前前端页面仍基于本地 mock 数据展示，无法代表真实后端联调结果；若要完成 MVP 闭环，必须把页面切到真实 API。

## New Findings: 2026-03-17
- `src/app/dashboard/page.tsx`、`src/app/repo/[id]/page.tsx`、`src/app/repo/[id]/config/page.tsx`、`src/app/task/[id]/page.tsx`、`src/app/settings/page.tsx` 均直接依赖 `src/modules/mvp/mock-data.ts`。
- `src/components/mvp/config-editor.tsx` 的保存动作仍是本地延时模拟，并未调用 `PUT /api/repos/:repoId/config`。
- 后端的 `repos`、`tasks`、`auth/session`、`github/installations` 等 Route Handlers 已存在，当前主要断点在前端接线而非接口缺失。

## Fixes Applied: 2026-03-17
- 新增页面数据层，前端页面已改为读取真实会话、仓库、配置和任务数据，不再依赖 `mock-data`。
- `ConfigEditor` 已切换为真实保存逻辑，调用 `PUT /api/repos/:repoId/config` 并刷新页面状态。
- 仓库详情页已新增真实任务创建入口，调用 `POST /api/repos/:repoId/tasks` 后跳转到任务详情页。
- 任务详情页已增加轮询组件，定期请求 `GET /api/tasks/:taskId/progress`。
- 导入仓库面板已切换为真实 API 流程，并对“未绑定 GitHub 账号 / 无可用安装”做了空态处理。
- GitHub 安装 ID 在服务层增加了显式校验，异常场景返回业务错误而不是底层 SDK 报错。

## Latest Verification
- `GET /api/auth/session`：通过
- `GET /api/meta/bootstrap`：通过
- `GET /api/repos`：通过
- `GET /api/repos/:repoId`：通过
- `GET /api/repos/:repoId/config`：通过
- `PUT /api/repos/:repoId/config`：通过
- `GET /api/repos/:repoId/tasks`：通过
- `POST /api/repos/:repoId/tasks`：通过
- 同仓库重复创建任务：正确返回 `409 TASK_CONFLICT`
- `GET /api/tasks/:taskId`：通过
- `GET /api/tasks/:taskId/progress`：通过
- `GET /api/tasks/:taskId/preview`：通过
- `GET /api/repos/:repoId/files` 在无效安装信息下：正确返回 `503 GITHUB_INSTALLATION_INVALID`
- `/dashboard`、`/repo/[id]`、`/repo/[id]/config`、`/task/[id]`、`/settings`：已在浏览器中完成实际验收

## Key Files
- 接口文档：[docs/MVP接口文档.md](F:/myProjects/GitTrans/docs/MVP接口文档.md)
- 人工配置文档：[docs/人工进行的配置文档.md](F:/myProjects/GitTrans/docs/人工进行的配置文档.md)
- 快速启动文档：[docs/快速启动说明文档.md](F:/myProjects/GitTrans/docs/快速启动说明文档.md)
- Prisma schema：[prisma/schema.prisma](F:/myProjects/GitTrans/prisma/schema.prisma)
- 初始化迁移：[prisma/migrations/20260315100000_init/migration.sql](F:/myProjects/GitTrans/prisma/migrations/20260315100000_init/migration.sql)

---
*Update this file after every 2 view/browser/search operations*
