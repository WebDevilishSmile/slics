/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      new URL('https://lh3.googleusercontent.com/**'),
      new URL('https://yt3.ggpht.com/**'),
    ],
  },
};

export default nextConfig;
