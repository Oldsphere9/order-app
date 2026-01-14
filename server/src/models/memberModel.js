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
    // 단, employee_id가 이미 존재하는 경우를 확인 (UNIQUE 제약조건 위반 방지)
    const existingEmployeeId = await client.query(
      'SELECT * FROM members WHERE employee_id = $1',
      [employee_id]
    );
    
    if (existingEmployeeId.rows.length > 0) {
      // 같은 사원번호지만 팀이나 이름이 다른 경우 - 다른 인원으로 새 멤버 생성 불가
      // 이 경우는 데이터베이스 제약조건에 의해 처리됨
      // 하지만 더 명확한 에러 메시지를 위해 체크
      throw new Error(`사원번호 ${employee_id}는 이미 다른 인원(${existingEmployeeId.rows[0].name}, ${existingEmployeeId.rows[0].team})으로 등록되어 있습니다.`);
    }
    
    // 새 멤버 생성
    const result = await client.query(
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

// employee_id로 멤버 조회
export const getMemberByEmployeeId = async (employeeId) => {
  const result = await pool.query('SELECT * FROM members WHERE employee_id = $1', [employeeId]);
  return result.rows[0];
};
