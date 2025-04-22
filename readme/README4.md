# Test Betikleri Kullanım Kılavuzu

Bu klasörde, Playwright Server Agent'ı test etmek için kullanabileceğiniz çeşitli test betikleri bulunmaktadır.

## Ön Koşullar

1. Playwright Server Agent'ın çalışıyor olması gerekir (port 3002'de)
2. curl.exe komutunun çalışıyor olması gerekir

## Mevcut Test Betikleri

### 1. Google Arama Testi (Basit)

```
run-google-test.bat
```

Bu betik, test-plan.json dosyasını kullanarak Google arama testini çalıştırır.

### 2. Belirli Bir Tarayıcıda Test

```
run-browser-test.bat [tarayıcı] [headless]
```

Örnek:
```
run-browser-test.bat firefox true
```

Parametreler:
- tarayıcı: chromium, firefox veya edge
- headless: true veya false

### 3. Tüm Tarayıcılarda Test

```
run-all-browsers-test.bat
```

Bu betik, testi sırayla Chromium, Firefox ve Edge tarayıcılarında çalıştırır.

### 4. İnteraktif Test

```
interactive-test.bat
```

Bu betik, kullanıcıya hangi tarayıcıda ve hangi modda test çalıştırmak istediğini sorar.

### 5. Test Sonuçlarını Görüntüleme

```
view-results.bat
```

Bu betik, son test sonuçlarını ve istatistiklerini görüntüler.

### 6. Tam Ekran Testi

```
run-fullscreen-test.bat
```

Bu betik, tarayıcıyı tam ekran moduna geçirme testini çalıştırır.

## Test Planları

- test-plan.json: Google arama testi
- test-fullscreen.json: Tam ekran modu testi
- error-test-plan.json: Hata durumlarını test etmek için

## Notlar

- Tüm betikler Windows ortamında çalışacak şekilde tasarlanmıştır.
- Sunucunun 3002 portunda çalıştığı varsayılmıştır.
- Test sonuçları ve ekran görüntüleri sunucu tarafında saklanır.
