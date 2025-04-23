import api from './api';

export interface TestStepResult {
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

export interface TestResult {
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
  tags?: string[];
}

const resultsService = {
  // Tüm test sonuçlarını getir
  getResults: async (): Promise<TestResult[]> => {
    const response = await api.get('/results');
    return response.data;
  },

  // Belirli bir test sonucunu getir
  getResult: async (id: string): Promise<TestResult> => {
    const response = await api.get(`/results/${id}`);
    return response.data;
  },

  // Belirli bir dönem için özet sonuçları getir
  getSummary: async (period: 'daily' | 'weekly' | 'monthly'): Promise<any> => {
    const response = await api.get(`/reports/summary/${period}`);
    return response.data;
  },

  // Belirli bir dönem için analiz sonuçlarını getir
  getAnalysis: async (period: 'daily' | 'weekly' | 'monthly'): Promise<any> => {
    const response = await api.get(`/reports/analyze/${period}`);
    return response.data;
  }
};

export default resultsService;
