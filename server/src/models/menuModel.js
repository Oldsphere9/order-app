import pool from '../config/database.js';

// 메뉴 목록 조회
export const getMenus = async (filters = {}) => {
  const { category, status } = filters;
  let query = 'SELECT * FROM menus WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (category) {
    query += ` AND category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  if (status) {
    query += ` AND sale_status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  } else {
    // status가 명시되지 않은 경우 기본적으로 active 메뉴만 조회
    query += ` AND sale_status = 'active'`;
  }

  query += ' ORDER BY category, name';

  const result = await pool.query(query, params);
  return result.rows;
};

// 특정 메뉴 조회
export const getMenuById = async (id) => {
  const result = await pool.query('SELECT * FROM menus WHERE id = $1', [id]);
  return result.rows[0];
};

// 메뉴 업데이트
export const updateMenu = async (id, updates) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex}`);
    values.push(updates.name);
    paramIndex++;
  }

  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex}`);
    values.push(updates.description);
    paramIndex++;
  }

  if (updates.base_price !== undefined) {
    fields.push(`base_price = $${paramIndex}`);
    values.push(updates.base_price);
    paramIndex++;
  }

  if (updates.sale_status !== undefined) {
    fields.push(`sale_status = $${paramIndex}`);
    values.push(updates.sale_status);
    paramIndex++;
  }

  if (fields.length === 0) {
    throw new Error('업데이트할 필드가 없습니다.');
  }

  // updated_at 필드 추가
  fields.push(`updated_at = NOW()`);

  values.push(id);
  const query = `UPDATE menus SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

// 메뉴 생성 (초기 데이터 삽입용)
export const createMenu = async (menuData) => {
  const { name, description, category, base_price, sale_status = 'active' } = menuData;
  const result = await pool.query(
    'INSERT INTO menus (name, description, category, base_price, sale_status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, description, category, base_price, sale_status]
  );
  return result.rows[0];
};
