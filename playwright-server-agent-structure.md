# Playwright Server Agent - Proje Yapısı ve Özellikleri

## 1. Genel Bakış

Playwright Server Agent, tarayıcı otomasyonu için Playwright kütüphanesini kullanan bir Node.js tabanlı sunucu uygulamasıdır. Bu uygulama, web uygulamalarının otomatik testlerini çalıştırmak, performans metriklerini toplamak ve test sonuçlarını raporlamak için kullanılır.

## 2. Temel Teknolojiler

- **Node.js**: Sunucu tarafı JavaScript çalışma ortamı
- **Express.js**: Web API sunucusu için kullanılan framework
- **Socket.io**: Gerçek zamanlı iletişim için WebSocket kütüphanesi
- **Playwright**: Microsoft tarafından geliştirilen tarayıcı otomasyon kütüphanesi
- **ES Modules**: Proje ES Modules yapısını kullanmaktadır (`import`/`export` sözdizimi)

## 3. Mimari Yapı

### 3.1. Klasör Yapısı

```
/playwright-server-agent/
├── server.js                # Ana sunucu dosyası
├── config.js                # Yapılandırma sistemi
├── playwright-server-config.js # Kullanıcı yapılandırması
├── services/                # Temel servis modülleri
│   ├── agent/               # Ajan yönetim sistemi
│   │   ├── implementations/ # Ajan uygulamaları
│   │   └── interfaces/      # Ajan arayüzleri
│   ├── browser/             # Tarayıcı otomasyon bileşenleri
│   │   ├── implementations/ # Tarayıcı uygulamaları
│   │   └── interfaces/      # Tarayıcı arayüzleri
│   ├── core/                # Temel arayüzler
│   ├── factory/             # Factory sınıfları
│   ├── performance/         # Performans ölçüm bileşenleri
│   ├── reporting/           # Raporlama bileşenleri
│   └── test/                # Test çalıştırma bileşenleri
├── routes/                  # API rotaları
│   ├── api.js               # Genel API rotaları
│   ├── agent.js             # Ajan rotaları
│   ├── reports.js           # Rapor rotaları
│   ├── performance.js       # Performans rotaları
│   ├── status.js            # Durum rotaları
│   ├── test-plans.js        # Test planları rotaları
│   └── test-suites.js       # Test suiteleri rotaları
├── public/                  # Statik dosyalar ve frontend
├── test-run-with-curl-scripts/ # Test çalıştırma betikleri
│   ├── test-plans/          # Örnek test planları
│   └── test-suites/         # Örnek test suiteleri
└── data/                    # Veri dosyaları
    └── reports/             # Test raporları
```

### 3.2. Temel Bileşenler

#### 3.2.1. Sunucu (server.js)

- Express.js tabanlı web sunucusu
- Socket.io entegrasyonu ile gerçek zamanlı iletişim
- API rotalarının tanımlanması
- Statik dosya sunumu
- Hata yakalama ve işleme

#### 3.2.2. Yapılandırma Sistemi (config.js)

- Varsayılan yapılandırma ayarları
- Kullanıcı yapılandırması yükleme
- Yapılandırma birleştirme
- Gerekli dizinleri oluşturma

#### 3.2.3. Ajan Sistemi (services/agent)

- **TestAgent**: Tarayıcı otomasyonu için ana giriş noktası
- **AgentManager**: Test ajanlarını yönetir ve test isteklerini dağıtır
- **QueueSystem**: Test isteklerini sıraya alır ve önceliklendirir
- **SystemMonitor**: Sistem kaynaklarını izler

#### 3.2.4. Tarayıcı Otomasyonu (services/browser)

- **BrowserController**: Tarayıcı başlatma, sayfa yönetimi ve kapatma işlemleri
- **BrowserManager**: Tarayıcı örneklerini yönetir
- **ElementInteractor**: Sayfa elemanları ile etkileşim sağlar
- **ParallelTestManager**: Paralel test çalıştırma yönetimi

#### 3.2.5. Test Çalıştırma (services/test)

- **TestExecutor**: Test planlarını çalıştırır
- **StepExecutor**: Test adımlarını çalıştırır
- **TestReporter**: Test sonuçlarını raporlar

#### 3.2.6. Performans Ölçümü (services/performance)

- **PerformanceCollector**: Performans metriklerini toplar
- **NetworkMonitor**: Ağ isteklerini izler
- **PerformanceReporter**: Performans raporları oluşturur

## 4. API Yapısı

### 4.1. Temel API Endpointleri

