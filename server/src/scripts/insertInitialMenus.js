import * as menuModel from '../models/menuModel.js';
import pool from '../config/database.js';

const initialMenus = [
  // 커피
  { name: '카페 아메리카노', description: '진한 에스프레소에 물을 더한 커피', category: '커피', base_price: 4500 },
  { name: '카페 라떼', description: '에스프레소와 스팀 밀크의 조화', category: '커피', base_price: 5000 },
  { name: '카푸치노', description: '에스프레소와 우유 거품의 완벽한 조합', category: '커피', base_price: 5000 },
  { name: '카라멜 마키아또', description: '카라멜 시럽이 들어간 달콤한 커피', category: '커피', base_price: 5500 },
  { name: '바닐라 라떼', description: '바닐라 시럽이 들어간 부드러운 라떼', category: '커피', base_price: 5500 },
  { name: '헤이즐넛 라떼', description: '헤이즐넛 시럽이 들어간 고소한 라떼', category: '커피', base_price: 5500 },
  { name: '콜드브루', description: '차갑게 우려낸 부드러운 커피', category: '커피', base_price: 5000 },
  { name: '에스프레소', description: '진한 에스프레소 샷', category: '커피', base_price: 4000 },
  { name: '아이스 아메리카노', description: '차갑게 마시는 아메리카노', category: '커피', base_price: 4500 },
  { name: '카페 모카', description: '초콜릿이 들어간 달콤한 커피', category: '커피', base_price: 5500 },
  
  // 논커피
  { name: '그린티 라떼', description: '녹차가 들어간 부드러운 라떼', category: '논커피', base_price: 5500 },
  { name: '망고 스무디', description: '신선한 망고가 들어간 스무디', category: '논커피', base_price: 6000 },
  { name: '딸기 스무디', description: '달콤한 딸기가 들어간 스무디', category: '논커피', base_price: 6000 },
  { name: '초콜릿 라떼', description: '진한 초콜릿이 들어간 라떼', category: '논커피', base_price: 5500 },
  { name: '아이스티', description: '시원한 아이스티', category: '논커피', base_price: 4000 },
  { name: '레몬에이드', description: '상큼한 레몬에이드', category: '논커피', base_price: 5000 },
  { name: '자몽에이드', description: '달콤한 자몽에이드', category: '논커피', base_price: 5000 },
  { name: '유자차', description: '따뜻한 유자차', category: '논커피', base_price: 5000 },
  
  // 디저트
  { name: '치즈케이크', description: '부드러운 치즈케이크', category: '디저트', base_price: 6500 },
  { name: '초콜릿 케이크', description: '진한 초콜릿 케이크', category: '디저트', base_price: 6500 },
  { name: '마카롱', description: '달콤한 마카롱', category: '디저트', base_price: 3000 },
  { name: '브라우니', description: '진한 초콜릿 브라우니', category: '디저트', base_price: 5000 },
  { name: '머핀', description: '부드러운 머핀', category: '디저트', base_price: 4000 },
  { name: '스콘', description: '바삭한 스콘', category: '디저트', base_price: 4000 },
];

async function insertInitialMenus() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 기존 메뉴 확인
    const existing = await client.query('SELECT COUNT(*) FROM menus');
    if (parseInt(existing.rows[0].count) > 0) {
      console.log('기존 메뉴가 있어 초기 메뉴 삽입을 건너뜁니다.');
      await client.query('COMMIT');
      return;
    }
    
    console.log('초기 메뉴 데이터 삽입 시작...');
    
    for (const menu of initialMenus) {
      await menuModel.createMenu(menu);
    }
    
    await client.query('COMMIT');
    console.log(`✅ ${initialMenus.length}개의 메뉴가 삽입되었습니다.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('초기 메뉴 삽입 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

insertInitialMenus()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
