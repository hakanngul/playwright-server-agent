# Test Otomasyon Veritabanı Yapısı

Bu belge, test otomasyon projesi için oluşturulan veritabanı yapısını açıklamaktadır.

## Veritabanı Tabloları

Veritabanı aşağıdaki tablolardan oluşmaktadır:

### Grup 1: Test Çalıştırma ve Sonuç Tabloları

#### TestRun Tablosu
- `id` (PRIMARY KEY): Benzersiz test çalıştırma kimliği
- `name`: Test çalıştırmasının adı
- `description`: Test çalıştırmasının açıklaması
- `status`: Test durumu (PASSED, FAILED, SKIPPED, IN_PROGRESS, ABORTED)
- `start_time`: Başlangıç zamanı
- `end_time`: Bitiş zamanı
- `duration_ms`: Test süresi (milisaniye)
- `browser`: Kullanılan tarayıcı (Chrome, Firefox, Safari, Edge)
- `browser_version`: Tarayıcı sürümü
- `operating_system`: İşletim sistemi bilgisi
- `viewport_size`: Görüntü alanı boyutu (örn. 1920x1080)
- `environment`: Test ortamı (DEV, TEST, STAGING, PROD)
- `build_number`: CI/CD pipeline build numarası
- `created_by`: Testi başlatan kullanıcı
- `tags`: Test etiketleri (JSON formatında)

