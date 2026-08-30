'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getStoredItem,
  removeStoredItem,
  setStoredItem,
} from './storage'

// React hook 包裝 storage 抽象層,提供 client component 用的 reactive localStorage state。
// - SSR 安全:Server Component 端呼叫不會 throw,只回 defaultValue
// - Hydration 安全:回傳 hydrated flag,SSR 與 CSR 第一次 render 都顯示 defaultValue,
//   useEffect 跑完才更新成 stored value,避免 hydration mismatch
//
// 用法:
//   const [name, setName, removeName] = useLocalStorage<string>('user:name', '')

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): readonly [T, (value: T | ((prev: T) => T)) => void, () => void, boolean] {
  const [value, setValue] = useState<T>(defaultValue)
  const [hydrated, setHydrated] = useState(false)

  // 初始載入:從 localStorage 讀取一次
  // 只依賴 key:key 變動才重讀;defaultValue 故意不列 deps（避免呼叫端每次 render
  // 都傳新物件參考導致 effect 一直 re-run;若需要 defaultValue 即時同步,呼叫端
  // 應用 useState 持有或傳 primitive）
  useEffect(() => {
    setValue(getStoredItem<T>(key, defaultValue))
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
        setStoredItem(key, resolved)
        return resolved
      })
    },
    [key]
  )

  const remove = useCallback(() => {
    removeStoredItem(key)
    setValue(defaultValue)
  }, [key, defaultValue])

  return [value, update, remove, hydrated] as const
}