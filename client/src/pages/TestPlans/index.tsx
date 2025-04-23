import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import { PlusIcon, PencilIcon, TrashBinIcon, PlayIcon } from '../../icons';

// Test planı tipi
interface TestPlan {
  id: string;
  name: string;
  description: string;
  browserPreference: string;
  headless: boolean;
  stepsCount: number;
  createdAt: string;
  updatedAt: string;
}

// Örnek test planları
const sampleTestPlans: TestPlan[] = [
  {
    id: '1',
    name: 'Login Test',
    description: 'Kullanıcı girişi testi',
    browserPreference: 'chromium',
    headless: true,
    stepsCount: 5,
    createdAt: '2023-06-15T10:30:00Z',
    updatedAt: '2023-06-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Ürün Arama',
    description: 'Ürün arama ve filtreleme testi',
    browserPreference: 'firefox',
    headless: false,
    stepsCount: 8,
    createdAt: '2023-06-14T14:20:00Z',
    updatedAt: '2023-06-14T15:45:00Z'
  },
  {
    id: '3',
    name: 'Sepete Ekleme',
    description: 'Ürün sepete ekleme testi',
    browserPreference: 'chromium',
    headless: true,
    stepsCount: 6,
    createdAt: '2023-06-13T09:15:00Z',
    updatedAt: '2023-06-13T09:15:00Z'
  },
  {
    id: '4',
    name: 'Ödeme İşlemi',
    description: 'Ödeme işlemi testi',
    browserPreference: 'edge',
    headless: true,
    stepsCount: 12,
    createdAt: '2023-06-12T16:40:00Z',
    updatedAt: '2023-06-12T16:40:00Z'
  }
];

const TestPlans: React.FC = () => {
  const [testPlans, setTestPlans] = useState<TestPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        title="Test Planları | Playwright Server Agent"
        description="Test planlarını yönetin"
      />
      
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Test Planları
        </h2>
        <Link
          to="/test-plans/create"
          className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary py-2.5 px-5 text-center font-medium text-white hover:bg-opacity-90"
        >
          <PlusIcon className="w-5 h-5" />
          Yeni Test Planı
        </Link>
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
                    Test Planı
                  </th>
                  <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                    Tarayıcı
                  </th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                    Adım Sayısı
                  </th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                    Headless
                  </th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                    Son Güncelleme
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {testPlans.map((testPlan, index) => (
                  <tr key={testPlan.id}>
                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                      <div className="flex flex-col gap-1">
                        <h5 className="font-medium text-black dark:text-white">
                          {testPlan.name}
                        </h5>
                        <p className="text-sm text-gray-500">{testPlan.description}</p>
                      </div>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getBrowserIcon(testPlan.browserPreference)}</span>
                        <span className="capitalize">{testPlan.browserPreference}</span>
                      </div>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <span className="text-black dark:text-white">{testPlan.stepsCount}</span>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <span className={`inline-flex rounded-full py-1 px-3 text-sm font-medium ${
                        testPlan.headless
                          ? 'bg-success/10 text-success'
                          : 'bg-warning/10 text-warning'
                      }`}>
                        {testPlan.headless ? 'Evet' : 'Hayır'}
                      </span>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">{formatDate(testPlan.updatedAt)}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex items-center space-x-3.5">
                        <Link to={`/test-run?planId=${testPlan.id}`} className="hover:text-primary">
                          <PlayIcon className="w-5 h-5" />
                        </Link>
                        <Link to={`/test-plans/edit/${testPlan.id}`} className="hover:text-primary">
                          <PencilIcon className="w-5 h-5" />
                        </Link>
                        <button className="hover:text-danger">
                          <TrashBinIcon className="w-5 h-5" />
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

export default TestPlans;
