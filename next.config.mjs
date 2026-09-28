/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  images: { unoptimized: true },
  experimental: {
    serverActions: {
      // Stays under Vercel's hard 4.5MB request-body cap, with headroom for
      // multipart overhead above the 4MB file size actions/gallery.ts enforces.
      bodySizeLimit: "4mb",
    },
  },
}

export default nextConfig
