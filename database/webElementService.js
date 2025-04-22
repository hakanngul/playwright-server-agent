/**
 * Web element ve sayfa işlemlerini yöneten servis
 */

import db from './db.js';

const webElementService = {
  /**
   * Yeni bir sayfa oluşturur
   * @param {Object} page - Sayfa bilgileri
   * @returns {Object} Oluşturulan sayfa
   */
  createPage(page) {
    const stmt = db.prepare(`
      INSERT INTO pages (name, url, description)
      VALUES (?, ?, ?)
    `);
    
    const info = stmt.run(
      page.name,
      page.url || null,
      page.description || null
    );
    
    return {
      id: info.lastInsertRowid,
      ...page
    };
  },
  
  /**
   * Tüm sayfaları getirir
   * @returns {Array} Sayfalar listesi
   */
  getAllPages() {
    const stmt = db.prepare('SELECT * FROM pages ORDER BY name');
    return stmt.all();
  },
  
  /**
   * Belirli bir sayfayı ID'ye göre getirir
   * @param {number} id - Sayfa ID'si
   * @returns {Object|null} Sayfa veya null
   */
  getPageById(id) {
    const stmt = db.prepare('SELECT * FROM pages WHERE id = ?');
    return stmt.get(id);
  },
  
  /**
   * Sayfayı günceller
   * @param {number} id - Sayfa ID'si
   * @param {Object} page - Güncellenecek alanlar
   * @returns {boolean} Başarılı olup olmadığı
   */
  updatePage(id, page) {
    const stmt = db.prepare(`
      UPDATE pages
      SET name = ?, url = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const info = stmt.run(
      page.name,
      page.url || null,
      page.description || null,
      id
    );
    
    return info.changes > 0;
  },
  
  /**
   * Sayfayı siler
   * @param {number} id - Sayfa ID'si
   * @returns {boolean} Başarılı olup olmadığı
   */
  deletePage(id) {
    const stmt = db.prepare('DELETE FROM pages WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  },
  
  /**
   * Yeni bir web element oluşturur
   * @param {Object} element - Web element bilgileri
   * @returns {Object} Oluşturulan web element
   */
  createElement(element) {
    const stmt = db.prepare(`
      INSERT INTO web_elements (
        name, description, page_id, locator_type, locator_value,
        parent_element_id, attributes, screenshot_path, is_visible,
        is_enabled, is_required, validation_rules
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      element.name,
      element.description || null,
      element.page_id || null,
      element.locator_type,
      element.locator_value,
      element.parent_element_id || null,
      element.attributes ? JSON.stringify(element.attributes) : null,
      element.screenshot_path || null,
      element.is_visible === false ? 0 : 1,
      element.is_enabled === false ? 0 : 1,
      element.is_required === true ? 1 : 0,
      element.validation_rules ? JSON.stringify(element.validation_rules) : null
    );
    
    return {
      id: info.lastInsertRowid,
      ...element
    };
  },
  
  /**
   * Tüm web elementleri getirir
   * @param {Object} options - Filtreleme seçenekleri
   * @returns {Array} Web elementleri listesi
   */
  getAllElements(options = {}) {
    const { page_id, locator_type, parent_element_id } = options;
    
    let query = `
      SELECT e.*, p.name as page_name
      FROM web_elements e
      LEFT JOIN pages p ON e.page_id = p.id
    `;
    
    const params = [];
    
    // Filtreleme koşulları
    const conditions = [];
    
    if (page_id) {
      conditions.push('e.page_id = ?');
      params.push(page_id);
    }
    
    if (locator_type) {
      conditions.push('e.locator_type = ?');
      params.push(locator_type);
    }
    
    if (parent_element_id !== undefined) {
      if (parent_element_id === null) {
        conditions.push('e.parent_element_id IS NULL');
      } else {
        conditions.push('e.parent_element_id = ?');
        params.push(parent_element_id);
      }
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Sıralama
    query += ' ORDER BY e.name';
    
    const stmt = db.prepare(query);
    const elements = stmt.all(...params);
    
    // JSON alanlarını dönüştür
    return elements.map(element => {
      if (element.attributes) {
        try {
          element.attributes = JSON.parse(element.attributes);
        } catch (error) {
          console.warn('Failed to parse attributes JSON:', error);
        }
      }
      
      if (element.validation_rules) {
        try {
          element.validation_rules = JSON.parse(element.validation_rules);
        } catch (error) {
          console.warn('Failed to parse validation_rules JSON:', error);
        }
      }
      
      // Boolean alanları dönüştür
      element.is_visible = !!element.is_visible;
      element.is_enabled = !!element.is_enabled;
      element.is_required = !!element.is_required;
      
      return element;
    });
  },
  
  /**
   * Belirli bir web elementi ID'ye göre getirir
   * @param {number} id - Web element ID'si
   * @returns {Object|null} Web element veya null
   */
  getElementById(id) {
    const stmt = db.prepare(`
      SELECT e.*, p.name as page_name
      FROM web_elements e
      LEFT JOIN pages p ON e.page_id = p.id
      WHERE e.id = ?
    `);
    
    const element = stmt.get(id);
    
    if (!element) return null;
    
    // JSON alanlarını dönüştür
    if (element.attributes) {
      try {
        element.attributes = JSON.parse(element.attributes);
      } catch (error) {
        console.warn('Failed to parse attributes JSON:', error);
      }
    }
    
    if (element.validation_rules) {
      try {
        element.validation_rules = JSON.parse(element.validation_rules);
      } catch (error) {
        console.warn('Failed to parse validation_rules JSON:', error);
      }
    }
    
    // Boolean alanları dönüştür
    element.is_visible = !!element.is_visible;
    element.is_enabled = !!element.is_enabled;
    element.is_required = !!element.is_required;
    
    return element;
  },
  
  /**
   * Web elementi günceller
   * @param {number} id - Web element ID'si
   * @param {Object} element - Güncellenecek alanlar
   * @returns {boolean} Başarılı olup olmadığı
   */
  updateElement(id, element) {
    const updateFields = [];
    const params = [];
    
    // Güncellenecek alanları belirle
    if (element.name !== undefined) {
      updateFields.push('name = ?');
      params.push(element.name);
    }
    
    if (element.description !== undefined) {
      updateFields.push('description = ?');
      params.push(element.description);
    }
    
    if (element.page_id !== undefined) {
      updateFields.push('page_id = ?');
      params.push(element.page_id);
    }
    
    if (element.locator_type !== undefined) {
      updateFields.push('locator_type = ?');
      params.push(element.locator_type);
    }
    
    if (element.locator_value !== undefined) {
      updateFields.push('locator_value = ?');
      params.push(element.locator_value);
    }
    
    if (element.parent_element_id !== undefined) {
      updateFields.push('parent_element_id = ?');
      params.push(element.parent_element_id);
    }
    
    if (element.attributes !== undefined) {
      updateFields.push('attributes = ?');
      params.push(JSON.stringify(element.attributes));
    }
    
    if (element.screenshot_path !== undefined) {
      updateFields.push('screenshot_path = ?');
      params.push(element.screenshot_path);
    }
    
    if (element.is_visible !== undefined) {
      updateFields.push('is_visible = ?');
      params.push(element.is_visible ? 1 : 0);
    }
    
    if (element.is_enabled !== undefined) {
      updateFields.push('is_enabled = ?');
      params.push(element.is_enabled ? 1 : 0);
    }
    
    if (element.is_required !== undefined) {
      updateFields.push('is_required = ?');
      params.push(element.is_required ? 1 : 0);
    }
    
    if (element.validation_rules !== undefined) {
      updateFields.push('validation_rules = ?');
      params.push(JSON.stringify(element.validation_rules));
    }
    
    // Güncelleme zamanını ekle
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Hiçbir alan güncellenmeyecekse hata döndür
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    const query = `UPDATE web_elements SET ${updateFields.join(', ')} WHERE id = ?`;
    params.push(id);
    
    const stmt = db.prepare(query);
    const info = stmt.run(...params);
    
    return info.changes > 0;
  },
  
  /**
   * Web elementi siler
   * @param {number} id - Web element ID'si
   * @returns {boolean} Başarılı olup olmadığı
   */
  deleteElement(id) {
    const stmt = db.prepare('DELETE FROM web_elements WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  },
  
  /**
   * Belirli bir sayfaya ait tüm web elementleri getirir
   * @param {number} pageId - Sayfa ID'si
   * @returns {Array} Web elementleri listesi
   */
  getElementsByPageId(pageId) {
    return this.getAllElements({ page_id: pageId });
  },
  
  /**
   * Belirli bir üst elemente ait tüm alt elementleri getirir
   * @param {number} parentElementId - Üst element ID'si
   * @returns {Array} Web elementleri listesi
   */
  getChildElements(parentElementId) {
    return this.getAllElements({ parent_element_id: parentElementId });
  },
  
  /**
   * Kök elementleri getirir (üst elementi olmayan elementler)
   * @param {number} pageId - Sayfa ID'si (opsiyonel)
   * @returns {Array} Web elementleri listesi
   */
  getRootElements(pageId) {
    const options = { parent_element_id: null };
    
    if (pageId) {
      options.page_id = pageId;
    }
    
    return this.getAllElements(options);
  }
};

export default webElementService;
