/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // -------------------------------------------------------------------------
  // Output: keep default (no 'export') — we have API routes that require
  // a Node.js runtime. Netlify's @netlify/plugin-nextjs handles SSR.
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Webpack: keep Node-only modules out of browser/Edge bundles.
  // -------------------------------------------------------------------------
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals = [...(config.externals || []), "pdf-parse"];
    }
    return config;
  },

  // -------------------------------------------------------------------------
  // Experimental: keep heavy server-only packages in Node runtime (Next 14+)
  // -------------------------------------------------------------------------
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs", "pdf-parse"],
  },
};

export default nextConfig;
