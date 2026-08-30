import { test, expect } from '@playwright/test'

// Round 6:第一個 client-side interactivity E2E
// 驗證 FavoriteButton + localStorage 端到端運作
// 包含 hydration 等待、click 後狀態變化、reload 後狀態保留

test.describe('Favorite button (localStorage 互動)', () => {
  test('點擊加入收藏,狀態切換且寫入 localStorage', async ({ page }) => {
    await page.goto('/properties/p1')

    // 等待 hydration 完成（button 顯示「加入收藏」表示 hydrated 後的未收藏狀態）
    const button = page.getByRole('button', { name: '加入收藏' })
    await expect(button).toBeVisible()

    // 點擊後變成「已收藏」
    await button.click()
    await expect(page.getByRole('button', { name: '取消收藏' })).toBeVisible()

    // 確認 localStorage 有寫入
    const stored = await page.evaluate(() => window.localStorage.getItem('hotel-pm:favoritePropertyIds'))
    expect(JSON.parse(stored ?? '[]')).toContain('p1')
  })

  test('reload 後收藏狀態保留', async ({ page }) => {
    // 先到頁面加入收藏
    await page.goto('/properties/p2')
    await page.getByRole('button', { name: '加入收藏' }).click()
    await expect(page.getByRole('button', { name: '取消收藏' })).toBeVisible()

    // Reload 後應仍顯示「已收藏」
    await page.reload()
    await expect(page.getByRole('button', { name: '取消收藏' })).toBeVisible()
  })

  test('點擊已收藏物業 → 取消收藏,localStorage 同步移除', async ({ page }) => {
    // 先預載收藏狀態
    await page.goto('/properties/p3')
    await page.getByRole('button', { name: '加入收藏' }).click()
    await expect(page.getByRole('button', { name: '取消收藏' })).toBeVisible()

    // 點擊「取消收藏」
    await page.getByRole('button', { name: '取消收藏' }).click()
    await expect(page.getByRole('button', { name: '加入收藏' })).toBeVisible()

    // 確認 localStorage 內已無 p3
    const stored = await page.evaluate(() => window.localStorage.getItem('hotel-pm:favoritePropertyIds'))
    const ids = JSON.parse(stored ?? '[]') as string[]
    expect(ids).not.toContain('p3')
  })

  test('不同物業的收藏狀態彼此獨立', async ({ page }) => {
    // 收藏 p1
    await page.goto('/properties/p1')
    await page.getByRole('button', { name: '加入收藏' }).click()
    await expect(page.getByRole('button', { name: '取消收藏' })).toBeVisible()

    // 切到 p2,應該是未收藏狀態
    await page.goto('/properties/p2')
    await expect(page.getByRole('button', { name: '加入收藏' })).toBeVisible()

    // 切回 p1,應該仍顯示已收藏
    await page.goto('/properties/p1')
    await expect(page.getByRole('button', { name: '取消收藏' })).toBeVisible()
  })
})