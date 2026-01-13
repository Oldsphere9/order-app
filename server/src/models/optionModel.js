import pool from '../config/database.js';

// 옵션 목록 조회
export const getOptions = async (filters = {}) => {
  const { menu_id, option_type } = filters;
  let query = 'SELECT * FROM options WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (menu_id) {
    query += ` AND (menu_id = $${paramIndex} OR menu_id IS NULL)`;
    params.push(menu_id);
    paramIndex++;
  }

  if (option_type) {
    query += ` AND option_type = $${paramIndex}`;
    params.push(option_type);
    paramIndex++;
  }

  query += ' ORDER BY option_type, price';

  const result = await pool.query(query, params);
  return result.rows;
};
