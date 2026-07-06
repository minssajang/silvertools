/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com',
      'plus.unsplash.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
    ],
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          // 관리자 컴포넌트 — 일반 사용자에게 로드 안 됨
          admin: {
            test: /[\\/]components[\\/]admin[\\/]/,
            name: 'admin',
            chunks: 'all',
            priority: 30,
            enforce: true,
          },
          // React 등 공통 프레임워크 분리
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'framework',
            chunks: 'all',
            priority: 40,
            enforce: true,
          },
          // 나머지 node_modules 분리
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 20,
          },
        },
      }
    }
    return config
  },

  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: '/api/sitemap.xml' },
      { source: '/robots.txt',  destination: '/api/robots.txt'  },
    ]
  },

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://www.silvertools.kr/:path*',
        permanent: true,
      },
      // apex(silvertools.kr) -> www로 통일하되, ads.txt는 애드센스 크롤러가
      // 리다이렉트 없이 바로 읽을 수 있도록 예외로 둔다.
      {
        source: '/:path((?!ads\\.txt$).*)',
        has: [{ type: 'host', value: 'silvertools.kr' }],
        destination: 'https://www.silvertools.kr/:path*',
        permanent: true,
      },
      {
        source: '/',
        has: [{ type: 'host', value: 'silvertools.kr' }],
        destination: 'https://www.silvertools.kr/',
        permanent: true,
      },
    ]
  },

  async headers() {
    return [
      {
        // 블로그 페이지에서 Unsplash 이미지 로드 허용
        source: '/blog/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "img-src 'self' data: https://images.unsplash.com https://plus.unsplash.com ;",
          },
        ],
      },
    ]
  },
}
module.exports = nextConfig
