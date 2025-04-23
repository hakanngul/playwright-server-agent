import api from './api';

export interface ServerConfig {
  port: number;
  allowedOrigins: string[];
}

export interface TestConfig {
  parallelTests: number;
  defaultBrowser: string;
  defaultHeadless: boolean;
  browsers: {
    chromium: boolean;
    firefox: boolean;
    edge: boolean;
  };
}

export interface PathsConfig {
  screenshotsDir: string;
  reportsDir: string;
  testPlansDir: string;
}

export interface PerformanceConfig {
  collectMetrics: boolean;
  webVitals: boolean;
  networkMetrics: boolean;
  thresholds: {
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
  };
}

export interface Config {
  server: ServerConfig;
  test: TestConfig;
  paths: PathsConfig;
  performance: PerformanceConfig;
}

const configService = {
  // Mevcut konfigürasyonu getir
  getConfig: async (): Promise<Config> => {
    const response = await api.get('/config');
    return response.data;
  },

  // Konfigürasyonu güncelle
  updateConfig: async (config: Partial<Config>): Promise<Config> => {
    const response = await api.put('/config', config);
    return response.data;
  },

  // Sunucu durumunu getir
  getStatus: async (): Promise<{ status: string; uptime: number; activeBrowsers: number }> => {
    const response = await api.get('/status');
    return response.data;
  }
};

export default configService;
