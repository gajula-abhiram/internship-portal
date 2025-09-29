/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude better-sqlite3 from client-side bundle
      config.externals = config.externals || [];
      config.externals.push('better-sqlite3');
      config.externals.push('bindings');
    }
    
    // Add fallback for node modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        assert: false,
        process: false,
        child_process: false,
        tls: false,
        net: false,
        http: false,
        https: false,
        zlib: false,
        os: false,
        dns: false,
        readline: false,
        module: false,
        vm: false,
        constants: false,
        events: false,
        tty: false,
        url: false,
        querystring: false,
        string_decoder: false,
        punycode: false,
        domain: false,
        timers: false,
        console: false,
        perf_hooks: false,
        async_hooks: false,
        inspector: false,
        trace_events: false,
        v8: false,
        worker_threads: false,
        dgram: false,
        cluster: false,
        repl: false,
        readline: false,
        fs: false,
        path: false
      };
    }
    
    return config;
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Output configuration for Vercel
  outputFileTracingRoot: __dirname,
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ];
  },
}

export default nextConfig