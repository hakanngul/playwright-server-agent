# Playwright Server Agent - Detaylı Analiz

## 1. Genel Proje Yapısı

Bu proje, Playwright kütüphanesini kullanarak tarayıcı otomasyonu sağlayan bir sunucu uygulamasıdır. Temel olarak şu bileşenlerden oluşmaktadır:

- **Express Sunucusu**: API isteklerini karşılayan ve test çalıştırma işlemlerini yöneten bir web sunucusu
- **Tarayıcı Otomasyonu**: Playwright kullanarak tarayıcı kontrolü sağlayan modüller
- **Retry Mekanizması**: Hata durumlarında işlemleri yeniden deneme mantığı
- **Tarayıcı Havuzu**: Kaynakları verimli kullanmak için tarayıcı örneklerini yöneten sistem
- **Veritabanı Entegrasyonu**: Test sonuçlarını ve element bilgilerini saklayan SQLite veritabanı
- **Raporlama Sistemi**: Test sonuçlarını JSON formatında kaydeden ve analiz eden modüller

## 2. Temel Bileşenler

### 2.1. Sunucu (server.js)

- Express.js tabanlı bir web sunucusu
- WebSocket desteği ile gerçek zamanlı iletişim
- API rotaları ve test çalıştırma endpoint'leri
- Tarayıcı havuzu yönetimi
- Hata yakalama ve işleme mekanizmaları

### 2.2. Tarayıcı Otomasyonu (services/browser)

- **TestAgent**: Tarayıcı otomasyonu için ana giriş noktası
- **BrowserManager**: Tarayıcı örneklerini başlatma, yapılandırma ve kapatma
- **BrowserPool**: Birden fazla tarayıcı örneğini yönetme
- **ElementHelper**: Sayfa elementleriyle etkileşim için yardımcı fonksiyonlar
- **StepExecutor**: Test adımlarını çalıştırma ve sonuçları işleme
- **TestRunner**: Test planlarını çalıştırma ve sonuçları raporlama
- **ScreenshotManager**: Ekran görüntüsü alma ve yönetme
- **AntiDetection**: Bot algılama önlemlerini uygulama

### 2.3. Retry Mekanizması (services/utils/RetryHelper.js)

- Hata durumlarında işlemleri yeniden deneme
- Üstel geri çekilme stratejisi (exponential backoff)
- Özelleştirilebilir yeniden deneme seçenekleri
- Sonuç ve istisna tabanlı yeniden deneme koşulları
- Geri çağırma (callback) desteği

### 2.4. Hata Yönetimi (services/errors)

- Özel hata sınıfları
- Yeniden denenebilir hataları işaretleme
- Hata detaylarını JSON formatında dönüştürme
- Farklı hata türleri için özel işleme

### 2.5. API Rotaları (routes)

- Element yönetimi
- Senaryo yönetimi
- Test sonuçları yönetimi
- Raporlama

### 2.6. Veritabanı (database)

- SQLite veritabanı entegrasyonu
- Element, senaryo ve test sonuçları için servisler

## 3. Retry Mekanizması Detaylı Analizi

Retry mekanizması, projenin en önemli bileşenlerinden biridir ve `services/utils/RetryHelper.js` dosyasında uygulanmıştır:

### 3.1. RetryHelper Sınıfı

- **Yapılandırılabilir Seçenekler**:
  - `maxRetries`: Maksimum yeniden deneme sayısı (varsayılan: 3)
  - `initialDelay`: İlk deneme sonrası bekleme süresi (varsayılan: 1000ms)
  - `maxDelay`: Maksimum bekleme süresi (varsayılan: 10000ms)
  - `factor`: Üstel artış faktörü (varsayılan: 2)
  - `retryOnException`: Hata durumunda yeniden deneme yapılıp yapılmayacağı
  - `retryOnResult`: Sonuca göre yeniden deneme koşulu
  - `onRetry`: Her yeniden denemede çağrılacak fonksiyon

