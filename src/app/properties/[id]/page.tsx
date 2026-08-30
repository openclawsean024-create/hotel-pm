import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPropertyById,
  validateProperty,
  type Property,
} from "@/lib/domain";
import { FavoriteButton } from "@/components/favorite-button";

// SPEC §1-§9 提到的「物業詳情」路由第一個實作。
// 純前端模式:使用 mock data;v2 接 Supabase 後,此處改為 server fetch。
const mockProperties: Property[] = [
  { id: "p1", address: "台北市大安區和平東路 1 號 3 樓", roomType: "studio", sizeInPing: 12, monthlyRent: 30000, deposit: 60000, status: "rented", photos: [], ownerName: "王房東", ownerShareRatio: 0.7, notes: "近捷運站", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "p2", address: "台北市信義區松仁路 50 號 5 樓", roomType: "two-bedroom", sizeInPing: 28, monthlyRent: 55000, deposit: 110000, status: "rented", photos: [], ownerName: "李房東", ownerShareRatio: 0.6, notes: "家庭友善", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "p3", address: "台中市西區美村路 100 號 2 樓", roomType: "one-bedroom", sizeInPing: 18, monthlyRent: 25000, deposit: 50000, status: "vacant", photos: [], ownerName: "張房東", ownerShareRatio: 0.65, notes: "預計 8 月招租", createdAt: "2026-02-15", updatedAt: "2026-07-01" },
];

type Params = { id: string };

export function generateStaticParams(): Params[] {
  return mockProperties.map((p) => ({ id: p.id }));
}

// Next.js 15+ 將 params 變成 Promise;不 await 會拿到 Promise 物件而非字串值
export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const p = getPropertyById(mockProperties, id);
  if (!p) return { title: "找不到物業 — hotel-pm" };
  return {
    title: `${p.address} — hotel-pm`,
    description: `${p.roomType} · ${p.sizeInPing} 坪 · 月租 NT$${p.monthlyRent.toLocaleString()}`,
  };
}

const statusLabels: Record<Property["status"], string> = {
  vacant: "空置",
  rented: "出租中",
  reserved: "已預訂",
  maintenance: "維修中",
};

const roomTypeLabels: Record<Property["roomType"], string> = {
  studio: "套房",
  "one-bedroom": "1 房",
  "two-bedroom": "2 房",
  "three-bedroom": "3 房",
  house: "獨棟透天",
};

export default async function PropertyDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const property = getPropertyById(mockProperties, id);
  if (!property) {
    // 觸發 Next.js 的 404 頁面（app/_not-found）
    notFound();
  }
  const errors = validateProperty(property);

  return (
    <article className="space-y-6">
      <nav className="text-sm text-gray-500">
        <Link href="/properties" className="hover:text-brand-600 hover:underline">
          ← 返回物業列表
        </Link>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-green">{statusLabels[property.status]}</span>
            <span className="badge-gray">{roomTypeLabels[property.roomType]}</span>
          </div>
          <h1 className="text-3xl font-bold">{property.address}</h1>
        </div>
        <FavoriteButton propertyId={property.id} />
      </header>

      <section className="card grid grid-cols-2 gap-4 p-5 text-sm md:grid-cols-4">
        <Detail label="月租金" value={`NT$${property.monthlyRent.toLocaleString()}`} />
        <Detail label="押金" value={`NT$${property.deposit.toLocaleString()}`} />
        <Detail label="坪數" value={`${property.sizeInPing} 坪`} />
        <Detail label="拆帳比例" value={`${(property.ownerShareRatio * 100).toFixed(0)}%`} />
        <Detail label="房東" value={property.ownerName} />
        <Detail label="建立日期" value={property.createdAt} />
      </section>

      {property.notes && (
        <section className="card p-5">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">備註</h2>
          <p className="text-sm text-gray-600">📝 {property.notes}</p>
        </section>
      )}

      {errors.length > 0 && (
        <section className="card border-red-200 bg-red-50 p-5">
          <h2 className="mb-2 text-sm font-semibold text-red-700">資料驗證失敗</h2>
          <ul className="list-disc pl-5 text-sm text-red-700">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}