# 计算机科学（cs-knowledge）

操作系统 / 计算机组成原理 / 数据结构与算法的分步可视讲解站。Next.js 16 App Router 静态导出（`out/`），由 Cloudflare Workers Static Assets 托管。

- 代码：MIT（`LICENSE`）
- 内容（`content/`）：CC BY 4.0（`content/LICENSE`）
- 引用材料各按其原许可；本站与所引用的大学无关联，不代表任何大学背书。
- 发现内容错误：请用 Issue 模板「内容纠错」。

第一版只支持 PC 浏览器。

## 命令
| 命令 | 作用 |
|---|---|
| `npm run build` | 静态导出到 `out/`（含 draft 主题，用于预览） |
| `CS_PRODUCTION=1 npm run build` | 上线构建：只含 published 主题（没有 published 主题时失败） |
| `npm run typecheck` | tsc（当前只跑 tsc + build；vitest/e2e 暂停） |
| `npm run size` | 检查步骤页首屏 JS（gzip）≤ `budget.json` 预算（200 KB） |
| `npm run review` | 输出出处清单（仅供参考，不拦上线）；`--topic os/syscall` `--stale 180` `--check-links` |
| `npm run e2e` | 对 `out/` 起本地静态服务并跑浏览器冒烟测试 |

## 内容
一个主题一个文件：`content/topics/<subject>/<slug>/zh.yaml`；来源表 `content/sources.yaml`。规则见 `src/lib/schema.ts`。
