import { describe, expect, it } from 'vitest'
import {
  calculateBreakdown,
  calculateMonthlyReport,
  calculateOverdueDays,
  getContractAlerts,
  getOccupancyRate,
  getPropertyById,
  generateSitemap,
  isBookingOverlapping,
  parseDateStrict,
  parseIcsEvents,
  validateProperty,
  validateBooking,
  validatePosOrder,
  createCsv,
  getGracefulFallback,
  isLawReviewRequired,
  sendLineNotify,
  type Booking,
  type Property,
  type Tenant,
} from '@/lib/domain'

const property: Property = {
  id: 'p1', address: '台北市大安區和平東路 1 號', roomType: 'studio', sizeInPing: 12,
  monthlyRent: 30000, deposit: 60000, status: 'rented', photos: [], ownerName: '王房東',
  ownerShareRatio: 0.7, notes: '', createdAt: '2026-01-01', updatedAt: '2026-01-01',
}
const tenant: Tenant = {
  id: 't1', propertyId: 'p1', name: '林小美', phone: '0912345678', contractStart: '2026-01-01',
  contractEnd: '2026-12-31', paymentDay: 5, monthlyRent: 30000, createdAt: '2026-01-01', updatedAt: '2026-01-01',
}
const booking: Booking = { id: 'b1', propertyId: 'p1', tenantId: 't1', checkInDate: '2026-07-10', checkOutDate: '2026-07-12', platform: 'direct', totalAmount: 6000, status: 'confirmed' }

describe('F-M1 物業驗證與上限', () => {
  it('接受完整物業資料', () => expect(validateProperty(property)).toEqual([]))
  it('拒絕空地址與負數租金', () => expect(validateProperty({ ...property, address: '', monthlyRent: -1 })).toEqual(expect.arrayContaining(['請填寫地址', '租金不可為負數'])))
  it('第 31 間物業觸發升級提示', () => expect(getGracefulFallback('property-limit')).toContain('包租代管版'))
  it('照片失敗時仍可保存文字資料', () => expect(getGracefulFallback('photo-upload')).toContain('略過照片'))
  it('輸出匯出資料為 CSV', () => expect(createCsv([{ name: '王小明', rent: 30000 }])).toContain('name,rent'))
})

describe('F-M2 住宿與合約', () => {
  it('驗證房客與合約欄位', () => expect(getContractAlerts([tenant], new Date('2026-12-01'))).toEqual([{ tenantId: 't1', message: '合約將於 30 天內到期', severity: 'warning' }]))
  it('合約逾期會產生紅色警示', () => expect(getContractAlerts([{ ...tenant, contractEnd: '2025-12-31' }], new Date('2026-01-10'))[0].severity).toBe('danger'))
  it('租金不得為負數', () => expect(validateBooking({ ...booking, totalAmount: -1 })).toContain('金額不可為負數'))
  it('逾期天數可計算', () => expect(calculateOverdueDays('2026-07-01', new Date('2026-07-05'))).toBe(4))
  it('新入住紀錄必須有房客', () => expect(validateBooking({ ...booking, tenantId: '' })).toContain('請選擇房客'))
})

describe('F-M3 訂房看板', () => {
  it('識別重疊訂房', () => expect(isBookingOverlapping(booking, { ...booking, id: 'b2', checkInDate: '2026-07-11', checkOutDate: '2026-07-13' })).toBe(true))
  it('相鄰日期不視為重疊', () => expect(isBookingOverlapping(booking, { ...booking, id: 'b2', checkInDate: '2026-07-12', checkOutDate: '2026-07-13' })).toBe(false))
  it('計算房源入住率', () => expect(getOccupancyRate([booking], '2026-07-01', '2026-07-31')).toBeCloseTo(2 / 31))
  it('解析簡單 ICS 事件', () => expect(parseIcsEvents('BEGIN:VEVENT\nUID:abc\nDTSTART;VALUE=DATE:20260710\nDTEND;VALUE=DATE:20260712\nSUMMARY:海邊旅客\nEND:VEVENT')).toEqual([{ uid: 'abc', start: '2026-07-10', end: '2026-07-12', summary: '海邊旅客' }]))
  it('ICS 解析失敗提供手動新增 fallback', () => expect(getGracefulFallback('ics-parse')).toContain('手動新增'))
})

