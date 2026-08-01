import {
  calculateBreakdown,
  calculateMonthlyReport,
  createCsv,
  type BreakdownRule,
  type Property,
  type Booking,
} from "@/lib/domain";

const mockProperties: Property[] = [
  {
    id: "p1",
    address: "台北市大安區和平東路 1 號 3 樓",
    roomType: "studio",
    sizeInPing: 12,
    monthlyRent: 30000,
    deposit: 60000,
    status: "rented",
    photos: [],
    ownerName: "王房東",
    ownerShareRatio: 0.7,
    notes: "",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "p2",
    address: "台北市信義區松仁路 50 號 5 樓",
    roomType: "two-bedroom",
    sizeInPing: 28,
    monthlyRent: 55000,
    deposit: 110000,
    status: "rented",
    photos: [],
    ownerName: "李房東",
    ownerShareRatio: 0.6,
    notes: "",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

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
];

export default function ReportsPage() {
  const year = 2026;
  const month = 7;
  const report = calculateMonthlyReport(
    mockProperties,
    mockBookings,
    [],
    year,
    month
  );

  // 示範 3 種拆帳規則
  const ratioRule: BreakdownRule = { type: "ratio", ownerRatio: 0.7 };
  const fixedRule: BreakdownRule = { type: "fixed", ownerAmount: 25000 };
  const tieredRule: BreakdownRule = {
    type: "tiered",
    tiers: [
      { until: 30000, ownerRatio: 0.6 },
      { until: Infinity, ownerRatio: 0.7 },
    ],
  };

  const sampleIncome = 100000;
  const sampleExpenses = 20000;
  const ratioDemo = calculateBreakdown({
    income: sampleIncome,
    expenses: sampleExpenses,
    rule: ratioRule,
  });
  const fixedDemo = calculateBreakdown({
    income: sampleIncome,
    expenses: sampleExpenses,
    rule: fixedRule,
  });
  const tieredDemo = calculateBreakdown({
    income: 60000,
    expenses: 10000,
    rule: tieredRule,
  });

  // CSV 匯出範例
  const csv = createCsv(
    report.map((r) => {
      const p = mockProperties.find((pp) => pp.id === r.propertyId);
      return {
        物業: p?.address ?? r.propertyId,
        房東: p?.ownerName ?? "",
        收入: r.totalIncome,
        訂房數: r.bookingCount,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">月報表</h1>
          <p className="text-sm text-gray-600">
            {year} 年 {month} 月 · 自動拆帳 + 一鍵匯出
          </p>
        </div>
        <button className="btn btn-primary">📄 匯出 PDF</button>
      </div>

      {/* 月報表總覽 */}
      <section className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-600">
            <tr>
              <th className="px-4 py-3">物業</th>
              <th className="px-4 py-3">房東</th>
              <th className="px-4 py-3 text-right">月收入</th>
              <th className="px-4 py-3 text-right">訂房數</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {report.map((r) => {
              const p = mockProperties.find((pp) => pp.id === r.propertyId);
              return (
                <tr key={r.propertyId}>
                  <td className="px-4 py-3 font-medium">{p?.address}</td>
                  <td className="px-4 py-3 text-gray-600">{p?.ownerName}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    NT${r.totalIncome.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {r.bookingCount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* 3 種拆帳規則 demo */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">3 種拆帳規則示範</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <BreakdownCard
            title="固定比例 (ratio)"
            subtitle="房東拿 70%"
            result={ratioDemo}
          />
          <BreakdownCard
            title="固定金額 (fixed)"
            subtitle="房東固定拿 NT$25,000"
            result={fixedDemo}
          />
          <BreakdownCard
            title="階梯式 (tiered)"
            subtitle="≤3 萬拿 60%,>3 萬拿 70%"
            result={tieredDemo}
          />
        </div>
      </section>

      {/* CSV 匯出範例 */}
      <section className="card p-5">
        <h2 className="mb-2 text-lg font-semibold">CSV 匯出範例</h2>
        <p className="mb-3 text-xs text-gray-500">
          domain.ts 的 createCsv() 產出,可下載或複製到 Excel/Google Sheets
        </p>
        <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">
          {csv}
        </pre>
      </section>
    </div>
  );
}

function BreakdownCard({
  title,
  subtitle,
  result,
}: {
  title: string;
  subtitle: string;
  result: {
    netIncome: number;
    ownerShare: number;
    operatorShare: number;
    checksum: number;
  };
}) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-xs text-gray-500">{subtitle}</p>
      <div className="mt-3 space-y-2 text-sm">
        <Row label="淨收入" value={result.netIncome} />
        <Row label="房東分潤" value={result.ownerShare} color="text-brand-600" />
        <Row label="管家分潤" value={result.operatorShare} color="text-green-600" />
        <Row label="驗算 (雙和)" value={result.checksum} muted />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  color,
  muted,
}: {
  label: string;
  value: number;
  color?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-xs text-gray-400" : ""}>{label}</span>
      <span className={`font-medium ${color ?? ""}`}>
        NT${value.toLocaleString()}
      </span>
    </div>
  );
}