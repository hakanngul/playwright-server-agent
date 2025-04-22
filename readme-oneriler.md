# Playwright Server Agent için Performans İzleme Önerileri

Playwright tabanlı test otomasyon çerçevenizde performans izleme, testlerin etkinliğini ve verimliliğini artırmak için kritik öneme sahiptir. İşte bu konuda uygulanabilecek kapsamlı öneriler:

## 1. Test Performans Metrikleri Toplama

### Temel Metrikler:
- **Test Çalışma Süresi**: Her test adımı ve toplam test süresi
- **Sayfa Yükleme Süreleri**: Navigation ve sayfa yükleme performansı
- **Kaynak Kullanımı**: CPU, bellek kullanımı
- **Ağ İstekleri**: Sayfa başına istek sayısı, istek süreleri, yanıt boyutları

### Uygulama Önerisi:
```javascript
// Performans izleme için StepExecutor'a eklenecek kod
async executeStep(step, index) {
  const startTime = performance.now();
  const memoryBefore = process.memoryUsage();
  
  // Mevcut step yürütme kodu...
  const result = await this.executeStepInternal(step, index);
  
  const endTime = performance.now();
  const memoryAfter = process.memoryUsage();
  
  // Performans metriklerini ekle
  result.performance = {
    duration: endTime - startTime,
    memoryUsage: {
      before: memoryBefore,
      after: memoryAfter,
      diff: {
        rss: memoryAfter.rss - memoryBefore.rss,
        heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
        heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed
      }
    }
  };
  
  return result;
}
```

## 2. Sayfa Performans Metrikleri

### Web Vitals Metrikleri:
- **First Contentful Paint (FCP)**: İlk içeriğin görüntülenme süresi
- **Largest Contentful Paint (LCP)**: En büyük içeriğin görüntülenme süresi
- **Cumulative Layout Shift (CLS)**: Kümülatif düzen kayması
- **First Input Delay (FID)**: İlk giriş gecikmesi

### Uygulama Önerisi:
```javascript
// PerformanceHelper sınıfı
export class PerformanceHelper {
  constructor(page) {
    this.page = page;
  }
  
  async captureWebVitals() {
    return await this.page.evaluate(() => {
      const webVitals = {};
      
      // FCP
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcpEntry) {
        webVitals.fcp = fcpEntry.startTime;
      }
      
      // LCP
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        webVitals.lcp = lcpEntries[lcpEntries.length - 1].startTime;
      }
      
      // CLS - requires PerformanceObserver in the page
      if (window.cls) {
        webVitals.cls = window.cls;
      }
      
      return webVitals;
    });
  }
  
  async setupPerformanceObservers() {
    await this.page.addInitScript(() => {
      window.cls = 0;
      
      // CLS Observer
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            window.cls += entry.value;
          }
        }
      }).observe({type: 'layout-shift', buffered: true});
    });
  }
}
```

## 3. Ağ Performans İzleme

### İzlenecek Metrikler:
- **İstek Sayısı**: Sayfa başına toplam HTTP istekleri
- **İstek Süreleri**: Her isteğin tamamlanma süresi
- **Yanıt Boyutları**: İndirilen veri miktarı
- **Yavaş İstekler**: Belirli bir eşiği aşan istekler

### Uygulama Önerisi:
```javascript
// NetworkMonitor sınıfı
export class NetworkMonitor {
  constructor(page) {
    this.page = page;
    this.requests = [];
    this.setupListeners();
  }
  
  setupListeners() {
    this.page.on('request', request => {
      const requestData = {
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        startTime: Date.now(),
        status: null,
        responseSize: 0,
        duration: 0
      };
      
      this.requests.push(requestData);
    });
    
    this.page.on('response', response => {
      const request = response.request();
      const requestData = this.requests.find(r => r.url === request.url());
      
      if (requestData) {
        requestData.status = response.status();
        requestData.duration = Date.now() - requestData.startTime;
        
        response.buffer().then(buffer => {
          requestData.responseSize = buffer.length;
        }).catch(() => {
          // Bazı yanıtlar buffer'a dönüştürülemeyebilir
        });
      }
    });
  }
  
  getNetworkStats() {
    const stats = {
      totalRequests: this.requests.length,
      totalSize: this.requests.reduce((sum, req) => sum + (req.responseSize || 0), 0),
      averageDuration: this.requests.length > 0 
        ? this.requests.reduce((sum, req) => sum + req.duration, 0) / this.requests.length 
        : 0,
      slowRequests: this.requests.filter(req => req.duration > 1000) // 1 saniyeden uzun istekler
    };
    
    return stats;
  }
  
  reset() {
    this.requests = [];
  }
}
```

