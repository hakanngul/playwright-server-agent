import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import testPlanService, { TestPlan } from '../services/testPlanService';

interface TestPlanContextType {
  testPlans: TestPlan[];
  currentTestPlan: TestPlan | null;
  loading: boolean;
  error: string | null;
  fetchTestPlans: () => Promise<void>;
  fetchTestPlan: (id: string) => Promise<void>;
  createTestPlan: (testPlan: TestPlan) => Promise<void>;
  updateTestPlan: (id: string, testPlan: TestPlan) => Promise<void>;
  deleteTestPlan: (id: string) => Promise<void>;
  runTestPlan: (testPlan: TestPlan) => Promise<{ testId: string }>;
  clearCurrentTestPlan: () => void;
}

const TestPlanContext = createContext<TestPlanContextType | undefined>(undefined);

export const useTestPlan = () => {
  const context = useContext(TestPlanContext);
  if (context === undefined) {
    throw new Error('useTestPlan must be used within a TestPlanProvider');
  }
  return context;
};

interface TestPlanProviderProps {
  children: ReactNode;
}

export const TestPlanProvider: React.FC<TestPlanProviderProps> = ({ children }) => {
  const [testPlans, setTestPlans] = useState<TestPlan[]>([]);
  const [currentTestPlan, setCurrentTestPlan] = useState<TestPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTestPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await testPlanService.getTestPlans();
      setTestPlans(data);
    } catch (err) {
      setError('Test planları yüklenirken bir hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestPlan = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await testPlanService.getTestPlan(id);
      setCurrentTestPlan(data);
    } catch (err) {
      setError('Test planı yüklenirken bir hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createTestPlan = async (testPlan: TestPlan) => {
    setLoading(true);
    setError(null);
    try {
      await testPlanService.createTestPlan(testPlan);
      await fetchTestPlans();
    } catch (err) {
      setError('Test planı oluşturulurken bir hata oluştu.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTestPlan = async (id: string, testPlan: TestPlan) => {
    setLoading(true);
    setError(null);
    try {
      await testPlanService.updateTestPlan(id, testPlan);
      await fetchTestPlans();
      if (currentTestPlan && currentTestPlan.id === id) {
        setCurrentTestPlan(testPlan);
      }
    } catch (err) {
      setError('Test planı güncellenirken bir hata oluştu.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTestPlan = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await testPlanService.deleteTestPlan(id);
      await fetchTestPlans();
      if (currentTestPlan && currentTestPlan.id === id) {
        setCurrentTestPlan(null);
      }
    } catch (err) {
      setError('Test planı silinirken bir hata oluştu.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const runTestPlan = async (testPlan: TestPlan) => {
    setLoading(true);
    setError(null);
    try {
      const result = await testPlanService.runTestPlan(testPlan);
      return result;
    } catch (err) {
      setError('Test planı çalıştırılırken bir hata oluştu.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCurrentTestPlan = () => {
    setCurrentTestPlan(null);
  };

  useEffect(() => {
    fetchTestPlans();
  }, []);

  const value = {
    testPlans,
    currentTestPlan,
    loading,
    error,
    fetchTestPlans,
    fetchTestPlan,
    createTestPlan,
    updateTestPlan,
    deleteTestPlan,
    runTestPlan,
    clearCurrentTestPlan
  };

  return <TestPlanContext.Provider value={value}>{children}</TestPlanContext.Provider>;
};

export default TestPlanContext;
