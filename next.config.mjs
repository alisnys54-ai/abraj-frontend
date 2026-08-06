/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  images: { unoptimized: true },
  // Remove output: export - deploy as serverless on Netlify
};
export default nextConfig;
