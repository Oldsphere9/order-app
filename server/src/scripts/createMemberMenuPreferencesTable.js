import pool from '../config/database.js';

async function createMemberMenuPreferencesTable() {
  const client = await pool.connect();
  
  try {
    console.log('member_menu_preferences 테이블 생성 시작...');
    
    await client.query('BEGIN');
    
    // MemberMenuPreferences 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS member_menu_preferences (
        id SERIAL PRIMARY KEY,
        member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
        order_count INTEGER NOT NULL DEFAULT 0 CHECK (order_count >= 0),
        last_ordered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(member_id, menu_id)
      )
    `);
    
    console.log('✅ member_menu_preferences 테이블 생성 완료');
    
    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_member_menu_preferences_member_id 
      ON member_menu_preferences(member_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_member_menu_preferences_menu_id 
      ON member_menu_preferences(menu_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_member_menu_preferences_order_count 
      ON member_menu_preferences(order_count DESC)
    `);
    
    console.log('✅ 인덱스 생성 완료');
    
    // 트리거 함수가 없으면 생성
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    // 트리거 생성
    await client.query(`
      DROP TRIGGER IF EXISTS update_member_menu_preferences_updated_at ON member_menu_preferences;
      CREATE TRIGGER update_member_menu_preferences_updated_at 
      BEFORE UPDATE ON member_menu_preferences
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    
    console.log('✅ 트리거 생성 완료');
    
    await client.query('COMMIT');
    
    console.log('\n============================================================');
    console.log('✅ member_menu_preferences 테이블 생성 완료!');
    console.log('============================================================\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 테이블 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

createMemberMenuPreferencesTable()
  .then(() => {
    console.log('스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('스크립트 실행 실패:', error);
    process.exit(1);
  });
