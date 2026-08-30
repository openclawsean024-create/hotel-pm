'use client'

import { StorageKeys } from '@/lib/storage'
import { useLocalStorage } from '@/lib/use-local-storage'

// 物業詳情頁的「收藏」按鈕。
// 純前端示範:state 存 localStorage,跨頁跨 reload 都保留。
// v2 接 Supabase 後,可改為寫入 user_favorites table。

export function FavoriteButton({ propertyId }: { propertyId: string }) {
  const [favoriteIds, setFavoriteIds, , hydrated] = useLocalStorage<string[]>(
    StorageKeys.favoritePropertyIds,
    []
  )

  function toggleFavorite() {
    setFavoriteIds((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    )
  }

  const isFavorite = favoriteIds.includes(propertyId)

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? '取消收藏' : '加入收藏'}
      className={`btn ${isFavorite ? 'btn-primary' : 'btn-secondary'}`}
      // hydrated 前不渲染狀態,避免 SSR 顯示「已收藏」、CSR 顯示「未收藏」的 hydration mismatch
      suppressHydrationWarning
    >
      <span aria-hidden>{hydrated && isFavorite ? '★' : '☆'}</span>
      <span className="ml-2">
        {hydrated ? (isFavorite ? '已收藏' : '加入收藏') : '收藏'}
      </span>
    </button>
  )
}