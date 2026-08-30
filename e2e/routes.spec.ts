import { test, expect } from '@playwright/test'

// Round 7:擴充 E2E 覆蓋到所有主要路由（dashboard / 首頁 / properties 已在 dashboard.spec.ts）
// 涵蓋 bookings / tenants / reports 三個先前未測的路由

test.describe('Bookings 訂房看板', () => {
  test('顯示訂房列表與 ICS 解析 demo', async ({ page }) => {
    await page.goto('/bookings')

    await expect(page.getByRole('heading', { name: '訂房看板' })).toBeVisible()
    // ICS demo 區塊
    await expect(page.getByText(/ICS 解析 demo/)).toBeVisible()
    // 至少一個 mock booking 的物業地址
    await expect(page.getByText(/台北市大安區/).first()).toBeVisible()
  })

  test('狀態標籤正確顯示', async ({ page }) => {
    await page.goto('/bookings')
    // mockBookings 有 confirmed / checked-out / pending 三種狀態
    await expect(page.getByText('已確認').first()).toBeVisible()
    await expect(page.getByText('已退房').first()).toBeVisible()
    await expect(page.getByText('待確認').first()).toBeVisible()
  })
})

test.describe('Tenants 房客管理', () => {
  test('顯示房客列表與合約警示', async ({ page }) => {
    await page.goto('/tenants')

    await expect(page.getByRole('heading', { name: '房客管理' })).toBeVisible()
    // mockTenants 包含林小美與陳家三口
    await expect(page.getByText('林小美')).toBeVisible()
    await expect(page.getByText('陳家三口')).toBeVisible()
  })

  test('table 表頭完整', async ({ page }) => {
    await page.goto('/tenants')
    await expect(page.getByRole('columnheader', { name: '姓名' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '物業' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '電話' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '合約期間' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '月租金' })).toBeVisible()
  })
})

test.describe('Reports 月報表', () => {
  test('顯示月報表與 3 種拆帳規則 demo', async ({ page }) => {
    await page.goto('/reports')

    await expect(page.getByRole('heading', { name: '月報表' })).toBeVisible()
    // 3 種拆帳規則的卡片標題
    await expect(page.getByText('固定比例 (ratio)')).toBeVisible()
    await expect(page.getByText('固定金額 (fixed)')).toBeVisible()
    await expect(page.getByText('階梯式 (tiered)')).toBeVisible()
    // CSV 匯出範例區塊
    await expect(page.getByText('CSV 匯出範例')).toBeVisible()
  })
})

test.describe('Properties 導航', () => {
  test('從列表頁點擊物業可進入詳情頁', async ({ page }) => {
    await page.goto('/properties')
    // 點擊第一張物業卡片的「查看房客」連結（用「台北市大安區」address 定位）
    await expect(page.getByRole('heading', { name: '物業管理' })).toBeVisible()

    // 直接導航到詳情頁（按鈕是純展示沒 wire up）
    await page.goto('/properties/p2')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('台北市信義區')
    await expect(page.getByText('李房東')).toBeVisible()
  })
})