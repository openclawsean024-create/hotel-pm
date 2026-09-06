# hotel-pm · 變更日誌

> 對齊 SPEC v3.0 契約，採 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/) 格式 + [語意化版本](https://semver.org/lang/zh-TW/)。

---

## [v3.0.2] — 2026-09-06 — Sean 10-repo-fleet 升級

### Added
- `PRD/SPEC.md`：v3.0.2 入口規格書（既有 1220 行 v2.2.1 內容頂部加 v3.0.2 banner + 文末加 §A 增量章節）
  - v3.0.2 banner：說明本次升級是「頂部 banner + 增量章節」而非重寫，保留 v2.2.1 完整性
  - §A.1 部署契約：DEPLOY_TARGET=vercel、雙 deploy 路徑（Vercel GitHub App 自動 + GHA workflow_dispatch 備援）
  - §A.2 DoD 完整版：12 條條件全綠（typecheck / lint / 71 tests / 12 static pages / 15 E2E / security headers / no TODO / no secrets / PRD / CHANGELOG / 5 jobs CI / Vercel deploy）
  - §A.3 5 條 Non-Goals
  - §A.4 變更日誌引用
- `PRD/CHANGELOG.md`：本檔
- `devDependencies.@testing-library/dom`：`^10.x`（補齊 use-local-storage.test.ts 的 transitive dep — 既有 `package.json` 缺此 dev dep 導致 vitest 失敗，補上後 71/71 全綠）
- `package-lock.json`：npm install regen（含 @testing-library/dom + 它的 transitive）

### Changed
- `PRD/SPEC.md` 頂部從「# 飯店 / 包租代管物業管理 — 規格計劃書 v2.2.1」改為「v3.0.2」（banner 樣式 + 增量章節導引）

### Deprecated
- 無

### Removed
- 無

### Fixed
- **vitest use-local-storage.test.ts 失敗**（既有 bug）：`@testing-library/dom` 未列在 devDependencies 導致 `Cannot find module '@testing-library/dom'` — 補上後 71/71 全綠

### Security
- 無

---

## [v3.0.0 → v3.0.1] — 2026-08 rpb Round 1-8

### Round 1-8 累計（詳見 `STATUS.md` + `BUILD_REPORT.md` 1095 行）

- ✅ **8 round rpb（production-ready pass）**
- ✅ **86 tests**（Round 8 完成時）→ 71 tests（v3.0.2 確認實際數：domain 57 + storage 8 + use-local-storage 6 = 71）
- ✅ **CI 5 jobs**：typecheck / test / lint / build / E2E
- ✅ **Security headers**（next.config.mjs）：CSP / X-Frame-Options / HSTS / Permissions-Policy
- ✅ **ESLint 0 errors / 0 warnings**（換用 `eslint-config-next/core-web-vitals` via FlatCompat）
- ✅ **15/15 Playwright E2E**（dashboard / favorite / routes）

### 主要改動
- `src/lib/domain.ts` 修正（Round 1）
- `eslint.config.mjs` Flat config + FlatCompat 包裝 legacy preset
- `next.config.mjs` 加上 security headers
- `playwright.config.ts` E2E 設定
- `vitest.config.ts` Unit test 設定

---

## [v2.2.1] — 2026-07-19 — Sweet-spot-driven rewrite

### Added
- `PRD/SPEC.md` v2.2.1（1220 行）：sweet-spot-driven 完整規格書
- 5 種 persona + 訪談 SOP
- 6 個主要場景 + mermaid 流程圖
- 4 大模組（物業 / 房客 / 訂房 / 月報表）
- 5 條 ADR
- 10 個競爭對手分析
- 變現模式（免費 + 民宿版 NT$499/月 + 包租代管版 NT$1,499/月）

### Notes
- sweet score = 7/7（fleet 內少數 GO 級專案）
- 行動建議：GO!

---

## [v2.0 → v2.2.1] — 2026-06~07

- 多 persona 訪談 + sweet-spot 評估
- 5 大模組 P0 完成（物業 / 房客 / 訂房 / 月報表 / Dashboard）
- localStorage 為主、雲端同步（@supabase/supabase-js）為 v2 加值

---

## [v1.x] — 2025~2026 Q1

- 初始版本
- 純前端 SPA + localStorage
- TypeScript + Next.js 起步

---

<!-- v3.0.2 完成於 2026-09-06 by Sean 10-repo-fleet -->
