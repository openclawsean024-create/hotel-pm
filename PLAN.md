# Plan: hotel-pm — Round 1

> 由 goal round 1 產出。本檔聚焦**最小、可驗收**的 production-readiness 改善。
> 不重構整個目錄、不動 SPEC、不引入新 heavyweight dep。

## Baseline（round 1 開始前）

- `npm run typecheck` → ✅ exit 0
- `npm test` → ✅ 31/31 通過（src/lib/domain.test.ts）
- `npm run build` → ✅ Next.js 16 編譯成功，8 個 static page
- `npm run lint` → ✅ exit 0 但有 1 warning：`sendLineNotify` 的 `payload` 從未被使用（domain.ts:339）
- TODO/FIXME/HACK 掃描 → ✅ 無
- console.log 掃描 → ✅ 無
- 狀態：`STATUS.md` 已 STALE 且與現實矛盾（聲稱「production 沒寫」，事實上 v3 P0 已完成）

## Milestone 1 — Backend（domain.ts 修正）

**owner**：backend
**scope**：`src/lib/domain.ts` + `src/lib/domain.test.ts`
**verify**：`npm run typecheck && npm test && npm run lint && npm run build`
**est. LOC**：~30 行（4 行 domain + ~25 行測試）

具體項目：
1. **lint warning 修復**：`sendLineNotify` 的 `payload` 參數實際上沒被使用。改成 mock 將 payload 寫入 outbox queue（console.warn in dev），讓參數有實際意義。同時加 JSDoc 說明「mock 行為，生產請替換成 LINE Notify API」。
2. **CSV RFC 4180 escape（production bug）**：現有 `createCsv` 沒處理 `,` / `"` / `\n` / `\r`。地址含逗號（如「台北市大安區,和平東路」）會毀掉 CSV。加 escape helper：`escapeCsvField` 把含特殊字元的欄位加上雙引號、外層 `"` 變成 `""`。新增測試覆蓋。
3. **`calculateMonthlyReport` 排除 cancelled booking**：現在即使 `status === 'cancelled'` 也會計入收入，這是 bug。加 filter。新增測試覆蓋。

## Milestone 2 — Docs sync

**owner**：docs
**scope**：`STATUS.md` + 新增 `BUILD_REPORT.md`
**verify**：`cat STATUS.md` 內容與現實一致、`BUILD_REPORT.md` 描述 round 1 變更
**est. LOC**：~40 行

具體項目：
1. **重寫 `STATUS.md`**：把 STALE checkpoint 區塊改成 round 1 的真實狀態（typecheck/test/build 全綠，31/31 pass，v3 P0 features 已交付）。
2. **新增 `BUILD_REPORT.md`**：記錄 round 1 的修正（domain.ts 3 項 + docs 同步），給後續 round 與維運接手用。

## Out of scope (this round)

- 前端頁面（5 個 page.tsx 目前都是 demo UI，UX 與 a11y 改善放到 round 2）
- localStorage → Supabase 真實接線（SPEC §0 說 v2 才做，本 round 不做）
- CI workflow（has_ci = false，devops round 再決定）
- 5 個 page 的 props 真實化（仍用 mock data，round 2/3 處理）
- README（這次 round 不加，避免 scope 膨脹）
- 安全 audit（security round 再做）

## Dependencies

- M1 之後 M2 才能驗證（因為 M1 改了 domain.ts，要先看測試結果）
- M1 / M2 都做完才能宣告 round 1 完成