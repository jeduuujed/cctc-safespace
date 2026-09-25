import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    config.resolve.modules = [path.join(__dirname, 'node_modules'), 'node_modules'];
    if (dev) {
      config.cache = false;
    }
    return config;
  }
};

export default nextConfig;