- **Üstel Geri Çekilme**: Her başarısız denemeden sonra bekleme süresi üstel olarak artırılır:
  ```javascript
  calculateDelay(attempt, options) {
    const delay = options.initialDelay * Math.pow(options.factor, attempt);
    return Math.min(delay, options.maxDelay);
  }
  ```

- **Hata ve Sonuç Tabanlı Yeniden Deneme**: Hem hatalara hem de dönüş değerlerine göre yeniden deneme yapabilir:
  ```javascript
  // Sonuç tabanlı yeniden deneme
  if (retryOptions.retryOnResult && retryOptions.retryOnResult(result)) {
    // Yeniden deneme mantığı...
  }
  
  // Hata tabanlı yeniden deneme
  if (!retryOptions.retryOnException || (error.isRetryable === false)) {
    throw error;
  }
  ```

### 3.2. Retry Mekanizmasının Kullanımı

Retry mekanizması, projenin çeşitli bölümlerinde kullanılmaktadır:

1. **Sayfa Gezinme İşlemlerinde**:
   ```javascript
   await retry(async () => {
     try {
       await this.page.goto(step.value, {
         waitUntil: 'networkidle',
         timeout: step.timeout || 60000
       });
       return true;
     } catch (error) {
       // Hata işleme...
     }
   }, {
     maxRetries: 2,
     initialDelay: 1000,
     factor: 2,
     onRetry: ({ attempt, error, willRetry }) => {
       console.log(`Retry ${attempt} navigating to: ${step.value}`);
     }
   });
   ```

2. **Element Etkileşimlerinde**:
   ```javascript
   await retry(async () => {
     try {
       const clickElementVisible = await this.waitForElementByStrategy(target, strategy);
       // Element tıklama işlemi...
     } catch (error) {
       // Hata işleme...
     }
   }, retryOptions);
   ```

3. **Tarayıcı Havuzu İşlemlerinde**: Tarayıcı edinme ve serbest bırakma işlemlerinde örtük yeniden deneme mantığı

## 4. Tarayıcı Havuzu Mekanizması

Tarayıcı havuzu, kaynakları verimli kullanmak için tasarlanmış önemli bir bileşendir:

### 4.1. BrowserPool Sınıfı

- **Havuz Yapılandırması**:
  - `maxSize`: Maksimum tarayıcı sayısı
  - `minSize`: Minimum hazır tarayıcı sayısı
  - `idleTimeout`: Boşta kalan tarayıcıların kapatılma süresi

- **Tarayıcı Yönetimi**:
  - Tarayıcı oluşturma ve havuza ekleme
  - Havuzdan tarayıcı edinme
  - Kullanılan tarayıcıları havuza geri döndürme
  - Boşta kalan tarayıcıları temizleme

- **Bakım İşlemleri**:
  - Periyodik olarak havuzu kontrol etme
  - Minimum tarayıcı sayısını koruma
  - Uzun süre boşta kalan tarayıcıları kapatma

### 4.2. Görünür ve Headless Tarayıcılar

- Görünür tarayıcılar (headless=false) için özel işleme:
  ```javascript
  if (isHeadless === false) {
    // Görünür tarayıcılar için havuz kullanılmaz, her seferinde yeni oluşturulur
    const browserManager = new BrowserManager(browserType, { headless: false });
    // ...
  }
  ```

- Headless tarayıcılar için havuz kullanımı:
  ```javascript
  // Headless tarayıcılar için havuzdan edinme
  const index = this.availableBrowsers.findIndex(bm => bm.getBrowserType() === browserType);
  if (index >= 0) {
    browserManager = this.availableBrowsers[index];
    this.availableBrowsers.splice(index, 1);
  }
  ```

## 5. Test Çalıştırma Mekanizması

### 5.1. TestRunner Sınıfı

- Test planlarını çalıştırma
- Adım adım test yürütme
- Sonuçları toplama ve raporlama
- Tarayıcı kaynaklarını yönetme

