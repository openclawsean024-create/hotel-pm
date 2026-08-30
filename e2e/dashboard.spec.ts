import { test, expect } from '@playwright/test'

// Round 5 第一個 E2E spec:dashboard 路由能正確渲染並顯示預期內容
// 後續 round 可依此模式擴充 properties/[id] / bookings / reports 等

test('dashboard 顯示「總覽」標題與基本 stat card', async ({ page }) => {
  await page.goto('/dashboard')

  // 主要標題
  await expect(page.getByRole('heading', { name: '總覽', level: 1 })).toBeVisible()

  // 四個 stat card（標題文字）
  await expect(page.getByText('物業總數')).toBeVisible()
  await expect(page.getByText('月租金收入')).toBeVisible()
  await expect(page.getByText('本月訂房數')).toBeVisible()
  await expect(page.getByText('合約警示')).toBeVisible()
})

test('首頁顯示 hero 與 4 個 demo 卡片', async ({ page }) => {
  await page.goto('/')

  // 主標題
  await expect(page.getByRole('heading', { name: '飯店 / 包租代管物業管理' })).toBeVisible()

  // 四個 demo section 標題
  await expect(page.getByText('物業驗證')).toBeVisible()
  await expect(page.getByText('拆帳計算')).toBeVisible()
  await expect(page.getByText('合約警示')).toBeVisible()
  await expect(page.getByText('CSV 匯出')).toBeVisible()
})

test('properties list 顯示所有 mock 物業', async ({ page }) => {
  await page.goto('/properties')

  await expect(page.getByRole('heading', { name: '物業管理' })).toBeVisible()
  // 至少 3 個 mock 物業地址
  await expect(page.getByText(/台北市大安區/)).toBeVisible()
  await expect(page.getByText(/台北市信義區/)).toBeVisible()
  await expect(page.getByText(/台中市西區/)).toBeVisible()
})

test('property detail SSG 頁面可訪問', async ({ page }) => {
  await page.goto('/properties/p1')

  // 標題包含地址
  await expect(page.getByRole('heading', { level: 1 })).toContainText('台北市大安區')
  // 房東名稱
  await expect(page.getByText('王房東')).toBeVisible()
  // 返回連結
  await expect(page.getByRole('link', { name: /返回物業列表/ })).toBeVisible()
})

test('不存在的 property id 觸發 404', async ({ page }) => {
  const response = await page.goto('/properties/non-existent-id')
  // Next.js 的 notFound() 會回 404
  expect(response?.status()).toBe(404)
})