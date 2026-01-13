import pool from '../config/database.js';

async function updateMemberMenuPreferencesTable() {
  const client = await pool.connect();
  
  try {
    console.log('member_menu_preferences 테이블 업데이트 시작...');
    
    await client.query('BEGIN');
    
    // 요일별, 시간대별 주문 패턴을 저장할 JSON 필드 추가
    await client.query(`
      ALTER TABLE member_menu_preferences 
      ADD COLUMN IF NOT EXISTS time_pattern JSONB DEFAULT '{}'::jsonb
    `);
    
    console.log('✅ time_pattern 컬럼 추가 완료');
    
    // 기존 데이터에 빈 JSON 객체로 초기화
    await client.query(`
      UPDATE member_menu_preferences 
      SET time_pattern = '{}'::jsonb 
      WHERE time_pattern IS NULL
    `);
    
    console.log('✅ 기존 데이터 초기화 완료');
    
    // 인덱스 생성 (JSONB 필드 검색 최적화)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_member_menu_preferences_time_pattern 
      ON member_menu_preferences USING GIN (time_pattern)
    `);
    
    console.log('✅ 인덱스 생성 완료');
    
    await client.query('COMMIT');
    
    console.log('\n============================================================');
    console.log('✅ member_menu_preferences 테이블 업데이트 완료!');
    console.log('============================================================\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 테이블 업데이트 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

updateMemberMenuPreferencesTable()
  .then(() => {
    console.log('스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('스크립트 실행 실패:', error);
    process.exit(1);
  });
