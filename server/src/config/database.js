import pg from 'pg';
import dotenv from 'dotenv';

// 환경 변수 로드 (.env 파일)
dotenv.config({ path: '.env' });

const { Pool } = pg;

// PostgreSQL 연결 풀 생성
// macOS에서는 기본 사용자가 현재 시스템 사용자일 수 있음
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coffee_order_db',
  // DB_USER가 설정되지 않았거나 'postgres'인 경우 현재 시스템 사용자 사용
  user: (process.env.DB_USER && process.env.DB_USER !== 'postgres') 
    ? process.env.DB_USER 
    : (process.env.USER || 'postgres'),
  password: process.env.DB_PASSWORD || '',
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 연결 테스트
pool.on('connect', () => {
  console.log('데이터베이스 연결 성공');
});

pool.on('error', (err) => {
  console.error('데이터베이스 연결 오류:', err);
});

export default pool;
