import api from './api';

export interface TestStep {
  action: string;
  target?: string;
  strategy?: string;
  value?: string;
  description?: string;
  timeout?: number;
}

export interface TestPlan {
  id?: string;
  name: string;
  description: string;
  browserPreference: string;
  headless: boolean;
  steps: TestStep[];
  createdAt?: string;
  updatedAt?: string;
}

const testPlanService = {
  // Test planlarını getir
  getTestPlans: async (): Promise<TestPlan[]> => {
    const response = await api.get('/test-plans');
    return response.data;
  },

  // Test planı detayını getir
  getTestPlan: async (id: string): Promise<TestPlan> => {
    const response = await api.get(`/test-plans/${id}`);
    return response.data;
  },

  // Test planı oluştur
  createTestPlan: async (testPlan: TestPlan): Promise<TestPlan> => {
    const response = await api.post('/test-plans', testPlan);
    return response.data;
  },

  // Test planı güncelle
  updateTestPlan: async (id: string, testPlan: TestPlan): Promise<TestPlan> => {
    const response = await api.put(`/test-plans/${id}`, testPlan);
    return response.data;
  },

  // Test planı sil
  deleteTestPlan: async (id: string): Promise<void> => {
    await api.delete(`/test-plans/${id}`);
  },

  // Test planını çalıştır
  runTestPlan: async (testPlan: TestPlan): Promise<{ testId: string }> => {
    const response = await api.post('/test/run', testPlan);
    return response.data;
  }
};

export default testPlanService;
