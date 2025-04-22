/**
 * Import Reports CLI Tool
 * 
 * Bu araç, data/reports klasöründeki JSON raporları veritabanına aktarır.
 * 
 * Kullanım:
 *   node import-reports.js all                  - Tüm raporları içe aktar
 *   node import-reports.js date 2025-04-22      - Belirli bir günün raporlarını içe aktar
 */

import { reportImportService } from './database/index.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log('Komut belirtilmedi. Kullanım:');
    console.log('  node import-reports.js all                  - Tüm raporları içe aktar');
    console.log('  node import-reports.js date 2025-04-22      - Belirli bir günün raporlarını içe aktar');
    process.exit(1);
  }
  
  try {
    if (command === 'all') {
      console.log('Tüm raporlar içe aktarılıyor...');
      const result = await reportImportService.importAllDailyReports();
      console.log('İçe aktarma sonucu:', result);
    } else if (command === 'date') {
      const date = args[1];
      
      if (!date) {
        console.log('Tarih belirtilmedi. Kullanım:');
        console.log('  node import-reports.js date 2025-04-22');
        process.exit(1);
      }
      
      console.log(`${date} tarihli raporlar içe aktarılıyor...`);
      const result = await reportImportService.importReportsForDate(date);
      console.log('İçe aktarma sonucu:', result);
    } else {
      console.log(`Bilinmeyen komut: ${command}`);
      console.log('Kullanım:');
      console.log('  node import-reports.js all                  - Tüm raporları içe aktar');
      console.log('  node import-reports.js date 2025-04-22      - Belirli bir günün raporlarını içe aktar');
      process.exit(1);
    }
    
    // İçe aktarma sonrası veritabanındaki test sonuçlarını göster
    const testResults = reportImportService.getRecentTestResults(5);
    console.log('\nVeritabanındaki son 5 test sonucu:');
    console.log(testResults);
    
    const stats = reportImportService.getTestResultStats();
    console.log('\nVeritabanındaki test sonuçları istatistikleri:');
    console.log(stats);
    
    console.log('\nİşlem tamamlandı.');
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

main();
