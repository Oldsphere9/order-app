import pool from '../config/database.js';
import * as menuModel from '../models/menuModel.js';

// 명령어 인자 파싱
const args = process.argv.slice(2);
const command = args[0];

// 메뉴 목록 조회
async function listMenus() {
  try {
    const result = await pool.query(
      'SELECT id, name, description, category, base_price, sale_status FROM menus ORDER BY category, name'
    );
    
    console.log('\n' + '='.repeat(100));
    console.log('메뉴 목록');
    console.log('='.repeat(100));
    
    if (result.rows.length === 0) {
      console.log('메뉴가 없습니다.');
      return;
    }
    
    // 카테고리별로 그룹화
    const byCategory = {};
    result.rows.forEach(menu => {
      if (!byCategory[menu.category]) {
        byCategory[menu.category] = [];
      }
      byCategory[menu.category].push(menu);
    });
    
    Object.keys(byCategory).sort().forEach(category => {
      console.log(`\n[${category}]`);
      byCategory[category].forEach(menu => {
        console.log(
          `  ID: ${menu.id.toString().padStart(3)} | ` +
          `상태: ${menu.sale_status.padEnd(10)} | ` +
          `가격: ${menu.base_price.toString().padStart(6)}원 | ` +
          `${menu.name}`
        );
        if (menu.description) {
          console.log(`      설명: ${menu.description}`);
        }
      });
    });
    
    console.log('\n' + '='.repeat(100));
    console.log(`총 ${result.rows.length}개의 메뉴가 있습니다.`);
    console.log('='.repeat(100) + '\n');
  } catch (error) {
    console.error('메뉴 목록 조회 실패:', error);
    throw error;
  }
}

// 메뉴 상세 조회
async function showMenu(id) {
  try {
    const menu = await menuModel.getMenuById(id);
    
    if (!menu) {
      console.log(`메뉴 ID ${id}를 찾을 수 없습니다.`);
      return;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('메뉴 상세 정보');
    console.log('='.repeat(80));
    console.log(`ID: ${menu.id}`);
    console.log(`이름: ${menu.name}`);
    console.log(`설명: ${menu.description || '(없음)'}`);
    console.log(`카테고리: ${menu.category}`);
    console.log(`기본 가격: ${menu.base_price.toLocaleString()}원`);
    console.log(`판매 상태: ${menu.sale_status}`);
    console.log(`생성일: ${menu.created_at}`);
    console.log(`수정일: ${menu.updated_at}`);
    console.log('='.repeat(80) + '\n');
  } catch (error) {
    console.error('메뉴 조회 실패:', error);
    throw error;
  }
}

// 메뉴 업데이트
async function updateMenu(id, updates) {
  try {
    const menu = await menuModel.updateMenu(id, updates);
    console.log(`✅ 메뉴 ID ${id}가 업데이트되었습니다.`);
    await showMenu(id);
  } catch (error) {
    console.error('메뉴 업데이트 실패:', error);
    throw error;
  }
}

// 메뉴 삭제
async function deleteMenu(id) {
  try {
    const menu = await menuModel.getMenuById(id);
    
    if (!menu) {
      console.log(`메뉴 ID ${id}를 찾을 수 없습니다.`);
      return;
    }
    
    await pool.query('DELETE FROM menus WHERE id = $1', [id]);
    console.log(`✅ 메뉴 ID ${id} (${menu.name})가 삭제되었습니다.`);
  } catch (error) {
    console.error('메뉴 삭제 실패:', error);
    throw error;
  }
}

// 사용법 출력
function printUsage() {
  console.log(`
메뉴 관리 스크립트 사용법:

  목록 조회:
    node src/scripts/manageMenus.js list

  상세 조회:
    node src/scripts/manageMenus.js show <메뉴ID>

  메뉴 업데이트:
    node src/scripts/manageMenus.js update <메뉴ID> --name "새 메뉴명"
    node src/scripts/manageMenus.js update <메뉴ID> --price <가격>
    node src/scripts/manageMenus.js update <메뉴ID> --status <active|season_off>
    node src/scripts/manageMenus.js update <메뉴ID> --description "설명"

  여러 필드 동시 업데이트:
    node src/scripts/manageMenus.js update <메뉴ID> --name "새 메뉴명" --price <가격>

  메뉴 삭제:
    node src/scripts/manageMenus.js delete <메뉴ID>

예제:
  node src/scripts/manageMenus.js list
  node src/scripts/manageMenus.js show 1
  node src/scripts/manageMenus.js update 1 --name "아메리카노" --price 4500
  node src/scripts/manageMenus.js update 1 --status season_off
  node src/scripts/manageMenus.js delete 1
`);
}

// 메인 실행 함수
async function main() {
  try {
    if (!command) {
      printUsage();
      process.exit(0);
    }

    switch (command) {
      case 'list':
        await listMenus();
        break;

      case 'show':
        const showId = parseInt(args[1]);
        if (isNaN(showId)) {
          console.error('올바른 메뉴 ID를 입력하세요.');
          printUsage();
          process.exit(1);
        }
        await showMenu(showId);
        break;

      case 'update':
        const updateId = parseInt(args[1]);
        if (isNaN(updateId)) {
          console.error('올바른 메뉴 ID를 입력하세요.');
          printUsage();
          process.exit(1);
        }

        const updates = {};
        
        // 인자 파싱
        for (let i = 2; i < args.length; i += 2) {
          const flag = args[i];
          const value = args[i + 1];

          if (flag === '--name') {
            updates.name = value;
          } else if (flag === '--price') {
            updates.base_price = parseInt(value);
            if (isNaN(updates.base_price)) {
              console.error('가격은 숫자여야 합니다.');
              process.exit(1);
            }
          } else if (flag === '--status') {
            if (value !== 'active' && value !== 'season_off') {
              console.error('상태는 active 또는 season_off여야 합니다.');
              process.exit(1);
            }
            updates.sale_status = value;
          } else if (flag === '--description') {
            updates.description = value;
          }
        }

        if (Object.keys(updates).length === 0) {
          console.error('업데이트할 필드를 지정하세요.');
          printUsage();
          process.exit(1);
        }

        await updateMenu(updateId, updates);
        break;

      case 'delete':
        const deleteId = parseInt(args[1]);
        if (isNaN(deleteId)) {
          console.error('올바른 메뉴 ID를 입력하세요.');
          printUsage();
          process.exit(1);
        }
        await deleteMenu(deleteId);
        break;

      default:
        console.error(`알 수 없는 명령어: ${command}`);
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