### 5.2. StepExecutor Sınıfı

- Farklı test adımlarını çalıştırma:
  - Gezinme işlemleri (navigate, goBack, goForward, refresh)
  - Element etkileşimleri (click, doubleClick, hover, type, select)
  - Klavye işlemleri (pressEnter, pressTab, pressEscape)
  - Bekleme işlemleri (wait, waitForElement, waitForNavigation)
  - Ekran görüntüsü alma (takeScreenshot, takeElementScreenshot)
  - Doğrulama işlemleri (verifyText, verifyTitle, verifyURL)

- Hata yakalama ve işleme
- Adım sonuçlarını raporlama

## 6. Hata Yönetimi

### 6.1. Özel Hata Sınıfları

- **AppError**: Temel hata sınıfı
- **ValidationError**: Doğrulama hataları
- **NotFoundError**: Bulunamayan kaynaklar
- **BrowserError**: Tarayıcı hataları
- **ElementError**: Element etkileşim hataları
- **NavigationError**: Gezinme hataları
- **TimeoutError**: Zaman aşımı hataları
- **NetworkError**: Ağ hataları

### 6.2. Yeniden Denenebilir Hatalar

- `isRetryable` özelliği ile hataların yeniden denenip denenemeyeceğini belirleme:
  ```javascript
  constructor(message, code = 'INTERNAL_ERROR', isRetryable = false) {
    // ...
    this.isRetryable = isRetryable;
    // ...
  }
  ```

## 7. Test Planları

Test planları, JSON formatında tanımlanır ve şu bileşenleri içerir:

- Test adı ve açıklaması
- Tarayıcı tercihi ve headless modu
- Tarayıcı havuzu kullanımı
- Ekran görüntüsü alma tercihi
- Test adımları:
  - Eylem (action)
  - Hedef (target)
  - Strateji (strategy)
  - Değer (value)
  - Açıklama (description)

Örnek:
```json
{
  "name": "Google Arama Testi",
  "description": "Google'a git ve arama yap",
  "browserPreference": "chromium",
  "headless": false,
  "useBrowserPool": false,
  "takeScreenshots": true,
  "steps": [
    {
      "action": "navigate",
      "value": "https://www.google.com",
      "description": "Google'a git"
    },
    // Diğer adımlar...
  ]
}
```

## 8. Anti-Bot Algılama Önlemleri

Proje, bot algılama sistemlerini atlatmak için çeşitli önlemler içerir:

- Gerçekçi kullanıcı ajanları
- Otomasyon belirteçlerini gizleme
- Tarayıcı parmak izini değiştirme
- Gerçekçi tarayıcı davranışları

## 9. Raporlama Sistemi

- JSON formatında test sonuçları
- Günlük, haftalık ve aylık raporlar
- Test istatistikleri ve analizler

## 10. Veritabanı Entegrasyonu

- SQLite veritabanı kullanımı
- Element, senaryo ve test sonuçları için tablolar
- CRUD işlemleri için servisler

## Sonuç

Playwright Server Agent, tarayıcı otomasyonu için kapsamlı bir çözüm sunan, iyi tasarlanmış bir projedir. Özellikle retry mekanizması, tarayıcı havuzu ve hata yönetimi gibi bileşenler, projenin güvenilirliğini ve verimliliğini artırmaktadır. Proje, test otomasyonu, web kazıma (scraping) ve tarayıcı tabanlı işlemler için güçlü bir altyapı sağlamaktadır.

Retry mekanizması, projenin en önemli özelliklerinden biridir ve tarayıcı otomasyonunun doğasında var olan kararsızlıkları ele almak için etkili bir çözüm sunmaktadır. Üstel geri çekilme stratejisi, özelleştirilebilir yeniden deneme seçenekleri ve hem hata hem de sonuç tabanlı yeniden deneme mantığı, projenin güvenilirliğini önemli ölçüde artırmaktadır.
