import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Link } from 'react-router';
import { PlayIcon, EyeIcon, ChartIcon, ListIcon } from '../../icons';

// Özet istatistikler tipi
interface SummaryStats {
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  averageDuration: number;
}

// Son test sonuçları tipi
interface RecentTest {
  id: string;
  name: string;
  browserType: string;
  timestamp: string;
  duration: number;
  success: boolean;
}

// Örnek özet istatistikler
const sampleSummaryStats: SummaryStats = {
  totalTests: 120,
  successfulTests: 98,
  failedTests: 22,
  totalSteps: 850,
  successfulSteps: 780,
  failedSteps: 70,
  averageDuration: 4500
};

// Örnek son test sonuçları
const sampleRecentTests: RecentTest[] = [
  {
    id: '1',
    name: 'Login Test',
    browserType: 'chromium',
    timestamp: '2023-06-15T10:30:00Z',
    duration: 3500,
    success: true
  },
  {
    id: '2',
    name: 'Ürün Arama',
    browserType: 'firefox',
    timestamp: '2023-06-14T14:20:00Z',
    duration: 5200,
    success: false
  },
  {
    id: '3',
    name: 'Sepete Ekleme',
    browserType: 'chromium',
    timestamp: '2023-06-13T09:15:00Z',
    duration: 4100,
    success: true
  },
  {
    id: '4',
    name: 'Ödeme İşlemi',
    browserType: 'edge',
    timestamp: '2023-06-12T16:40:00Z',
    duration: 8700,
    success: false
  }
];

// Örnek test sonuçları trendi (son 7 gün)
const trendDates = ['1 Haz', '5 Haz', '10 Haz', '15 Haz', '20 Haz', '25 Haz', '30 Haz'];
const successTrend = [15, 18, 22, 19, 25, 20, 22];
const failureTrend = [5, 3, 2, 4, 2, 3, 1];

