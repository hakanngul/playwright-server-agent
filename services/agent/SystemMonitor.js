/**
 * System Monitor
 * Monitors system resources and provides metrics
 */

import os from 'os';
import EventEmitter from 'events';

export class SystemMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      checkInterval: options.checkInterval || 5000, // 5 saniye
      cpuThresholdHigh: options.cpuThresholdHigh || 80, // %80
      cpuThresholdLow: options.cpuThresholdLow || 20,  // %20
      memoryThresholdHigh: options.memoryThresholdHigh || 80, // %80
      memoryThresholdLow: options.memoryThresholdLow || 20,  // %20
      ...options
    };
    
    this.metrics = {
      cpu: 0,
      memory: 0,
      lastCheck: null
    };
    
    this._startMonitoring();
  }
  
  _startMonitoring() {
    this._checkResources();
    
    setInterval(() => {
      this._checkResources();
    }, this.options.checkInterval);
  }
  
  async _checkResources() {
    try {
      // CPU kullanımını hesapla
      const cpuUsage = await this._getCpuUsage();
      
      // Bellek kullanımını hesapla
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
      
      // Metrikleri güncelle
      this.metrics = {
        cpu: cpuUsage,
        memory: memoryUsage,
        lastCheck: new Date()
      };
      
      // Olayları tetikle
      if (cpuUsage > this.options.cpuThresholdHigh || memoryUsage > this.options.memoryThresholdHigh) {
        this.emit('resources:high', this.metrics);
      } else if (cpuUsage < this.options.cpuThresholdLow && memoryUsage < this.options.memoryThresholdLow) {
        this.emit('resources:low', this.metrics);
      }
      
      this.emit('metrics:updated', this.metrics);
    } catch (error) {
      console.error('Error checking system resources:', error);
    }
  }
  
  async _getCpuUsage() {
    return new Promise((resolve) => {
      const startMeasure = this._getCpuInfo();
      
      // 100ms sonra tekrar ölç
      setTimeout(() => {
        const endMeasure = this._getCpuInfo();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        const cpuUsage = 100 - (100 * idleDifference / totalDifference);
        resolve(cpuUsage);
      }, 100);
    });
  }
  
  _getCpuInfo() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        total += cpu.times[type];
      }
      idle += cpu.times.idle;
    }
    
    return { idle, total };
  }
  
  getMetrics() {
    return { ...this.metrics };
  }
}

export default SystemMonitor;
