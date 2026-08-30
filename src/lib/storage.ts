// 純前端 localStorage 抽象層。
// 設計重點:
//   1. SSR 安全:Server Component 呼叫時不 throw、不 crash,只回 defaultValue
//   2. JSON 序列化:內建 try/catch,壞資料回 defaultValue 不 throw
//   3. 型別安全:泛型 <T>,呼叫端不需 cast
//   4. 無外部依賴:只用到標準瀏覽器 API (window.localStorage)

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export function getStoredItem<T>(key: string, defaultValue: T): T {
  if (!isBrowser()) return defaultValue
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    // 壞 JSON（例如 localStorage 被外部程式污染）視為沒有，回 default
    return defaultValue
  }
}

export function setStoredItem<T>(key: string, value: T): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // QuotaExceededError 或其他寫入失敗:靜默忽略（PMS 不需要通知使用者）
  }
}

export function removeStoredItem(key: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // 同上
  }
}

// 集中管理本專案用到的 storage keys,避免散落在各 component 的字串 typo
export const StorageKeys = {
  favoritePropertyIds: 'hotel-pm:favoritePropertyIds',
} as const