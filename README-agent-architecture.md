# Playwright Server Agent - JavaScript Mimarisi

Bu proje, Playwright kütüphanesini kullanarak tarayıcı otomasyonu sağlayan bir agent mimarisi sunar. Bu mimari, SVG şemasında gösterilen yapıyı JavaScript kullanarak uygulamaktadır.

## Mimari Yapı

Proje, aşağıdaki ana bileşenlerden oluşmaktadır:

### 1. Arayüzler (Interfaces)

- **IBrowserController**: Tarayıcı kontrolü için arayüz
- **IElementInteractor**: Sayfa elemanları ile etkileşim için arayüz
- **ITestRunner**: Test çalıştırma için arayüz
- **IAgent**: Agent yönetimi için arayüz

### 2. Uygulamalar (Implementations)

- **BrowserController**: Tarayıcı başlatma, sayfa yönetimi ve kapatma işlemleri
- **ElementInteractor**: Sayfa elemanları ile etkileşim sağlar
- **TestRunner**: Test planlarını çalıştırır
- **TestAgent**: Tarayıcı otomasyonu için ana giriş noktası
- **AgentManager**: Test ajanlarını yönetir ve test isteklerini dağıtır

### 3. Fabrikalar (Factories)

- **BrowserFactory**: Tarayıcı bileşenlerini oluşturur
- **TestFactory**: Test bileşenlerini oluşturur
- **AgentFactory**: Agent bileşenlerini oluşturur

## Kullanım

### Basit Kullanım

```javascript
import { createTestAgent } from './src/index.js';

// Test planı oluştur
const testPlan = {
  name: 'Örnek Test',
  description: 'Örnek test planı',
  browserPreference: 'chromium',
  headless: false,
  steps: [
    {
      action: 'navigate',
      value: 'https://example.com',
      description: 'Example sayfasına git'
    },
    {
      action: 'screenshot',
      value: 'example-page',
      description: 'Sayfanın ekran görüntüsünü al'
    }
  ]
};

// Agent oluştur ve testi çalıştır
async function runTest() {
  const agent = createTestAgent('chromium', { headless: false });
  
  try {
    await agent.initialize();
    const result = await agent.runTest(testPlan);
    console.log('Test sonucu:', result);
  } finally {
    await agent.close();
  }
}

runTest().catch(console.error);
```

### Agent Manager Kullanımı

```javascript
import { createAgentManager } from './src/index.js';

// Agent Manager oluştur
const agentManager = createAgentManager({
  maxAgents: 2,
  headless: false,
  closeAgentAfterTest: true
});

// Olayları dinle
agentManager.on('request:completed', ({ requestId, result }) => {
  console.log(`Test ${requestId} tamamlandı:`, result);
});

// Test isteği gönder
const requestId = await agentManager.submitRequest(testPlan);

// İsteğin durumunu kontrol et
const status = agentManager.getRequestStatus(requestId);
console.log('İstek durumu:', status);

// İşlem tamamlandığında Agent Manager'ı kapat
await agentManager.close();
```

## Mimari Avantajları

1. **Modüler Yapı**: Her bileşen kendi sorumluluğuna odaklanır
2. **Arayüz Tabanlı**: Bileşenler arayüzler üzerinden iletişim kurar
3. **Fabrika Deseni**: Bileşenlerin oluşturulması fabrikalar tarafından yönetilir
4. **Olay Tabanlı**: Olaylar üzerinden asenkron iletişim sağlanır
5. **Ölçeklenebilir**: Paralel test çalıştırma ve dinamik agent yönetimi

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Örnek uygulamayı çalıştır
npm start
```

## Gereksinimler

- Node.js 14 veya üzeri
- Playwright
