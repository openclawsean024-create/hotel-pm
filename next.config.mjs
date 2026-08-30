/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Security headers (production baseline)
  // - CSP 預留 'unsafe-inline' 是給 Tailwind 與 Next.js 內聯 style / script;後續可改 nonce-based
  // - Permissions-Policy 鎖掉麥克風/相機/地理位置,純 PMS 不需要這些
  // - Strict-Transport-Security 建議在 Vercel 預設開啟,此處雙重保險
  async headers() {
    const csp = [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "font-src 'self' https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'microphone=(), camera=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

export default nextConfig