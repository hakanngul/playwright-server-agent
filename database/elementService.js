import db from './db.js';

// Element CRUD operations
const elementService = {
  // Create a new element
  createElement(element) {
    const stmt = db.prepare(`
      INSERT INTO elements (name, selector, selector_type, description, page_name)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      element.name,
      element.selector,
      element.selector_type,
      element.description || null,
      element.page_name || 'Default Screen'
    );
    
    return {
      id: info.lastInsertRowid,
      ...element
    };
  },
  
  // Get all elements
  getAllElements() {
    const stmt = db.prepare('SELECT * FROM elements ORDER BY name');
    return stmt.all();
  },
  
  // Get element by ID
  getElementById(id) {
    const stmt = db.prepare('SELECT * FROM elements WHERE id = ?');
    return stmt.get(id);
  },
  
  // Update an element
  updateElement(id, element) {
    const stmt = db.prepare(`
      UPDATE elements
      SET name = ?, selector = ?, selector_type = ?, description = ?, page_name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const info = stmt.run(
      element.name,
      element.selector,
      element.selector_type,
      element.description || null,
      element.page_name || 'Default Screen',
      id
    );
    
    return info.changes > 0;
  },
  
  // Delete an element
  deleteElement(id) {
    const stmt = db.prepare('DELETE FROM elements WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }
};

export default elementService;
