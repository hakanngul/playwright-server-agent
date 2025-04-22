/**
 * Hata takip ve yapılandırma işlemlerini yöneten servis
 */

import db from './db.js';

const bugAndConfigService = {
  /**
   * Yeni bir hata kaydı oluşturur
   * @param {Object} bug - Hata bilgileri
   * @returns {Object} Oluşturulan hata kaydı
   */
  createBug(bug) {
    const stmt = db.prepare(`
      INSERT INTO bugs (
        test_result_id, title, description, severity, status,
        reported_by, assigned_to, screenshot_path, video_path, external_bug_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      bug.test_result_id || null,
      bug.title,
      bug.description || null,
      bug.severity || 'MEDIUM',
      bug.status || 'NEW',
      bug.reported_by || null,
      bug.assigned_to || null,
      bug.screenshot_path || null,
      bug.video_path || null,
      bug.external_bug_id || null
    );
    
    return {
      id: info.lastInsertRowid,
      ...bug
    };
  },
  
  /**
   * Tüm hata kayıtlarını getirir
   * @param {Object} options - Filtreleme seçenekleri
   * @returns {Array} Hata kayıtları listesi
   */
  getAllBugs(options = {}) {
    const { status, severity, test_result_id } = options;
    
    let query = `
      SELECT b.*, tr.status as test_result_status
      FROM bugs b
      LEFT JOIN test_results_extended tr ON b.test_result_id = tr.id
    `;
    
    const params = [];
    
    // Filtreleme koşulları
    const conditions = [];
    
    if (status) {
      conditions.push('b.status = ?');
      params.push(status);
    }
    
    if (severity) {
      conditions.push('b.severity = ?');
      params.push(severity);
    }
    
    if (test_result_id) {
      conditions.push('b.test_result_id = ?');
      params.push(test_result_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Sıralama
    query += ' ORDER BY b.created_at DESC';
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  },
  
  /**
   * Belirli bir hata kaydını ID'ye göre getirir
   * @param {number} id - Hata kaydı ID'si
   * @returns {Object|null} Hata kaydı veya null
   */
  getBugById(id) {
    const stmt = db.prepare(`
      SELECT b.*, tr.status as test_result_status
      FROM bugs b
      LEFT JOIN test_results_extended tr ON b.test_result_id = tr.id
      WHERE b.id = ?
    `);
    
    return stmt.get(id);
  },
  
  /**
   * Hata kaydını günceller
   * @param {number} id - Hata kaydı ID'si
   * @param {Object} bug - Güncellenecek alanlar
   * @returns {boolean} Başarılı olup olmadığı
   */
  updateBug(id, bug) {
    const updateFields = [];
    const params = [];
    
    // Güncellenecek alanları belirle
    if (bug.title !== undefined) {
      updateFields.push('title = ?');
      params.push(bug.title);
    }
    
    if (bug.description !== undefined) {
      updateFields.push('description = ?');
      params.push(bug.description);
    }
    
    if (bug.severity !== undefined) {
      updateFields.push('severity = ?');
      params.push(bug.severity);
    }
    
    if (bug.status !== undefined) {
      updateFields.push('status = ?');
      params.push(bug.status);
    }
    
    if (bug.assigned_to !== undefined) {
      updateFields.push('assigned_to = ?');
      params.push(bug.assigned_to);
    }
    
    if (bug.external_bug_id !== undefined) {
      updateFields.push('external_bug_id = ?');
      params.push(bug.external_bug_id);
    }
    
    // Güncelleme zamanını ekle
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Hiçbir alan güncellenmeyecekse hata döndür
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    const query = `UPDATE bugs SET ${updateFields.join(', ')} WHERE id = ?`;
    params.push(id);
    
    const stmt = db.prepare(query);
    const info = stmt.run(...params);
    
    return info.changes > 0;
  },
  
  /**
   * Hata kaydını siler
   * @param {number} id - Hata kaydı ID'si
   * @returns {boolean} Başarılı olup olmadığı
   */
  deleteBug(id) {
    const stmt = db.prepare('DELETE FROM bugs WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  },
  
  /**
   * Yeni bir test verisi oluşturur
   * @param {Object} testData - Test verisi bilgileri
   * @returns {Object} Oluşturulan test verisi
   */
  createTestData(testData) {
    const stmt = db.prepare(`
      INSERT INTO test_data (name, description, data_type, value, is_sensitive)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      testData.name,
      testData.description || null,
      testData.data_type,
      JSON.stringify(testData.value),
      testData.is_sensitive ? 1 : 0
    );
    
    return {
      id: info.lastInsertRowid,
      ...testData
    };
  },
  
  /**
   * Tüm test verilerini getirir
   * @param {Object} options - Filtreleme seçenekleri
   * @returns {Array} Test verileri listesi
   */
  getAllTestData(options = {}) {
    const { data_type, is_sensitive } = options;
    
    let query = 'SELECT * FROM test_data';
    const params = [];
    
    // Filtreleme koşulları
    const conditions = [];
    
    if (data_type) {
      conditions.push('data_type = ?');
      params.push(data_type);
    }
    
    if (is_sensitive !== undefined) {
      conditions.push('is_sensitive = ?');
      params.push(is_sensitive ? 1 : 0);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Sıralama
    query += ' ORDER BY name';
    
    const stmt = db.prepare(query);
    const testDataList = stmt.all(...params);
    
    // JSON değerlerini dönüştür
    return testDataList.map(testData => {
      try {
        testData.value = JSON.parse(testData.value);
      } catch (error) {
        console.warn('Failed to parse value JSON:', error);
      }
      
      // Boolean alanları dönüştür
      testData.is_sensitive = !!testData.is_sensitive;
      
      return testData;
    });
  },
  
  /**
   * Belirli bir test verisini ID'ye göre getirir
   * @param {number} id - Test verisi ID'si
   * @returns {Object|null} Test verisi veya null
   */
  getTestDataById(id) {
    const stmt = db.prepare('SELECT * FROM test_data WHERE id = ?');
    const testData = stmt.get(id);
    
    if (!testData) return null;
    
    // JSON değerini dönüştür
    try {
      testData.value = JSON.parse(testData.value);
    } catch (error) {
      console.warn('Failed to parse value JSON:', error);
    }
    
    // Boolean alanları dönüştür
    testData.is_sensitive = !!testData.is_sensitive;
    
    return testData;
  },
  
  /**
   * Test verisini günceller
   * @param {number} id - Test verisi ID'si
   * @param {Object} testData - Güncellenecek alanlar
   * @returns {boolean} Başarılı olup olmadığı
   */
  updateTestData(id, testData) {
    const updateFields = [];
    const params = [];
    
    // Güncellenecek alanları belirle
    if (testData.name !== undefined) {
      updateFields.push('name = ?');
      params.push(testData.name);
    }
    
    if (testData.description !== undefined) {
      updateFields.push('description = ?');
      params.push(testData.description);
    }
    
    if (testData.data_type !== undefined) {
      updateFields.push('data_type = ?');
      params.push(testData.data_type);
    }
    
    if (testData.value !== undefined) {
      updateFields.push('value = ?');
      params.push(JSON.stringify(testData.value));
    }
    
    if (testData.is_sensitive !== undefined) {
      updateFields.push('is_sensitive = ?');
      params.push(testData.is_sensitive ? 1 : 0);
    }
    
    // Güncelleme zamanını ekle
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Hiçbir alan güncellenmeyecekse hata döndür
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    const query = `UPDATE test_data SET ${updateFields.join(', ')} WHERE id = ?`;
    params.push(id);
    
    const stmt = db.prepare(query);
    const info = stmt.run(...params);
    
    return info.changes > 0;
  },
  
  /**
   * Test verisini siler
   * @param {number} id - Test verisi ID'si
   * @returns {boolean} Başarılı olup olmadığı
   */
  deleteTestData(id) {
    const stmt = db.prepare('DELETE FROM test_data WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  },
  
  /**
   * Yeni bir yapılandırma oluşturur
   * @param {Object} config - Yapılandırma bilgileri
   * @returns {Object} Oluşturulan yapılandırma
   */
  createConfiguration(config) {
    const stmt = db.prepare(`
      INSERT INTO configurations (name, value, description, environment)
      VALUES (?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      config.name,
      config.value,
      config.description || null,
      config.environment || 'DEV'
    );
    
    return {
      id: info.lastInsertRowid,
      ...config
    };
  },
  
  /**
   * Tüm yapılandırmaları getirir
   * @param {Object} options - Filtreleme seçenekleri
   * @returns {Array} Yapılandırmalar listesi
   */
  getAllConfigurations(options = {}) {
    const { environment } = options;
    
    let query = 'SELECT * FROM configurations';
    const params = [];
    
    // Filtreleme koşulları
    if (environment) {
      query += ' WHERE environment = ?';
      params.push(environment);
    }
    
    // Sıralama
    query += ' ORDER BY name';
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  },
  
  /**
   * Belirli bir yapılandırmayı ID'ye göre getirir
   * @param {number} id - Yapılandırma ID'si
   * @returns {Object|null} Yapılandırma veya null
   */
  getConfigurationById(id) {
    const stmt = db.prepare('SELECT * FROM configurations WHERE id = ?');
    return stmt.get(id);
  },
  
  /**
   * Belirli bir yapılandırmayı adına göre getirir
   * @param {string} name - Yapılandırma adı
   * @param {string} environment - Ortam (opsiyonel)
   * @returns {Object|null} Yapılandırma veya null
   */
  getConfigurationByName(name, environment = 'DEV') {
    const stmt = db.prepare('SELECT * FROM configurations WHERE name = ? AND environment = ?');
    return stmt.get(name, environment);
  },
  
  /**
   * Yapılandırmayı günceller
   * @param {number} id - Yapılandırma ID'si
   * @param {Object} config - Güncellenecek alanlar
   * @returns {boolean} Başarılı olup olmadığı
   */
  updateConfiguration(id, config) {
    const updateFields = [];
    const params = [];
    
    // Güncellenecek alanları belirle
    if (config.name !== undefined) {
      updateFields.push('name = ?');
      params.push(config.name);
    }
    
    if (config.value !== undefined) {
      updateFields.push('value = ?');
      params.push(config.value);
    }
    
    if (config.description !== undefined) {
      updateFields.push('description = ?');
      params.push(config.description);
    }
    
    if (config.environment !== undefined) {
      updateFields.push('environment = ?');
      params.push(config.environment);
    }
    
    // Güncelleme zamanını ekle
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Hiçbir alan güncellenmeyecekse hata döndür
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    const query = `UPDATE configurations SET ${updateFields.join(', ')} WHERE id = ?`;
    params.push(id);
    
    const stmt = db.prepare(query);
    const info = stmt.run(...params);
    
    return info.changes > 0;
  },
  
  /**
   * Yapılandırmayı siler
   * @param {number} id - Yapılandırma ID'si
   * @returns {boolean} Başarılı olup olmadığı
   */
  deleteConfiguration(id) {
    const stmt = db.prepare('DELETE FROM configurations WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }
};

export default bugAndConfigService;
