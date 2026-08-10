/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // Deployed as serverless on Netlify via @netlify/plugin-nextjs.
  // Note: no output:'export' (dynamic route /tasks/[id] needs SSR),
  // and no trailingSlash (it can cause 404s with the Netlify Next runtime).
};
export default nextConfig;
