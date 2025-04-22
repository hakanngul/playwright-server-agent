/**
 * Test çalıştırma işlemlerini yöneten servis
 */

import db from './db.js';

const testRunService = {
  /**
   * Yeni bir test çalıştırması oluşturur
   * @param {Object} testRun - Test çalıştırma bilgileri
   * @returns {Object} Oluşturulan test çalıştırması
   */
  createTestRun(testRun) {
    const stmt = db.prepare(`
      INSERT INTO test_runs (
        name, description, status, start_time, end_time, duration_ms,
        browser, browser_version, operating_system, viewport_size,
        environment, build_number, created_by, tags
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      testRun.name,
      testRun.description || null,
      testRun.status || 'IN_PROGRESS',
      testRun.start_time || new Date().toISOString(),
      testRun.end_time || null,
      testRun.duration_ms || null,
      testRun.browser || 'chromium',
      testRun.browser_version || null,
      testRun.operating_system || null,
      testRun.viewport_size || null,
      testRun.environment || null,
      testRun.build_number || null,
      testRun.created_by || null,
      testRun.tags ? JSON.stringify(testRun.tags) : null
    );
    
    return {
      id: info.lastInsertRowid,
      ...testRun
    };
  },
  
  /**
   * Tüm test çalıştırmalarını getirir
   * @param {Object} options - Filtreleme ve sıralama seçenekleri
   * @returns {Array} Test çalıştırmaları listesi
   */
  getAllTestRuns(options = {}) {
    const { limit = 100, offset = 0, status, browser, environment } = options;
    
    let query = 'SELECT * FROM test_runs';
    const params = [];
    
    // Filtreleme koşulları
    const conditions = [];
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (browser) {
      conditions.push('browser = ?');
      params.push(browser);
    }
    
    if (environment) {
      conditions.push('environment = ?');
      params.push(environment);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Sıralama ve limit
    query += ' ORDER BY start_time DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  },
  
  /**
   * Belirli bir test çalıştırmasını ID'ye göre getirir
   * @param {number} id - Test çalıştırma ID'si
   * @returns {Object|null} Test çalıştırması veya null
   */
  getTestRunById(id) {
    const stmt = db.prepare('SELECT * FROM test_runs WHERE id = ?');
    return stmt.get(id);
  },
  
  /**
   * Test çalıştırmasını günceller
   * @param {number} id - Test çalıştırma ID'si
   * @param {Object} testRun - Güncellenecek alanlar
   * @returns {boolean} Başarılı olup olmadığı
   */
  updateTestRun(id, testRun) {
    const updateFields = [];
    const params = [];
    
    // Güncellenecek alanları belirle
    if (testRun.name !== undefined) {
      updateFields.push('name = ?');
      params.push(testRun.name);
    }
    
    if (testRun.description !== undefined) {
      updateFields.push('description = ?');
      params.push(testRun.description);
    }
    
    if (testRun.status !== undefined) {
      updateFields.push('status = ?');
      params.push(testRun.status);
    }
    
    if (testRun.end_time !== undefined) {
      updateFields.push('end_time = ?');
      params.push(testRun.end_time);
    }
    
    if (testRun.duration_ms !== undefined) {
      updateFields.push('duration_ms = ?');
      params.push(testRun.duration_ms);
    }
    
    if (testRun.tags !== undefined) {
      updateFields.push('tags = ?');
      params.push(JSON.stringify(testRun.tags));
    }
    
    // Güncelleme zamanını ekle
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Hiçbir alan güncellenmeyecekse hata döndür
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    const query = `UPDATE test_runs SET ${updateFields.join(', ')} WHERE id = ?`;
    params.push(id);
    
    const stmt = db.prepare(query);
    const info = stmt.run(...params);
    
    return info.changes > 0;
  },
  
  /**
   * Test çalıştırmasını tamamlar
   * @param {number} id - Test çalıştırma ID'si
   * @param {Object} result - Tamamlama bilgileri
   * @returns {boolean} Başarılı olup olmadığı
   */
  completeTestRun(id, result) {
    const endTime = result.end_time || new Date().toISOString();
    
    // Test başlangıç zamanını al
    const testRun = this.getTestRunById(id);
    if (!testRun) {
      throw new Error('Test run not found');
    }
    
    // Süreyi hesapla
    const startTime = new Date(testRun.start_time);
    const endTimeDate = new Date(endTime);
    const durationMs = endTimeDate.getTime() - startTime.getTime();
    
    const stmt = db.prepare(`
      UPDATE test_runs
      SET status = ?, end_time = ?, duration_ms = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const info = stmt.run(
      result.status || 'PASSED',
      endTime,
      durationMs,
      id
    );
    
    return info.changes > 0;
  },
  
  /**
   * Test çalıştırmasını siler
   * @param {number} id - Test çalıştırma ID'si
   * @returns {boolean} Başarılı olup olmadığı
   */
  deleteTestRun(id) {
    const stmt = db.prepare('DELETE FROM test_runs WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  },
  
  /**
   * Test çalıştırma istatistiklerini getirir
   * @returns {Object} İstatistikler
   */
  getTestRunStats() {
    const totalStmt = db.prepare('SELECT COUNT(*) as total FROM test_runs');
    const passedStmt = db.prepare("SELECT COUNT(*) as count FROM test_runs WHERE status = 'PASSED'");
    const failedStmt = db.prepare("SELECT COUNT(*) as count FROM test_runs WHERE status = 'FAILED'");
    const skippedStmt = db.prepare("SELECT COUNT(*) as count FROM test_runs WHERE status = 'SKIPPED'");
    const inProgressStmt = db.prepare("SELECT COUNT(*) as count FROM test_runs WHERE status = 'IN_PROGRESS'");
    const abortedStmt = db.prepare("SELECT COUNT(*) as count FROM test_runs WHERE status = 'ABORTED'");
    
    const total = totalStmt.get().total;
    const passed = passedStmt.get().count;
    const failed = failedStmt.get().count;
    const skipped = skippedStmt.get().count;
    const inProgress = inProgressStmt.get().count;
    const aborted = abortedStmt.get().count;
    
    return {
      total,
      passed,
      failed,
      skipped,
      inProgress,
      aborted,
      successRate: total > 0 ? (passed / total) * 100 : 0
    };
  }
};

export default testRunService;