## 4. Performans Raporlama

### Raporlama Özellikleri:
- **JSON Formatında Raporlar**: Tüm performans metriklerini içeren yapılandırılmış raporlar
- **Trend Analizi**: Zaman içindeki performans değişimlerini izleme
- **Eşik Uyarıları**: Belirli eşikleri aşan performans sorunları için uyarılar

### Uygulama Önerisi:
```javascript
// PerformanceReporter sınıfı
export class PerformanceReporter {
  constructor(options = {}) {
    this.reportsDir = options.reportsDir || './data/performance-reports';
    this.thresholds = options.thresholds || {
      testDuration: 10000, // 10 saniye
      pageDuration: 5000,  // 5 saniye
      requestDuration: 1000 // 1 saniye
    };
    
    // Raporlama dizinini oluştur
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }
  
  saveReport(testName, performanceData) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${testName.replace(/\s+/g, '-')}_${timestamp}.json`;
    const filePath = path.join(this.reportsDir, filename);
    
    // Eşik aşımlarını kontrol et
    const warnings = this.checkThresholds(performanceData);
    
    // Uyarıları rapora ekle
    const reportData = {
      testName,
      timestamp: new Date().toISOString(),
      performanceData,
      warnings
    };
    
    // Raporu kaydet
    fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2));
    
    return {
      filePath,
      warnings
    };
  }
  
  checkThresholds(performanceData) {
    const warnings = [];
    
    // Test süresi kontrolü
    if (performanceData.testDuration > this.thresholds.testDuration) {
      warnings.push({
        type: 'testDuration',
        message: `Test süresi eşiği aşıldı: ${performanceData.testDuration}ms > ${this.thresholds.testDuration}ms`
      });
    }
    
    // Sayfa yükleme süresi kontrolü
    if (performanceData.webVitals && performanceData.webVitals.lcp > this.thresholds.pageDuration) {
      warnings.push({
        type: 'pageDuration',
        message: `Sayfa yükleme süresi eşiği aşıldı: ${performanceData.webVitals.lcp}ms > ${this.thresholds.pageDuration}ms`
      });
    }
    
    // Yavaş istekler kontrolü
    if (performanceData.networkStats && performanceData.networkStats.slowRequests.length > 0) {
      warnings.push({
        type: 'slowRequests',
        message: `${performanceData.networkStats.slowRequests.length} yavaş istek tespit edildi`,
        details: performanceData.networkStats.slowRequests
      });
    }
    
    return warnings;
  }
  
  generateTrendReport(testName, limit = 10) {
    const files = fs.readdirSync(this.reportsDir)
      .filter(file => file.startsWith(testName.replace(/\s+/g, '-')))
      .sort()
      .reverse()
      .slice(0, limit);
    
    const trendData = files.map(file => {
      const filePath = path.join(this.reportsDir, file);
      const reportData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      return {
        timestamp: reportData.timestamp,
        testDuration: reportData.performanceData.testDuration,
        webVitals: reportData.performanceData.webVitals,
        networkStats: {
          totalRequests: reportData.performanceData.networkStats.totalRequests,
          totalSize: reportData.performanceData.networkStats.totalSize,
          averageDuration: reportData.performanceData.networkStats.averageDuration
        },
        warnings: reportData.warnings.length
      };
    });
    
    return trendData;
  }
}
```

## 5. Performans İzleme Entegrasyonu

### TestRunner Entegrasyonu:
```javascript
// TestRunner sınıfına eklenecek kod
constructor(options = {}) {
  // Mevcut kod...
  
  // Performans izleme bileşenleri
  this.performanceHelper = null;
  this.networkMonitor = null;
  this.performanceReporter = new PerformanceReporter({
    reportsDir: options.performanceReportsDir || './data/performance-reports',
    thresholds: options.performanceThresholds
  });
}

