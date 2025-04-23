# Playwright Server Agent API Dokümantasyonu

Bu doküman, Playwright Server Agent'ın API endpointlerini, bu endpointlere gönderilecek verileri ve alınacak yanıtları detaylı olarak açıklar.

## İçindekiler

- [API Endpointleri Tablosu](#api-endpointleri-tablosu)
- [Detaylı API Açıklamaları](#detaylı-api-açıklamaları)
  - [1. `/api/test/run` (POST)](#1-apitestrun-post)
  - [2. `/api/test/run-parallel` (POST)](#2-apitestrun-parallel-post)
  - [3. `/api/results/recent` (GET)](#3-apiresultsrecent-get)
  - [4. `/api/results/:id` (GET)](#4-apiresultsid-get)
  - [5. `/api/performance/report/:id` (GET)](#5-apiperformancereportid-get)
  - [6. `/api/performance/web-vitals/:id` (GET)](#6-apiperformanceweb-vitalsid-get)
  - [7. `/api/performance/network/:id` (GET)](#7-apiperformancenetworkid-get)
  - [8. `/api/performance/trend` (GET)](#8-apiperformancetrend-get)
  - [9. `/api/performance/optimize/:id` (GET)](#9-apiperformanceoptimizeid-get)
  - [10. `/api/status` (GET)](#10-apistatus-get)
- [Test Adımları (Steps) Referansı](#test-adımları-steps-referansı)
- [Seçici Stratejileri (Selector Strategies)](#seçici-stratejileri-selector-strategies)
- [Örnek Kullanım Senaryoları](#örnek-kullanım-senaryoları)

## API Endpointleri Tablosu

| Endpoint | HTTP Metodu | Açıklama | İstek (Request) | Yanıt (Response) |
|----------|-------------|----------|----------------|------------------|
| `/api/test/run` | POST | Tek bir test planını çalıştırır | Test planı JSON objesi | Test sonucu JSON objesi |
| `/api/test/run-parallel` | POST | Birden fazla test planını paralel olarak çalıştırır | Test planları JSON dizisi | Test sonuçları JSON dizisi |
| `/api/results/recent` | GET | En son çalıştırılan test sonuçlarını getirir | `limit` (opsiyonel) | Test sonuçları JSON dizisi |
| `/api/results/:id` | GET | Belirli bir ID'ye sahip test sonucunu getirir | `id` (path parametresi) | Test sonucu JSON objesi |
| `/api/performance/report/:id` | GET | Belirli bir test için performans raporunu getirir | `id` (path parametresi) | Performans raporu JSON objesi |
| `/api/performance/web-vitals/:id` | GET | Belirli bir test için Web Vitals metriklerini getirir | `id` (path parametresi) | Web Vitals JSON objesi |
| `/api/performance/network/:id` | GET | Belirli bir test için ağ metriklerini getirir | `id` (path parametresi) | Ağ metrikleri JSON objesi |
| `/api/performance/trend` | GET | Performans trendlerini getirir | `testName`, `limit` (opsiyonel) | Trend verileri JSON objesi |
| `/api/performance/optimize/:id` | GET | Belirli bir test için optimizasyon önerilerini getirir | `id` (path parametresi) | Optimizasyon önerileri JSON objesi |
| `/api/status` | GET | Server durumunu getirir | - | Durum JSON objesi |

## Detaylı API Açıklamaları

### 1. `/api/test/run` (POST)

Tek bir test planını çalıştırır ve sonuçları döndürür.

**İstek (Request):**
```json
{
  "name": "Test Adı",
  "description": "Test açıklaması",
  "browserType": "chromium", // "chromium", "firefox" veya "webkit"
  "headless": true, // true veya false
  "steps": [
    {
      "action": "navigate", // "navigate", "click", "type", "wait", vb.
      "target": "https://example.com", // URL, seçici, vb.
      "strategy": "css", // "css", "xpath", "id", vb. (opsiyonel)
      "value": "değer", // Metin girişi için (opsiyonel)
      "description": "Adım açıklaması" // (opsiyonel)
    }
    // Daha fazla adım...
  ]
}
```

**Yanıt (Response):**
```json
{
  "name": "Test Adı",
  "description": "Test açıklaması",
  "browserType": "chromium",
  "headless": true,
  "startTime": "2025-04-23T08:04:09.527Z",
  "endTime": "2025-04-23T08:04:15.510Z",
  "duration": 5983,
  "steps": [
    {
      "step": 1,
      "action": "navigate",
      "target": "https://example.com",
      "value": "",
      "description": "Adım açıklaması",
      "duration": 1903,
      "success": true,
      "error": null,
      "screenshot": null
    }
    // Daha fazla adım sonucu...
  ],
  "success": true,
  "error": null,
  "performance": {
    "webVitals": {
      "fcp": 976,
      "lcp": 1004,
      "cls": 0.001,
      "fid": 5.4,
      "tti": 1397,
      "ttfb": 477
    },
    "networkMetrics": {
      "totalRequests": 9,
      "totalSize": 250199,
      "averageDuration": 506.125
      // Daha fazla ağ metriği...
    }
    // Daha fazla performans metriği...
  },
  "reportId": "test-1745395455512-fefdae6f"
}
```

### 2. `/api/test/run-parallel` (POST)

Birden fazla test planını paralel olarak çalıştırır ve sonuçları döndürür.

**İstek (Request):**
```json
[
  {
    "name": "Paralel Test 1",
    "description": "Paralel çalıştırma testi 1",
    "browserType": "chromium",
    "headless": false,
    "steps": [
      // Test adımları...
    ]
  },
  {
    "name": "Paralel Test 2",
    "description": "Paralel çalıştırma testi 2",
    "browserType": "chromium",
    "headless": false,
    "steps": [
      // Test adımları...
    ]
  }
  // Daha fazla test planı...
]
```

**Yanıt (Response):**
```json
{
  "success": true,
  "results": [
    {
      "name": "Paralel Test 1",
      "description": "Paralel çalıştırma testi 1",
      "browserType": "chromium",
      "headless": false,
      "startTime": "2025-04-23T08:02:52.778Z",
      "endTime": "2025-04-23T08:03:28.637Z",
      "duration": 35857,
      "steps": [
        // Test adım sonuçları...
      ],
      "success": true,
      "error": null,
      "performance": {
        // Performans metrikleri...
      }
    },
    // Daha fazla test sonucu...
  ]
}
```

### 3. `/api/results/recent` (GET)

En son çalıştırılan test sonuçlarını getirir.

**İstek (Request):**
```
/api/results/recent?limit=5
```

**Yanıt (Response):**
```json
[
  {
    "id": "test-1745395455512-fefdae6f",
    "name": "Temel Etkileşimler Testi",
    "description": "Only Testing Blog üzerinde temel etkileşimleri test eder",
    "browserType": "chromium",
    "headless": false,
    "startTime": "2025-04-23T08:04:09.527Z",
    "endTime": "2025-04-23T08:04:15.510Z",
    "duration": 5983,
    "success": true,
    "error": null,
    "stepCount": 13,
    "successfulSteps": 13,
    "failedSteps": 0
  },
  // Daha fazla test sonucu...
]
```

### 4. `/api/results/:id` (GET)

Belirli bir ID'ye sahip test sonucunu getirir.

**İstek (Request):**
```
/api/results/test-1745395455512-fefdae6f
```

**Yanıt (Response):**
```json
{
  "id": "test-1745395455512-fefdae6f",
  "name": "Temel Etkileşimler Testi",
  "description": "Only Testing Blog üzerinde temel etkileşimleri test eder",
  "browserType": "chromium",
  "headless": false,
  "startTime": "2025-04-23T08:04:09.527Z",
  "endTime": "2025-04-23T08:04:15.510Z",
  "duration": 5983,
  "steps": [
    // Detaylı adım sonuçları...
  ],
  "success": true,
  "error": null,
  "performance": {
    // Detaylı performans metrikleri...
  },
  "artifacts": {
    "screenshots": [
      "screenshot_1745395455390.png"
    ],
    "videos": [],
    "traces": []
  }
}
```

### 5. `/api/performance/report/:id` (GET)

Belirli bir test için performans raporunu getirir.

**İstek (Request):**
```
/api/performance/report/test-1745395455512-fefdae6f
```

**Yanıt (Response):**
```json
{
  "testId": "test-1745395455512-fefdae6f",
  "testName": "Temel Etkileşimler Testi",
  "timestamp": "2025-04-23T08:04:15.510Z",
  "duration": 5983,
  "webVitals": {
    "fcp": 976,
    "lcp": 1004,
    "cls": 0.001,
    "fid": 5.4,
    "tti": 1397,
    "ttfb": 477
  },
  "networkMetrics": {
    "totalRequests": 9,
    "totalSize": 250199,
    "averageDuration": 506.125,
    "slowRequests": [],
    "failedRequests": [],
    "uncacheableRequests": [
      // Önbelleğe alınamayan istekler...
    ],
    "statsByType": {
      // İstek türüne göre istatistikler...
    },
    "requestTimeline": [
      // İstek zaman çizelgesi...
    ]
  },
  "stepStats": {
    "totalSteps": 13,
    "averageStepDuration": 460.08,
    "minStepDuration": 19,
    "maxStepDuration": 1903,
    "slowestStepIndex": 0
  },
  "memoryUsage": {
    "initialMemory": {
      // Başlangıç bellek kullanımı...
    },
    "finalMemory": {
      // Son bellek kullanımı...
    },
    "memoryDiff": {
      // Bellek kullanım farkı...
    }
  },
  "warnings": [
    // Performans uyarıları...
  ],
  "recommendations": [
    // Optimizasyon önerileri...
  ]
}
```

### 6. `/api/performance/web-vitals/:id` (GET)

Belirli bir test için Web Vitals metriklerini getirir.

**İstek (Request):**
```
/api/performance/web-vitals/test-1745395455512-fefdae6f
```

**Yanıt (Response):**
```json
{
  "testId": "test-1745395455512-fefdae6f",
  "testName": "Temel Etkileşimler Testi",
  "timestamp": "2025-04-23T08:04:15.510Z",
  "webVitals": {
    "fcp": 976,
    "lcp": 1004,
    "cls": 0.001,
    "fid": 5.4,
    "tti": 1397,
    "ttfb": 477
  },
  "scores": {
    "fcp": "good",
    "lcp": "good",
    "cls": "good",
    "fid": "good"
  },
  "issues": [],
  "recommendations": []
}
```

### 7. `/api/performance/network/:id` (GET)

Belirli bir test için ağ metriklerini getirir.

**İstek (Request):**
```
/api/performance/network/test-1745395455512-fefdae6f
```

**Yanıt (Response):**
```json
{
  "testId": "test-1745395455512-fefdae6f",
  "testName": "Temel Etkileşimler Testi",
  "timestamp": "2025-04-23T08:04:15.510Z",
  "networkMetrics": {
    "totalRequests": 9,
    "totalSize": 250199,
    "averageDuration": 506.125,
    "slowRequests": [],
    "failedRequests": [],
    "uncacheableRequests": [
      // Önbelleğe alınamayan istekler...
    ],
    "largeResources": [],
    "statsByType": {
      "document": {
        "count": 1,
        "totalSize": 33964,
        "averageDuration": 477,
        "slowCount": 0,
        "largeCount": 0
      },
      // Diğer türler...
    },
    "timingMetrics": {
      "dnsLookup": 0,
      "tcpConnect": 0,
      "sslHandshake": 0,
      "ttfb": 0,
      "download": 0
    },
    "requestTimeline": [
      // İstek zaman çizelgesi...
    ]
  },
  "issues": [
    "Found 1 uncacheable resources"
  ],
  "recommendations": [
    "Add proper cache headers to static resources"
  ]
}
```

### 8. `/api/performance/trend` (GET)

Performans trendlerini getirir.

**İstek (Request):**
```
/api/performance/trend?testName=Performans%20Test%20Planı&limit=10
```

**Yanıt (Response):**
```json
{
  "testName": "Performans Test Planı",
  "limit": 10,
  "trendData": [
    {
      "timestamp": "2025-04-23T08:04:40.830Z",
      "webVitals": {
        "fcp": 1896,
        "lcp": 1896,
        "cls": 0.146,
        "fid": null,
        "tti": 4410,
        "ttfb": 1229
      },
      "networkStats": {
        "totalRequests": 30,
        "totalSize": 2675725,
        "averageDuration": 626
      },
      "warnings": 6
    },
    // Daha fazla trend verisi...
  ]
}
```

### 9. `/api/performance/optimize/:id` (GET)

Belirli bir test için optimizasyon önerilerini getirir.

**İstek (Request):**
```
/api/performance/optimize/test-1745395455512-fefdae6f
```

**Yanıt (Response):**
```json
{
  "testId": "test-1745395455512-fefdae6f",
  "testName": "Temel Etkileşimler Testi",
  "timestamp": "2025-04-23T08:04:15.510Z",
  "optimizationSuggestions": [
    {
      "category": "caching",
      "severity": "medium",
      "issue": "Found 1 uncacheable resources",
      "recommendation": "Add proper cache headers to static resources",
      "resources": [
        // İlgili kaynaklar...
      ]
    },
    // Daha fazla öneri...
  ],
  "potentialImprovements": {
    "performance": "minor",
    "loadTime": "~200ms",
    "resourceUsage": "~50KB"
  }
}
```

### 10. `/api/status` (GET)

Server durumunu getirir.

**İstek (Request):**
```
/api/status
```

**Yanıt (Response):**
```json
{
  "status": "running",
  "uptime": 3600,
  "version": "1.0.0",
  "systemInfo": {
    "platform": "darwin",
    "nodeVersion": "v23.11.0",
    "browsers": {
      "chromium": "available",
      "firefox": "not found",
      "webkit": "not available"
    }
  },
  "testStats": {
    "totalTestsRun": 128,
    "successfulTests": 98,
    "failedTests": 30,
    "averageDuration": 8500
  },
  "workerStatus": {
    "active": 0,
    "idle": 4,
    "maxWorkers": 4
  }
}
```

## Test Adımları (Steps) Referansı

Test planlarında kullanabileceğiniz adım türleri:

| Adım (Action) | Açıklama | Gerekli Parametreler | Opsiyonel Parametreler |
|---------------|----------|----------------------|------------------------|
| `navigate` | Belirtilen URL'ye gider | `target` (URL) | `description` |
| `click` | Belirtilen elemana tıklar | `target` (seçici) | `strategy`, `description` |
| `doubleClick` | Belirtilen elemana çift tıklar | `target` (seçici) | `strategy`, `description` |
| `type` | Belirtilen elemana metin yazar | `target` (seçici), `value` (metin) | `strategy`, `description` |
| `select` | Dropdown'dan bir seçenek seçer | `target` (seçici), `value` (seçenek değeri) | `strategy`, `description` |
| `check` | Checkbox'ı işaretler | `target` (seçici) | `strategy`, `description` |
| `uncheck` | Checkbox'ın işaretini kaldırır | `target` (seçici) | `strategy`, `description` |
| `wait` | Belirtilen süre (ms) kadar bekler | `target` (süre) | `description` |
| `waitForElement` | Belirtilen elemanın görünür olmasını bekler | `target` (seçici) | `strategy`, `description`, `timeout` |
| `waitForNavigation` | Sayfa yönlendirmesinin tamamlanmasını bekler | - | `description`, `timeout` |
| `waitForURL` | Belirli bir URL'ye ulaşılmasını bekler | `target` (URL) | `description`, `timeout` |
| `pressEnter` | Enter tuşuna basar | - | `description` |
| `pressKey` | Belirtilen tuşa basar | `value` (tuş) | `description` |
| `hover` | Belirtilen elemanın üzerine gelir | `target` (seçici) | `strategy`, `description` |
| `takeScreenshot` | Ekran görüntüsü alır | - | `target` (dosya adı), `description` |
| `goBack` | Tarayıcı geçmişinde geri gider | - | `description` |
| `goForward` | Tarayıcı geçmişinde ileri gider | - | `description` |
| `refresh` | Sayfayı yeniler | - | `description` |
| `clickInFrame` | Frame içindeki bir elemana tıklar | `target` (seçici), `frame` (frame adı/indeksi) | `strategy`, `description` |
| `typeInFrame` | Frame içindeki bir elemana metin yazar | `target` (seçici), `value` (metin), `frame` (frame adı/indeksi) | `strategy`, `description` |
| `dragAndDrop` | Bir elemanı başka bir elemana sürükler | `target` (kaynak seçici), `value` (hedef seçici) | `strategy`, `description` |
| `executeScript` | JavaScript kodu çalıştırır | `value` (JavaScript kodu) | `description` |

## Seçici Stratejileri (Selector Strategies)

Test adımlarında kullanabileceğiniz seçici stratejileri:

| Strateji | Açıklama | Örnek |
|----------|----------|-------|
| `css` | CSS seçici (varsayılan) | `#login-button`, `.form-input` |
| `xpath` | XPath seçici | `//button[contains(text(), 'Giriş')]` |
| `id` | ID seçici | `login-button` |
| `name` | Name özelliği seçici | `username` |
| `text` | Metin içeriği seçici | `Giriş Yap` |
| `role` | ARIA role seçici | `button` |
| `testId` | Test ID seçici | `login-form-submit` |

## Örnek Kullanım Senaryoları

### 1. Basit Bir Login Testi

```json
{
  "name": "Login Testi",
  "description": "Kullanıcı girişi yapabilme testi",
  "browserType": "chromium",
  "headless": false,
  "steps": [
    {
      "action": "navigate",
      "target": "https://example.com/login",
      "description": "Login sayfasına git"
    },
    {
      "action": "type",
      "target": "#username",
      "value": "testuser",
      "description": "Kullanıcı adını gir"
    },
    {
      "action": "type",
      "target": "#password",
      "value": "password123",
      "description": "Şifreyi gir"
    },
    {
      "action": "click",
      "target": "#login-button",
      "description": "Login butonuna tıkla"
    },
    {
      "action": "waitForNavigation",
      "description": "Yönlendirmenin tamamlanmasını bekle"
    },
    {
      "action": "waitForElement",
      "target": ".dashboard-welcome",
      "description": "Dashboard'un yüklenmesini bekle"
    },
    {
      "action": "takeScreenshot",
      "target": "login-success",
      "description": "Başarılı giriş ekran görüntüsü"
    }
  ]
}
```

### 2. Paralel Form Doğrulama Testi

```json
[
  {
    "name": "Geçerli Form Testi",
    "description": "Geçerli verilerle form gönderimi testi",
    "browserType": "chromium",
    "headless": true,
    "steps": [
      {
        "action": "navigate",
        "target": "https://example.com/form",
        "description": "Form sayfasına git"
      },
      {
        "action": "type",
        "target": "#name",
        "value": "John Doe",
        "description": "İsim gir"
      },
      {
        "action": "type",
        "target": "#email",
        "value": "john@example.com",
        "description": "E-posta gir"
      },
      {
        "action": "click",
        "target": "#submit",
        "description": "Gönder butonuna tıkla"
      },
      {
        "action": "waitForElement",
        "target": ".success-message",
        "description": "Başarı mesajını bekle"
      }
    ]
  },
  {
    "name": "Geçersiz Form Testi",
    "description": "Geçersiz e-posta ile form gönderimi testi",
    "browserType": "chromium",
    "headless": true,
    "steps": [
      {
        "action": "navigate",
        "target": "https://example.com/form",
        "description": "Form sayfasına git"
      },
      {
        "action": "type",
        "target": "#name",
        "value": "John Doe",
        "description": "İsim gir"
      },
      {
        "action": "type",
        "target": "#email",
        "value": "invalid-email",
        "description": "Geçersiz e-posta gir"
      },
      {
        "action": "click",
        "target": "#submit",
        "description": "Gönder butonuna tıkla"
      },
      {
        "action": "waitForElement",
        "target": ".error-message",
        "description": "Hata mesajını bekle"
      }
    ]
  }
]
```

### 3. Performans Testi

```json
{
  "name": "Performans Test Planı",
  "description": "Web Vitals ve performans metriklerini test etmek için örnek test planı",
  "browserType": "chromium",
  "headless": true,
  "steps": [
    {
      "action": "navigate",
      "target": "https://example.com",
      "description": "Ana sayfaya git"
    },
    {
      "action": "wait",
      "target": "2000",
      "description": "2 saniye bekle"
    },
    {
      "action": "takeScreenshot",
      "target": "anasayfa",
      "description": "Ekran görüntüsü al"
    },
    {
      "action": "click",
      "target": ".product-link",
      "description": "Ürün sayfasına git"
    },
    {
      "action": "wait",
      "target": "2000",
      "description": "2 saniye bekle"
    },
    {
      "action": "takeScreenshot",
      "target": "urun-sayfasi",
      "description": "Ekran görüntüsü al"
    }
  ]
}
```
