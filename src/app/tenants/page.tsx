import { getContractAlerts, type Tenant } from "@/lib/domain";

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

const mockProperties: Record<string, string> = {
  p1: "台北市大安區和平東路 1 號 3 樓",
  p2: "台北市信義區松仁路 50 號 5 樓",
};

export default function TenantsPage() {
  const today = new Date("2026-08-01");
  const alerts = getContractAlerts(mockTenants, today);
  const alertMap = new Map(alerts.map((a) => [a.tenantId, a]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">房客管理</h1>
          <p className="text-sm text-gray-600">
            共 {mockTenants.length} 位 · 合約到期自動警示
          </p>
        </div>
        <button className="btn btn-primary">+ 新增房客</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-600">
            <tr>
              <th className="px-4 py-3">姓名</th>
              <th className="px-4 py-3">物業</th>
              <th className="px-4 py-3">電話</th>
              <th className="px-4 py-3">合約期間</th>
              <th className="px-4 py-3">月租金</th>
              <th className="px-4 py-3">繳款日</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockTenants.map((t) => {
              const alert = alertMap.get(t.id);
              return (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {mockProperties[t.propertyId] ?? t.propertyId}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.phone}</td>
                  <td className="px-4 py-3 text-xs">
                    {t.contractStart} → {t.contractEnd}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    NT${t.monthlyRent.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    每月 {t.paymentDay} 號
                  </td>
                  <td className="px-4 py-3">
                    {alert ? (
                      <span
                        className={
                          alert.severity === "danger"
                            ? "badge-red"
                            : "badge-yellow"
                        }
                      >
                        {alert.message}
                      </span>
                    ) : (
                      <span className="badge-green">正常</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs text-brand-600 hover:underline">
                      編輯
                    </button>
                    <span className="mx-1 text-gray-300">·</span>
                    <button className="text-xs text-red-600 hover:underline">
                      刪除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}