describe('F-M6 報表與拆帳', () => {
  it('固定比例拆帳', () => expect(calculateBreakdown({ income: 100000, expenses: 20000, rule: { type: 'ratio', ownerRatio: 0.7 } })).toEqual({ netIncome: 80000, ownerShare: 56000, operatorShare: 24000, checksum: 80000 }))
  it('固定金額拆帳', () => expect(calculateBreakdown({ income: 100000, expenses: 20000, rule: { type: 'fixed', ownerAmount: 25000 } })).toEqual({ netIncome: 80000, ownerShare: 25000, operatorShare: 55000, checksum: 80000 }))
  it('階梯式租金拆帳', () => expect(calculateBreakdown({ income: 60000, expenses: 10000, rule: { type: 'tiered', tiers: [{ until: 30000, ownerRatio: 0.6 }, { until: Infinity, ownerRatio: 0.7 }] } })).toEqual({ netIncome: 50000, ownerShare: 35000, operatorShare: 15000, checksum: 50000 }))
  it('拆帳雙重驗算總和相等', () => { const r = calculateBreakdown({ income: 50000, expenses: 5000, rule: { type: 'ratio', ownerRatio: 0.5 } }); expect(r.ownerShare + r.operatorShare).toBe(r.checksum) })
  it('生成月報表', () => expect(calculateMonthlyReport([property], [booking], [], 2026, 7)[0]).toMatchObject({ propertyId: 'p1', totalIncome: 6000 }))
  it('負支出不得讓報表通過', () => expect(() => calculateBreakdown({ income: 100, expenses: -1, rule: { type: 'ratio', ownerRatio: 0.5 } })).toThrow('支出不可為負數'))
})

describe('F-M4/F-M5 需求與維修', () => {
  it('超過 30 天未完工顯示 danger fallback', () => expect(getGracefulFallback('maintenance-overdue')).toContain('超過 30 天'))
  it('維修通知失敗轉站內提醒', () => expect(getGracefulFallback('line-failure')).toContain('站內紅點'))
  it('CSV 可匯出維修資料', () => expect(createCsv([{ property: 'p1', status: 'pending' }])).toBe('property,status\np1,pending'))
  it('完整房客資料可關聯物業', () => expect(tenant.propertyId).toBe(property.id))
  it('訂房金額可為零但不可為負', () => expect(validateBooking({ ...booking, totalAmount: 0 })).toEqual([]))
})

describe('POS、審核與法條', () => {
  it('POS 訂單需有品項', () => expect(validatePosOrder({ items: [], total: 0 })).toContain('至少需要一項商品'))
  it('POS 訂單驗證總額', () => expect(validatePosOrder({ items: [{ name: '早餐', quantity: 2, unitPrice: 100 }], total: 200 })).toEqual([]))
  it('POS 訂單拒絕錯誤總額', () => expect(validatePosOrder({ items: [{ name: '早餐', quantity: 2, unitPrice: 100 }], total: 100 })).toContain('總額驗算不符'))
  it('個資與住宿契約提交前需法條審核', () => expect(isLawReviewRequired('residential-contract')).toBe(true))
  it('一般備註不需法條審核', () => expect(isLawReviewRequired('note')).toBe(false))
})

describe('CSV 跳脫 (RFC 4180)', () => {
  it('欄位含逗號會自動加雙引號', () =>
    expect(createCsv([{ address: '台北,大安', rent: 1000 }])).toBe('address,rent\n"台北,大安",1000'))
  it('欄位含雙引號會 escape 成兩個', () =>
    expect(createCsv([{ note: 'A "B" C' }])).toBe('note\n"A ""B"" C"'))
  it('欄位含換行會自動加雙引號', () =>
    expect(createCsv([{ note: 'line1\nline2' }])).toBe('note\n"line1\nline2"'))
  it('欄位無特殊字元時維持原樣', () =>
    expect(createCsv([{ property: 'p1', status: 'pending' }])).toBe('property,status\np1,pending'))
})

describe('月報表排除已取消訂房', () => {
  it('cancelled booking 不計入收入與筆數', () => {
    const cancelled: Booking = { ...booking, id: 'b-cancel', status: 'cancelled', totalAmount: 9999 }
    const r = calculateMonthlyReport([property], [booking, cancelled], [], 2026, 7)[0]
    expect(r.totalIncome).toBe(6000)
    expect(r.bookingCount).toBe(1)
  })
  it('無訂房時回傳零收入、零筆數', () => {
    const r = calculateMonthlyReport([property], [], [], 2026, 7)[0]
    expect(r.totalIncome).toBe(0)
    expect(r.bookingCount).toBe(0)
  })
})

