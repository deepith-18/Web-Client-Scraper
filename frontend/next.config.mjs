/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Handled separately in CI/CD pipeline
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

