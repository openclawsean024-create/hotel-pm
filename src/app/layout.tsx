import './globals.css'

export const metadata = {
  title: '飯店物業管理 hotel-pm',
  description: '民宿 1-10 房 × 包租代管拆帳 · v3.0 production',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}
