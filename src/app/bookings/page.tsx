import { parseIcsEvents, type Booking } from "@/lib/domain";

const mockBookings: Booking[] = [
  {
    id: "b1",
    propertyId: "p1",
    tenantId: "t1",
    checkInDate: "2026-07-10",
    checkOutDate: "2026-07-12",
    platform: "airbnb",
    totalAmount: 6000,
    status: "checked-out",
  },
  {
    id: "b2",
    propertyId: "p2",
    tenantId: "t2",
    checkInDate: "2026-07-20",
    checkOutDate: "2026-07-25",
    platform: "booking",
    totalAmount: 18000,
    status: "confirmed",
  },
  {
    id: "b3",
    propertyId: "p1",
    tenantId: "t1",
    checkInDate: "2026-08-05",
    checkOutDate: "2026-08-08",
    platform: "direct",
    totalAmount: 9000,
    status: "pending",
  },
];

const mockProperties: Record<string, string> = {
  p1: "台北市大安區和平東路 1 號 3 樓",
  p2: "台北市信義區松仁路 50 號 5 樓",
};

const mockTenants: Record<string, string> = {
  t1: "林小美",
  t2: "陳家三口",
};

const platformLabels: Record<Booking["platform"], string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  direct: "官網直訂",
  agoda: "Agoda",
  other: "其他",
};

const platformColors: Record<Booking["platform"], string> = {
  airbnb: "bg-red-100 text-red-800",
  booking: "bg-blue-100 text-blue-800",
  direct: "bg-green-100 text-green-800",
  agoda: "bg-yellow-100 text-yellow-800",
  other: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<Booking["status"], string> = {
  pending: "待確認",
  confirmed: "已確認",
  "checked-in": "入住中",
  "checked-out": "已退房",
  cancelled: "已取消",
};

const statusColors: Record<Booking["status"], string> = {
  pending: "badge-yellow",
  confirmed: "badge-green",
  "checked-in": "bg-blue-100 text-blue-800",
  "checked-out": "badge-gray",
  cancelled: "badge-red",
};

// 示範 ICS 解析功能
const sampleIcs = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:airbnb-12345
DTSTART;VALUE=DATE:20260810
DTEND;VALUE=DATE:20260813
SUMMARY:Airbnb - 林先生
END:VEVENT
END:VCALENDAR`;

const parsedEvents = parseIcsEvents(sampleIcs);

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">訂房看板</h1>
          <p className="text-sm text-gray-600">
            行事曆檢視 + ICS 自動匯入
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary">📥 匯入 ICS</button>
          <button className="btn btn-primary">+ 新增訂房</button>
        </div>
      </div>

      {/* ICS 解析 demo */}
      {parsedEvents.length > 0 && (
        <section className="card border-brand-200 bg-brand-50 p-4 text-sm">
          <strong>📥 ICS 解析 demo:</strong>{" "}
          從備份的 sampleIcs 解析出 {parsedEvents.length} 筆事件
          (uid: {parsedEvents[0].uid}, {parsedEvents[0].start} →{" "}
          {parsedEvents[0].end})
        </section>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-600">
            <tr>
              <th className="px-4 py-3">入住</th>
              <th className="px-4 py-3">退房</th>
              <th className="px-4 py-3">物業</th>
              <th className="px-4 py-3">房客</th>
              <th className="px-4 py-3">平台</th>
              <th className="px-4 py-3">金額</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockBookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{b.checkInDate}</td>
                <td className="px-4 py-3 text-gray-600">{b.checkOutDate}</td>
                <td className="px-4 py-3 text-gray-600">
                  {mockProperties[b.propertyId] ?? b.propertyId}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {mockTenants[b.tenantId] ?? b.tenantId}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${platformColors[b.platform]}`}>
                    {platformLabels[b.platform]}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">
                  NT${b.totalAmount.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className={statusColors[b.status]}>
                    {statusLabels[b.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs text-brand-600 hover:underline">
                    編輯
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}