async initialize() {
  // Mevcut kod...
  
  // Performans izleme bileşenlerini oluştur
  const page = this.browserManager.getPage();
  this.performanceHelper = new PerformanceHelper(page);
  this.networkMonitor = new NetworkMonitor(page);
  
  // Performans gözlemcilerini ayarla
  await this.performanceHelper.setupPerformanceObservers();
}

async runTest(testPlan) {
  // Mevcut kod...
  
  // Performans izlemeyi başlat
  const testStartTime = performance.now();
  this.networkMonitor.reset();
  
  // Test adımlarını çalıştır...
  
  // Performans metriklerini topla
  const testEndTime = performance.now();
  const webVitals = await this.performanceHelper.captureWebVitals();
  const networkStats = this.networkMonitor.getNetworkStats();
  
  // Performans verilerini sonuçlara ekle
  results.performance = {
    testDuration: testEndTime - testStartTime,
    webVitals,
    networkStats,
    stepPerformance: results.steps.map(step => step.performance)
  };
  
  // Performans raporunu kaydet
  const reportResult = this.performanceReporter.saveReport(testPlan.name, results.performance);
  
  // Uyarıları loglara ekle
  if (reportResult.warnings.length > 0) {
    console.warn(`Performans uyarıları tespit edildi: ${reportResult.warnings.length}`);
    reportResult.warnings.forEach(warning => {
      console.warn(`- ${warning.message}`);
    });
  }
  
  return results;
}
```

## 6. Performans Görselleştirme (Web Arayüzü için)

Ayrı bir projede geliştirdiğiniz web arayüzüne entegre edilebilecek performans görselleştirme bileşenleri:

1. **Zaman Çizelgesi Grafiği**: Test adımlarının süresini gösteren çubuk grafik
2. **Trend Grafikleri**: Zaman içindeki performans değişimlerini gösteren çizgi grafikleri
3. **Isı Haritaları**: Yavaş çalışan test adımlarını vurgulayan ısı haritaları
4. **Ağ Waterfall Diyagramı**: Ağ isteklerinin zamanlama ve süresini gösteren şelale diyagramı

## 7. Performans Optimizasyon Önerileri

Performans izleme sisteminiz, aşağıdaki optimizasyon önerilerini otomatik olarak üretebilir:

1. **Yavaş Adımlar**: "X adımı ortalamadan %Y daha yavaş çalışıyor, optimize edilmeli"
2. **Ağ Darboğazları**: "Z sayfasında çok sayıda büyük boyutlu istek var"
3. **Bellek Sızıntıları**: "Test çalıştıkça bellek kullanımı sürekli artıyor"
4. **Paralelleştirme Önerileri**: "Bu test süiti paralel çalıştırılarak %X hızlandırılabilir"

## Uygulama Planı

1. **Aşama 1**: Temel performans metriklerini toplama (test süresi, adım süresi)
2. **Aşama 2**: Web Vitals ve ağ performans izleme ekleme
3. **Aşama 3**: Performans raporlama ve eşik uyarıları
4. **Aşama 4**: Trend analizi ve optimizasyon önerileri
5. **Aşama 5**: Web arayüzü entegrasyonu (ayrı projenizde)

Bu öneriler, Playwright Server Agent projenize kapsamlı bir performans izleme sistemi eklemenize yardımcı olacaktır. Bu sistem, testlerinizin performansını sürekli izleyerek, darboğazları tespit etmenize ve optimizasyon fırsatlarını belirlemenize olanak tanıyacaktır.
