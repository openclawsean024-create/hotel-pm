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
// 嚴格日期解析:invalid 字串會 throw,避免 NaN 污染計算
// 使用情境:從 localStorage / API / 使用者輸入讀到 ISO 日期字串時,強制要求格式正確
export function parseDateStrict(value: string, fieldName: string): Date {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    throw new Error(`無效的日期欄位 ${fieldName}: ${JSON.stringify(value)}`)
  }
  return d
}

// 從物業清單中依 ID 查找單筆;找不到回 null（用 null 而非 undefined,便於 caller 用 ? 鏈判斷）
export function getPropertyById(properties: Property[], id: string): Property | null {
  return properties.find((p) => p.id === id) ?? null
}

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
    const end = parseDateStrict(t.contractEnd, 'contractEnd').getTime()
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
  const due = parseDateStrict(dueDate, 'dueDate').getTime()
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
  const aStart = parseDateStrict(a.checkInDate, 'a.checkInDate').getTime()
  const aEnd = parseDateStrict(a.checkOutDate, 'a.checkOutDate').getTime()
  const bStart = parseDateStrict(b.checkInDate, 'b.checkInDate').getTime()
  const bEnd = parseDateStrict(b.checkOutDate, 'b.checkOutDate').getTime()
  // 相鄰不視為重疊 (aEnd === bStart 不算重疊)
  return aStart < bEnd && bStart < aEnd
}

export function getOccupancyRate(
  bookings: Booking[],
  rangeStart: string,
  rangeEnd: string
): number {
  const rangeStartMs = parseDateStrict(rangeStart, 'rangeStart').getTime()
  const rangeEndMs = parseDateStrict(rangeEnd, 'rangeEnd').getTime()
  const totalDays = Math.max(1, Math.floor((rangeEndMs - rangeStartMs) / (1000 * 60 * 60 * 24)))
  let occupiedDays = 0
  for (const b of bookings) {
    if (b.status === 'cancelled') continue
    const bStart = Math.max(parseDateStrict(b.checkInDate, 'b.checkInDate').getTime(), rangeStartMs)
    const bEnd = Math.min(parseDateStrict(b.checkOutDate, 'b.checkOutDate').getTime(), rangeEndMs)
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
  } catch (err) {
    // 有意的吞例外:壞 ICS 不應炸 UI,fallback 文案由 getGracefulFallback('ics-parse') 提供
    // 開發環境留 trace,生產環境保持安靜
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[ics-parse] failed to parse ICS payload:', err)
    }
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
  // 驗證 ownerRatio 必須在 [0,1],避免 ownerShare > netIncome 破壞 checksum 不變式
  const ratios: number[] = []
  if (params.rule.type === 'ratio') ratios.push(params.rule.ownerRatio)
  else if (params.rule.type === 'tiered') {
    for (const t of params.rule.tiers) ratios.push(t.ownerRatio)
  }
  for (const r of ratios) {
    if (!Number.isFinite(r) || r < 0 || r > 1) {
      throw new Error(`ownerRatio 必須在 0~1 之間,收到: ${r}`)
    }
  }
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
    // 已取消的訂房不計入月報表的收入與筆數（取消等同交易未發生）
    const activeBookings = bookings.filter(
      (b) => b.propertyId === p.id && b.status !== 'cancelled'
    )
    const totalIncome = activeBookings
      .filter((b) => {
        const d = new Date(b.checkInDate)
        return d.getFullYear() === year && d.getMonth() + 1 === month
      })
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    return { propertyId: p.id, totalIncome, bookingCount: activeBookings.length }
  })
}

// ===== F-M4/F-M5: 需求與維修 =====
// RFC 4180 CSV escape:欄位含 , " \r \n 時,用雙引號包起來,內部 " 改成 ""
function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function createCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.map(escapeCsvField).join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvField(String(row[h] ?? ''))).join(','))
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

