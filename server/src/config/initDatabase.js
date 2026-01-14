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

export { initDatabase, testConnection };
