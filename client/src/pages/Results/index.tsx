import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { EyeIcon, DownloadIcon } from '../../icons';

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
  stepsCount: number;
  successfulSteps: number;
  failedSteps: number;
}

// Örnek test sonuçları
const sampleResults: TestResult[] = [
  {
    id: '1',
    name: 'Login Test',
    description: 'Kullanıcı girişi testi',
    browserType: 'chromium',
    headless: true,
    timestamp: '2023-06-15T10:30:00Z',
    duration: 3500,
    success: true,
    stepsCount: 5,
    successfulSteps: 5,
    failedSteps: 0
  },
  {
    id: '2',
    name: 'Ürün Arama',
    description: 'Ürün arama ve filtreleme testi',
    browserType: 'firefox',
    headless: false,
    timestamp: '2023-06-14T14:20:00Z',
    duration: 5200,
    success: false,
    stepsCount: 8,
    successfulSteps: 6,
    failedSteps: 2
  },
  {
    id: '3',
    name: 'Sepete Ekleme',
    description: 'Ürün sepete ekleme testi',
    browserType: 'chromium',
    headless: true,
    timestamp: '2023-06-13T09:15:00Z',
    duration: 4100,
    success: true,
    stepsCount: 6,
    successfulSteps: 6,
    failedSteps: 0
  },
  {
    id: '4',
    name: 'Ödeme İşlemi',
    description: 'Ödeme işlemi testi',
    browserType: 'edge',
    headless: true,
    timestamp: '2023-06-12T16:40:00Z',
    duration: 8700,
    success: false,
    stepsCount: 12,
    successfulSteps: 8,
    failedSteps: 4
  }
];

const Results: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // API'den test sonuçlarını getirme simülasyonu
    const fetchResults = async () => {
      try {
        // Gerçek API çağrısı burada yapılacak
        // const response = await fetch('http://localhost:3002/api/results');
        // const data = await response.json();
        
        // Şimdilik örnek veri kullanıyoruz
        setTimeout(() => {
          setResults(sampleResults);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Test sonuçları yüklenirken bir hata oluştu.');
        setLoading(false);
        console.error(err);
      }
    };

    fetchResults();
  }, []);

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

  return (
    <>
      <PageMeta
        title="Test Sonuçları | Playwright Server Agent"
        description="Test sonuçlarını görüntüleyin"
      />
      
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Test Sonuçları
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
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                    Test
                  </th>
                  <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                    Tarayıcı
                  </th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                    Durum
                  </th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                    Adımlar
                  </th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                    Süre
                  </th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                    Tarih
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={result.id}>
                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                      <div className="flex flex-col gap-1">
                        <h5 className="font-medium text-black dark:text-white">
                          {result.name}
                        </h5>
                        <p className="text-sm text-gray-500">{result.description}</p>
                      </div>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getBrowserIcon(result.browserType)}</span>
                        <span className="capitalize">{result.browserType}</span>
                      </div>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <span className={`inline-flex rounded-full py-1 px-3 text-sm font-medium ${
                        result.success
                          ? 'bg-success/10 text-success'
                          : 'bg-danger/10 text-danger'
                      }`}>
                        {result.success ? 'Başarılı' : 'Başarısız'}
                      </span>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex items-center gap-1">
                        <span className="text-success">{result.successfulSteps}</span>
                        <span>/</span>
                        <span className="text-danger">{result.failedSteps}</span>
                        <span>/</span>
                        <span className="text-black dark:text-white">{result.stepsCount}</span>
                      </div>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">{formatDuration(result.duration)}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">{formatDate(result.timestamp)}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex items-center space-x-3.5">
                        <button className="hover:text-primary">
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button className="hover:text-primary">
                          <DownloadIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default Results;
