import api from './api';

export interface WebVitals {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  tti: number; // Time to Interactive
  ttfb: number; // Time to First Byte
}

export interface NetworkMetrics {
  totalRequests: number;
  totalSize: number;
  averageDuration: number;
  slowestRequests?: {
    url: string;
    duration: number;
    size: number;
  }[];
}

export interface PerformanceData {
  webVitals: WebVitals;
  networkMetrics: NetworkMetrics;
  warnings: string[];
  recommendations: string[];
}

export interface PerformanceTrend {
  testName: string;
  limit: number;
  trendData: {
    timestamp: string;
    duration: number;
    success: boolean;
    webVitals: WebVitals;
    networkStats: {
      totalRequests: number;
      totalSize: number;
      averageDuration: number;
    };
    warnings: number;
  }[];
}

const performanceService = {
  // Belirli bir test için performans raporunu getir
  getPerformanceReport: async (testId: string): Promise<PerformanceData> => {
    const response = await api.get(`/performance/report/${testId}`);
    return response.data;
  },

  // Belirli bir test için Web Vitals metriklerini getir
  getWebVitals: async (testId: string): Promise<WebVitals> => {
    const response = await api.get(`/performance/web-vitals/${testId}`);
    return response.data;
  },

  // Belirli bir test için ağ metriklerini getir
  getNetworkMetrics: async (testId: string): Promise<NetworkMetrics> => {
    const response = await api.get(`/performance/network/${testId}`);
    return response.data;
  },

  // Belirli bir test adı için performans trendini getir
  getPerformanceTrend: async (testName: string, limit: number = 10): Promise<PerformanceTrend> => {
    const response = await api.get(`/performance/trend?testName=${encodeURIComponent(testName)}&limit=${limit}`);
    return response.data;
  },

  // Belirli bir test için optimizasyon önerilerini getir
  getOptimizationRecommendations: async (testId: string): Promise<string[]> => {
    const response = await api.get(`/performance/optimize/${testId}`);
    return response.data.recommendations;
  }
};

export default performanceService;