describe('LINE Notify mock', () => {
  it('payload 缺漏時回 ok=false 與 fallback', async () => {
    const r = await sendLineNotify({ to: '', message: 'hello', type: 'system-alert' })
    expect(r.ok).toBe(false)
    expect(r.fallback).toContain('站內紅點')
  })
  it('payload 完整時回 ok=true', async () => {
    const r = await sendLineNotify({ to: 'U123', message: '合約到期', type: 'contract-expiry' })
    expect(r.ok).toBe(true)
    expect(r.fallback).toBeUndefined()
  })
})

describe('Sitemap XML escape', () => {
  it('property id 含 & 會被 escape 成 &amp;', () => {
    const xml = generateSitemap([{ ...property, id: 'p&1' }])
    expect(xml).toContain('properties/p&amp;1')
    expect(xml).not.toContain('properties/p&1')
  })
  it('property id 含 < > " \' 都會被 escape', () => {
    const xml = generateSitemap([{ ...property, id: 'a<b>c"d\'e' }])
    expect(xml).toContain('&lt;')
    expect(xml).toContain('&gt;')
    expect(xml).toContain('&quot;')
    expect(xml).toContain('&apos;')
  })
  it('正常 id 不會被改動', () => {
    const xml = generateSitemap([property])
    expect(xml).toContain('properties/p1')
  })
})

describe('拆帳 ownerRatio 範圍驗證', () => {
  it('ratio > 1 會 throw', () => {
    expect(() =>
      calculateBreakdown({ income: 1000, expenses: 0, rule: { type: 'ratio', ownerRatio: 1.5 } })
    ).toThrow(/ownerRatio 必須在 0~1 之間/)
  })
  it('ratio < 0 會 throw', () => {
    expect(() =>
      calculateBreakdown({ income: 1000, expenses: 0, rule: { type: 'ratio', ownerRatio: -0.1 } })
    ).toThrow(/ownerRatio 必須在 0~1 之間/)
  })
  it('ratio = 0 邊界值合法', () => {
    expect(() =>
      calculateBreakdown({ income: 1000, expenses: 0, rule: { type: 'ratio', ownerRatio: 0 } })
    ).not.toThrow()
  })
  it('tiered 任一 tier 的 ownerRatio 超出範圍會 throw', () => {
    expect(() =>
      calculateBreakdown({
        income: 60000,
        expenses: 10000,
        rule: { type: 'tiered', tiers: [{ until: 30000, ownerRatio: 0.6 }, { until: Infinity, ownerRatio: 1.5 }] },
      })
    ).toThrow(/ownerRatio 必須在 0~1 之間/)
  })
})

describe('parseDateStrict (F3 修正)', () => {
  it('合法 ISO 字串回 Date 物件', () => {
    expect(parseDateStrict('2026-07-10', 'checkIn').toISOString()).toBe('2026-07-10T00:00:00.000Z')
  })
  it('空字串會 throw', () => {
    expect(() => parseDateStrict('', 'checkIn')).toThrow(/無效的日期欄位 checkIn/)
  })
  it('亂碼會 throw', () => {
    expect(() => parseDateStrict('not-a-date', 'checkIn')).toThrow(/無效的日期欄位 checkIn/)
  })
  it('呼叫 getContractAlerts 傳 garbage contractEnd 會 throw', () => {
    expect(() => getContractAlerts([{ id: 't-bad', contractEnd: 'bad-date' }], new Date())).toThrow(/contractEnd/)
  })
  it('呼叫 isBookingOverlapping 傳 garbage 日期會 throw', () => {
    expect(() => isBookingOverlapping({ ...booking, checkInDate: 'xxx' }, booking)).toThrow(/a\.checkInDate/)
  })
  it('呼叫 getOccupancyRate 傳 garbage range 會 throw', () => {
    expect(() => getOccupancyRate([], 'bad', '2026-07-31')).toThrow(/rangeStart/)
  })
})

describe('ICS parse 友善錯誤 (F4 修正)', () => {
  it('壞 ICS 回空陣列且不 throw', () => {
    expect(parseIcsEvents('this is not ics')).toEqual([])
  })
  it('完全空字串回空陣列', () => {
    expect(parseIcsEvents('')).toEqual([])
  })
})

describe('getPropertyById', () => {
  const list: Property[] = [property, { ...property, id: 'p2' }]
  it('找到時回傳該物業物件', () => {
    expect(getPropertyById(list, 'p1')?.address).toBe(property.address)
  })
  it('找不到時回 null（不是 undefined）', () => {
    expect(getPropertyById(list, 'p-nonexistent')).toBeNull()
  })
  it('空清單回 null', () => {
    expect(getPropertyById([], 'p1')).toBeNull()
  })
})
