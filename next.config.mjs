/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/*": ["./lib/wasm/*.wasm"],
    },
  },
};

export default nextConfig;
