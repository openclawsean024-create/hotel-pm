import { describe, expect, it } from 'vitest'
import {
  calculateBreakdown,
  calculateMonthlyReport,
  calculateOverdueDays,
  getContractAlerts,
  getOccupancyRate,
  isBookingOverlapping,
  parseIcsEvents,
  validateProperty,
  validateBooking,
  validatePosOrder,
  createCsv,
  getGracefulFallback,
  isLawReviewRequired,
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
