const { pool } = require('../config/database');

const RolePermissionModel = {
  getPermissionsForCampus: async (campusId, filters = {}) => {

    let query = `
      SELECT 
        rp.campus_id,
        rp.role_name,
        rp.permission_code,
        rp.created_at,
        rp.created_by_username,
        p.name AS permission_name,
        p.description AS permission_description,
        p.category AS permission_category
      FROM role_organization_permissions rp
      JOIN permissions p ON rp.permission_code = p.code
      WHERE rp.campus_id = $1
    `;

    const values = [campusId];
    let idx = 2;

    if (filters.role_name) {
      query += ` AND rp.role_name = $${idx++}`;
      values.push(filters.role_name);
    }

    if (filters.permission_code) {
      query += ` AND rp.permission_code = $${idx++}`;
      values.push(filters.permission_code);
    }

    if (filters.category) {
      query += ` AND p.category = $${idx++}`;
      values.push(filters.category);
    }

    query += ' ORDER BY rp.role_name ASC, rp.permission_code ASC';

    const result = await pool.query(query, values);
    return result.rows;
  },

  getRolePermission: async (campusId, roleName, permissionCode) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
      throw new Error('Valid campus ID is required');
    }
    if (!roleName || roleName.toString().trim() === '' || roleName === 'undefined' || roleName === null) {
      throw new Error('Valid role name is required');
    }
    if (!permissionCode || permissionCode.toString().trim() === '' || permissionCode === 'undefined' || permissionCode === null) {
      throw new Error('Valid permission code is required');
    }

    const query = `
      SELECT 
        rp.campus_id,
        rp.role_name,
        rp.permission_code,
        rp.created_at,
        rp.created_by_username,
        p.name AS permission_name,
        p.description AS permission_description,
        p.category AS permission_category
      FROM role_organization_permissions rp
      JOIN permissions p ON rp.permission_code = p.code
      WHERE rp.campus_id = $1
        AND rp.role_name = $2
        AND rp.permission_code = $3
    `;

    const result = await pool.query(query, [campusId, roleName, permissionCode]);
    return result.rows[0];
  },

  createRolePermission: async (data) => {
    const { campus_id, role_name, permission_code, created_by_username } = data;

    if (!campus_id || campus_id.toString().trim() === '' || campus_id === 'undefined' || campus_id === null) {
      throw new Error('Valid campus ID is required');
    }
    if (!role_name || role_name.toString().trim() === '') {
      throw new Error('Role name is required');
    }
    if (!permission_code || permission_code.toString().trim() === '') {
      throw new Error('Permission code is required');
    }
    if (!created_by_username || created_by_username.toString().trim() === '') {
      throw new Error('Created by username is required');
    }

    const query = `
      INSERT INTO role_organization_permissions (
        campus_id,
        role_name,
        permission_code,
        created_by_username
      )
      VALUES ($1, $2, $3, $4)
      RETURNING campus_id, role_name, permission_code, created_at, created_by_username
    `;

    const values = [campus_id, role_name, permission_code, created_by_username];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  deleteRolePermission: async (campusId, roleName, permissionCode) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
      throw new Error('Valid campus ID is required');
    }
    if (!roleName || roleName.toString().trim() === '' || roleName === 'undefined' || roleName === null) {
      throw new Error('Valid role name is required');
    }
    if (!permissionCode || permissionCode.toString().trim() === '' || permissionCode === 'undefined' || permissionCode === null) {
      throw new Error('Valid permission code is required');
    }

    const query = `
      DELETE FROM role_organization_permissions
      WHERE campus_id = $1
        AND role_name = $2
        AND permission_code = $3
      RETURNING campus_id, role_name, permission_code, created_at, created_by_username
    `;

    const result = await pool.query(query, [campusId, roleName, permissionCode]);
    return result.rows[0];
  }
};

module.exports = RolePermissionModel;

