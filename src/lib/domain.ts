// hotel-pm domain.ts — TDD 綠燈實作（30 tests 對齊）

// ===== 型別 =====
export interface Property {
  id: string
  address: string
  roomType: 'studio' | 'one-bedroom' | 'two-bedroom' | 'three-bedroom' | 'house'
  sizeInPing: number
  monthlyRent: number
  deposit: number
  status: 'vacant' | 'rented' | 'reserved' | 'maintenance'
  photos: string[]
  ownerName: string
  ownerShareRatio: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Tenant {
  id: string
  propertyId: string
  name: string
  phone: string
  contractStart: string
  contractEnd: string
  paymentDay: number
  monthlyRent: number
  createdAt: string
  updatedAt: string
}

export interface Booking {
  id: string
  propertyId: string
  tenantId: string
  checkInDate: string
  checkOutDate: string
  platform: 'airbnb' | 'booking' | 'direct' | 'agoda' | 'other'
  totalAmount: number
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled'
}

export interface ContractAlert {
  tenantId: string
  message: string
  severity: 'warning' | 'danger'
}

// ===== F-M1: 物業驗證 =====
export function validateProperty(p: Partial<Property>): string[] {
  const errors: string[] = []
  if (!p.address || p.address.trim() === '') errors.push('請填寫地址')
  if (typeof p.monthlyRent === 'number' && p.monthlyRent < 0) errors.push('租金不可為負數')
  if (typeof p.deposit === 'number' && p.deposit < 0) errors.push('押金不可為負數')
  if (typeof p.sizeInPing === 'number' && p.sizeInPing <= 0) errors.push('坪數需大於 0')
  if (!p.ownerName || p.ownerName.trim() === '') errors.push('請填寫房東姓名')
  return errors
}

// ===== F-M2: 住宿與合約 =====
export function getContractAlerts(
  tenants: Array<Partial<Tenant> & { id: string; contractEnd: string }>,
  now: Date
): ContractAlert[] {
  const alerts: ContractAlert[] = []
  const today = now.getTime()
  for (const t of tenants) {
    const end = new Date(t.contractEnd).getTime()
    const daysLeft = Math.floor((end - today) / (1000 * 60 * 60 * 24))
    if (daysLeft < 0) {
      alerts.push({
        tenantId: t.id,
        message: `合約已逾期 ${Math.abs(daysLeft)} 天`,
        severity: 'danger',
      })
    } else if (daysLeft <= 30) {
      alerts.push({
        tenantId: t.id,
        message: `合約將於 ${daysLeft} 天內到期`,
        severity: 'warning',
      })
    }
  }
  return alerts
}

export function calculateOverdueDays(dueDate: string, now: Date): number {
  const due = new Date(dueDate).getTime()
  const cur = now.getTime()
  const diff = cur - due
  if (diff <= 0) return 0
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function validateBooking(b: Partial<Booking>): string[] {
  const errors: string[] = []
  if (!b.tenantId || b.tenantId === '') errors.push('請選擇房客')
  if (!b.propertyId || b.propertyId === '') errors.push('請選擇物業')
  if (!b.checkInDate) errors.push('請填寫入住日期')
  if (!b.checkOutDate) errors.push('請填寫退房日期')
  if (b.checkInDate && b.checkOutDate) {
    const start = new Date(b.checkInDate).getTime()
    const end = new Date(b.checkOutDate).getTime()
    if (start >= end) errors.push('退房日期需晚於入住日期')
  }
  if (typeof b.totalAmount === 'number' && b.totalAmount < 0) errors.push('金額不可為負數')
  return errors
}

// ===== F-M3: 訂房看板 =====
export function isBookingOverlapping(a: Booking, b: Booking): boolean {
  const aStart = new Date(a.checkInDate).getTime()
  const aEnd = new Date(a.checkOutDate).getTime()
  const bStart = new Date(b.checkInDate).getTime()
  const bEnd = new Date(b.checkOutDate).getTime()
  // 相鄰不視為重疊 (aEnd === bStart 不算重疊)
  return aStart < bEnd && bStart < aEnd
}

export function getOccupancyRate(
  bookings: Booking[],
  rangeStart: string,
  rangeEnd: string
): number {
  const rangeStartMs = new Date(rangeStart).getTime()
  const rangeEndMs = new Date(rangeEnd).getTime()
  const totalDays = Math.max(1, Math.floor((rangeEndMs - rangeStartMs) / (1000 * 60 * 60 * 24)))
  let occupiedDays = 0
  for (const b of bookings) {
    if (b.status === 'cancelled') continue
    const bStart = Math.max(new Date(b.checkInDate).getTime(), rangeStartMs)
    const bEnd = Math.min(new Date(b.checkOutDate).getTime(), rangeEndMs)
    const overlap = Math.max(0, Math.floor((bEnd - bStart) / (1000 * 60 * 60 * 24)))
    occupiedDays += overlap
  }
  return occupiedDays / totalDays
}

export function parseIcsEvents(ics: string): Array<{ uid: string; start: string; end: string; summary: string }> {
  const events: Array<{ uid: string; start: string; end: string; summary: string }> = []
  try {
    const blocks = ics.split('BEGIN:VEVENT').slice(1)
    for (const block of blocks) {
      const endIdx = block.indexOf('END:VEVENT')
      if (endIdx === -1) continue
      const body = block.slice(0, endIdx)
      const lines = body.split(/\r?\n/)
      const ev: { uid?: string; start?: string; end?: string; summary?: string } = {}
      for (const line of lines) {
        if (line.startsWith('UID:')) ev.uid = line.slice(4).trim()
        else if (line.startsWith('DTSTART')) {
          const m = line.match(/:(\d{4})(\d{2})(\d{2})/)
          if (m) ev.start = `${m[1]}-${m[2]}-${m[3]}`
        } else if (line.startsWith('DTEND')) {
          const m = line.match(/:(\d{4})(\d{2})(\d{2})/)
          if (m) ev.end = `${m[1]}-${m[2]}-${m[3]}`
        } else if (line.startsWith('SUMMARY:')) ev.summary = line.slice(8).trim()
      }
      if (ev.uid && ev.start && ev.end && ev.summary !== undefined) {
        events.push({ uid: ev.uid, start: ev.start, end: ev.end, summary: ev.summary })
      }
    }
  } catch {
    return []
  }
  return events
}

// ===== F-M6: 報表與拆帳 =====
export type BreakdownRule =
  | { type: 'ratio'; ownerRatio: number }
  | { type: 'fixed'; ownerAmount: number }
  | { type: 'tiered'; tiers: Array<{ until: number; ownerRatio: number }> }

export function calculateBreakdown(params: {
  income: number
  expenses: number
  rule: BreakdownRule
}): { netIncome: number; ownerShare: number; operatorShare: number; checksum: number } {
  if (params.income < 0) throw new Error('收入不可為負數')
  if (params.expenses < 0) throw new Error('支出不可為負數')
  const netIncome = params.income - params.expenses
  let ownerShare = 0
  if (params.rule.type === 'ratio') {
    ownerShare = Math.round(netIncome * params.rule.ownerRatio)
  } else if (params.rule.type === 'fixed') {
    ownerShare = Math.min(params.rule.ownerAmount, netIncome)
  } else if (params.rule.type === 'tiered') {
    // tier.until = 「下一個 tier 從這金額開始」（切換點）
    // 找到第一個 tier t 使 netIncome <= t.until，套用 t.ownerRatio
    // 若所有 tier.until < netIncome → 套用最後一個 tier
    const sorted = [...params.rule.tiers].sort((a, b) => a.until - b.until)
    let chosenRatio = sorted[sorted.length - 1].ownerRatio
    for (const tier of sorted) {
      if (netIncome <= tier.until) {
        chosenRatio = tier.ownerRatio
        break
      }
    }
    ownerShare = Math.round(netIncome * chosenRatio)
  }
  const operatorShare = netIncome - ownerShare
  return { netIncome, ownerShare, operatorShare, checksum: netIncome }
}

export function calculateMonthlyReport(
  properties: Property[],
  bookings: Booking[],
  _maintenance: unknown[],
  year: number,
  month: number
): Array<{ propertyId: string; totalIncome: number; bookingCount: number }> {
  return properties.map((p) => {
    const matched = bookings.filter((b) => b.propertyId === p.id)
    const totalIncome = matched
      .filter((b) => {
        const d = new Date(b.checkInDate)
        return d.getFullYear() === year && d.getMonth() + 1 === month
      })
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    return { propertyId: p.id, totalIncome, bookingCount: matched.length }
  })
}

// ===== F-M4/F-M5: 需求與維修 =====
export function createCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => String(row[h] ?? '')).join(','))
  }
  return lines.join('\n')
}

// ===== POS / 法條審核 =====
export function validatePosOrder(order: { items: Array<{ name: string; quantity: number; unitPrice: number }>; total: number }): string[] {
  const errors: string[] = []
  if (!order.items || order.items.length === 0) errors.push('至少需要一項商品')
  const expected = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  if (expected !== order.total) errors.push('總額驗算不符')
  return errors
}

const LAW_REVIEW_TYPES = new Set(['residential-contract', 'personal-data-export', 'tenant-id-upload'])

export function isLawReviewRequired(type: string): boolean {
  return LAW_REVIEW_TYPES.has(type)
}

// ===== 降級機制 =====
const FALLBACKS: Record<string, string> = {
  'property-limit': '物業數已達 30 間上限，請升級至包租代管版（NT$1,499/月）',
  'photo-upload': '照片上傳失敗，已略過照片，文字資料已保存',
  'ics-parse': 'ICS 解析失敗，請手動新增訂房紀錄',
  'maintenance-overdue': '維修案件已超過 30 天未完工，請聯繫管理員',
  'line-failure': 'LINE 推播失敗，已轉為站內紅點提醒',
}

export function getGracefulFallback(scenario: string): string {
  return FALLBACKS[scenario] ?? '系統暫時無法回應，請稍後再試'
}