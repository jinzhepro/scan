/** @type {import('next').NextConfig} */
const nextConfig = {

  images: {
    domains: ['localhost', 'supabase.co', 'your-supabase-project.supabase.co'],
    unoptimized: true, // 微信H5环境优化
  },
  // PWA配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
  // 微信H5优化
  async rewrites() {
    return [
      {
        source: '/mp-verification_:file.txt',
        destination: '/api/wechat/verification/:file',
      },
    ]
  },
  // 构建优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 输出配置
  output: 'standalone',
  // 压缩配置
  compress: true,
  // 静态文件优化
  trailingSlash: false
}

module.exports = nextConfig