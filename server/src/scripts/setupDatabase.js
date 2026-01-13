import { initDatabase, testConnection } from '../config/initDatabase.js';
import pool from '../config/database.js';

async function setup() {
  console.log('데이터베이스 설정 시작...\n');
  
  // 연결 테스트
  const connected = await testConnection();
  if (!connected) {
    console.error('\n❌ 데이터베이스 연결에 실패했습니다.');
    console.error('다음을 확인하세요:');
    console.error('1. PostgreSQL이 실행 중인지 확인');
    console.error('2. .env 파일의 데이터베이스 설정 확인');
    console.error('3. 데이터베이스가 생성되었는지 확인');
    process.exit(1);
  }
  
  // 데이터베이스 초기화
  await initDatabase();
  
  console.log('\n✅ 데이터베이스 설정 완료!');
  await pool.end();
  process.exit(0);
}

setup().catch((error) => {
  console.error('설정 중 오류 발생:', error);
  process.exit(1);
});