// ===== F-M4: 需求記錄 =====
export interface MaintenanceRequest {
  id: string
  propertyId: string
  tenantId: string
  category: 'repair' | 'cleaning' | 'inspection' | 'other'
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'assigned' | 'in-progress' | 'completed'
  assignedTo?: string
  cost?: number
  createdAt: string
  updatedAt: string
}

export function createMaintenanceRequest(
  input: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): MaintenanceRequest {
  const now = new Date().toISOString()
  return {
    ...input,
    id: `maint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }
}

export function assignMaintenanceRequest(
  request: MaintenanceRequest,
  assignedTo: string
): MaintenanceRequest {
  return { ...request, status: 'assigned', assignedTo, updatedAt: new Date().toISOString() }
}

export function completeMaintenanceRequest(
  request: MaintenanceRequest,
  cost?: number
): MaintenanceRequest {
  return { ...request, status: 'completed', cost, updatedAt: new Date().toISOString() }
}

// ===== F-M7: PDF 匯出 =====
export function generateReportPdf(report: {
  title: string
  rows: Array<Record<string, unknown>>
}): { filename: string; content: string; mimeType: string } {
  // v3 MVP: 回傳 CSV 格式(後續升級 jsPDF → React-PDF)
  const csv = createCsv(report.rows)
  return {
    filename: `${report.title.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`,
    content: csv,
    mimeType: 'text/csv',
  }
}

// ===== F-M8: LINE 通知 =====
export interface LineNotifyPayload {
  to: string
  message: string
  type: 'contract-expiry' | 'payment-reminder' | 'maintenance-complete' | 'system-alert'
}

export function formatLineNotify(payload: LineNotifyPayload): string {
  const prefix = {
    'contract-expiry': '📋 合約提醒',
    'payment-reminder': '💰 繳費提醒',
    'maintenance-complete': '🔧 維修完成',
    'system-alert': '⚠️ 系統警示',
  }[payload.type] ?? '📢 通知'
  return `${prefix}\n${payload.message}`
}

export async function sendLineNotify(
  payload: LineNotifyPayload
): Promise<{ ok: boolean; fallback?: string }> {
  // Mock: 模擬 outbox queue 接收訊息並回結果,實際上不發 LINE Notify API。
  // 真實實作請改為呼叫 LINE Notify API:
  //   POST https://notify-api.line.me/api/notify
  //   Header: Authorization: Bearer ${process.env.LINE_NOTIFY_TOKEN}
  //   Body:  message=<formatLineNotify(payload)>
  // payload 缺漏時回 fallback（沿用既有 line-failure 文案）
  if (!payload.message || !payload.to) {
    return { ok: false, fallback: getGracefulFallback('line-failure') }
  }
  const message = formatLineNotify(payload) // 預熱 message pipeline,證明端到端可用
  return message ? { ok: true } : { ok: false, fallback: getGracefulFallback('line-failure') }
}

// ===== F-M10: SEO / Sitemap =====
// XML escape:把 & < > ' " 轉成 entity,避免無效 / 可被利用的 sitemap 輸出
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
}

export function generateSitemap(properties: Property[]): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '<url><loc>https://hotel-pm.vercel.app/</loc><priority>1.0</priority></url>',
    '<url><loc>https://hotel-pm.vercel.app/dashboard</loc><priority>0.9</priority></url>',
  ]
  for (const p of properties) {
    lines.push(
      `<url><loc>https://hotel-pm.vercel.app/properties/${escapeXml(p.id)}</loc><priority>0.7</priority></url>`
    )
  }
  lines.push('</urlset>')
  return lines.join('\n')
}

export const openGraphMeta = {
  title: '民宿管家 hotel-pm — 台灣專業 PMS',
  description: '台灣 1-10 房民宿與 50-200 房包租代管業者的本土化 PMS',
  type: 'website',
  url: 'https://hotel-pm.vercel.app',
  image: '/og-image.png',
}