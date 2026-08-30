# Security Review — Round 2

> 由 `repo-prompt-builder` goal session round 2 產出。
> 範圍：`src/lib/domain.ts`、`src/app/**/*.{ts,tsx}`、`package.json`、`*.config.{ts,mjs}`。
> 不涵蓋：基礎設施（Vercel 環境變數管理、Supabase RLS、CDN headers）— 留給後續 round。

## Summary

| 等級 | 數量 |
|---|---|
| 🔴 Critical | 0 |
| 🟠 High | 0 |
| 🟡 Medium | 2（F1, F2 — 本 round 修復）|
| 🟢 Low | 2（F3, F4 — 列入 follow-up,不阻塞本 round）|
| ✅ Clean | XSS sinks（dangerouslySetInnerHTML / innerHTML）、eval / new Function、hardcoded secrets、SQL injection — 全部 0 命中 |

## 🟡 Medium（已修復）

### F1 — `generateSitemap` 沒做 XML escape

**位置**：`src/lib/domain.ts:354-357`

**問題**：`generateSitemap(properties)` 直接把 `${p.id}` 內插到 `<loc>...</loc>`。
若 property ID 含 XML 特殊字元（`&`、`<`、`>`、`'`、`"`），輸出會是無效甚至可被 parser 利用的 XML。

**風險等級**：Medium（sitemap 通常是公開檔案;若攻擊者能控制 ID,可在 SEO / data feed 攻擊面植入 XML）。

**修正**：加 `escapeXml()` helper,內插前先 escape。本 round 已修並加測試。

### F2 — `calculateBreakdown` 沒驗證 `ownerRatio` 範圍

**位置**：`src/lib/domain.ts:185-202`

**問題**：`{ type: 'ratio', ownerRatio: 2.5 }` 會讓 `ownerShare > netIncome`、`operatorShare < 0`，
破壞 `ownerShare + operatorShare === checksum` 不變式。`tiered` 規則內每個 tier 的 `ownerRatio` 也有同樣問題。

**風險等級**：Medium（會算出錯誤的拆帳金額,直接影響房東 / 管家分潤）。

**修正**：在函式入口驗證所有 `ownerRatio` 必須在 `[0, 1]`,違反就 throw。
本 round 已修並加測試。

## 🟢 Low（記錄為 follow-up）

### F3 — 多處 `new Date(string).getTime()` 沒驗證輸入

**位置**：`getContractAlerts`、`calculateOverdueDays`、`isBookingOverlapping`、`getOccupancyRate`、`validateBooking`、`parseIcsEvents`（至少 6 處）

**問題**：傳入非法字串會得到 `NaN`;NaN 的比較都回 false,函式會靜默回傳空陣列或錯誤結果,沒有任何錯誤訊號。

**風險等級**：Low（不會破壞 security,但會讓 caller 在髒資料時拿到 garbage 結果）。

**建議**：在每個入口加 `Number.isFinite(...)` guard,或抽 `parseDate()` helper,失敗回 null。
本 round **不修**,列入 round 3 候選。

### F4 — `parseIcsEvents` 靜默吞所有例外

**位置**：`src/lib/domain.ts:142-167`

**問題**：`try { ... } catch { return [] }` 違反 backend brief 的「no raw exception 吞噬」原則。
但因為 ICS 解析失敗的 fallback 文案已存在（`getGracefulFallback('ics-parse')`）,
且本來就希望壞 ICS 不要炸 UI,所以這裡的 catch 是「有意的」。

**風險等級**：Low（不是真 bug,是文件意圖不明確）。

**建議**：把空 `catch` 改成 `catch (err) { if (process.env.NODE_ENV !== 'production') console.warn('[ics-parse]', err); return [] }`,
至少在開發環境留 trace。
本 round **不修**,列入 round 3 候選。

## ✅ 已驗證為安全

| 檢查 | 結果 |
|---|---|
| `dangerouslySetInnerHTML` 使用 | 0 處 |
| `.innerHTML =` 直接寫入 | 0 處 |
| `eval()` / `new Function()` | 0 處 |
| Hardcoded API key / token | 0 處 |
| SQL 字串拼接 | 0 處（純前端,無 DB）|
| `process.env.*` 直出到 client bundle | 0 處（皆為 server / build-time 變數）|

## 不在本 round 範圍（建議後續 round）

1. **Supabase RLS policy 設計**（v2 接線後再做）
2. **CSP / Security Headers**（透過 `next.config.mjs` headers 或 middleware）
3. **Rate limiting on Supabase calls**（同上）
4. **個資欄位加密**（電話、地址、押金）— 目前是純前端,可見性等於資料外洩;v2 接線前需評估
5. **依賴漏洞掃描**（`npm audit`、Snyk、Dependabot — round 3 可加入 CI）

## 修正驗證

本 round 結束時 `npm test` 應該從 39 增加到 ≥ 45（新增 6 個 case：F1 三種 XML escape、F2 三種 ownerRatio 驗證）。
完整 verify 證據見 [`/Users/sean/Documents/Agent space/prompts/hotel-pm/rpb-round2-verify.log`](../BUILD_REPORT.md)。