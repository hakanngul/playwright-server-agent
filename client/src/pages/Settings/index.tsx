import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { ChevronDownIcon } from '../../icons';

// Konfigürasyon tipi
interface Config {
  server: {
    port: number;
    allowedOrigins: string[];
  };
  test: {
    parallelTests: number;
    defaultBrowser: string;
    defaultHeadless: boolean;
    browsers: {
      chromium: boolean;
      firefox: boolean;
      edge: boolean;
    };
  };
  paths: {
    screenshotsDir: string;
    reportsDir: string;
    testPlansDir: string;
  };
  performance: {
    collectMetrics: boolean;
    webVitals: boolean;
    networkMetrics: boolean;
    thresholds: {
      lcp: number;
      fid: number;
      cls: number;
      ttfb: number;
    };
  };
}

// Örnek konfigürasyon
const sampleConfig: Config = {
  server: {
    port: 3002,
    allowedOrigins: ['http://localhost:5173', 'http://localhost:3000']
  },
  test: {
    parallelTests: 4,
    defaultBrowser: 'chromium',
    defaultHeadless: true,
    browsers: {
      chromium: true,
      firefox: true,
      edge: true
    }
  },
  paths: {
    screenshotsDir: 'screenshots',
    reportsDir: 'reports',
    testPlansDir: 'test-plans'
  },
  performance: {
    collectMetrics: true,
    webVitals: true,
    networkMetrics: true,
    thresholds: {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      ttfb: 600
    }
  }
};