const Dashboard: React.FC = () => {
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [recentTests, setRecentTests] = useState<RecentTest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // API'den özet istatistikleri ve son test sonuçlarını getirme simülasyonu
    const fetchDashboardData = async () => {
      try {
        // Gerçek API çağrıları burada yapılacak
        // const summaryResponse = await fetch('http://localhost:3002/api/summary');
        // const summaryData = await summaryResponse.json();
        // const recentResponse = await fetch('http://localhost:3002/api/results/recent');
        // const recentData = await recentResponse.json();
        
        // Şimdilik örnek veri kullanıyoruz
        setTimeout(() => {
          setSummaryStats(sampleSummaryStats);
          setRecentTests(sampleRecentTests);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Dashboard verileri yüklenirken bir hata oluştu.');
        setLoading(false);
        console.error(err);
      }
    };

    fetchDashboardData();
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

  // Test sonuçları trendi grafiği için seçenekler
  const testResultsTrendOptions: ApexOptions = {
    chart: {
      height: 350,
      type: 'bar',
      stacked: true,
      toolbar: {
        show: false
      }
    },
    colors: ['#10B981', '#F87171'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%'
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 2
    },
    xaxis: {
      categories: trendDates
    },
    yaxis: {
      title: {
        text: 'Test Sayısı'
      }
    },
    tooltip: {
      y: {
        formatter: (value) => `${value} test`
      }
    },
    fill: {
      opacity: 1
    },
    legend: {
      position: 'top'
    }
  };

  // Test sonuçları trendi grafiği için seriler
  const testResultsTrendSeries = [
    {
      name: 'Başarılı',
      data: successTrend
    },
    {
      name: 'Başarısız',
      data: failureTrend
    }
  ];

  // Başarı oranı grafiği için seçenekler
  const successRateOptions: ApexOptions = {
    chart: {
      height: 350,
      type: 'radialBar'
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: '70%'
        },
        dataLabels: {
          name: {
            show: false
          },
          value: {
            fontSize: '30px',
            show: true,
            formatter: (val) => `${Math.round(val)}%`
          }
        }
      }
    },
    colors: ['#10B981'],
    labels: ['Başarı Oranı']
  };

  // Başarı oranı grafiği için seriler
  const successRateSeries = summaryStats
    ? [Math.round((summaryStats.successfulTests / summaryStats.totalTests) * 100)]
    : [0];

  return (
    <>
      <PageMeta
        title="Dashboard | Playwright Server Agent"
        description="Playwright Server Agent Dashboard"
      />
      
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Dashboard
        </h2>
        <Link
          to="/test-run"
          className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary py-2.5 px-5 text-center font-medium text-white hover:bg-opacity-90"
        >
          <PlayIcon className="w-5 h-5" />
          Yeni Test Çalıştır
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
      ) : summaryStats ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5 mb-6">
            <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                <ListIcon className="fill-primary dark:fill-white" />
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <h4 className="text-title-md font-bold text-black dark:text-white">
                    {summaryStats.totalTests}
                  </h4>
                  <span className="text-sm font-medium">Toplam Test</span>
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-meta-3">
                  {summaryStats.successfulTests} başarılı / {summaryStats.failedTests} başarısız
                </span>
              </div>
            </div>

            <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                <PlayIcon className="fill-primary dark:fill-white" />
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <h4 className="text-title-md font-bold text-black dark:text-white">
                    {summaryStats.totalSteps}
                  </h4>
                  <span className="text-sm font-medium">Toplam Adım</span>
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-meta-3">
                  {summaryStats.successfulSteps} başarılı / {summaryStats.failedSteps} başarısız
                </span>
              </div>
            </div>

            <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                <ChartIcon className="fill-primary dark:fill-white" />
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <h4 className="text-title-md font-bold text-black dark:text-white">
                    {formatDuration(summaryStats.averageDuration)}
                  </h4>
                  <span className="text-sm font-medium">Ortalama Süre</span>
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                <svg
                  className="fill-primary dark:fill-white"
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21.1063 18.0469L19.3875 3.23126C19.2157 1.71876 17.9438 0.584381 16.3969 0.584381H5.56878C4.05628 0.584381 2.78441 1.71876 2.57816 3.23126L0.859406 18.0469C0.756281 18.9063 1.03128 19.7313 1.61566 20.3844C2.20003 21.0375 2.99066 21.3813 3.85003 21.3813H18.1157C18.975 21.3813 19.8 21.0031 20.35 20.3844C20.9 19.7656 21.2094 18.9063 21.1063 18.0469ZM19.2157 19.3531C18.9407 19.6625 18.5625 19.8344 18.15 19.8344H3.85003C3.43753 19.8344 3.05941 19.6625 2.78441 19.3531C2.50941 19.0438 2.37191 18.6313 2.44066 18.2188L4.12503 3.43751C4.19378 2.71563 4.81253 2.16563 5.56878 2.16563H16.4313C17.1532 2.16563 17.7719 2.71563 17.875 3.43751L19.5938 18.2531C19.6282 18.6656 19.4907 19.0438 19.2157 19.3531Z"
                    fill=""
                  />
                  <path
                    d="M14.3345 5.29375C13.922 5.39688 13.647 5.80938 13.7501 6.22188C13.7845 6.42813 13.8189 6.63438 13.8189 6.80625C13.8189 8.35313 12.547 9.625 11.0001 9.625C9.45327 9.625 8.1814 8.35313 8.1814 6.80625C8.1814 6.6 8.21577 6.42813 8.25015 6.22188C8.35327 5.80938 8.07827 5.39688 7.66577 5.29375C7.25327 5.19063 6.84077 5.46563 6.73765 5.87813C6.6689 6.1875 6.63452 6.49688 6.63452 6.80625C6.63452 9.2125 8.5939 11.1719 11.0001 11.1719C13.4064 11.1719 15.3658 9.2125 15.3658 6.80625C15.3658 6.49688 15.3314 6.1875 15.2626 5.87813C15.1595 5.46563 14.747 5.225 14.3345 5.29375Z"
                    fill=""
                  />
                </svg>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <h4 className="text-title-md font-bold text-black dark:text-white">
                    {Math.round((summaryStats.successfulTests / summaryStats.totalTests) * 100)}%
                  </h4>
                  <span className="text-sm font-medium">Başarı Oranı</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-2 2xl:gap-7.5 mb-6">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
              <div className="mb-3 justify-between gap-4 sm:flex">
                <div>
                  <h5 className="text-xl font-semibold text-black dark:text-white">
                    Test Sonuçları Trendi
                  </h5>
                </div>
                <div>
                  <Link
                    to="/results"
                    className="inline-flex items-center justify-center gap-2.5 rounded-md border border-primary py-2 px-4 text-center font-medium text-primary hover:bg-opacity-90"
                  >
                    <EyeIcon className="w-5 h-5" />
                    Tüm Sonuçlar
                  </Link>
                </div>
              </div>

              <div className="mb-2">
                <div id="testResultsTrendChart">
                  <Chart
                    options={testResultsTrendOptions}
                    series={testResultsTrendSeries}
                    type="bar"
                    height={350}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
              <div className="mb-3 justify-between gap-4 sm:flex">
                <div>
                  <h5 className="text-xl font-semibold text-black dark:text-white">
                    Başarı Oranı
                  </h5>
                </div>
                <div>
                  <Link
                    to="/performance"
                    className="inline-flex items-center justify-center gap-2.5 rounded-md border border-primary py-2 px-4 text-center font-medium text-primary hover:bg-opacity-90"
                  >
                    <ChartIcon className="w-5 h-5" />
                    Performans
                  </Link>
                </div>
              </div>

              <div className="mb-2">
                <div id="successRateChart">
                  <Chart
                    options={successRateOptions}
                    series={successRateSeries}
                    type="radialBar"
                    height={350}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <div className="mb-6 flex items-center justify-between">
              <h4 className="text-xl font-semibold text-black dark:text-white">
                Son Test Sonuçları
              </h4>
              <Link
                to="/results"
                className="inline-flex items-center justify-center gap-2.5 rounded-md border border-primary py-2 px-4 text-center font-medium text-primary hover:bg-opacity-90"
              >
                <EyeIcon className="w-5 h-5" />
                Tüm Sonuçlar
              </Link>
            </div>

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
                  {recentTests.map((test, index) => (
                    <tr key={test.id}>
                      <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                        <h5 className="font-medium text-black dark:text-white">
                          {test.name}
                        </h5>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getBrowserIcon(test.browserType)}</span>
                          <span className="capitalize">{test.browserType}</span>
                        </div>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <span className={`inline-flex rounded-full py-1 px-3 text-sm font-medium ${
                          test.success
                            ? 'bg-success/10 text-success'
                            : 'bg-danger/10 text-danger'
                        }`}>
                          {test.success ? 'Başarılı' : 'Başarısız'}
                        </span>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <p className="text-black dark:text-white">{formatDuration(test.duration)}</p>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <p className="text-black dark:text-white">{formatDate(test.timestamp)}</p>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <div className="flex items-center space-x-3.5">
                          <Link to={`/results/${test.id}`} className="hover:text-primary">
                            <EyeIcon className="w-5 h-5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
};

export default Dashboard;
