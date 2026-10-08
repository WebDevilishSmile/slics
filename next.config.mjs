/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      new URL('https://lh3.googleusercontent.com/**'),
      new URL('https://yt3.ggpht.com/**'),
    ],
  },
  // Renamed routes, so a bookmarked old link still lands (the query string,
  // e.g. ?slic=, carries over).
  async redirects() {
    return [{ source: '/all', destination: '/hubs', permanent: true }];
  },
};

export default nextConfig;
