import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  reactCompiler: true,

  // Разрешаем доступ с локальной сети в режиме разработки
  // Это убирает предупреждение о cross-origin запросах
  allowedDevOrigins: [
    '10.81.23.214:3000',  // IP адрес в локальной сети
    'localhost:3000',      // Локальный доступ
  ],
};

export default nextConfig;
