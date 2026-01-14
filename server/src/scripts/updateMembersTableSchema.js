import pool from '../config/database.js';

/**
 * Members 테이블 스키마 업데이트
 * employee_id의 UNIQUE 제약조건을 제거하고, (team, name, employee_id) 조합에 UNIQUE 제약조건 추가
 * 동일 인원 판단 기준: 팀, 이름, 사원번호가 모두 일치해야 함
 */
async function updateMembersTableSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Members 테이블 스키마 업데이트 시작...');
    
    await client.query('BEGIN');
    
    // 1. 기존 employee_id UNIQUE 제약조건 찾기
    const constraintCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'members' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%employee_id%'
    `);
    
    // 2. 기존 employee_id UNIQUE 제약조건 제거
    if (constraintCheck.rows.length > 0) {
      for (const constraint of constraintCheck.rows) {
        const constraintName = constraint.constraint_name;
        console.log(`기존 제약조건 제거: ${constraintName}`);
        await client.query(`ALTER TABLE members DROP CONSTRAINT IF EXISTS ${constraintName}`);
      }
    }
    
    // 3. (team, name, employee_id) 조합에 UNIQUE 제약조건 추가
    // 먼저 기존 제약조건이 있는지 확인
    const existingCompositeConstraint = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'members' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'members_team_name_employee_id_unique'
    `);
    
    if (existingCompositeConstraint.rows.length === 0) {
      console.log('(team, name, employee_id) UNIQUE 제약조건 추가...');
      await client.query(`
        ALTER TABLE members 
        ADD CONSTRAINT members_team_name_employee_id_unique 
        UNIQUE (team, name, employee_id)
      `);
      console.log('✅ (team, name, employee_id) UNIQUE 제약조건 추가 완료');
    } else {
      console.log('✅ (team, name, employee_id) UNIQUE 제약조건이 이미 존재합니다.');
    }
    
    // 4. employee_id에 인덱스는 유지 (조회 성능을 위해)
    const indexCheck = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'members' 
      AND indexname = 'idx_members_employee_id'
    `);
    
    if (indexCheck.rows.length === 0) {
      console.log('employee_id 인덱스 생성...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_members_employee_id 
        ON members(employee_id)
      `);
      console.log('✅ employee_id 인덱스 생성 완료');
    }
    
    await client.query('COMMIT');
    console.log('✅ Members 테이블 스키마 업데이트 완료');
    console.log('이제 같은 사원번호라도 팀이나 이름이 다르면 다른 인원으로 처리됩니다.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Members 테이블 스키마 업데이트 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트로 직접 실행 시
if (import.meta.url === `file://${process.argv[1]}`) {
  updateMembersTableSchema()
    .then(() => {
      console.log('스키마 업데이트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('스키마 업데이트 실패:', error);
      process.exit(1);
    });
}

export default updateMembersTableSchema;
