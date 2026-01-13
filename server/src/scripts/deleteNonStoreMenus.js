import pool from '../config/database.js';

// 커피빈 현대자동차남양연구소점에서 판매하는 메뉴 목록
const STORE_MENUS = [
  // 커피 - 기본 메뉴
  '아메리카노',
  '카페라떼',
  '카페모카',
  '카푸치노',
  '에스프레소',
  '아이스 아메리카노',
  '아이스 카페모카',
  '카라멜 마키아토',
  '헤이즐넛 라떼',
  '바닐라 라떼',
  '콜드브루',
  
  // 논커피 - 기본 메뉴
  '그린티 라떼',
  '초콜릿 라떼',
  '아이스티',
  '레몬에이드',
  '자몽에이드',
  '유자차',
  
  // 디저트 - 기본 메뉴
  '치즈케이크',
  '초콜릿 케이크',
  '마카롱',
  '브라우니',
  '머핀',
  '스콘',
];

async function deleteNonStoreMenus() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('='.repeat(80));
    console.log('커피빈 현대자동차남양연구소점 미판매 메뉴 삭제');
    console.log('='.repeat(80));
    
    // 모든 메뉴 조회
    const allMenus = await pool.query('SELECT id, name FROM menus');
    
    const menusToDelete = [];
    const menusToKeep = [];
    
    // 삭제할 메뉴와 유지할 메뉴 분류
    for (const menu of allMenus.rows) {
      if (STORE_MENUS.includes(menu.name)) {
        menusToKeep.push(menu);
      } else {
        menusToDelete.push(menu);
      }
    }
    
    console.log(`\n📊 메뉴 분석:`);
    console.log(`  ✅ 유지할 메뉴: ${menusToKeep.length}개`);
    console.log(`  ❌ 삭제할 메뉴: ${menusToDelete.length}개\n`);
    
    if (menusToDelete.length === 0) {
      console.log('삭제할 메뉴가 없습니다.');
      await client.query('COMMIT');
      return;
    }
    
    // 삭제 전 주문 참조 확인
    console.log('🔍 주문 참조 확인 중...\n');
    let deletedCount = 0;
    let skippedCount = 0;
    const skippedMenus = [];
    
    for (const menu of menusToDelete) {
      // 해당 메뉴를 참조하는 주문이 있는지 확인
      const orderCheck = await client.query(
        'SELECT COUNT(*) as count FROM orders WHERE menu_id = $1',
        [menu.id]
      );
      
      const orderCount = parseInt(orderCheck.rows[0].count);
      
      if (orderCount > 0) {
        console.log(`⚠️  [스킵] ${menu.name} (ID: ${menu.id}) - 주문 ${orderCount}개 참조 중`);
        skippedMenus.push({ menu, orderCount });
        skippedCount++;
      } else {
        // Options 테이블에서 참조 확인
        const optionCheck = await client.query(
          'SELECT COUNT(*) as count FROM options WHERE menu_id = $1',
          [menu.id]
        );
        
        const optionCount = parseInt(optionCheck.rows[0].count);
        
        if (optionCount > 0) {
          // Options의 menu_id를 NULL로 업데이트
          await client.query(
            'UPDATE options SET menu_id = NULL WHERE menu_id = $1',
            [menu.id]
          );
        }
        
        // 메뉴 삭제
        await client.query('DELETE FROM menus WHERE id = $1', [menu.id]);
        console.log(`✅ [삭제] ${menu.name} (ID: ${menu.id})`);
        deletedCount++;
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(80));
    console.log('삭제 완료');
    console.log(`  ✅ 삭제된 메뉴: ${deletedCount}개`);
    console.log(`  ⚠️  건너뛴 메뉴 (주문 참조 중): ${skippedCount}개`);
    console.log('='.repeat(80));
    
    if (skippedMenus.length > 0) {
      console.log('\n⚠️  주문 참조로 인해 삭제되지 않은 메뉴:');
      skippedMenus.forEach(({ menu, orderCount }) => {
        console.log(`  - ${menu.name} (ID: ${menu.id}, 주문 ${orderCount}개)`);
      });
      console.log('\n💡 이 메뉴들은 기존 주문에 참조되어 있어 삭제되지 않았습니다.');
      console.log('   필요시 sale_status를 season_off로 변경하여 주문 화면에서 숨길 수 있습니다.\n');
    }
    
    // 최종 메뉴 개수 확인
    const finalCount = await pool.query('SELECT COUNT(*) as count FROM menus');
    console.log(`📊 최종 메뉴 개수: ${finalCount.rows[0].count}개\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 메뉴 삭제 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

deleteNonStoreMenus()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
