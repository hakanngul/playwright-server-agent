# 🚀 Playwright'ten Puppeteer'a Geçiş Rehberi

<div align="center">
  <img src="https://raw.githubusercontent.com/microsoft/playwright/main/docs/src/img/playwright-logo.svg" width="200" alt="Playwright Logo">
  <span style="font-size: 48px; margin: 0 20px;">➡️</span>
  <img src="https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png" width="200" alt="Puppeteer Logo">
</div>

## 📋 İçindekiler

- [Giriş](#-giriş)
- [Mevcut Mimari](#-mevcut-mimari)
- [Değiştirilmesi Gereken Bileşenler](#-değiştirilmesi-gereken-bileşenler)
- [Playwright ve Puppeteer Arasındaki Temel Farklar](#-playwright-ve-puppeteer-arasındaki-temel-farklar)
- [Uygulama Örnekleri](#-uygulama-örnekleri)
- [Geçiş Adımları](#-geçiş-adımları)
- [Test ve Doğrulama](#-test-ve-doğrulama)

## 🌟 Giriş

Bu rehber, mevcut Playwright tabanlı test otomasyon projesini Puppeteer kullanacak şekilde nasıl özelleştireceğinizi açıklamaktadır. Playwright ve Puppeteer, web tarayıcılarını otomatikleştirmek için kullanılan iki popüler JavaScript kütüphanesidir. Her ikisi de benzer amaçlara hizmet etse de, API'leri ve yetenekleri arasında önemli farklar bulunmaktadır.

## 🏗 Mevcut Mimari

Mevcut proje, aşağıdaki ana bileşenlerden oluşan modüler bir mimariye sahiptir:

```
/server-agent/
├── server.js                # Ana sunucu dosyası
├── services/
│   ├── testAgent.js         # Playwright test ajanı (giriş noktası)
│   └── browser/             # Modüler tarayıcı otomasyon bileşenleri
│       ├── index.js         # Ana modül dışa aktarımları
│       ├── AntiDetection.js # Bot algılama önlemleri
│       ├── BrowserManager.js # Tarayıcı başlatma ve yönetimi
│       ├── ElementHelper.js # Element etkileşim yardımcıları
│       ├── ScreenshotManager.js # Ekran görüntüsü alma yardımcıları
│       ├── StepExecutor.js  # Test adımı yürütme
│       └── TestRunner.js    # Test planı yürütme
├── routes/
│   └── api.js               # API rotaları
```

### Veri Akışı

1. **Kullanıcı İsteği** → `server.js` API endpoint'leri aracılığıyla test planını alır
2. **Test Ajanı** → `testAgent.js` test planını işler ve tarayıcı otomasyonunu başlatır
3. **Tarayıcı Yönetimi** → `BrowserManager.js` tarayıcıyı başlatır ve yapılandırır
4. **Test Yürütme** → `TestRunner.js` ve `StepExecutor.js` test adımlarını yürütür
5. **Element Etkileşimleri** → `ElementHelper.js` sayfa elementleriyle etkileşimleri yönetir
6. **Sonuçlar** → Test sonuçları kullanıcıya döndürülür

## 🔄 Değiştirilmesi Gereken Bileşenler

Playwright'ten Puppeteer'a geçiş yaparken, aşağıdaki bileşenlerin önemli değişiklikler gerektireceğini unutmayın:

| Bileşen | Değişiklik Seviyesi | Açıklama |
|---------|---------------------|----------|
| **BrowserManager.js** | 🔴 Yüksek | Tarayıcı başlatma, bağlam oluşturma ve yapılandırma tamamen değiştirilmeli |
| **ElementHelper.js** | 🔴 Yüksek | Element seçme ve etkileşim yöntemleri Puppeteer API'sine uyarlanmalı |
| **AntiDetection.js** | 🟠 Orta | Bot algılama önlemleri Puppeteer'a uygun şekilde güncellenmeli |
| **StepExecutor.js** | 🟠 Orta | Test adımı yürütme yöntemleri Puppeteer API'sine uyarlanmalı |
| **TestRunner.js** | 🟡 Düşük | Yüksek seviyeli test yürütme mantığı minimal değişiklik gerektirir |
| **server.js** | 🟢 Minimal | API endpoint'leri minimal değişiklik gerektirir |

## 🔍 Playwright ve Puppeteer Arasındaki Temel Farklar

### 1. Tarayıcı Başlatma ve Bağlam

<table>
<tr>
<th>Playwright</th>
<th>Puppeteer</th>
</tr>
<tr>
<td>

```javascript
import { chromium, firefox } from 'playwright';
const browser = await chromium.launch(options);
const context = await browser.newContext(contextOptions);
const page = await context.newPage();
```

</td>
<td>

```javascript
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch(options);
const context = await browser.createIncognitoBrowserContext();
const page = await context.newPage();
```

</td>
</tr>
</table>

### 2. Element Seçimi

<table>
<tr>
<th>Playwright</th>
<th>Puppeteer</th>
</tr>
<tr>
<td>

```javascript
// Birleşik seçici motoru
await page.$('css=selector');
await page.$('xpath=//div');
await page.getByRole('button');
```

</td>
<td>

```javascript
// Farklı seçici türleri için ayrı yöntemler
await page.$('selector');
await page.$x('//div');
// Rol tabanlı seçiciler için yerleşik destek yok
```

</td>
</tr>
</table>

### 3. Element Etkileşimleri

<table>
<tr>
<th>Playwright</th>
<th>Puppeteer</th>
</tr>
<tr>
<td>

```javascript
await page.click('selector', options);
await page.fill('selector', 'text');
```

</td>
<td>

```javascript
await page.click('selector');
await page.type('selector', 'text');
```

</td>
</tr>
</table>

### 4. Bekleme Mekanizmaları

<table>
<tr>
<th>Playwright</th>
<th>Puppeteer</th>
</tr>
<tr>
<td>

```javascript
await page.waitForSelector('selector', { state: 'visible' });
await page.waitForNavigation({ waitUntil: 'networkidle' });
```

</td>
<td>

```javascript
await page.waitForSelector('selector', { visible: true });
await page.waitForNavigation({ waitUntil: 'networkidle0' });
```

</td>
</tr>
</table>

## 💻 Uygulama Örnekleri

### BrowserManager.js Örneği (Puppeteer ile)

```javascript
/**
 * Tarayıcı yönetim modülü
 * Tarayıcı başlatma, yapılandırma ve temizleme işlemlerini yönetir
 */

import puppeteer from 'puppeteer';
import { applyAntiDetectionMeasures } from './AntiDetection.js';

/**
 * Tarayıcı örneklerini ve yapılandırmalarını yönetir
 */
export class BrowserManager {
  /**
   * Yeni bir BrowserManager örneği oluşturur
   * @param {string} browserType - Kullanılacak tarayıcı türü (chrome, firefox)
   * @param {Object} options - Tarayıcı yapılandırma seçenekleri
   */
  constructor(browserType = 'chrome', options = {}) {
    this.browserType = browserType;
    this.headless = options.headless !== undefined ? options.headless : true;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.initialized = false;
    this.lastUsed = Date.now();

    console.log(`BrowserManager oluşturuldu: browserType: ${browserType}, headless: ${this.headless}`);
  }

  /**
   * Tarayıcıyı, bağlamı ve sayfayı başlatır
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    console.log(`Tarayıcı başlatılıyor (tür: ${this.browserType})...`);
    try {
      // Tarayıcıyı başlat
      this.browser = await this.launchBrowser();
      console.log('Tarayıcı başarıyla başlatıldı');

      // Tarayıcı bağlamı oluştur
      this.context = await this.browser.createIncognitoBrowserContext();

      // Yeni bir sayfa oluştur
      this.page = await this.context.newPage();

      // Zaman aşımlarını ayarla
      this.page.setDefaultTimeout(30000);

      // Bot algılama önlemlerini uygula
      await applyAntiDetectionMeasures(this.page, this.browserType);

      this.initialized = true;
      console.log('Tarayıcı sayfası bot algılama önlemleriyle başlatıldı');
    } catch (error) {
      console.error('Tarayıcı başlatılamadı:', error);
      throw error;
    }
  }

  /**
   * browserType'a göre uygun tarayıcıyı başlatır
   * @returns {Promise<Browser>} Puppeteer tarayıcı örneği
   * @private
   */
  async launchBrowser() {
    const launchOptions = {
      headless: this.headless ? 'new' : false,
      args: this.headless ? [] : ['--start-maximized'],
      ignoreDefaultArgs: ['--enable-automation'],
    };

    console.log(`Tarayıcı headless modu ile başlatılıyor: ${this.headless ? 'true (görünmez)' : 'false (görünür)'}`);
    console.log(`Başlatma seçenekleri: ${JSON.stringify(launchOptions, null, 2)}`);

    switch (this.browserType) {
      case 'firefox':
        console.log('Firefox tarayıcısı kullanılıyor');
        // Firefox için Puppeteer özel seçenekleri
        return await puppeteer.launch({
          ...launchOptions,
          product: 'firefox',
          extraPrefsFirefox: {
            'dom.webdriver.enabled': false,
            'privacy.trackingprotection.enabled': false,
          }
        });

      case 'chrome':
      default:
        console.log('Chrome tarayıcısı kullanılıyor');
        return await puppeteer.launch(launchOptions);
    }
  }

  // Diğer yöntemler benzer şekilde güncellenmelidir...
}
```

### ElementHelper.js Örneği (Puppeteer ile)

```javascript
/**
 * Element etkileşimleri için yardımcı sınıf
 */
export class ElementHelper {
  /**
   * Yeni bir ElementHelper örneği oluşturur
   * @param {Page} page - Puppeteer sayfa nesnesi
   */
  constructor(page) {
    this.page = page;
    this.defaultTimeout = 10000;
  }

  /**
   * Strateji ve hedefe göre bir element alır
   * @param {string} target - Element hedefi (seçici, xpath, vb.)
   * @param {string} strategy - Seçim stratejisi (css, xpath, id, vb.)
   * @returns {Promise<ElementHandle|null>} Element handle veya bulunamazsa null
   */
  async getElementByStrategy(target, strategy) {
    console.log(`Stratejiye göre element alınıyor: ${strategy}, hedef: ${target}`);
    try {
      switch (strategy) {
        case 'css':
          return await this.page.$(target);
        case 'xpath':
          const elements = await this.page.$x(target);
          return elements.length > 0 ? elements[0] : null;
        case 'id':
          return await this.page.$(`#${target}`);
        case 'name':
          return await this.page.$(`[name="${target}"]`);
        case 'class':
          return await this.page.$(`.${target}`);
        case 'text':
          // Puppeteer'da doğrudan metin seçici yok, XPath kullanmak gerekiyor
          const textElements = await this.page.$x(`//*[contains(text(), "${target}")]`);
          return textElements.length > 0 ? textElements[0] : null;
        default:
          throw new Error(`Desteklenmeyen seçici stratejisi: ${strategy}`);
      }
    } catch (error) {
      console.error(`getElementByStrategy'de hata: ${error.message}`);
      return null;
    }
  }

  /**
   * Bir elemente tıklar
   * @param {string} target - Element hedefi (seçici, xpath, vb.)
   * @param {string} strategy - Seçim stratejisi (css, xpath, id, vb.)
   * @returns {Promise<boolean>} Tıklama başarılıysa true
   */
  async clickElement(target, strategy) {
    console.log(`Tıklanacak element bulunuyor: ${target}, ${strategy} kullanılarak`);
    
    try {
      // Elementin görünür olmasını bekle
      await this.waitForElementByStrategy(target, strategy);
      
      // Stratejiye göre elementi al
      if (strategy === 'xpath') {
        const elements = await this.page.$x(target);
        if (elements.length > 0) {
          await elements[0].click();
        } else {
          throw new Error(`Element bulunamadı: ${target}`);
        }
      } else {
        const selector = this.convertToSelector(target, strategy);
        await this.page.click(selector);
      }
      
      console.log('Tıklama başarıyla gerçekleştirildi');
      return true;
    } catch (error) {
      console.error(`Elemente tıklarken hata: ${error.message}`);
      return false;
    }
  }

  // Diğer yöntemler benzer şekilde güncellenmelidir...
}
```

## 🚶‍♂️ Geçiş Adımları

Playwright'ten Puppeteer'a geçiş için izlenmesi gereken adımlar:

1. **Bağımlılıkları Güncelle**
   ```bash
   npm uninstall playwright
   npm install puppeteer
   ```

2. **Temel Bileşenleri Güncelle**
   - BrowserManager.js
   - ElementHelper.js
   - AntiDetection.js
   - StepExecutor.js

3. **API Farklılıklarını Adapte Et**
   - Tarayıcı başlatma
   - Element seçimi
   - Etkileşimler
   - Bekleme mekanizmaları

4. **Bot Algılama Önlemlerini Güncelle**
   - Puppeteer'a uygun bot algılama önlemlerini uygula

5. **Kapsamlı Test Yap**
   - Tüm test adımlarının yeni implementasyonla doğru çalıştığından emin ol

## 🧪 Test ve Doğrulama

Geçiş tamamlandıktan sonra, aşağıdaki kontrolleri yapmanız önerilir:

- **Temel İşlevsellik Testleri**: Tüm tarayıcı etkileşimlerinin beklendiği gibi çalıştığını doğrulayın
- **Performans Karşılaştırması**: Playwright ve Puppeteer arasındaki performans farklarını ölçün
- **Bot Algılama Testleri**: Bot algılama önlemlerinin hala etkili olduğunu doğrulayın
- **Tarayıcı Uyumluluğu**: Desteklenen tüm tarayıcıların doğru çalıştığını kontrol edin

---

<div align="center">
  <p>Bu rehber, Playwright tabanlı test otomasyon projenizi Puppeteer'a geçirmenize yardımcı olmak için hazırlanmıştır.</p>
  <p>Sorularınız veya geri bildirimleriniz için lütfen iletişime geçin.</p>
</div>
