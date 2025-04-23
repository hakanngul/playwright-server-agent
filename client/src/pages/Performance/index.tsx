import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

// Performans verisi tipi
interface PerformanceData {
  testName: string;
  date: string;
  webVitals: {
    fcp: number;
    lcp: number;
    cls: number;
    fid: number;
    tti: number;
    ttfb: number;
  };
  networkMetrics: {
    totalRequests: number;
    totalSize: number;
    averageDuration: number;
  };
}

// Örnek performans verileri
const samplePerformanceData: PerformanceData[] = [
  {
    testName: 'Login Test',
    date: '2023-06-15',
    webVitals: {
      fcp: 850,
      lcp: 1200,
      cls: 0.05,
      fid: 120,
      tti: 1500,
      ttfb: 350
    },
    networkMetrics: {
      totalRequests: 15,
      totalSize: 1250000,
      averageDuration: 250
    }
  },
  {
    testName: 'Ürün Arama',
    date: '2023-06-14',
    webVitals: {
      fcp: 920,
      lcp: 1350,
      cls: 0.08,
      fid: 150,
      tti: 1700,
      ttfb: 420
    },
    networkMetrics: {
      totalRequests: 22,
      totalSize: 1850000,
      averageDuration: 320
    }
  },
  {
    testName: 'Sepete Ekleme',
    date: '2023-06-13',
    webVitals: {
      fcp: 780,
      lcp: 1100,
      cls: 0.03,
      fid: 100,
      tti: 1400,
      ttfb: 300
    },
    networkMetrics: {
      totalRequests: 18,
      totalSize: 1450000,
      averageDuration: 280
    }
  },
  {
    testName: 'Ödeme İşlemi',
    date: '2023-06-12',
    webVitals: {
      fcp: 1050,
      lcp: 1500,
      cls: 0.12,
      fid: 180,
      tti: 1900,
      ttfb: 480
    },
    networkMetrics: {
      totalRequests: 30,
      totalSize: 2250000,
      averageDuration: 380
    }
  }
];

// Trend verileri
const trendDates = ['1 Haz', '5 Haz', '10 Haz', '15 Haz', '20 Haz', '25 Haz', '30 Haz'];
const fcpTrend = [950, 920, 880, 850, 830, 800, 780];
const lcpTrend = [1400, 1350, 1300, 1250, 1200, 1150, 1100];
const ttfbTrend = [450, 430, 410, 390, 370, 350, 330];

const Performance: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // API'den performans verilerini getirme simülasyonu
    const fetchPerformanceData = async () => {
      try {
        // Gerçek API çağrısı burada yapılacak
        // const response = await fetch('http://localhost:3002/api/performance');
        // const data = await response.json();
        
        // Şimdilik örnek veri kullanıyoruz
        setTimeout(() => {
          setPerformanceData(samplePerformanceData);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Performans verileri yüklenirken bir hata oluştu.');
        setLoading(false);
        console.error(err);
      }
    };

    fetchPerformanceData();
  }, []);

  // Web Vitals trend grafiği için seçenekler
  const webVitalsTrendOptions: ApexOptions = {
    chart: {
      height: 350,
      type: 'line',
      toolbar: {
        show: false
      }
    },
    colors: ['#3C50E0', '#10B981', '#F59E0B'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    xaxis: {
      categories: trendDates
    },
    yaxis: {
      title: {
        text: 'Milisaniye'
      }
    },
    tooltip: {
      y: {
        formatter: (value) => `${value} ms`
      }
    },
    legend: {
      position: 'top'
    }
  };

  // Web Vitals trend grafiği için seriler
  const webVitalsTrendSeries = [
    {
      name: 'FCP',
      data: fcpTrend
    },
    {
      name: 'LCP',
      data: lcpTrend
    },
    {
      name: 'TTFB',
      data: ttfbTrend
    }
  ];

  // Ağ metrikleri grafiği için seçenekler
  const networkMetricsOptions: ApexOptions = {
    chart: {
      height: 350,
      type: 'bar',
      toolbar: {
        show: false
      }
    },
    colors: ['#10B981'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: '55%'
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: performanceData.map(data => data.testName)
    },
    yaxis: {
      title: {
        text: 'İstek Sayısı'
      }
    },
    tooltip: {
      y: {
        formatter: (value) => `${value} istek`
      }
    }
  };

  // Ağ metrikleri grafiği için seriler
  const networkMetricsSeries = [
    {
      name: 'İstek Sayısı',
      data: performanceData.map(data => data.networkMetrics.totalRequests)
    }
  ];

  return (
    <>
      <PageMeta
        title="Performans | Playwright Server Agent"
        description="Performans metriklerini görüntüleyin"
      />
      
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Performans Metrikleri
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
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5 mb-6">
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
                    {performanceData[0]?.webVitals.fcp} ms
                  </h4>
                  <span className="text-sm font-medium">First Contentful Paint (FCP)</span>
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
                    {performanceData[0]?.webVitals.lcp} ms
                  </h4>
                  <span className="text-sm font-medium">Largest Contentful Paint (LCP)</span>
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
                    {performanceData[0]?.webVitals.cls}
                  </h4>
                  <span className="text-sm font-medium">Cumulative Layout Shift (CLS)</span>
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
                    {performanceData[0]?.webVitals.ttfb} ms
                  </h4>
                  <span className="text-sm font-medium">Time to First Byte (TTFB)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-2 2xl:gap-7.5">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
              <div className="mb-3 justify-between gap-4 sm:flex">
                <div>
                  <h5 className="text-xl font-semibold text-black dark:text-white">
                    Web Vitals Trend
                  </h5>
                </div>
              </div>

              <div className="mb-2">
                <div id="webVitalsTrendChart">
                  <Chart
                    options={webVitalsTrendOptions}
                    series={webVitalsTrendSeries}
                    type="line"
                    height={350}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
              <div className="mb-3 justify-between gap-4 sm:flex">
                <div>
                  <h5 className="text-xl font-semibold text-black dark:text-white">
                    Ağ Metrikleri
                  </h5>
                </div>
              </div>

              <div className="mb-2">
                <div id="networkMetricsChart">
                  <Chart
                    options={networkMetricsOptions}
                    series={networkMetricsSeries}
                    type="bar"
                    height={350}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <h5 className="mb-6 text-xl font-semibold text-black dark:text-white">
              Performans Detayları
            </h5>
            
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 text-left dark:bg-meta-4">
                    <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                      Test
                    </th>
                    <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                      FCP
                    </th>
                    <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                      LCP
                    </th>
                    <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                      CLS
                    </th>
                    <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                      TTFB
                    </th>
                    <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                      İstek Sayısı
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map((data, index) => (
                    <tr key={index}>
                      <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                        <h5 className="font-medium text-black dark:text-white">
                          {data.testName}
                        </h5>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <span className="text-black dark:text-white">{data.webVitals.fcp} ms</span>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <span className="text-black dark:text-white">{data.webVitals.lcp} ms</span>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <span className="text-black dark:text-white">{data.webVitals.cls}</span>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <span className="text-black dark:text-white">{data.webVitals.ttfb} ms</span>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <span className="text-black dark:text-white">{data.networkMetrics.totalRequests}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Performance;
