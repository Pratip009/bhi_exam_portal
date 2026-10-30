/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ["mongoose", "bcryptjs", "pdf-lib"] },
};
export default nextConfig;
