import type { MetadataRoute } from "next";
import type { Property } from "@/lib/domain";

// 此檔讓 Next.js 自動生成 /sitemap.xml (MetadataRoute.Sitemap 格式)
// domain.ts 的 generateSitemap() 仍保留,供非 Next.js 場景（例如 SSR streaming）輸出 XML 字串用
const mockProperties: Property[] = [
  { id: "p1", address: "台北市大安區和平東路 1 號 3 樓", roomType: "studio", sizeInPing: 12, monthlyRent: 30000, deposit: 60000, status: "rented", photos: [], ownerName: "王房東", ownerShareRatio: 0.7, notes: "", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "p2", address: "台北市信義區松仁路 50 號 5 樓", roomType: "two-bedroom", sizeInPing: 28, monthlyRent: 55000, deposit: 110000, status: "rented", photos: [], ownerName: "李房東", ownerShareRatio: 0.6, notes: "", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "p3", address: "台中市西區美村路 100 號 2 樓", roomType: "one-bedroom", sizeInPing: 18, monthlyRent: 25000, deposit: 50000, status: "vacant", photos: [], ownerName: "張房東", ownerShareRatio: 0.65, notes: "預計 8 月招租", createdAt: "2026-02-15", updatedAt: "2026-07-01" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://hotel-pm.vercel.app";
  const now = new Date();
  return [
    { url: `${baseUrl}/`, lastModified: now, priority: 1.0 },
    { url: `${baseUrl}/dashboard`, lastModified: now, priority: 0.9 },
    ...mockProperties.map((p) => ({
      url: `${baseUrl}/properties/${p.id}`,
      lastModified: now,
      priority: 0.7,
    })),
  ];
}