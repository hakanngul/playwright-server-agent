/**
 * Test suite ve test case işlemlerini yöneten servis
 */

import db from './db.js';

const testSuiteService = {
  /**
   * Yeni bir test suite oluşturur
   * @param {Object} testSuite - Test suite bilgileri
   * @returns {Object} Oluşturulan test suite
   */
  createTestSuite(testSuite) {
    const stmt = db.prepare(`
      INSERT INTO test_suites (name, description, tags)
      VALUES (?, ?, ?)
    `);
    
    const info = stmt.run(
      testSuite.name,
      testSuite.description || null,
      testSuite.tags ? JSON.stringify(testSuite.tags) : null
    );
    
    return {
      id: info.lastInsertRowid,
      ...testSuite
    };
  },
  
  /**
   * Tüm test suite'leri getirir
   * @returns {Array} Test suite'leri listesi
   */
  getAllTestSuites() {
    const stmt = db.prepare('SELECT * FROM test_suites ORDER BY name');
    return stmt.all();
  },
  
  /**
   * Belirli bir test suite'i ID'ye göre getirir
   * @param {number} id - Test suite ID'si
   * @returns {Object|null} Test suite veya null
   */
  getTestSuiteById(id) {
    const stmt = db.prepare('SELECT * FROM test_suites WHERE id = ?');
    const testSuite = stmt.get(id);
    
    if (!testSuite) return null;
    
    // Etiketleri JSON'a dönüştür
    if (testSuite.tags) {
      try {
        testSuite.tags = JSON.parse(testSuite.tags);
      } catch (error) {
        console.warn('Failed to parse tags JSON:', error);
      }
    }
    
    return testSuite;
  },
  
  /**
   * Test suite'i günceller
   * @param {number} id - Test suite ID'si
   * @param {Object} testSuite - Güncellenecek alanlar
   * @returns {boolean} Başarılı olup olmadığı
   */
  updateTestSuite(id, testSuite) {
    const stmt = db.prepare(`
      UPDATE test_suites
      SET name = ?, description = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const info = stmt.run(
      testSuite.name,
      testSuite.description || null,
      testSuite.tags ? JSON.stringify(testSuite.tags) : null,
      id
    );
    
    return info.changes > 0;
  },
  
  /**
   * Test suite'i siler
   * @param {number} id - Test suite ID'si
   * @returns {boolean} Başarılı olup olmadığı
   */
  deleteTestSuite(id) {
    const stmt = db.prepare('DELETE FROM test_suites WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  },
  
  /**
   * Yeni bir test case oluşturur
   * @param {Object} testCase - Test case bilgileri
   * @returns {Object} Oluşturulan test case
   */
  createTestCase(testCase) {
    const stmt = db.prepare(`
      INSERT INTO test_cases (
        test_suite_id, name, description, priority, automation_status,
        expected_result, prerequisites, author, tags
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      testCase.test_suite_id || null,
      testCase.name,
      testCase.description || null,
      testCase.priority || null,
      testCase.automation_status || 'MANUAL',
      testCase.expected_result || null,
      testCase.prerequisites || null,
      testCase.author || null,
      testCase.tags ? JSON.stringify(testCase.tags) : null
    );
    
    return {
      id: info.lastInsertRowid,
      ...testCase
    };
  },
  
  /**
   * Tüm test case'leri getirir
   * @param {Object} options - Filtreleme seçenekleri
   * @returns {Array} Test case'leri listesi
   */
  getAllTestCases(options = {}) {
    const { test_suite_id, priority, automation_status } = options;
    
    let query = `
      SELECT tc.*, ts.name as test_suite_name
      FROM test_cases tc
      LEFT JOIN test_suites ts ON tc.test_suite_id = ts.id
    `;
    
    const params = [];
    
    // Filtreleme koşulları
    const conditions = [];
    
    if (test_suite_id) {
      conditions.push('tc.test_suite_id = ?');
      params.push(test_suite_id);
    }
    
    if (priority) {
      conditions.push('tc.priority = ?');
      params.push(priority);
    }
    
    if (automation_status) {
      conditions.push('tc.automation_status = ?');
      params.push(automation_status);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Sıralama
    query += ' ORDER BY tc.name';
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  },
  
  /**
   * Belirli bir test case'i ID'ye göre getirir
   * @param {number} id - Test case ID'si
   * @returns {Object|null} Test case veya null
   */
  getTestCaseById(id) {
    const stmt = db.prepare(`
      SELECT tc.*, ts.name as test_suite_name
      FROM test_cases tc
      LEFT JOIN test_suites ts ON tc.test_suite_id = ts.id
      WHERE tc.id = ?
    `);
    
    const testCase = stmt.get(id);
    
    if (!testCase) return null;
    
    // Etiketleri JSON'a dönüştür
    if (testCase.tags) {
      try {
        testCase.tags = JSON.parse(testCase.tags);
      } catch (error) {
        console.warn('Failed to parse tags JSON:', error);
      }
    }
    
    return testCase;
  },
  
  /**
   * Test case'i günceller
   * @param {number} id - Test case ID'si
   * @param {Object} testCase - Güncellenecek alanlar
   * @returns {boolean} Başarılı olup olmadığı
   */
  updateTestCase(id, testCase) {
    const updateFields = [];
    const params = [];
    
    // Güncellenecek alanları belirle
    if (testCase.test_suite_id !== undefined) {
      updateFields.push('test_suite_id = ?');
      params.push(testCase.test_suite_id);
    }
    
    if (testCase.name !== undefined) {
      updateFields.push('name = ?');
      params.push(testCase.name);
    }
    
    if (testCase.description !== undefined) {
      updateFields.push('description = ?');
      params.push(testCase.description);
    }
    
    if (testCase.priority !== undefined) {
      updateFields.push('priority = ?');
      params.push(testCase.priority);
    }
    
    if (testCase.automation_status !== undefined) {
      updateFields.push('automation_status = ?');
      params.push(testCase.automation_status);
    }
    
    if (testCase.expected_result !== undefined) {
      updateFields.push('expected_result = ?');
      params.push(testCase.expected_result);
    }
    
    if (testCase.prerequisites !== undefined) {
      updateFields.push('prerequisites = ?');
      params.push(testCase.prerequisites);
    }
    
    if (testCase.author !== undefined) {
      updateFields.push('author = ?');
      params.push(testCase.author);
    }
    
    if (testCase.tags !== undefined) {
      updateFields.push('tags = ?');
      params.push(JSON.stringify(testCase.tags));
    }
    
    // Güncelleme zamanını ekle
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Hiçbir alan güncellenmeyecekse hata döndür
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    const query = `UPDATE test_cases SET ${updateFields.join(', ')} WHERE id = ?`;
    params.push(id);
    
    const stmt = db.prepare(query);
    const info = stmt.run(...params);
    
    return info.changes > 0;
  },
  
  /**
   * Test case'i siler
   * @param {number} id - Test case ID'si
   * @returns {boolean} Başarılı olup olmadığı
   */
  deleteTestCase(id) {
    const stmt = db.prepare('DELETE FROM test_cases WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  },
  
  /**
   * Belirli bir test suite'e ait tüm test case'leri getirir
   * @param {number} testSuiteId - Test suite ID'si
   * @returns {Array} Test case'leri listesi
   */
  getTestCasesByTestSuiteId(testSuiteId) {
    const stmt = db.prepare('SELECT * FROM test_cases WHERE test_suite_id = ? ORDER BY name');
    return stmt.all(testSuiteId);
  }
};

export default testSuiteService;
