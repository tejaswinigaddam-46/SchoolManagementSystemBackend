const { pool } = require('../config/database');

const PermissionModel = {
  getAllPermissions: async () => {
    const query = `
      SELECT code, name, description, category, created_at
      FROM permissions
      ORDER BY code ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  getPermissionByCode: async (code) => {
    const query = `
      SELECT code, name, description, category, created_at
      FROM permissions
      WHERE code = $1
    `;
    const result = await pool.query(query, [code]);
    return result.rows[0];
  },

  createPermission: async (permissionData) => {
    const { code, name, description, category } = permissionData;

    if (!code || code.toString().trim() === '' || code === 'undefined' || code === null) {
      throw new Error('Valid permission code is required');
    }
    if (!name || name.toString().trim() === '') {
      throw new Error('Permission name is required');
    }

    const query = `
      INSERT INTO permissions (code, name, description, category)
      VALUES ($1, $2, $3, $4)
      RETURNING code, name, description, category, created_at
    `;
    const values = [code.trim(), name.trim(), description || null, category || null];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  updatePermission: async (code, updateData) => {

    const fields = [];
    const values = [];
    let idx = 1;

    const addField = (column, value) => {
      if (value !== undefined) {
        fields.push(`${column} = $${idx++}`);
        values.push(value);
      }
    };

    addField('name', updateData.name !== undefined ? updateData.name : undefined);
    addField('description', updateData.description !== undefined ? updateData.description : undefined);
    addField('category', updateData.category !== undefined ? updateData.category : undefined);

    if (fields.length === 0) {
      throw new Error('No valid fields provided for update');
    }

    values.push(code);
    const query = `
      UPDATE permissions
      SET ${fields.join(', ')}
      WHERE code = $${idx}
      RETURNING code, name, description, category, created_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  deletePermission: async (code) => {

    const query = `
      DELETE FROM permissions
      WHERE code = $1
      RETURNING code, name, description, category, created_at
    `;
    const result = await pool.query(query, [code]);
    return result.rows[0];
  }
};

module.exports = PermissionModel;