const Settings: React.FC = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('server');

  useEffect(() => {
    // API'den konfigürasyonu getirme simülasyonu
    const fetchConfig = async () => {
      try {
        // Gerçek API çağrısı burada yapılacak
        // const response = await fetch('http://localhost:3002/api/config');
        // const data = await response.json();
        
        // Şimdilik örnek veri kullanıyoruz
        setTimeout(() => {
          setConfig(sampleConfig);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Konfigürasyon yüklenirken bir hata oluştu.');
        setLoading(false);
        console.error(err);
      }
    };

    fetchConfig();
  }, []);

  const handleInputChange = (section: string, field: string, value: any) => {
    if (!config) return;

    setConfig({
      ...config,
      [section]: {
        ...config[section as keyof Config],
        [field]: value
      }
    });
  };

  const handleNestedInputChange = (section: string, parent: string, field: string, value: any) => {
    if (!config) return;

    setConfig({
      ...config,
      [section]: {
        ...config[section as keyof Config],
        [parent]: {
          ...(config[section as keyof Config] as any)[parent],
          [field]: value
        }
      }
    });
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Gerçek API çağrısı burada yapılacak
      // await fetch('http://localhost:3002/api/config', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(config)
      // });
      
      // Simülasyon
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Konfigürasyon başarıyla kaydedildi.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Konfigürasyon kaydedilirken bir hata oluştu.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Ayarlar | Playwright Server Agent"
        description="Sistem ayarlarını yapılandırın"
      />
      
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Ayarlar
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-danger">{error}</div>
        </div>
      ) : config ? (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-7.5 py-4 dark:border-strokedark">
            <div className="flex flex-wrap items-center">
              <button
                onClick={() => setActiveTab('server')}
                className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === 'server'
                    ? 'bg-primary text-white'
                    : 'hover:bg-primary/[0.1] hover:text-primary'
                }`}
              >
                Sunucu
              </button>
              <button
                onClick={() => setActiveTab('test')}
                className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === 'test'
                    ? 'bg-primary text-white'
                    : 'hover:bg-primary/[0.1] hover:text-primary'
                }`}
              >
                Test
              </button>
              <button
                onClick={() => setActiveTab('paths')}
                className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === 'paths'
                    ? 'bg-primary text-white'
                    : 'hover:bg-primary/[0.1] hover:text-primary'
                }`}
              >
                Dosya Yolları
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === 'performance'
                    ? 'bg-primary text-white'
                    : 'hover:bg-primary/[0.1] hover:text-primary'
                }`}
              >
                Performans
              </button>
            </div>
          </div>

          <div className="p-7.5">
            {success && (
              <div className="mb-6 flex w-full rounded-lg border-l-6 border-[#34D399] bg-[#34D399]/[.15] px-7 py-5 shadow-md dark:bg-[#34D399]/[.15]">
                <div className="mr-5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#34D399]">
                  <svg
                    width="16"
                    height="12"
                    viewBox="0 0 16 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15.2984 0.826822L15.2868 0.811827L15.2741 0.797751C14.9173 0.401867 14.3238 0.400754 13.9657 0.794406L5.91888 9.45376L2.05667 5.2868C1.69856 4.89287 1.10487 4.89389 0.747996 5.28987C0.417335 5.65675 0.417335 6.22337 0.747996 6.59026L0.747959 6.59029L0.752701 6.59541L4.86742 11.0348C5.14445 11.3405 5.52858 11.5 5.89581 11.5C6.29242 11.5 6.65178 11.3355 6.92401 11.035L15.2162 2.11161C15.5833 1.74452 15.576 1.18615 15.2984 0.826822Z"
                      fill="white"
                      stroke="white"
                    ></path>
                  </svg>
                </div>
                <div className="w-full">
                  <h5 className="mb-1 text-lg font-semibold text-black dark:text-[#34D399]">
                    Başarılı
                  </h5>
                  <p className="text-base text-body dark:text-white">
                    {success}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'server' && (
              <div>
                <h3 className="mb-5 text-xl font-semibold text-black dark:text-white">
                  Sunucu Ayarları
                </h3>
                
                <div className="mb-5.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Port
                  </label>
                  <input
                    type="number"
                    value={config.server.port}
                    onChange={(e) => handleInputChange('server', 'port', parseInt(e.target.value))}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                
                <div className="mb-5.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    İzin Verilen Kaynaklar (CORS)
                  </label>
                  <textarea
                    value={config.server.allowedOrigins.join('\n')}
                    onChange={(e) => handleInputChange('server', 'allowedOrigins', e.target.value.split('\n'))}
                    rows={4}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    placeholder="Her satıra bir URL girin"
                  />
                  <p className="mt-2 text-sm text-gray-500">Her satıra bir URL girin (örn. http://localhost:5173)</p>
                </div>
              </div>
            )}

            {activeTab === 'test' && (
              <div>
                <h3 className="mb-5 text-xl font-semibold text-black dark:text-white">
                  Test Ayarları
                </h3>
                
                <div className="mb-5.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Paralel Test Sayısı
                  </label>
                  <input
                    type="number"
                    value={config.test.parallelTests}
                    onChange={(e) => handleInputChange('test', 'parallelTests', parseInt(e.target.value))}
                    min={1}
                    max={10}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                
                <div className="mb-5.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Varsayılan Tarayıcı
                  </label>
                  <div className="relative z-20 bg-white dark:bg-form-input">
                    <select
                      value={config.test.defaultBrowser}
                      onChange={(e) => handleInputChange('test', 'defaultBrowser', e.target.value)}
                      className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                    >
                      <option value="chromium">Chromium</option>
                      <option value="firefox">Firefox</option>
                      <option value="edge">Edge</option>
                    </select>
                    <span className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
                      <ChevronDownIcon className="w-5 h-5" />
                    </span>
                  </div>
                </div>
                
                <div className="mb-5.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Varsayılan Headless Modu
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex cursor-pointer items-center">
                      <input
                        type="radio"
                        name="headless"
                        checked={config.test.defaultHeadless}
                        onChange={() => handleInputChange('test', 'defaultHeadless', true)}
                        className="mr-2 h-5 w-5 cursor-pointer"
                      />
                      <span className="text-sm text-black dark:text-white">Evet</span>
                    </label>
                    <label className="flex cursor-pointer items-center">
                      <input
                        type="radio"
                        name="headless"
                        checked={!config.test.defaultHeadless}
                        onChange={() => handleInputChange('test', 'defaultHeadless', false)}
                        className="mr-2 h-5 w-5 cursor-pointer"
                      />
                      <span className="text-sm text-black dark:text-white">Hayır</span>
                    </label>
                  </div>
                </div>
                
                <div className="mb-5.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Etkin Tarayıcılar
                  </label>
                  <div className="flex flex-col gap-2.5">
                    <label className="flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={config.test.browsers.chromium}
                        onChange={(e) => handleNestedInputChange('test', 'browsers', 'chromium', e.target.checked)}
                        className="mr-2 h-5 w-5 cursor-pointer"
                      />
                      <span className="text-sm text-black dark:text-white">Chromium</span>
                    </label>
                    <label className="flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={config.test.browsers.firefox}
                        onChange={(e) => handleNestedInputChange('test', 'browsers', 'firefox', e.target.checked)}
                        className="mr-2 h-5 w-5 cursor-pointer"
                      />
                      <span className="text-sm text-black dark:text-white">Firefox</span>
                    </label>
                    <label className="flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={config.test.browsers.edge}
                        onChange={(e) => handleNestedInputChange('test', 'browsers', 'edge', e.target.checked)}
                        className="mr-2 h-5 w-5 cursor-pointer"
                      />
                      <span className="text-sm text-black dark:text-white">Edge</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'paths' && (
              <div>
                <h3 className="mb-5 text-xl font-semibold text-black dark:text-white">
                  Dosya Yolları
                </h3>
                
                <div className="mb-5.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Ekran Görüntüleri Dizini
                  </label>
                  <input
                    type="text"
                    value={config.paths.screenshotsDir}
                    onChange={(e) => handleInputChange('paths', 'screenshotsDir', e.target.value)}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                
                <div className="mb-5.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Raporlar Dizini
                  </label>
                  <input
                    type="text"
                    value={config.paths.reportsDir}
                    onChange={(e) => handleInputChange('paths', 'reportsDir', e.target.value)}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
                
                <div className="mb-5.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Test Planları Dizini
                  </label>
                  <input
                    type="text"
                    value={config.paths.testPlansDir}
                    onChange={(e) => handleInputChange('paths', 'testPlansDir', e.target.value)}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div>
                <h3 className="mb-5 text-xl font-semibold text-black dark:text-white">
                  Performans Ayarları
                </h3>
                
                <div className="mb-5.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Performans Metrikleri
                  </label>
                  <div className="flex flex-col gap-2.5">
                    <label className="flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={config.performance.collectMetrics}
                        onChange={(e) => handleInputChange('performance', 'collectMetrics', e.target.checked)}
                        className="mr-2 h-5 w-5 cursor-pointer"
                      />
                      <span className="text-sm text-black dark:text-white">Performans Metriklerini Topla</span>
                    </label>
                    <label className="flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={config.performance.webVitals}
                        onChange={(e) => handleInputChange('performance', 'webVitals', e.target.checked)}
                        className="mr-2 h-5 w-5 cursor-pointer"
                      />
                      <span className="text-sm text-black dark:text-white">Web Vitals Metriklerini Topla</span>
                    </label>
                    <label className="flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={config.performance.networkMetrics}
                        onChange={(e) => handleInputChange('performance', 'networkMetrics', e.target.checked)}
                        className="mr-2 h-5 w-5 cursor-pointer"
                      />
                      <span className="text-sm text-black dark:text-white">Ağ Metriklerini Topla</span>
                    </label>
                  </div>
                </div>
                
                <div className="mb-5.5">
                  <h4 className="mb-3 text-lg font-medium text-black dark:text-white">
                    Performans Eşikleri
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                        LCP Eşiği (ms)
                      </label>
                      <input
                        type="number"
                        value={config.performance.thresholds.lcp}
                        onChange={(e) => handleNestedInputChange('performance', 'thresholds', 'lcp', parseInt(e.target.value))}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                        FID Eşiği (ms)
                      </label>
                      <input
                        type="number"
                        value={config.performance.thresholds.fid}
                        onChange={(e) => handleNestedInputChange('performance', 'thresholds', 'fid', parseInt(e.target.value))}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                        CLS Eşiği
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={config.performance.thresholds.cls}
                        onChange={(e) => handleNestedInputChange('performance', 'thresholds', 'cls', parseFloat(e.target.value))}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                        TTFB Eşiği (ms)
                      </label>
                      <input
                        type="number"
                        value={config.performance.thresholds.ttfb}
                        onChange={(e) => handleNestedInputChange('performance', 'thresholds', 'ttfb', parseInt(e.target.value))}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4.5">
              <button
                onClick={() => window.location.reload()}
                className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                disabled={saving}
              >
                İptal
              </button>
              <button
                onClick={handleSaveConfig}
                className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90"
                disabled={saving}
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                    <span>Kaydediliyor...</span>
                  </div>
                ) : (
                  'Kaydet'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Settings;
