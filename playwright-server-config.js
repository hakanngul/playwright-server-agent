/**
 * Playwright Server Agent Configuration Example
 *
 * Bu dosya, varsayılan yapılandırmayı geçersiz kılmak için kullanılır.
 * Sadece değiştirmek istediğiniz ayarları belirtin, diğerleri varsayılan değerlerini koruyacaktır.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  server: {
    // Sunucu portu
    port: 3002,

    // İzin verilen kaynaklar (CORS)
    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001']
  },
  test: {
    // Paralel çalışacak işçi sayısı
    workers: 4,

    // Tarayıcıları headless modda çalıştır
    headless: true,

    // Desteklenen tarayıcı türleri
    browserTypes: ['chromium', 'firefox']
  },
  paths: {
    // Raporlar için dizin
    reportsDir: path.join(__dirname, 'data/reports')
    // traces ve videos özellikleri kaldırıldı
  }
};
