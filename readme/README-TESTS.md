# Test Planlarını Çalıştırma Talimatları

Bu dizinde, server-agent'a test planları göndermek için kullanabileceğiniz çeşitli test planları ve script'ler bulunmaktadır.

## Ön Koşullar

1. server-agent'ın kurulu ve çalışır durumda olması gerekir:
   ```bash
   cd server-agent
   npm install
   npm start
   ```

2. Script'leri çalıştırılabilir yapın:
   ```bash
   ./make-scripts-executable.sh
   ```

## Temel Test Planını Çalıştırma

Chromium tarayıcısında Google arama testi yapmak için:
```bash
./run-test.sh
```

## Tüm Tarayıcılarda Test Çalıştırma

Chromium, Firefox ve WebKit (Safari) tarayıcılarında Google arama testi yapmak için:
```bash
./run-all-browsers.sh
```

## Gelişmiş Test Planını Çalıştırma

GitHub'da arama yapan ve sonuçları doğrulayan daha karmaşık bir test için:
```bash
./run-advanced-test.sh
```

## Test Planlarını Özelleştirme

Test planlarını özelleştirmek için ilgili JSON dosyalarını düzenleyebilirsiniz:
- `test-plan.json`: Temel Chromium testi
- `test-plan-firefox.json`: Firefox testi
- `test-plan-webkit.json`: WebKit (Safari) testi
- `test-plan-advanced.json`: Gelişmiş GitHub testi

## Curl ile Manuel Test Çalıştırma

Herhangi bir test planını manuel olarak çalıştırmak için:
```bash
curl -X POST \
  http://localhost:3001/api/test/run \
  -H 'Content-Type: application/json' \
  -d @test-plan.json
```

## Test Sonuçlarını Görüntüleme

Test sonuçları, server-agent'ın API'si üzerinden görüntülenebilir:
```bash
curl http://localhost:3001/api/results/recent
```

Son test sonucunu görüntülemek için:
```bash
curl http://localhost:3001/api/results/recent?limit=1
```

## Ekran Görüntülerini Görüntüleme

Test sırasında alınan ekran görüntüleri `server-agent/screenshots` dizininde saklanır ve 
`http://localhost:3001/screenshots/{screenshot_filename}` adresinden erişilebilir.
