import Link from "next/link";
import { validateProperty, type Property } from "@/lib/domain";

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
    notes: "近捷運站",
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
    notes: "家庭友善",
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

const statusLabels: Record<Property["status"], { label: string; className: string }> = {
  vacant: { label: "空置", className: "badge-gray" },
  rented: { label: "出租中", className: "badge-green" },
  reserved: { label: "已預訂", className: "badge-yellow" },
  maintenance: { label: "維修中", className: "badge-red" },
};

const roomTypeLabels: Record<Property["roomType"], string> = {
  studio: "套房",
  "one-bedroom": "1 房",
  "two-bedroom": "2 房",
  "three-bedroom": "3 房",
  house: "獨棟透天",
};

export default function PropertiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">物業管理</h1>
          <p className="text-sm text-gray-600">
            共 {mockProperties.length} 間 · 升級包租代管版前最多 30 間
          </p>
        </div>
        <button className="btn btn-primary">+ 新增物業</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {mockProperties.map((p) => {
          // 用 domain.ts 的 validateProperty 真的驗一次 (示範 TDD 串接)
          const errors = validateProperty(p);
          const isValid = errors.length === 0;

          return (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={statusLabels[p.status].className}>
                      {statusLabels[p.status].label}
                    </span>
                    <span className="badge-gray">
                      {roomTypeLabels[p.roomType]}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold">{p.address}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-brand-600">
                    NT${p.monthlyRent.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">/ 月</div>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Field label="坪數" value={`${p.sizeInPing} 坪`} />
                <Field label="押金" value={`NT$${p.deposit.toLocaleString()}`} />
                <Field label="房東" value={p.ownerName} />
                <Field label="拆帳比例" value={`${(p.ownerShareRatio * 100).toFixed(0)}%`} />
              </dl>

              {p.notes && (
                <p className="mt-3 text-sm text-gray-600">📝 {p.notes}</p>
              )}

              {!isValid && (
                <div className="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-700">
                  ⚠ 資料驗證失敗:{errors.join(", ")}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/tenants?propertyId=${p.id}`}
                  className="btn btn-secondary text-xs"
                >
                  查看房客
                </Link>
                <Link
                  href={`/bookings?propertyId=${p.id}`}
                  className="btn btn-secondary text-xs"
                >
                  查看訂房
                </Link>
                <button className="btn btn-secondary text-xs">編輯</button>
              </div>
            </div>
          );
        })}
      </div>

      <section className="card border-brand-200 bg-brand-50 p-4 text-sm">
        <strong>💡 提示:</strong>{" "}
        物業達 30 間會自動提示升級至包租代管版(NT$1,499/月)。
        純前端模式資料存在 localStorage,清瀏覽器資料會遺失 — 正式上線請改用 Supabase 雲端同步。
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}