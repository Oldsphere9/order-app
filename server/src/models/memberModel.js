import pool from '../config/database.js';

// 멤버 조회 또는 생성
// 동일 인원 판단 기준: 팀, 이름, 사원번호가 모두 일치해야 함
export const findOrCreateMember = async (memberData, client = pool) => {
  const { team, name, employee_id } = memberData;

  // 팀, 이름, 사원번호가 모두 일치하는 멤버 조회
  const existing = await client.query(
    'SELECT * FROM members WHERE team = $1 AND name = $2 AND employee_id = $3',
    [team, name, employee_id]
  );

  if (existing.rows.length > 0) {
    // 동일 인원 발견 (팀, 이름, 사원번호 모두 일치)
    return existing.rows[0];
  } else {
    // 동일 인원이 없음 - 새 멤버 생성
    // 팀, 이름, 사원번호가 모두 일치하는 멤버가 없으면 다른 인원으로 처리
    // 같은 사원번호라도 팀이나 이름이 다르면 다른 인원으로 새 멤버 생성 가능
    try {
      const result = await client.query(
        'INSERT INTO members (team, name, employee_id) VALUES ($1, $2, $3) RETURNING *',
        [team, name, employee_id]
      );
      return result.rows[0];
    } catch (error) {
      // 데이터베이스 제약조건 위반 시 (예: employee_id UNIQUE 제약조건)
      // 이 경우는 데이터베이스 스키마를 변경해야 함
      // 임시로 에러를 다시 throw하여 상위에서 처리하도록 함
      throw error;
    }
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

// employee_id로 멤버 조회
export const getMemberByEmployeeId = async (employeeId) => {
  const result = await pool.query('SELECT * FROM members WHERE employee_id = $1', [employeeId]);
  return result.rows[0];
};
