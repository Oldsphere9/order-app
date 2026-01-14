import pool from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 데이터베이스 초기화 함수
async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('데이터베이스 스키마 생성 시작...');
    
    // SQL 파일 읽기
    const sqlFile = path.join(__dirname, 'database.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // SQL 실행
    await client.query(sql);
    
    console.log('✅ 데이터베이스 스키마 생성 완료');
    
    // time_pattern 컬럼이 없는 경우 추가 (기존 테이블 마이그레이션)
    try {
      await client.query(`
        ALTER TABLE member_menu_preferences 
        ADD COLUMN IF NOT EXISTS time_pattern JSONB DEFAULT '{}'::jsonb
      `);
      console.log('✅ time_pattern 컬럼 마이그레이션 완료');
      
      // 인덱스 생성
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_member_menu_preferences_time_pattern 
        ON member_menu_preferences USING GIN (time_pattern)
      `);
      console.log('✅ time_pattern 인덱스 생성 완료');
    } catch (migrationError) {
      // 이미 컬럼이 있거나 다른 이유로 실패해도 계속 진행
      console.log('time_pattern 컬럼 마이그레이션 스킵:', migrationError.message);
    }
    
    // Members 테이블 스키마 업데이트 (employee_id UNIQUE 제약조건 변경)
    try {
      // 기존 employee_id UNIQUE 제약조건 찾기 (모든 방법으로)
      const constraintCheck1 = await client.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'members' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%employee_id%'
      `);
      
      const constraintCheck2 = await client.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'members' 
        AND indexname LIKE '%employee_id%'
        AND indexdef LIKE '%UNIQUE%'
      `);
      
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
      
      // 알려진 제약조건 이름도 포함 (PostgreSQL 자동 생성 이름)
      const knownConstraintNames = [
        'members_employee_id_key',
        'members_employee_id_unique',
        'idx_members_employee_id_unique'
      ];
      knownConstraintNames.forEach(name => allConstraints.add(name));
      
      // 기존 employee_id UNIQUE 제약조건 제거
      if (allConstraints.size > 0) {
        for (const constraintName of allConstraints) {
          try {
            await client.query(`ALTER TABLE members DROP CONSTRAINT IF EXISTS ${constraintName}`);
          } catch (error) {
            try {
              await client.query(`DROP INDEX IF EXISTS ${constraintName}`);
            } catch (indexError) {
              // 무시하고 계속 진행
            }
          }
        }
        console.log('✅ 기존 employee_id UNIQUE 제약조건 제거 완료');
      } else {
        // 그래도 알려진 제약조건 이름들을 시도
        for (const constraintName of knownConstraintNames) {
          try {
            await client.query(`ALTER TABLE members DROP CONSTRAINT IF EXISTS ${constraintName}`);
          } catch (error) {
            try {
              await client.query(`DROP INDEX IF EXISTS ${constraintName}`);
            } catch (indexError) {
              // 무시
            }
          }
        }
      }
      
      // (team, name, employee_id) 조합에 UNIQUE 제약조건 추가
      const existingCompositeConstraint = await client.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'members' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name = 'members_team_name_employee_id_unique'
      `);
      
      if (existingCompositeConstraint.rows.length === 0) {
        await client.query(`
          ALTER TABLE members 
          ADD CONSTRAINT members_team_name_employee_id_unique 
          UNIQUE (team, name, employee_id)
        `);
        console.log('✅ (team, name, employee_id) UNIQUE 제약조건 추가 완료');
      }
    } catch (migrationError) {
      console.log('Members 테이블 스키마 마이그레이션 스킵:', migrationError.message);
    }
    
    // closed_orders 테이블 생성 (주문 마감 기능)
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS closed_orders (
          id SERIAL PRIMARY KEY,
          original_order_id INTEGER,
          member_id INTEGER NOT NULL,
          member_team VARCHAR(50) NOT NULL,
          member_name VARCHAR(50) NOT NULL,
          member_employee_id VARCHAR(50) NOT NULL,
          menu_id INTEGER NOT NULL,
          menu_name VARCHAR(100) NOT NULL,
          menu_category VARCHAR(20) NOT NULL,
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          options JSONB NOT NULL DEFAULT '{}',
          unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
          total_price INTEGER NOT NULL CHECK (total_price >= 0),
          closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP
        )
      `);
      console.log('✅ closed_orders 테이블 생성 완료');
      
      // 인덱스 생성
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_closed_orders_closed_at 
        ON closed_orders(closed_at DESC)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_closed_orders_member_id 
        ON closed_orders(member_id)
      `);
      console.log('✅ closed_orders 인덱스 생성 완료');
    } catch (migrationError) {
      console.log('closed_orders 테이블 생성 스킵:', migrationError.message);
    }
    
    // 기본 데이터 삽입 (선택사항)
    await insertInitialData(client);
    
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 초기 데이터 삽입
async function insertInitialData(client) {
  try {
    // 기존 데이터 확인
    const menuCheck = await client.query('SELECT COUNT(*) FROM menus');
    if (parseInt(menuCheck.rows[0].count) > 0) {
      console.log('기존 데이터가 있어 초기 데이터를 건너뜁니다.');
      return;
    }
    
    console.log('초기 데이터 삽입 시작...');
    
    // 기본 옵션 삽입
    await client.query(`
      INSERT INTO options (name, option_type, price, menu_id) VALUES
      ('HOT', 'temperature', 0, NULL),
      ('ICE', 'temperature', 0, NULL),
      ('Regular', 'size', 0, NULL),
      ('Grande', 'size', 500, NULL),
      ('Venti', 'size', 1000, NULL),
      ('기본', 'shot', 0, NULL),
      ('+1샷', 'shot', 500, NULL),
      ('+2샷', 'shot', 1000, NULL),
      ('휘핑크림 추가', 'extra', 500, NULL),
      ('시럽 추가', 'extra', 500, NULL)
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✅ 초기 데이터 삽입 완료');
  } catch (error) {
    console.error('초기 데이터 삽입 중 오류:', error);
    // 초기 데이터 삽입 실패는 치명적이지 않으므로 계속 진행
  }
}

// 데이터베이스 연결 테스트
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ 데이터베이스 연결 성공:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error.message);
    if (error.code === '3D000') {
      console.error('\n💡 데이터베이스가 존재하지 않습니다. 다음 명령어로 생성하세요:');
      console.error('   createdb -U postgres coffee_order_db');
      console.error('   또는 psql -U postgres -c "CREATE DATABASE coffee_order_db;"');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 PostgreSQL 서버가 실행 중이지 않습니다.');
      console.error('   PostgreSQL을 시작하세요.');
    } else if (error.code === '28P01') {
      console.error('\n💡 인증 실패: .env 파일의 DB_USER와 DB_PASSWORD를 확인하세요.');
    }
    return false;
  }
}

// Members 테이블 스키마 마이그레이션 함수
async function ensureMembersTableSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Members 테이블 스키마 마이그레이션 시작...');
    
    // 기존 employee_id UNIQUE 제약조건 찾기 (모든 방법으로)
    const constraintCheck1 = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'members' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%employee_id%'
    `);
    
    const constraintCheck2 = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'members' 
      AND indexname LIKE '%employee_id%'
      AND indexdef LIKE '%UNIQUE%'
    `);
    
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
    
    // 알려진 제약조건 이름도 포함 (PostgreSQL 자동 생성 이름)
    const knownConstraintNames = [
      'members_employee_id_key',
      'members_employee_id_unique',
      'idx_members_employee_id_unique'
    ];
    knownConstraintNames.forEach(name => allConstraints.add(name));
    
    // 기존 employee_id UNIQUE 제약조건 제거
    if (allConstraints.size > 0) {
      for (const constraintName of allConstraints) {
        try {
          await client.query(`ALTER TABLE members DROP CONSTRAINT IF EXISTS ${constraintName}`);
          console.log(`✅ 제약조건 제거: ${constraintName}`);
        } catch (error) {
          try {
            await client.query(`DROP INDEX IF EXISTS ${constraintName}`);
            console.log(`✅ 인덱스 제거: ${constraintName}`);
          } catch (indexError) {
            // 무시하고 계속 진행
          }
        }
      }
      console.log('✅ 기존 employee_id UNIQUE 제약조건 제거 완료');
    } else {
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
    
    // (team, name, employee_id) 조합에 UNIQUE 제약조건 추가
    const existingCompositeConstraint = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'members' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'members_team_name_employee_id_unique'
    `);
    
    if (existingCompositeConstraint.rows.length === 0) {
      await client.query(`
        ALTER TABLE members 
        ADD CONSTRAINT members_team_name_employee_id_unique 
        UNIQUE (team, name, employee_id)
      `);
      console.log('✅ (team, name, employee_id) UNIQUE 제약조건 추가 완료');
    } else {
      console.log('✅ (team, name, employee_id) UNIQUE 제약조건이 이미 존재합니다.');
    }
    
    console.log('✅ Members 테이블 스키마 마이그레이션 완료');
  } catch (error) {
    console.error('❌ Members 테이블 스키마 마이그레이션 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// time_pattern 컬럼과 closed_orders 테이블 확인 및 추가하는 경량 마이그레이션 함수
async function ensureTimePatternColumn() {
  const client = await pool.connect();
  
  try {
    // time_pattern 컬럼이 없는 경우 추가
    await client.query(`
      ALTER TABLE member_menu_preferences 
      ADD COLUMN IF NOT EXISTS time_pattern JSONB DEFAULT '{}'::jsonb
    `);
    
    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_member_menu_preferences_time_pattern 
      ON member_menu_preferences USING GIN (time_pattern)
    `);
    
    console.log('✅ time_pattern 컬럼 확인 완료');
    
    // closed_orders 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS closed_orders (
        id SERIAL PRIMARY KEY,
        original_order_id INTEGER,
        member_id INTEGER NOT NULL,
        member_team VARCHAR(50) NOT NULL,
        member_name VARCHAR(50) NOT NULL,
        member_employee_id VARCHAR(50) NOT NULL,
        menu_id INTEGER NOT NULL,
        menu_name VARCHAR(100) NOT NULL,
        menu_category VARCHAR(20) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        options JSONB NOT NULL DEFAULT '{}',
        unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
        total_price INTEGER NOT NULL CHECK (total_price >= 0),
        closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP
      )
    `);
    
    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_closed_orders_closed_at 
      ON closed_orders(closed_at DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_closed_orders_member_id 
      ON closed_orders(member_id)
    `);
    
    console.log('✅ closed_orders 테이블 확인 완료');
  } catch (error) {
    // 테이블이 없으면 무시 (나중에 initDatabase에서 생성됨)
    if (error.code === '42P01') {
      console.log('테이블이 아직 없습니다. 나중에 생성됩니다.');
    } else {
      console.error('마이그레이션 확인 중 오류:', error.message);
    }
  } finally {
    client.release();
  }
}

export { initDatabase, testConnection, ensureTimePatternColumn, ensureMembersTableSchema };
