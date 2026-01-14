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
    
    // 1. 기존 employee_id UNIQUE 제약조건 찾기 (모든 방법으로)
    // PostgreSQL은 제약조건 이름을 자동 생성할 수 있으므로 여러 방법으로 찾기
    const constraintCheck1 = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'members' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%employee_id%'
    `);
    
    // 인덱스로도 찾기 (UNIQUE 제약조건은 인덱스를 생성함)
    const constraintCheck2 = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'members' 
      AND indexname LIKE '%employee_id%'
      AND indexdef LIKE '%UNIQUE%'
    `);
    
    // pg_constraint에서도 찾기
    const constraintCheck3 = await client.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'members'::regclass
      AND contype = 'u'
      AND conname LIKE '%employee_id%'
    `);
    
    // 모든 제약조건 이름 수집
    const allConstraints = new Set();
    constraintCheck1.rows.forEach(row => allConstraints.add(row.constraint_name));
    constraintCheck2.rows.forEach(row => allConstraints.add(row.indexname));
    constraintCheck3.rows.forEach(row => allConstraints.add(row.conname));
    
    // 2. 기존 employee_id UNIQUE 제약조건 제거
    // PostgreSQL에서 자동 생성되는 제약조건 이름도 포함
    const knownConstraintNames = [
      'members_employee_id_key',
      'members_employee_id_unique',
      'idx_members_employee_id_unique'
    ];
    
    // 알려진 제약조건 이름도 추가
    knownConstraintNames.forEach(name => allConstraints.add(name));
    
    if (allConstraints.size > 0) {
      for (const constraintName of allConstraints) {
        console.log(`기존 제약조건 제거 시도: ${constraintName}`);
        try {
          await client.query(`ALTER TABLE members DROP CONSTRAINT IF EXISTS ${constraintName}`);
          console.log(`✅ 제약조건 제거 성공: ${constraintName}`);
        } catch (error) {
          // 제약조건이 인덱스로만 존재하는 경우
          try {
            await client.query(`DROP INDEX IF EXISTS ${constraintName}`);
            console.log(`✅ 인덱스 제거 성공: ${constraintName}`);
          } catch (indexError) {
            console.log(`⚠️ 제약조건/인덱스 제거 실패 (무시): ${constraintName} - ${indexError.message}`);
          }
        }
      }
    } else {
      console.log('기존 employee_id UNIQUE 제약조건을 찾을 수 없습니다.');
      // 그래도 알려진 제약조건 이름들을 시도
      for (const constraintName of knownConstraintNames) {
        try {
          await client.query(`ALTER TABLE members DROP CONSTRAINT IF EXISTS ${constraintName}`);
          console.log(`✅ 알려진 제약조건 제거 시도 성공: ${constraintName}`);
        } catch (error) {
          try {
            await client.query(`DROP INDEX IF EXISTS ${constraintName}`);
            console.log(`✅ 알려진 인덱스 제거 시도 성공: ${constraintName}`);
          } catch (indexError) {
            // 무시
          }
        }
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
