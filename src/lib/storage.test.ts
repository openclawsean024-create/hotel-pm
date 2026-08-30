import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import {
  getStoredItem,
  setStoredItem,
  removeStoredItem,
  StorageKeys,
} from './storage'

// 在 node 環境模擬 window.localStorage,讓 storage 模組的 isBrowser() 走 true 分支
function mockLocalStorage() {
  const store = new Map<string, string>()
  const localStorageMock = {
    getItem: vi.fn((k: string) => store.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => { store.set(k, v) }),
    removeItem: vi.fn((k: string) => { store.delete(k) }),
    clear: vi.fn(() => { store.clear() }),
    key: vi.fn(),
    length: 0,
  }
  ;(globalThis as unknown as { window: object }).window = { localStorage: localStorageMock }
  return { store, localStorageMock }
}

describe('storage (SSR + 瀏覽器環境)', () => {
  describe('無 window（SSR）', () => {
    beforeEach(() => {
      delete (globalThis as { window?: object }).window
    })

    it('getStoredItem 在 SSR 環境回 defaultValue', () => {
      expect(getStoredItem<string[]>('any', ['fallback'])).toEqual(['fallback'])
    })

    it('setStoredItem 在 SSR 環境靜默不 throw', () => {
      expect(() => setStoredItem('any', { x: 1 })).not.toThrow()
    })

    it('removeStoredItem 在 SSR 環境靜默不 throw', () => {
      expect(() => removeStoredItem('any')).not.toThrow()
    })
  })

  describe('有 window（瀏覽器環境）', () => {
    let store: Map<string, string>
    beforeEach(() => {
      const m = mockLocalStorage()
      store = m.store
    })
    afterEach(() => {
      delete (globalThis as { window?: object }).window
    })

    it('setStoredItem 寫入後 getStoredItem 能取回', () => {
      setStoredItem('k', { a: 1, b: ['x'] })
      expect(store.get('k')).toBe('{"a":1,"b":["x"]}')
      expect(getStoredItem<{ a: number; b: string[] }>('k', { a: 0, b: [] })).toEqual({ a: 1, b: ['x'] })
    })

    it('getStoredItem 在 key 不存在時回 defaultValue', () => {
      expect(getStoredItem<string>('nope', 'fallback')).toBe('fallback')
    })

    it('getStoredItem 在 JSON 損壞時回 defaultValue 不 throw', () => {
      store.set('bad', '{ not valid json')
      expect(getStoredItem<unknown>('bad', null)).toBeNull()
    })

    it('removeStoredItem 能清掉 key', () => {
      setStoredItem('k', 'v')
      removeStoredItem('k')
      expect(store.has('k')).toBe(false)
    })

    it('StorageKeys 集中管理避免 typo', () => {
      expect(StorageKeys.favoritePropertyIds).toBe('hotel-pm:favoritePropertyIds')
    })
  })
})