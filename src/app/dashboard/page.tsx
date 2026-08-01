import Link from "next/link";
import {
  calculateMonthlyReport,
  getContractAlerts,
  type Property,
  type Booking,
  type Tenant,
} from "@/lib/domain";

// Mock data — v3 純前端 SPA + localStorage 模式
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
    notes: "近捷運站,適合單身或情侶",
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
    notes: "家庭友善,接受寵物",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "p3",
    address: "台中市西區美村路 100 號 2 樓",
    roomType: "one-bedroom",
    sizeInPing: 18,
    monthlyRent: 25000,
    deposit: 50000,
    status: "vacant",
    photos: [],
    ownerName: "張房東",
    ownerShareRatio: 0.65,
    notes: "預計 8 月招租",
    createdAt: "2026-02-15",
    updatedAt: "2026-07-01",
  },
];

const mockTenants: Tenant[] = [
  {
    id: "t1",
    propertyId: "p1",
    name: "林小美",
    phone: "0912345678",
    contractStart: "2026-01-01",
    contractEnd: "2026-12-31",
    paymentDay: 5,
    monthlyRent: 30000,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "t2",
    propertyId: "p2",
    name: "陳家三口",
    phone: "0923456789",
    contractStart: "2026-03-01",
    contractEnd: "2027-02-28",
    paymentDay: 1,
    monthlyRent: 55000,
    createdAt: "2026-02-15",
    updatedAt: "2026-03-01",
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

export default function DashboardPage() {
  const today = new Date("2026-08-01");

  const totalProperties = mockProperties.length;
  const rentedCount = mockProperties.filter((p) => p.status === "rented").length;
  const occupancyRate = Math.round((rentedCount / totalProperties) * 100);

  const totalMonthlyIncome = mockTenants.reduce(
    (sum, t) => sum + t.monthlyRent,
    0
  );

  const monthlyReport = calculateMonthlyReport(
    mockProperties,
    mockBookings,
    [],
    2026,
    7
  );

  const contractAlerts = getContractAlerts(mockTenants, today);
  const dangerAlerts = contractAlerts.filter((a) => a.severity === "danger");
  const warningAlerts = contractAlerts.filter((a) => a.severity === "warning");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">總覽</h1>
        <Link href="/properties" className="btn btn-primary">
          + 新增物業
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="物業總數"
          value={totalProperties}
          subtitle={`${rentedCount} 間已出租 (${occupancyRate}%)`}
          emoji="🏘️"
        />
        <StatCard
          title="月租金收入"
          value={`NT$${totalMonthlyIncome.toLocaleString()}`}
          subtitle={`${mockTenants.length} 位房客`}
          emoji="💰"
        />
        <StatCard
          title="本月訂房數"
          value={monthlyReport.reduce((s, r) => s + r.bookingCount, 0)}
          subtitle={`收入 NT$${monthlyReport.reduce((s, r) => s + r.totalIncome, 0).toLocaleString()}`}
          emoji="📅"
        />
        <StatCard
          title="合約警示"
          value={contractAlerts.length}
          subtitle={
            dangerAlerts.length > 0
              ? `${dangerAlerts.length} 個逾期`
              : warningAlerts.length > 0
              ? `${warningAlerts.length} 個即將到期`
              : "全部正常"
          }
          emoji={dangerAlerts.length > 0 ? "🚨" : warningAlerts.length > 0 ? "⚠️" : "✅"}
        />
      </div>

      {/* Contract Alerts */}
      {contractAlerts.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-semibold">合約警示</h2>
          <div className="space-y-2">
            {contractAlerts.map((alert) => {
              const tenant = mockTenants.find((t) => t.id === alert.tenantId);
              const property = mockProperties.find(
                (p) => p.id === tenant?.propertyId
              );
              return (
                <div
                  key={alert.tenantId}
                  className={`flex items-center justify-between rounded-md border p-3 ${
                    alert.severity === "danger"
                      ? "border-red-200 bg-red-50"
                      : "border-yellow-200 bg-yellow-50"
                  }`}
                >
                  <div>
                    <span
                      className={
                        alert.severity === "danger" ? "badge-red" : "badge-yellow"
                      }
                    >
                      {alert.severity === "danger" ? "逾期" : "即將到期"}
                    </span>
                    <span className="ml-3 font-medium">{tenant?.name}</span>
                    <span className="ml-2 text-sm text-gray-600">
                      · {property?.address}
                    </span>
                  </div>
                  <span className="text-sm">{alert.message}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction href="/properties" emoji="🏘️" title="物業管理" />
        <QuickAction href="/tenants" emoji="👥" title="房客管理" />
        <QuickAction href="/bookings" emoji="📅" title="訂房看板" />
        <QuickAction href="/reports" emoji="📊" title="月報表" />
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  emoji,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  emoji: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">{title}</div>
        <div className="text-2xl">{emoji}</div>
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function QuickAction({
  href,
  emoji,
  title,
}: {
  href: string;
  emoji: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="card p-5 transition-shadow hover:shadow-md"
    >
      <div className="text-3xl">{emoji}</div>
      <h3 className="mt-2 font-semibold">{title}</h3>
    </Link>
  );
}