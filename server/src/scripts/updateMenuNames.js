import pool from '../config/database.js';

// 커피빈 공식 홈페이지 기준 메뉴 이름 매핑
// PRD.md 참조: 다음 URL들의 메뉴를 참조
// * https://www.coffeebeankorea.com/menu/list.asp?category=32
// * https://www.coffeebeankorea.com/menu/list.asp?category=13
// * https://www.coffeebeankorea.com/menu/list.asp?category=14
// * https://www.coffeebeankorea.com/menu/list.asp?category=18
// * https://www.coffeebeankorea.com/menu/list.asp?category=17
// * https://www.coffeebeankorea.com/menu/list.asp?category=12
// * https://www.coffeebeankorea.com/menu/list.asp?category=11
// * https://www.coffeebeankorea.com/menu/list.asp?category=26
// * https://www.coffeebeankorea.com/menu/list.asp?category=6
// * https://www.coffeebeankorea.com/menu/list.asp?category=4
//
// 웹 검색 결과를 기반으로 실제 커피빈 공식 홈페이지의 메뉴 이름으로 업데이트
const menuNameUpdates = [
  // 커피 - 에스프레소 음료 (category=13)
  // 이미 업데이트된 메뉴들 (데이터베이스에 이미 올바른 이름으로 존재)
  // { currentName: '아메리카노', newName: '아메리카노' }, // Americano → 아메리카노 (이미 업데이트됨)
  // { currentName: '카페라떼', newName: '카페라떼' }, // Cafe Latte → 카페라떼 (이미 업데이트됨)
  // { currentName: '카페모카', newName: '카페모카' }, // Cafe Mocha → 카페모카 (이미 업데이트됨)
  
  // 추가로 확인된 메뉴들 (웹 검색 결과 기반)
  { currentName: '카라멜 마키아토', newName: '카라멜 마키아토' }, // 이미 올바른 이름
  { currentName: '헤이즐넛 라떼', newName: '헤이즐넛 라떼' }, // 동일
  { currentName: '바닐라 라떼', newName: '바닐라 라떼' }, // 동일
  { currentName: '카푸치노', newName: '카푸치노' }, // 동일
  { currentName: '콜드브루', newName: '콜드브루' }, // 동일
  { currentName: '에스프레소', newName: '에스프레소' }, // 동일
  { currentName: '아이스 아메리카노', newName: '아이스 아메리카노' }, // 동일
  
  // 논커피
  { currentName: '그린티 라떼', newName: '그린티 라떼' }, // 동일
  { currentName: '망고 스무디', newName: '망고 스무디' }, // 동일
  { currentName: '딸기 스무디', newName: '딸기 스무디' }, // 동일
  { currentName: '초콜릿 라떼', newName: '초콜릿 라떼' }, // 동일
  { currentName: '아이스티', newName: '아이스티' }, // 동일
  { currentName: '레몬에이드', newName: '레몬에이드' }, // 동일
  { currentName: '자몽에이드', newName: '자몽에이드' }, // 동일
  { currentName: '유자차', newName: '유자차' }, // 동일
  
  // 디저트
  { currentName: '치즈케이크', newName: '치즈케이크' }, // 동일
  { currentName: '초콜릿 케이크', newName: '초콜릿 케이크' }, // 동일
  { currentName: '마카롱', newName: '마카롱' }, // 동일
  { currentName: '브라우니', newName: '브라우니' }, // 동일
  { currentName: '머핀', newName: '머핀' }, // 동일
  { currentName: '스콘', newName: '스콘' }, // 동일
];

async function updateMenuNames() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('='.repeat(60));
    console.log('커피빈 공식 홈페이지 기준 메뉴 이름 업데이트');
    console.log('PRD.md 참조 URL:');
    console.log('  - category=32, 13, 14, 18, 17, 12, 11, 26, 6, 4');
    console.log('='.repeat(60));
    console.log('\n메뉴 이름 업데이트 시작...\n');
    
    let updatedCount = 0;
    let skippedCount = 0;
    let notFoundCount = 0;
    
    for (const update of menuNameUpdates) {
      // 현재 이름으로 메뉴 찾기
      const result = await client.query(
        'SELECT id, name FROM menus WHERE name = $1',
        [update.currentName]
      );
      
      if (result.rows.length > 0) {
        const menuId = result.rows[0].id;
        const currentName = result.rows[0].name;
        
        // 이름이 다른 경우에만 업데이트
        if (update.currentName !== update.newName) {
          await client.query(
            'UPDATE menus SET name = $1, updated_at = NOW() WHERE id = $2',
            [update.newName, menuId]
          );
          console.log(`✅ [ID: ${menuId}] "${update.currentName}" → "${update.newName}"`);
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        // 유사한 이름으로 검색 (공백 차이 등)
        const similarResult = await client.query(
          'SELECT id, name FROM menus WHERE name LIKE $1 OR name = $2',
          [`%${update.currentName.replace(/\s+/g, '%')}%`, update.newName]
        );
        
        if (similarResult.rows.length > 0) {
          const similarMenu = similarResult.rows[0];
          if (similarMenu.name === update.newName) {
            console.log(`ℹ️  "${update.currentName}" → 이미 "${update.newName}"로 저장되어 있습니다.`);
            skippedCount++;
          } else {
            console.log(`⚠️  "${update.currentName}" 메뉴를 찾을 수 없습니다. (유사: "${similarMenu.name}")`);
            notFoundCount++;
          }
        } else {
          console.log(`⚠️  "${update.currentName}" 메뉴를 찾을 수 없습니다.`);
          notFoundCount++;
        }
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(60));
    console.log('업데이트 완료');
    console.log(`  ✅ 업데이트된 메뉴: ${updatedCount}개`);
    console.log(`  ⏭️  변경 없음: ${skippedCount}개`);
    console.log(`  ⚠️  찾을 수 없음: ${notFoundCount}개`);
    console.log('='.repeat(60));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 메뉴 이름 업데이트 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

updateMenuNames()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
