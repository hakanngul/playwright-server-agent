import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import { DownloadIcon, ChartIcon } from '../../icons';

// Test adımı sonucu tipi
interface TestStepResult {
  step: number;
  action: string;
  target?: string;
  strategy?: string;
  value?: string;
  description?: string;
  success: boolean;
  error?: string;
  duration: number;
  screenshot?: string;
}

// Test sonucu tipi
interface TestResult {
  id: string;
  name: string;
  description: string;
  browserType: string;
  headless: boolean;
  timestamp: string;
  duration: number;
  success: boolean;
  error?: string;
  steps: TestStepResult[];
  metrics: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
  };
}

// Örnek test sonucu
const sampleTestResult: TestResult = {
  id: '1',
  name: 'Login Test',
  description: 'Kullanıcı girişi testi',
  browserType: 'chromium',
  headless: true,
  timestamp: '2023-06-15T10:30:00Z',
  duration: 3500,
  success: true,
  steps: [
    {
      step: 1,
      action: 'navigate',
      target: 'https://example.com/login',
      strategy: 'css',
      description: 'Login sayfasına git',
      success: true,
      duration: 800
    },
    {
      step: 2,
      action: 'type',
      target: '#username',
      strategy: 'css',
      value: 'testuser',
      description: 'Kullanıcı adını gir',
      success: true,
      duration: 500
    },
    {
      step: 3,
      action: 'type',
      target: '#password',
      strategy: 'css',
      value: 'password123',
      description: 'Şifreyi gir',
      success: true,
      duration: 450
    },
    {
      step: 4,
      action: 'click',
      target: 'button[type="submit"]',
      strategy: 'css',
      description: 'Giriş butonuna tıkla',
      success: true,
      duration: 300
    },
    {
      step: 5,
      action: 'waitForElement',
      target: '.dashboard',
      strategy: 'css',
      description: 'Dashboard sayfasının yüklenmesini bekle',
      success: true,
      duration: 1450
    }
  ],
  metrics: {
    totalSteps: 5,
    successfulSteps: 5,
    failedSteps: 0
  }
};

const ResultDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('steps');

  useEffect(() => {
    // API'den test sonucunu getirme simülasyonu
    const fetchTestResult = async () => {
      try {
        // Gerçek API çağrısı burada yapılacak
        // const response = await fetch(`http://localhost:3002/api/results/${id}`);
        // const data = await response.json();
        
        // Şimdilik örnek veri kullanıyoruz
        setTimeout(() => {
          setTestResult(sampleTestResult);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Test sonucu yüklenirken bir hata oluştu.');
        setLoading(false);
        console.error(err);
      }
    };

    if (id) {
      fetchTestResult();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
      return `${seconds} sn`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} dk ${remainingSeconds} sn`;
  };

  const getBrowserIcon = (browser: string) => {
    switch (browser) {
      case 'chromium':
        return '🌐';
      case 'firefox':
        return '🦊';
      case 'edge':
        return '🔵';
      default:
        return '🌐';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'navigate':
        return 'Sayfaya Git';
      case 'click':
        return 'Tıkla';
      case 'type':
        return 'Yazı Yaz';
      case 'select':
        return 'Seçim Yap';
      case 'check':
        return 'İşaretle';
      case 'uncheck':
        return 'İşareti Kaldır';
      case 'wait':
        return 'Bekle';
      case 'waitForElement':
        return 'Element İçin Bekle';
      case 'takeScreenshot':
        return 'Ekran Görüntüsü Al';
      case 'verifyText':
        return 'Metni Doğrula';
      case 'verifyElementExists':
        return 'Element Varlığını Doğrula';
      default:
        return action;
    }
  };

  return (
    <>
      <PageMeta
        title="Test Sonucu Detayı | Playwright Server Agent"
        description="Test sonucu detayını görüntüleyin"
      />
      
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Test Sonucu Detayı
        </h2>
        <div className="flex gap-3">
          <Link
            to="/results"
            className="inline-flex items-center justify-center gap-2.5 rounded-md border border-stroke py-2.5 px-5 text-center font-medium text-black hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
          >
            Geri
          </Link>
          <Link
            to={`/performance/${id}`}
            className="inline-flex items-center justify-center gap-2.5 rounded-md border border-primary py-2.5 px-5 text-center font-medium text-primary hover:bg-opacity-90"
          >
            <ChartIcon className="w-5 h-5" />
            Performans
          </Link>
          <button
            className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary py-2.5 px-5 text-center font-medium text-white hover:bg-opacity-90"
          >
            <DownloadIcon className="w-5 h-5" />
            İndir
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-danger">{error}</div>
        </div>
      ) : testResult ? (
        <>
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Test Bilgileri
              </h3>
            </div>
            <div className="p-6.5">
              <div className="mb-4.5 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-2.5 text-lg font-semibold text-black dark:text-white">
                    {testResult.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {testResult.description}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`inline-flex rounded-full py-1 px-3 text-sm font-medium ${
                    testResult.success
                      ? 'bg-success/10 text-success'
                      : 'bg-danger/10 text-danger'
                  }`}>
                    {testResult.success ? 'Başarılı' : 'Başarısız'}
                  </span>
                </div>
              </div>

              <div className="mb-4.5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <span className="block text-sm text-gray-500 dark:text-gray-400">Tarayıcı:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getBrowserIcon(testResult.browserType)}</span>
                    <span className="capitalize text-black dark:text-white">{testResult.browserType}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-sm text-gray-500 dark:text-gray-400">Headless:</span>
                  <span className="text-black dark:text-white">{testResult.headless ? 'Evet' : 'Hayır'}</span>
                </div>
                <div>
                  <span className="block text-sm text-gray-500 dark:text-gray-400">Süre:</span>
                  <span className="text-black dark:text-white">{formatDuration(testResult.duration)}</span>
                </div>
                <div>
                  <span className="block text-sm text-gray-500 dark:text-gray-400">Tarih:</span>
                  <span className="text-black dark:text-white">{formatDate(testResult.timestamp)}</span>
                </div>
              </div>

              <div className="mb-4.5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-sm border border-stroke bg-gray-2 p-4 dark:border-strokedark dark:bg-meta-4">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-black dark:text-white">{testResult.metrics.totalSteps}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Toplam Adım</span>
                  </div>
                </div>
                <div className="rounded-sm border border-stroke bg-gray-2 p-4 dark:border-strokedark dark:bg-meta-4">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-success">{testResult.metrics.successfulSteps}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Başarılı Adım</span>
                  </div>
                </div>
                <div className="rounded-sm border border-stroke bg-gray-2 p-4 dark:border-strokedark dark:bg-meta-4">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-danger">{testResult.metrics.failedSteps}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Başarısız Adım</span>
                  </div>
                </div>
              </div>

              {testResult.error && (
                <div className="mb-4.5 flex w-full rounded-lg border-l-6 border-[#F87171] bg-[#F87171]/[.15] px-7 py-5 shadow-md dark:bg-[#F87171]/[.15]">
                  <div className="mr-5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#F87171]">
                    <svg
                      width="19"
                      height="16"
                      viewBox="0 0 19 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1.50493 16H17.5023C18.6204 16 19.3413 14.9018 18.8354 13.9735L10.8367 0.770573C10.2852 -0.256858 8.70677 -0.256858 8.15528 0.770573L0.156617 13.9735C-0.334072 14.8998 0.386764 16 1.50493 16ZM10.7585 12.9298C10.7585 13.6155 10.2223 14.1433 9.45583 14.1433C8.6894 14.1433 8.15311 13.6155 8.15311 12.9298C8.15311 12.2441 8.6894 11.7163 9.45583 11.7163C10.2223 11.7163 10.7585 12.2441 10.7585 12.9298ZM8.75236 4.01062H10.2548C10.6674 4.01062 10.9127 4.33826 10.8671 4.75288L10.2071 10.1186C10.1615 10.5332 9.88572 10.7945 9.50142 10.7945C9.11929 10.7945 8.84138 10.5332 8.79579 10.1186L8.13574 4.75288C8.09449 4.33826 8.33984 4.01062 8.75236 4.01062Z"
                        fill="white"
                      />
                    </svg>
                  </div>
                  <div className="w-full">
                    <h5 className="mb-1 text-lg font-semibold text-[#B45454]">
                      Hata
                    </h5>
                    <p className="text-base leading-relaxed text-[#CD5D5D]">
                      {testResult.error}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <div className="flex flex-wrap items-center">
                <button
                  onClick={() => setSelectedTab('steps')}
                  className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    selectedTab === 'steps'
                      ? 'bg-primary text-white'
                      : 'hover:bg-primary/[0.1] hover:text-primary'
                  }`}
                >
                  Adımlar
                </button>
                <button
                  onClick={() => setSelectedTab('screenshots')}
                  className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    selectedTab === 'screenshots'
                      ? 'bg-primary text-white'
                      : 'hover:bg-primary/[0.1] hover:text-primary'
                  }`}
                >
                  Ekran Görüntüleri
                </button>
                <button
                  onClick={() => setSelectedTab('logs')}
                  className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    selectedTab === 'logs'
                      ? 'bg-primary text-white'
                      : 'hover:bg-primary/[0.1] hover:text-primary'
                  }`}
                >
                  Loglar
                </button>
              </div>
            </div>
            <div className="p-6.5">
              {selectedTab === 'steps' && (
                <div className="rounded-sm border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
                  <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                          <th className="py-4 px-4 font-medium text-black dark:text-white">
                            #
                          </th>
                          <th className="py-4 px-4 font-medium text-black dark:text-white">
                            Adım Tipi
                          </th>
                          <th className="py-4 px-4 font-medium text-black dark:text-white">
                            Hedef
                          </th>
                          <th className="py-4 px-4 font-medium text-black dark:text-white">
                            Değer
                          </th>
                          <th className="py-4 px-4 font-medium text-black dark:text-white">
                            Açıklama
                          </th>
                          <th className="py-4 px-4 font-medium text-black dark:text-white">
                            Durum
                          </th>
                          <th className="py-4 px-4 font-medium text-black dark:text-white">
                            Süre
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {testResult.steps.map((step) => (
                          <tr key={step.step}>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              <p className="text-black dark:text-white">{step.step}</p>
                            </td>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              <p className="text-black dark:text-white">{getActionLabel(step.action)}</p>
                            </td>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              <p className="text-black dark:text-white">{step.target || '-'}</p>
                            </td>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              <p className="text-black dark:text-white">{step.value || '-'}</p>
                            </td>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              <p className="text-black dark:text-white">{step.description || '-'}</p>
                            </td>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              <span className={`inline-flex rounded-full py-1 px-3 text-sm font-medium ${
                                step.success
                                  ? 'bg-success/10 text-success'
                                  : 'bg-danger/10 text-danger'
                              }`}>
                                {step.success ? 'Başarılı' : 'Başarısız'}
                              </span>
                            </td>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              <p className="text-black dark:text-white">{formatDuration(step.duration)}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedTab === 'screenshots' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {testResult.steps.filter(step => step.screenshot).length > 0 ? (
                    testResult.steps.filter(step => step.screenshot).map((step) => (
                      <div key={step.step} className="rounded-sm border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
                        <div className="mb-2">
                          <h5 className="text-lg font-semibold text-black dark:text-white">
                            Adım {step.step}: {step.description}
                          </h5>
                        </div>
                        <div className="mb-2">
                          <img
                            src={step.screenshot}
                            alt={`Adım ${step.step}`}
                            className="w-full rounded-sm"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button className="inline-flex items-center justify-center gap-2.5 rounded-md border border-primary py-2 px-4 text-center font-medium text-primary hover:bg-opacity-90">
                            <DownloadIcon className="w-5 h-5" />
                            İndir
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full flex items-center justify-center h-64">
                      <p className="text-gray-500 dark:text-gray-400">Bu test için ekran görüntüsü bulunmamaktadır.</p>
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'logs' && (
                <div className="rounded-sm border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
                  <pre className="h-96 overflow-auto rounded-sm bg-gray-2 p-4 text-sm text-black dark:bg-meta-4 dark:text-white">
                    {`[${formatDate(testResult.timestamp)}] Test başlatıldı: ${testResult.name}
[${formatDate(testResult.timestamp)}] Tarayıcı: ${testResult.browserType}, Headless: ${testResult.headless ? 'Evet' : 'Hayır'}
${testResult.steps.map(step => `[${formatDate(testResult.timestamp)}] Adım ${step.step}: ${getActionLabel(step.action)} - ${step.description || ''} - ${step.success ? 'Başarılı' : 'Başarısız'} (${formatDuration(step.duration)})${step.error ? `\n[${formatDate(testResult.timestamp)}] Hata: ${step.error}` : ''}`).join('\n')}
[${formatDate(testResult.timestamp)}] Test tamamlandı: ${testResult.success ? 'Başarılı' : 'Başarısız'} (${formatDuration(testResult.duration)})
[${formatDate(testResult.timestamp)}] Toplam adım: ${testResult.metrics.totalSteps}, Başarılı: ${testResult.metrics.successfulSteps}, Başarısız: ${testResult.metrics.failedSteps}
${testResult.error ? `[${formatDate(testResult.timestamp)}] Test hatası: ${testResult.error}` : ''}`}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
};

export default ResultDetail;
