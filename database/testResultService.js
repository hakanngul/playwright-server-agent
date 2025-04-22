/**
 * Test sonuçlarını yöneten servis
 */

import db from './db.js';

const testResultService = {
  /**
   * Yeni bir test sonucu oluşturur
   * @param {Object} testResult - Test sonuç bilgileri
   * @returns {Object} Oluşturulan test sonucu
   */
  createTestResult(testResult) {
    // İşlemi bir transaction içinde gerçekleştir
    const savedResult = db.transaction(() => {
      // Test sonucunu ekle
      const resultStmt = db.prepare(`
        INSERT INTO test_results_extended (
          test_run_id, test_suite_id, test_case_id, status, start_time, end_time,
          duration_ms, error_message, error_stack, screenshot_path, video_path,
          trace_path, retry_count, custom_data
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const resultInfo = resultStmt.run(
        testResult.test_run_id,
        testResult.test_suite_id || null,
        testResult.test_case_id || null,
        testResult.status || 'PASSED',
        testResult.start_time || new Date().toISOString(),
        testResult.end_time || null,
        testResult.duration_ms || null,
        testResult.error_message || null,
        testResult.error_stack || null,
        testResult.screenshot_path || null,
        testResult.video_path || null,
        testResult.trace_path || null,
        testResult.retry_count || 0,
        testResult.custom_data ? JSON.stringify(testResult.custom_data) : null
      );
      
      const resultId = resultInfo.lastInsertRowid;
      
      // Test adımlarını ekle (varsa)
      if (testResult.steps && Array.isArray(testResult.steps) && testResult.steps.length > 0) {
        const stepStmt = db.prepare(`
          INSERT INTO test_steps_extended (
            test_result_id, test_case_id, order_number, description, status,
            start_time, end_time, duration_ms, screenshot_path, error_message,
            expected_result, actual_result, action_type, action_target, action_value
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        testResult.steps.forEach((step, index) => {
          stepStmt.run(
            resultId,
            step.test_case_id || null,
            step.order_number || index + 1,
            step.description || null,
            step.status || 'PASSED',
            step.start_time || testResult.start_time,
            step.end_time || null,
            step.duration_ms || null,
            step.screenshot_path || null,
            step.error_message || null,
            step.expected_result || null,
            step.actual_result || null,
            step.action_type || null,
            step.action_target || null,
            step.action_value || null
          );
        });
      }
      
      return {
        id: resultId,
        ...testResult
      };
    })();
    
    return savedResult;
  },
  
  /**
   * Tüm test sonuçlarını getirir
   * @param {Object} options - Filtreleme ve sıralama seçenekleri
   * @returns {Array} Test sonuçları listesi
   */
  getAllTestResults(options = {}) {
    const { limit = 100, offset = 0, test_run_id, status } = options;
    
    let query = `
      SELECT r.*, 
        ts.name as test_suite_name,
        tc.name as test_case_name
      FROM test_results_extended r
      LEFT JOIN test_suites ts ON r.test_suite_id = ts.id
      LEFT JOIN test_cases tc ON r.test_case_id = tc.id
    `;
    
    const params = [];
    
    // Filtreleme koşulları
    const conditions = [];
    
    if (test_run_id) {
      conditions.push('r.test_run_id = ?');
      params.push(test_run_id);
    }
    
    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Sıralama ve limit
    query += ' ORDER BY r.start_time DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  },
  
  /**
   * Belirli bir test sonucunu ID'ye göre getirir
   * @param {number} id - Test sonuç ID'si
   * @returns {Object|null} Test sonucu veya null
   */
  getTestResultById(id) {
    // Test sonucunu al
    const resultStmt = db.prepare(`
      SELECT r.*, 
        ts.name as test_suite_name,
        tc.name as test_case_name
      FROM test_results_extended r
      LEFT JOIN test_suites ts ON r.test_suite_id = ts.id
      LEFT JOIN test_cases tc ON r.test_case_id = tc.id
      WHERE r.id = ?
    `);
    
    const result = resultStmt.get(id);
    
    if (!result) return null;
    
    // Test adımlarını al
    const stepsStmt = db.prepare(`
      SELECT * FROM test_steps_extended
      WHERE test_result_id = ?
      ORDER BY order_number
    `);
    
    const steps = stepsStmt.all(id);
    
    // Özel verileri JSON'a dönüştür
    if (result.custom_data) {
      try {
        result.custom_data = JSON.parse(result.custom_data);
      } catch (error) {
        console.warn('Failed to parse custom_data JSON:', error);
      }
    }
    
    return {
      ...result,
      steps
    };
  },
  
  /**
   * Test sonucunu günceller
   * @param {number} id - Test sonuç ID'si
   * @param {Object} testResult - Güncellenecek alanlar
   * @returns {boolean} Başarılı olup olmadığı
   */
  updateTestResult(id, testResult) {
    const updateFields = [];
    const params = [];
    
    // Güncellenecek alanları belirle
    if (testResult.status !== undefined) {
      updateFields.push('status = ?');
      params.push(testResult.status);
    }
    
    if (testResult.end_time !== undefined) {
      updateFields.push('end_time = ?');
      params.push(testResult.end_time);
    }
    
    if (testResult.duration_ms !== undefined) {
      updateFields.push('duration_ms = ?');
      params.push(testResult.duration_ms);
    }
    
    if (testResult.error_message !== undefined) {
      updateFields.push('error_message = ?');
      params.push(testResult.error_message);
    }
    
    if (testResult.error_stack !== undefined) {
      updateFields.push('error_stack = ?');
      params.push(testResult.error_stack);
    }
    
    if (testResult.screenshot_path !== undefined) {
      updateFields.push('screenshot_path = ?');
      params.push(testResult.screenshot_path);
    }
    
    if (testResult.video_path !== undefined) {
      updateFields.push('video_path = ?');
      params.push(testResult.video_path);
    }
    
    if (testResult.trace_path !== undefined) {
      updateFields.push('trace_path = ?');
      params.push(testResult.trace_path);
    }
    
    if (testResult.retry_count !== undefined) {
      updateFields.push('retry_count = ?');
      params.push(testResult.retry_count);
    }
    
    if (testResult.custom_data !== undefined) {
      updateFields.push('custom_data = ?');
      params.push(JSON.stringify(testResult.custom_data));
    }
    
    // Güncelleme zamanını ekle
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Hiçbir alan güncellenmeyecekse hata döndür
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    const query = `UPDATE test_results_extended SET ${updateFields.join(', ')} WHERE id = ?`;
    params.push(id);
    
    const stmt = db.prepare(query);
    const info = stmt.run(...params);
    
    return info.changes > 0;
  },
  
  /**
   * Test sonucunu siler
   * @param {number} id - Test sonuç ID'si
   * @returns {boolean} Başarılı olup olmadığı
   */
  deleteTestResult(id) {
    const stmt = db.prepare('DELETE FROM test_results_extended WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  },
  
  /**
   * Belirli bir test çalıştırmasına ait tüm test sonuçlarını getirir
   * @param {number} testRunId - Test çalıştırma ID'si
   * @returns {Array} Test sonuçları listesi
   */
  getTestResultsByRunId(testRunId) {
    const stmt = db.prepare(`
      SELECT r.*, 
        ts.name as test_suite_name,
        tc.name as test_case_name
      FROM test_results_extended r
      LEFT JOIN test_suites ts ON r.test_suite_id = ts.id
      LEFT JOIN test_cases tc ON r.test_case_id = tc.id
      WHERE r.test_run_id = ?
      ORDER BY r.start_time
    `);
    
    return stmt.all(testRunId);
  }
};

export default testResultService;
