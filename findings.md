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

## External Constraints
- 未配置 GitHub App 时，认证、安装、仓库导入、PR 写回能力不会真正工作。
- 未配置 OpenRouter Key 时，翻译任务无法真正调用模型。
- 未启动 MySQL 时，除健康检查和静态元信息接口外，其它依赖数据库的接口无法完整联调。

## Key Files
- 接口文档：[docs/MVP接口文档.md](F:/myProjects/GitTrans/docs/MVP接口文档.md)
- 人工配置文档：[docs/人工进行的配置文档.md](F:/myProjects/GitTrans/docs/人工进行的配置文档.md)
- 快速启动文档：[docs/快速启动说明文档.md](F:/myProjects/GitTrans/docs/快速启动说明文档.md)
- Prisma schema：[prisma/schema.prisma](F:/myProjects/GitTrans/prisma/schema.prisma)
- 初始化迁移：[prisma/migrations/20260315100000_init/migration.sql](F:/myProjects/GitTrans/prisma/migrations/20260315100000_init/migration.sql)

---
*Update this file after every 2 view/browser/search operations*
