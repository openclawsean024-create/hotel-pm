// @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './use-local-storage'

// 模擬 window.localStorage
function mockLocalStorage() {
  const store = new Map<string, string>()
  const m = {
    getItem: vi.fn((k: string) => store.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => { store.set(k, v) }),
    removeItem: vi.fn((k: string) => { store.delete(k) }),
    clear: vi.fn(() => { store.clear() }),
    key: vi.fn(),
    length: 0,
  }
  ;(globalThis as unknown as { window: object }).window = { localStorage: m }
  return { store, m }
}

describe('useLocalStorage', () => {
  beforeEach(() => {
    const { store } = mockLocalStorage()
    // 清掉殘留
    store.clear()
  })
  afterEach(() => {
    delete (globalThis as { window?: object }).window
  })

  it('useEffect 後讀取 localStorage 的值並標 hydrated=true', async () => {
    const { store } = mockLocalStorage()
    store.set('k2', JSON.stringify('stored'))

    const { result } = renderHook(() => useLocalStorage<string>('k2', 'default'))
    // 等待 effect 跑完
    await act(async () => { await Promise.resolve() })

    expect(result.current[0]).toBe('stored')
    expect(result.current[3]).toBe(true)
  })

  it('key 在 localStorage 不存在時回 defaultValue', async () => {
    const { result } = renderHook(() => useLocalStorage<string>('missing', 'fallback'))
    await act(async () => { await Promise.resolve() })
    expect(result.current[0]).toBe('fallback')
    expect(result.current[3]).toBe(true)
  })

  it('setter 寫入 localStorage 並更新 state', async () => {
    const { result } = renderHook(() => useLocalStorage<number>('k3', 0))
    await act(async () => { await Promise.resolve() })

    act(() => result.current[1](42))
    expect(result.current[0]).toBe(42)

    const stored = JSON.parse(window.localStorage.getItem('k3') ?? '0')
    expect(stored).toBe(42)
  })

  it('setter 接受 updater function', async () => {
    const { result } = renderHook(() => useLocalStorage<number>('k4', 10))
    await act(async () => { await Promise.resolve() })

    act(() => result.current[1]((prev) => prev + 5))
    expect(result.current[0]).toBe(15)
  })

  it('remove 清掉 localStorage 並 reset 到 defaultValue', async () => {
    const { store } = mockLocalStorage()
    store.set('k5', JSON.stringify('something'))

    const { result } = renderHook(() => useLocalStorage<string>('k5', 'fallback'))
    await act(async () => { await Promise.resolve() })
    expect(result.current[0]).toBe('something')

    act(() => result.current[2]())
    expect(result.current[0]).toBe('fallback')
    expect(store.has('k5')).toBe(false)
  })

  it('壞 JSON 不 throw,回 defaultValue', async () => {
    const { store } = mockLocalStorage()
    store.set('k6', '{ not valid')

    const { result } = renderHook(() => useLocalStorage<string>('k6', 'safe'))
    await act(async () => { await Promise.resolve() })

    expect(result.current[0]).toBe('safe')
  })
})