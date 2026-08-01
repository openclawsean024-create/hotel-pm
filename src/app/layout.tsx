import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "民宿管家 hotel-pm — 物業管理系統",
  description:
    "台灣民宿與包租代管業者的純前端物業管理系統（PMS）：物業、房客、訂房、月報表四大模組。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-lg font-semibold text-brand-600"
            >
              🏠 民宿管家 hotel-pm
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink href="/dashboard">總覽</NavLink>
              <NavLink href="/properties">物業</NavLink>
              <NavLink href="/tenants">房客</NavLink>
              <NavLink href="/bookings">訂房</NavLink>
              <NavLink href="/reports">月報表</NavLink>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
          © 2026 hotel-pm · 台灣民宿 / 包租代管 PMS · 純前端 · localStorage
          儲存
        </footer>
      </body>
    </html>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
    >
      {children}
    </Link>
  );
}