# Java Spring Boot ile Test Otomasyon Sunucusu Geliştirme

Bu rehber, mevcut JavaScript/Node.js tabanlı test otomasyon sunucusunu Java Spring Boot ile yeniden oluşturmak için adım adım bir kılavuz sunmaktadır.

## 1. Gerekli Araçlar ve Kurulum

- **JDK 17+**: En son Java sürümü
- **Maven** veya **Gradle**: Bağımlılık yönetimi için
- **IntelliJ IDEA** veya **Eclipse**: Java IDE
- **Spring Boot**: Web uygulaması geliştirme framework'ü
- **Playwright Java**: Tarayıcı otomasyonu için

## 2. Proje Yapısı Oluşturma

Spring Initializr (https://start.spring.io/) kullanarak başlangıç projesi oluşturun:

- **Project**: Maven veya Gradle
- **Language**: Java
- **Spring Boot**: En son kararlı sürüm
- **Dependencies**: 
  - Spring Web
  - Spring WebSocket
  - Lombok (opsiyonel, kod kısaltma için)
  - Spring Data JPA (veritabanı kullanacaksanız)
  - H2 Database (geliştirme için)

## 3. Playwright Bağımlılığı Ekleme

`pom.xml` dosyanıza Playwright bağımlılığını ekleyin:

```xml
<dependency>
    <groupId>com.microsoft.playwright</groupId>
    <artifactId>playwright</artifactId>
    <version>1.40.0</version> <!-- En son sürümü kontrol edin -->
</dependency>
```

## 4. Temel Paket Yapısı

```
src/main/java/com/example/testautomation/
├── config/           # Yapılandırma sınıfları
├── controller/       # REST API controller'ları
├── model/            # Veri modelleri
├── service/          # İş mantığı servisleri
│   ├── browser/      # Tarayıcı yönetimi
│   └── test/         # Test çalıştırma
├── util/             # Yardımcı sınıflar
└── TestAutomationApplication.java  # Ana uygulama sınıfı
```

## 5. Temel Bileşenleri Oluşturma

### 5.1. Veri Modelleri

```java
// TestPlan.java
@Data
public class TestPlan {
    private String name;
    private String description;
    private String browserPreference;
    private boolean headless;
    private boolean takeScreenshots;
    private List<TestStep> steps;
}

// TestStep.java
@Data
public class TestStep {
    private String action;
    private String target;
    private String strategy;
    private String value;
    private String description;
}

// TestResult.java
@Data
public class TestResult {
    private String name;
    private String description;
    private String browserType;
    private boolean headless;
    private String startTime;
    private String endTime;
    private long duration;
    private List<StepResult> steps;
    private boolean success;
    private String error;
}
```

### 5.2. Tarayıcı Yönetimi

```java
// BrowserManager.java
@Service
public class BrowserManager implements AutoCloseable {
    private Playwright playwright;
    private Browser browser;
    private BrowserContext context;
    private Page page;
    private String browserType;
    private boolean headless;
    
    public BrowserManager() {
        playwright = Playwright.create();
    }
    
    public void initialize(String browserType, boolean headless) {
        this.browserType = browserType;
        this.headless = headless;
        
        BrowserType browserInstance = switch (browserType.toLowerCase()) {
            case "firefox" -> playwright.firefox();
            case "webkit" -> playwright.webkit();
            default -> playwright.chromium();
        };
        
        browser = browserInstance.launch(new BrowserType.LaunchOptions()
                .setHeadless(headless));
        
        context = browser.newContext();
        page = context.newPage();
    }
    
    public Page getPage() {
        return page;
    }
    
    @Override
    public void close() {
        if (context != null) context.close();
        if (browser != null) browser.close();
        if (playwright != null) playwright.close();
    }
}
```

### 5.3. Element Yardımcısı

```java
// ElementHelper.java
@Service
public class ElementHelper {
    private final Page page;
    
    public ElementHelper(Page page) {
        this.page = page;
    }
    
    public String convertToSelector(String target, String strategy) {
        return switch (strategy.toLowerCase()) {
            case "id" -> "#" + target;
            case "class" -> "." + target;
            case "name" -> "[name='" + target + "']";
            case "xpath" -> "xpath=" + target;
            default -> target;
        };
    }
    
    public void clickElement(String target, String strategy) {
        String selector = convertToSelector(target, strategy);
        page.click(selector);
    }
    
    public void typeText(String target, String strategy, String text) {
        String selector = convertToSelector(target, strategy);
        page.fill(selector, text);
    }
    
    // Diğer element işlemleri...
}
```

### 5.4. Test Çalıştırıcı

```java
// TestRunner.java
@Service
public class TestRunner {
    private final BrowserManager browserManager;
    
    public TestRunner(BrowserManager browserManager) {
        this.browserManager = browserManager;
    }
    
    public TestResult runTest(TestPlan testPlan) {
        TestResult result = new TestResult();
        result.setName(testPlan.getName());
        result.setDescription(testPlan.getDescription());
        result.setBrowserType(testPlan.getBrowserPreference());
        result.setHeadless(testPlan.isHeadless());
        result.setStartTime(LocalDateTime.now().toString());
        
        try {
            browserManager.initialize(
                testPlan.getBrowserPreference(), 
                testPlan.isHeadless()
            );
            
            Page page = browserManager.getPage();
            ElementHelper elementHelper = new ElementHelper(page);
            
            List<StepResult> stepResults = new ArrayList<>();
            
            for (TestStep step : testPlan.getSteps()) {
                StepResult stepResult = executeStep(step, elementHelper, page);
                stepResults.add(stepResult);
                
                if (!stepResult.isSuccess()) {
                    result.setError("Step failed: " + stepResult.getError());
                    break;
                }
            }
            
            result.setSteps(stepResults);
            result.setSuccess(result.getError() == null);
            
        } catch (Exception e) {
            result.setSuccess(false);
            result.setError(e.getMessage());
        } finally {
            result.setEndTime(LocalDateTime.now().toString());
            result.setDuration(Duration.between(
                LocalDateTime.parse(result.getStartTime()), 
                LocalDateTime.parse(result.getEndTime())
            ).toMillis());
            
            browserManager.close();
        }
        
        return result;
    }
    
    private StepResult executeStep(TestStep step, ElementHelper elementHelper, Page page) {
        StepResult result = new StepResult();
        result.setAction(step.getAction());
        result.setDescription(step.getDescription());
        
        try {
            switch (step.getAction()) {
                case "navigate" -> page.navigate(step.getValue());
                case "click" -> elementHelper.clickElement(step.getTarget(), step.getStrategy());
                case "type" -> elementHelper.typeText(step.getTarget(), step.getStrategy(), step.getValue());
                case "wait" -> page.waitForTimeout(Double.parseDouble(step.getValue()));
                // Diğer eylemler...
                default -> throw new IllegalArgumentException("Unsupported action: " + step.getAction());
            }
            
            result.setSuccess(true);
        } catch (Exception e) {
            result.setSuccess(false);
            result.setError(e.getMessage());
        }
        
        return result;
    }
}
```

### 5.5. REST API Controller

```java
// TestController.java
@RestController
@RequestMapping("/api/test")
public class TestController {
    private final TestRunner testRunner;
    
    public TestController(TestRunner testRunner) {
        this.testRunner = testRunner;
    }
    
    @PostMapping("/run")
    public ResponseEntity<TestResult> runTest(@RequestBody TestPlan testPlan) {
        TestResult result = testRunner.runTest(testPlan);
        return ResponseEntity.ok(result);
    }
}
```

## 6. WebSocket Desteği (Gerçek Zamanlı Güncellemeler İçin)

```java
// WebSocketConfig.java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins("*")
                .withSockJS();
    }
}

// WebSocketService.java
@Service
public class WebSocketService {
    private final SimpMessagingTemplate messagingTemplate;
    
    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    public void sendTestUpdate(String testId, Object update) {
        messagingTemplate.convertAndSend("/topic/test/" + testId, update);
    }
}
```

## 7. Ekran Görüntüsü Yönetimi

```java
// ScreenshotManager.java
@Service
public class ScreenshotManager {
    private final String screenshotsDir;
    
    public ScreenshotManager(@Value("${screenshots.dir:./screenshots}") String screenshotsDir) {
        this.screenshotsDir = screenshotsDir;
        createScreenshotsDir();
    }
    
    private void createScreenshotsDir() {
        File dir = new File(screenshotsDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }
    
    public String takeScreenshot(Page page, String name) {
        String filename = name + "_" + System.currentTimeMillis() + ".png";
        String path = screenshotsDir + "/" + filename;
        page.screenshot(new Page.ScreenshotOptions().setPath(Paths.get(path)));
        return filename;
    }
}
```

## 8. Uygulama Yapılandırması

```java
// application.properties
server.port=3002
screenshots.dir=./screenshots
```

## 9. Ana Uygulama Sınıfı

```java
// TestAutomationApplication.java
@SpringBootApplication
public class TestAutomationApplication {
    public static void main(String[] args) {
        SpringApplication.run(TestAutomationApplication.class, args);
    }
}
```

## 10. Geliştirme ve Test

1. Uygulamayı çalıştırın: `./mvnw spring-boot:run`
2. API'yi test edin: `curl -X POST http://localhost:3002/api/test/run -H "Content-Type: application/json" -d @test-plan.json`

## 11. İleri Seviye Özellikler

- **Asenkron Test Çalıştırma**: `@Async` ve `CompletableFuture` kullanarak
- **Test Sonuçlarını Depolama**: Spring Data JPA ile veritabanı entegrasyonu
- **Kullanıcı Yönetimi**: Spring Security ile kimlik doğrulama
- **Tarayıcı Havuzu**: Tarayıcı örneklerini yönetmek için havuz mekanizması
- **Docker Entegrasyonu**: Uygulamayı konteynerize etme

## Başlangıç İçin Önerilen Adımlar

1. Önce basit bir Spring Boot projesi oluşturun
2. Playwright entegrasyonunu ekleyin ve basit tarayıcı işlemlerini test edin
3. Temel REST API'yi oluşturun
4. Veri modellerini ve servisleri ekleyin
5. Adım adım daha karmaşık özellikleri ekleyin

Bu yapı, mevcut Node.js uygulamanızın temel işlevselliğini Java Spring Boot ile yeniden oluşturmanıza yardımcı olacaktır. İhtiyaçlarınıza göre genişletebilir ve özelleştirebilirsiniz.
