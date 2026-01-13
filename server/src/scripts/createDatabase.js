import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const { Client } = pg;

// 데이터베이스 생성 스크립트
async function createDatabase() {
  // postgres 데이터베이스에 연결 (기본 데이터베이스)
  // macOS에서는 기본 사용자가 현재 시스템 사용자일 수 있음
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // 기본 데이터베이스
    user: process.env.DB_USER || process.env.USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  });

  const dbName = process.env.DB_NAME || 'coffee_order_db';

  try {
    await adminClient.connect();
    console.log('PostgreSQL에 연결되었습니다.');

    // 데이터베이스 존재 여부 확인
    const checkDb = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (checkDb.rows.length > 0) {
      console.log(`✅ 데이터베이스 '${dbName}'가 이미 존재합니다.`);
    } else {
      // 데이터베이스 생성
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ 데이터베이스 '${dbName}'가 생성되었습니다.`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ PostgreSQL 서버에 연결할 수 없습니다.');
      console.error('   PostgreSQL이 실행 중인지 확인하세요.');
    } else if (error.code === '28P01') {
      console.error('❌ 인증 실패: 사용자 이름 또는 비밀번호가 잘못되었습니다.');
      console.error('   .env 파일의 DB_USER와 DB_PASSWORD를 확인하세요.');
    } else {
      console.error('❌ 오류 발생:', error.message);
    }
    process.exit(1);
  } finally {
    await adminClient.end();
  }
}

createDatabase();