- `/api/agent/test-run`: Ajan tabanlı test çalıştırma
- `/api/agent/run-parallel`: Paralel test çalıştırma
- `/api/agent/test-status/:requestId`: Test durumunu sorgulama
- `/api/test-plans`: Test planlarını yönetme
- `/api/test-suites`: Test suitelerini yönetme
- `/api/results/recent`: Son test sonuçlarını getirme
- `/api/results/:id`: Belirli bir test sonucunu getirme
- `/api/performance/report/:id`: Performans raporunu getirme
- `/api/status`: Sunucu durumunu getirme

### 4.2. WebSocket Olayları

- `request:completed`: Test tamamlandığında gönderilir
- `request:failed`: Test başarısız olduğunda gönderilir
- `request:progress`: Test ilerleme durumu güncellendiğinde gönderilir

## 5. Test Planları ve Test Suiteleri

### 5.1. Test Planı Yapısı

```json
{
  "name": "Örnek Test",
  "description": "Örnek bir test planı",
  "browserPreference": "chromium",
  "headless": false,
  "steps": [
    {
      "action": "navigate",
      "value": "https://example.com",
      "description": "Örnek sayfaya git"
    },
    {
      "action": "click",
      "target": "#button1",
      "strategy": "css",
      "description": "Butona tıkla"
    }
  ]
}
```

### 5.2. Test Suite Yapısı

```json
{
  "name": "Örnek Test Suite",
  "description": "Örnek bir test suite",
  "category": "regression",
  "parallelExecution": true,
  "maxWorkers": 5,
  "defaultBrowserPreference": "chromium",
  "defaultHeadless": false,
  "testPlans": [
    // Test planları dizisi
  ]
}
```

## 6. Tarayıcı Desteği

Proje aşağıdaki tarayıcıları desteklemektedir:

- **Chromium**: Varsayılan tarayıcı
- **Firefox**: Mozilla Firefox tarayıcısı
- **WebKit**: Safari tarayıcı motoru
- **Edge**: Microsoft Edge tarayıcısı

## 7. Paralel Test Çalıştırma

Proje, birden fazla testi aynı anda çalıştırabilme yeteneğine sahiptir:

- **AgentManager**: Birden fazla test ajanını yönetir
- **ParallelTestManager**: Paralel test çalıştırma stratejilerini uygular
- **QueueSystem**: Test isteklerini sıraya alır ve önceliklendirir
- **Ölçeklenebilirlik**: Sistem kaynakları ve yapılandırma ayarlarına göre paralel çalıştırma sayısı ayarlanabilir

## 8. Raporlama Sistemi

- **JSON Raporları**: Test sonuçları JSON formatında kaydedilir
- **Performans Metrikleri**: Web Vitals, ağ metrikleri ve diğer performans ölçümleri
- **Hata Yakalama**: Test hataları ve ekran görüntüleri kaydedilir

## 9. Yeniden Oluşturma İçin Öneriler

Projeyi React.js ile yeniden oluştururken aşağıdaki adımları izleyebilirsiniz:

1. **Backend ve Frontend Ayrımı**:
   - Backend: Express.js ve Playwright ile tarayıcı otomasyonu
   - Frontend: React.js ile kullanıcı arayüzü

2. **Temel Bileşenler**:
   - Test planı oluşturma ve düzenleme arayüzü
   - Test suite yönetimi
   - Test çalıştırma ve sonuç görüntüleme
   - Performans raporları ve grafikler

3. **API Entegrasyonu**:
   - RESTful API ile backend iletişimi
   - WebSocket ile gerçek zamanlı güncellemeler

4. **Modüler Yapı**:
   - Bileşen tabanlı geliştirme
   - Yeniden kullanılabilir UI bileşenleri
   - State yönetimi (Redux veya Context API)

5. **Responsive Tasarım**:
   - Mobil ve masaüstü uyumlu arayüz
   - Material Design veya başka bir UI kütüphanesi kullanımı

## 10. Başlangıç Adımları

1. **Backend Kurulumu**:
   ```bash
   # Proje dizininde
   npm install
   node server.js
   ```

2. **Frontend Geliştirme**:
   ```bash
   # Yeni bir React projesi oluştur
   npx create-react-app playwright-ui
   cd playwright-ui
   npm start
   ```

3. **API Bağlantısı**:
   - Backend API'sine bağlanmak için axios veya fetch kullanımı
   - WebSocket bağlantısı için socket.io-client kullanımı

4. **Temel Sayfalar**:
   - Ana Sayfa: Genel bakış ve istatistikler
   - Test Planları: Test planı oluşturma ve düzenleme
   - Test Suiteleri: Test suite yönetimi
   - Sonuçlar: Test sonuçları ve raporlar
   - Performans: Performans metrikleri ve grafikler

Bu yapı, Playwright Server Agent projesinin temel özelliklerini ve mimarisini anlamanıza yardımcı olacak ve React.js ile yeniden oluşturmanız için bir başlangıç noktası sağlayacaktır.
