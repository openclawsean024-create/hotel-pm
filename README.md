# 民宿管家 hotel-pm

> 台灣 1–10 房民宿與 50–200 房包租代管業者的**本土化、低成本**純前端物業管理系統（PMS）。
> 規格詳見 [`PRD/SPEC.md`](./PRD/SPEC.md)。

[![CI](https://github.com/openclawsean024-create/hotel-pm/actions/workflows/ci.yml/badge.svg)](./.github/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#license)

## 特色

- 4 大核心模組：**物業**、**房客**、**訂房**、**月報表**
- 3 種拆帳規則（固定比例、固定金額、階梯式）
- 合約到期自動警示（30 天內 / 已逾期）
- 訂房衝突偵測 + ICS 行事曆匯入
- 維修工單 + POS 驗算 + 法條審核（個資 / 住契約）
- 一鍵 CSV / PDF 匯出 + LINE Notify 訊息推播
- SEO sitemap + Open Graph meta
- 純前端 SPA + localStorage（v2 起加雲端同步）

## 技術棧

| 類別 | 選用 |
|---|---|
| Framework | Next.js 16（App Router、Turbopack） |
| UI | React 19 + Tailwind CSS 4 |
| Language | TypeScript 5.8（strict mode） |
| Test | Vitest 3 |
| E2E | Playwright（spec 待補） |
| Cloud sync | Supabase JS（v2 才接線,目前僅宣告依賴） |
| Hosting | Vercel |

## 快速開始

需求：Node.js ≥ 20、npm ≥ 10。

```bash
npm install         # 安裝依賴
npm run dev         # 開發伺服器（http://localhost:3000）
npm run typecheck   # TypeScript 嚴格型別檢查
npm test            # 跑 Vitest（39 cases）
npm run build       # Next.js 生產建置
npm run lint        # ESLint
```

## 模組總覽

`src/lib/domain.ts` 是純函式 domain layer,涵蓋 15 個函式：

| 函式分類 | 代表函式 | 用途 |
|---|---|---|
| 物業驗證 (F-M1) | `validateProperty` | 欄位必填與範圍檢查 |
| 合約 (F-M2) | `getContractAlerts`、`calculateOverdueDays` | 到期 / 逾期自動警示 |
| 訂房 (F-M3) | `isBookingOverlapping`、`getOccupancyRate`、`parseIcsEvents` | 衝突、入住率、ICS 解析 |
| 拆帳 (F-M6) | `calculateBreakdown`、`calculateMonthlyReport` | 3 種拆帳規則、月報表彙總 |
| 維修 (F-M4/F-M5) | `createMaintenanceRequest`、`assignMaintenanceRequest` | 工單生命週期 |
| 匯出 (F-M7) | `generateReportPdf`、`createCsv` | CSV（RFC 4180 相容）、PDF 預留介面 |
| 通知 (F-M8) | `formatLineNotify`、`sendLineNotify` | LINE Notify 訊息格式與送出 |
| SEO (F-M10) | `generateSitemap`、`openGraphMeta` | sitemap.xml 與 OG meta |

`src/app/` 是 5 個 demo 頁面 + layout,目前用 mock data 展示 domain 函式串接。
localStorage persistence 與真實 CRUD 為 v2 範疇。

## 專案結構

```
.
├── PRD/SPEC.md                # 規格計劃書 v2.2.1
├── STATUS.md                  # 當前進度與 verify 狀態
├── BUILD_REPORT.md            # 變更紀錄（每 round 一節）
├── PLAN.md                    # 短期 milestone 規劃
├── docs/                      # 補充文件（security review 等）
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx           # 首頁（demo 卡片）
│   │   ├── dashboard/page.tsx
│   │   ├── properties/page.tsx
│   │   ├── tenants/page.tsx
│   │   ├── bookings/page.tsx
│   │   └── reports/page.tsx
│   └── lib/domain.ts          # 純函式 domain layer
├── .github/workflows/ci.yml   # CI：typecheck + test + build
├── eslint.config.mjs
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── playwright.config.ts
```

## 變現模式

- **免費版**：1–10 房民宿基礎 PMS
- **民宿版**：NT$499/月（解鎖進階報表、ICS 匯入）
- **包租代管版**：NT$1,499/月（50–200 房、階梯拆帳、Supabase 雲端同步、LINE 推播）

## 授權

MIT — 詳見 [LICENSE](./LICENSE)（v2 規劃,目前 v3 P0 未隨附）。

## 變更紀錄

每輪 round 結束會更新 [`BUILD_REPORT.md`](./BUILD_REPORT.md) 與 [`STATUS.md`](./STATUS.md)。