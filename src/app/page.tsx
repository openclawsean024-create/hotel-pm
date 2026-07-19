import { createCsv, validateProperty, calculateBreakdown, getContractAlerts } from '@/lib/domain'

export default function HomePage() {
  // Demo：驗證 domain.ts 真的能用
  const prop = { address: '台北市大安區和平東路 1 號', monthlyRent: 30000, deposit: 60000, sizeInPing: 12, ownerName: '王房東' }
  const errors = validateProperty(prop as Parameters<typeof validateProperty>[0])
  const breakdown = calculateBreakdown({ income: 100000, expenses: 20000, rule: { type: 'ratio' as const, ownerRatio: 0.7 } })
  const csv = createCsv([{ name: '王小明', rent: 30000 }])
  const alerts = getContractAlerts(
    [{ id: 't1', contractEnd: '2026-12-31' }],
    new Date('2026-12-01')
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">飯店 / 包租代管物業管理</h1>
        <p className="text-slate-300 mb-8">民宿 1-10 房 × 包租代管拆帳 · v3.0 production</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="bg-slate-800/60 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-3">物業驗證</h2>
            <pre className="text-sm bg-slate-900/60 p-3 rounded overflow-auto">
{JSON.stringify({ errors, isValid: errors.length === 0 }, null, 2)}
            </pre>
          </section>

          <section className="bg-slate-800/60 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-3">拆帳計算（淨利潤 80,000 · 7:3）</h2>
            <pre className="text-sm bg-slate-900/60 p-3 rounded overflow-auto">
{JSON.stringify(breakdown, null, 2)}
            </pre>
          </section>

          <section className="bg-slate-800/60 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-3">合約警示</h2>
            <pre className="text-sm bg-slate-900/60 p-3 rounded overflow-auto">
{JSON.stringify(alerts, null, 2)}
            </pre>
          </section>

          <section className="bg-slate-800/60 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-3">CSV 匯出</h2>
            <pre className="text-sm bg-slate-900/60 p-3 rounded overflow-auto">
{csv}
            </pre>
          </section>
        </div>

        <footer className="mt-12 text-sm text-slate-400 text-center">
          🏨 hotel-pm v3.0 · TDD 31/31 pass ·{' '}
          <a href="https://github.com/openclawsean024-create/hotel-pm" className="underline hover:text-white">
            GitHub
          </a>
        </footer>
      </div>
    </main>
  )
}