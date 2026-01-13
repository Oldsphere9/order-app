import pool from '../config/database.js';

// 멤버 조회 또는 생성
export const findOrCreateMember = async (memberData) => {
  const { team, name, employee_id } = memberData;

  // 기존 멤버 조회
  const existing = await pool.query(
    'SELECT * FROM members WHERE employee_id = $1',
    [employee_id]
  );

  if (existing.rows.length > 0) {
    // 기존 멤버 업데이트
    const result = await pool.query(
      'UPDATE members SET team = $1, name = $2, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $3 RETURNING *',
      [team, name, employee_id]
    );
    return result.rows[0];
  } else {
    // 새 멤버 생성
    const result = await pool.query(
      'INSERT INTO members (team, name, employee_id) VALUES ($1, $2, $3) RETURNING *',
      [team, name, employee_id]
    );
    return result.rows[0];
  }
};

// 멤버 조회
export const getMemberById = async (id) => {
  const result = await pool.query('SELECT * FROM members WHERE id = $1', [id]);
  return result.rows[0];
};

// 멤버 목록 조회 (필터링)
export const getMembers = async (filters = {}) => {
  const { team, name, employee_id } = filters;
  let query = 'SELECT * FROM members WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (team) {
    query += ` AND team = $${paramIndex}`;
    params.push(team);
    paramIndex++;
  }

  if (name) {
    query += ` AND name = $${paramIndex}`;
    params.push(name);
    paramIndex++;
  }

  if (employee_id) {
    query += ` AND employee_id = $${paramIndex}`;
    params.push(employee_id);
    paramIndex++;
  }

  query += ' ORDER BY team, name';

  const result = await pool.query(query, params);
  return result.rows;
};
