/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/relay-oLEZ/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*", // TODO: move these to .env or interpolate using NEXT_PUBLIC_POSTHOG_HOST ?
      },
      {
        source: "/relay-oLEZ/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
      {
        source: "/relay-oLEZ/flags",
        destination: "https://eu.i.posthog.com/flags",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