#### TestResult Tablosu
- `id` (PRIMARY KEY): Benzersiz test sonuç kimliği
- `test_run_id` (FOREIGN KEY): Bağlı olduğu TestRun'ın ID'si
- `test_suite_id` (FOREIGN KEY): Bağlı olduğu test suitinin ID'si
- `test_case_id` (FOREIGN KEY): Test durumu ID'si
- `status`: Test sonucu (PASSED, FAILED, SKIPPED, BLOCKED)
- `start_time`: Başlangıç zamanı
- `end_time`: Bitiş zamanı
- `duration_ms`: Süre (milisaniye)
- `error_message`: Hata mesajı (varsa)
- `error_stack`: Hata stack trace (varsa)
- `screenshot_path`: Hata ekran görüntüsü yolu
- `video_path`: Test video kaydı yolu (Playwright'ın video kayıt özelliği)
- `trace_path`: Playwright iz dosyası yolu
- `retry_count`: Yeniden deneme sayısı
- `custom_data`: Özel test verisi (JSON formatında)

#### TestStep Tablosu
- `id` (PRIMARY KEY): Benzersiz test adımı kimliği
- `test_result_id` (FOREIGN KEY): Bağlı olduğu test sonucu ID'si
- `test_case_id` (FOREIGN KEY): Bağlı olduğu test durumu ID'si
- `order_number`: Adım sıra numarası
- `description`: Adım açıklaması
- `status`: Adım durumu (PASSED, FAILED, SKIPPED)
- `start_time`: Başlangıç zamanı
- `end_time`: Bitiş zamanı
- `duration_ms`: Süre (milisaniye)
- `screenshot_path`: Adım ekran görüntüsü yolu
- `error_message`: Hata mesajı (varsa)
- `expected_result`: Beklenen sonuç
- `actual_result`: Gerçekleşen sonuç
- `action_type`: Eylem türü (CLICK, TYPE, ASSERT, NAVIGATE, WAIT, vb.)
- `action_target`: Hedef element (element_id veya locator)
- `action_value`: Eylem değeri (örn. yazılan metin)

### Grup 2: Test Organizasyon Tabloları

#### TestSuite Tablosu
- `id` (PRIMARY KEY): Benzersiz test suite kimliği
- `name`: Test suite adı
- `description`: Test suite açıklaması
- `tags`: Etiketler (JSON formatında)
- `created_at`: Oluşturulma tarihi
- `updated_at`: Güncellenme tarihi

#### TestCase Tablosu
- `id` (PRIMARY KEY): Benzersiz test durumu kimliği
- `test_suite_id` (FOREIGN KEY): Bağlı olduğu test suite ID'si
- `name`: Test durumu adı
- `description`: Test durumu açıklaması
- `priority`: Öncelik (P0, P1, P2, P3)
- `automation_status`: Otomasyon durumu (AUTOMATED, MANUAL, IN_PROGRESS)
- `expected_result`: Beklenen sonuç
- `prerequisites`: Ön koşullar
- `author`: Yazarı
- `tags`: Etiketler (JSON formatında)
- `created_at`: Oluşturulma tarihi
- `updated_at`: Güncellenme tarihi

### Grup 3: Web Element ve Sayfa Tabloları

#### Page Tablosu
- `id` (PRIMARY KEY): Benzersiz sayfa kimliği
- `name`: Sayfa adı
- `url`: Sayfa URL'si
- `description`: Sayfa açıklaması
- `created_at`: Oluşturulma tarihi
- `updated_at`: Güncellenme tarihi

#### WebElement Tablosu
- `id` (PRIMARY KEY): Benzersiz element kimliği
- `name`: Element adı/tanımlayıcısı
- `description`: Element açıklaması
- `page_id` (FOREIGN KEY): Bağlı olduğu sayfa ID'si
- `locator_type`: Locator türü (CSS, XPATH, TEXT, ROLE, TEST_ID)
- `locator_value`: Locator değeri
- `parent_element_id` (FOREIGN KEY): Üst element ID'si (iç içe elementler için)
- `attributes`: Element özellikleri (JSON formatında)
- `screenshot_path`: Element ekran görüntüsü yolu
- `is_visible`: Görünürlük durumu
- `is_enabled`: Etkin olma durumu
- `is_required`: Zorunluluk durumu
- `validation_rules`: Doğrulama kuralları (JSON formatında)
- `created_at`: Oluşturulma tarihi
- `updated_at`: Güncellenme tarihi

### Grup 4: Hata Takip ve Veri Tabloları

#### Bug Tablosu
- `id` (PRIMARY KEY): Benzersiz hata kimliği
- `test_result_id` (FOREIGN KEY): Bağlı olduğu test sonucu ID'si
- `title`: Hata başlığı
- `description`: Hata açıklaması
- `severity`: Önem derecesi (CRITICAL, HIGH, MEDIUM, LOW)
- `status`: Hata durumu (NEW, OPEN, FIXED, REJECTED, DUPLICATE)
- `reported_by`: Bildiren kişi
- `assigned_to`: Atanan kişi
- `screenshot_path`: Hata ekran görüntüsü yolu
- `video_path`: Hata video kaydı yolu
- `external_bug_id`: Harici hata takip sistemi ID'si (Jira, Bugzilla vb.)
- `created_at`: Oluşturulma tarihi
- `updated_at`: Güncellenme tarihi

#### TestData Tablosu
- `id` (PRIMARY KEY): Benzersiz test verisi kimliği
- `name`: Test verisi adı
- `description`: Test verisi açıklaması
- `data_type`: Veri türü (USER, PRODUCT, ORDER, vs.)
- `value`: Veri değeri (JSON formatında)
- `is_sensitive`: Hassas veri mi? (true/false)
- `created_at`: Oluşturulma tarihi
- `updated_at`: Güncellenme tarihi

#### Configuration Tablosu
- `id` (PRIMARY KEY): Benzersiz yapılandırma kimliği
- `name`: Yapılandırma adı
- `value`: Yapılandırma değeri
- `description`: Yapılandırma açıklaması
- `environment`: Ortam (DEV, TEST, STAGING, PROD)
- `created_at`: Oluşturulma tarihi
- `updated_at`: Güncellenme tarihi

## Veritabanı Servisleri

Veritabanı işlemleri için aşağıdaki servisler kullanılabilir:

1. `testRunService`: Test çalıştırma işlemleri
2. `testResultService`: Test sonuç işlemleri
3. `testSuiteService`: Test suite ve test case işlemleri
4. `webElementService`: Web element ve sayfa işlemleri
5. `bugAndConfigService`: Hata takip, test verisi ve yapılandırma işlemleri

## Veritabanı Migration

Veritabanı tablolarını oluşturmak veya silmek için migration işlemleri kullanılabilir:

```javascript
// Tabloları oluşturmak için
import { migrateUp } from './database/migrations/index.js';
migrateUp();

// Tabloları silmek için
import { migrateDown } from './database/migrations/index.js';
migrateDown();
```

Veya komut satırından:

```bash
# Tabloları oluşturmak için
node migrate-db.js up

# Tabloları silmek için
node migrate-db.js down
```

## Örnek Kullanım

```javascript
import { testRunService, testResultService } from './database/index.js';

// Yeni bir test çalıştırması oluştur
const testRun = testRunService.createTestRun({
  name: 'Smoke Test',
  description: 'Temel fonksiyonların testi',
  browser: 'chromium',
  environment: 'TEST'
});

// Test sonucu ekle
const testResult = testResultService.createTestResult({
  test_run_id: testRun.id,
  status: 'PASSED',
  start_time: new Date().toISOString(),
  end_time: new Date().toISOString(),
  duration_ms: 1500,
  steps: [
    {
      order_number: 1,
      description: 'Login sayfasına git',
      status: 'PASSED',
      action_type: 'NAVIGATE',
      action_target: 'https://example.com/login'
    },
    {
      order_number: 2,
      description: 'Kullanıcı adı gir',
      status: 'PASSED',
      action_type: 'TYPE',
      action_target: '#username',
      action_value: 'testuser'
    }
  ]
});
```
