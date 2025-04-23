import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { PlayIcon, ChevronDownIcon } from '../../icons';

// Test planı tipi
interface TestPlan {
  id: string;
  name: string;
  description: string;
  browserPreference: string;
  headless: boolean;
  stepsCount: number;
}

// Örnek test planları
const sampleTestPlans: TestPlan[] = [
  {
    id: '1',
    name: 'Login Test',
    description: 'Kullanıcı girişi testi',
    browserPreference: 'chromium',
    headless: true,
    stepsCount: 5
  },
  {
    id: '2',
    name: 'Ürün Arama',
    description: 'Ürün arama ve filtreleme testi',
    browserPreference: 'firefox',
    headless: false,
    stepsCount: 8
  },
  {
    id: '3',
    name: 'Sepete Ekleme',
    description: 'Ürün sepete ekleme testi',
    browserPreference: 'chromium',
    headless: true,
    stepsCount: 6
  },
  {
    id: '4',
    name: 'Ödeme İşlemi',
    description: 'Ödeme işlemi testi',
    browserPreference: 'edge',
    headless: true,
    stepsCount: 12
  }
];

const TestRun: React.FC = () => {
  const [testPlans, setTestPlans] = useState<TestPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TestPlan | null>(null);
  const [browserType, setBrowserType] = useState<string>('chromium');
  const [headless, setHeadless] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [running, setRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  useEffect(() => {
    // API'den test planlarını getirme simülasyonu
    const fetchTestPlans = async () => {
      try {
        // Gerçek API çağrısı burada yapılacak
        // const response = await fetch('http://localhost:3002/api/test-plans');
        // const data = await response.json();
        
        // Şimdilik örnek veri kullanıyoruz
        setTimeout(() => {
          setTestPlans(sampleTestPlans);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Test planları yüklenirken bir hata oluştu.');
        setLoading(false);
        console.error(err);
      }
    };

    fetchTestPlans();
  }, []);

  const handlePlanSelect = (plan: TestPlan) => {
    setSelectedPlan(plan);
    setBrowserType(plan.browserPreference);
    setHeadless(plan.headless);
    setShowDropdown(false);
  };

  const handleRunTest = async () => {
    if (!selectedPlan) return;

    setRunning(true);
    setProgress(0);
    setCurrentStep(0);

    // Test çalıştırma simülasyonu
    const totalSteps = selectedPlan.stepsCount;
    const stepInterval = 100 / totalSteps;

    for (let i = 1; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(i);
      setProgress(i * stepInterval);
    }

    // Test tamamlandı
    setTimeout(() => {
      setRunning(false);
      // Başarılı test sonucu için sonuç sayfasına yönlendirme yapılabilir
      // window.location.href = `/results/${testId}`;
    }, 1000);
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

  return (
    <>
      <PageMeta
        title="Test Çalıştır | Playwright Server Agent"
        description="Test planlarını çalıştırın"
      />
      
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Test Çalıştır
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
      ) : (
        <div className="rounded-sm border border-stroke bg-white p-7 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
              Test Planı Seçin
            </h3>
            
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex w-full items-center justify-between rounded border border-stroke py-3 px-5 text-left outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
              >
                <span className="text-black dark:text-white">
                  {selectedPlan ? selectedPlan.name : 'Test planı seçin'}
                </span>
                <ChevronDownIcon className="w-5 h-5" />
              </button>
              
              {showDropdown && (
                <div className="absolute left-0 top-full z-40 mt-1 w-full rounded-b-md border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                  <ul className="max-h-64 overflow-y-auto">
                    {testPlans.map((plan) => (
                      <li
                        key={plan.id}
                        onClick={() => handlePlanSelect(plan)}
                        className="flex cursor-pointer items-center gap-4 px-5 py-2 hover:bg-gray-2 dark:hover:bg-meta-4"
                      >
                        <span className="text-black dark:text-white">{plan.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {selectedPlan && (
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                {selectedPlan.description}
              </div>
            )}
          </div>
          
          {selectedPlan && (
            <>
              <div className="mb-8">
                <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                  Tarayıcı Ayarları
                </h3>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2.5 block text-black dark:text-white">
                      Tarayıcı Tipi
                    </label>
                    <div className="relative z-20 bg-transparent dark:bg-form-input">
                      <select
                        value={browserType}
                        onChange={(e) => setBrowserType(e.target.value)}
                        className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      >
                        <option value="chromium">Chromium</option>
                        <option value="firefox">Firefox</option>
                        <option value="edge">Edge</option>
                      </select>
                      <span className="absolute top-1/2 right-4 z-30 -translate-y-1/2">
                        <ChevronDownIcon className="w-5 h-5" />
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="mb-2.5 block text-black dark:text-white">
                      Headless Modu
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex cursor-pointer items-center">
                        <input
                          type="radio"
                          name="headless"
                          checked={headless}
                          onChange={() => setHeadless(true)}
                          className="mr-2 h-5 w-5 cursor-pointer"
                        />
                        <span className="text-sm text-black dark:text-white">Evet</span>
                      </label>
                      <label className="flex cursor-pointer items-center">
                        <input
                          type="radio"
                          name="headless"
                          checked={!headless}
                          onChange={() => setHeadless(false)}
                          className="mr-2 h-5 w-5 cursor-pointer"
                        />
                        <span className="text-sm text-black dark:text-white">Hayır</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                  Test Özeti
                </h3>
                
                <div className="rounded-sm border border-stroke bg-gray-2 p-4 dark:border-strokedark dark:bg-meta-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <div>
                      <span className="block text-sm text-gray-500 dark:text-gray-400">Test Planı:</span>
                      <span className="text-black dark:text-white">{selectedPlan.name}</span>
                    </div>
                    <div>
                      <span className="block text-sm text-gray-500 dark:text-gray-400">Tarayıcı:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getBrowserIcon(browserType)}</span>
                        <span className="capitalize text-black dark:text-white">{browserType}</span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-sm text-gray-500 dark:text-gray-400">Headless:</span>
                      <span className="text-black dark:text-white">{headless ? 'Evet' : 'Hayır'}</span>
                    </div>
                    <div>
                      <span className="block text-sm text-gray-500 dark:text-gray-400">Adım Sayısı:</span>
                      <span className="text-black dark:text-white">{selectedPlan.stepsCount}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {running ? (
                <div className="mb-8">
                  <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                    Test Çalışıyor
                  </h3>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        İlerleme: {currentStep}/{selectedPlan.stepsCount} adım
                      </span>
                      <span className="text-sm font-medium text-black dark:text-white">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-stroke dark:bg-strokedark">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={() => setRunning(false)}
                      className="inline-flex items-center justify-center gap-2.5 rounded-md bg-danger py-2.5 px-5 text-center font-medium text-white hover:bg-opacity-90"
                    >
                      İptal Et
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <button
                    onClick={handleRunTest}
                    className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary py-2.5 px-5 text-center font-medium text-white hover:bg-opacity-90"
                  >
                    <PlayIcon className="w-5 h-5" />
                    Testi Çalıştır
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default TestRun;
