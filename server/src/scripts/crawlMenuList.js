import pool from '../config/database.js';
import * as menuModel from '../models/menuModel.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

// PRD.md에 명시된 커피빈 공식 홈페이지 URL 목록
const COFFEE_BEAN_URLS = [
  { url: 'https://www.coffeebeankorea.com/menu/list.asp?category=32', category: '커피', categoryName: '신음료' },
  { url: 'https://www.coffeebeankorea.com/menu/list.asp?category=13', category: '커피', categoryName: '에스프레소 음료' },
  { url: 'https://www.coffeebeankorea.com/menu/list.asp?category=14', category: '커피', categoryName: '브루드 커피' },
  { url: 'https://www.coffeebeankorea.com/menu/list.asp?category=18', category: '논커피', categoryName: '티' },
  { url: 'https://www.coffeebeankorea.com/menu/list.asp?category=17', category: '논커피', categoryName: '티 라떼' },
  { url: 'https://www.coffeebeankorea.com/menu/list.asp?category=12', category: '논커피', categoryName: '아이스 블렌디드 (Non-Coffee)' },
  { url: 'https://www.coffeebeankorea.com/menu/list.asp?category=11', category: '논커피', categoryName: '아이스 블렌디드 (Coffee)' },
  { url: 'https://www.coffeebeankorea.com/menu/list.asp?category=26', category: '논커피', categoryName: '커피빈 주스(병음료)' },
  { url: 'https://www.coffeebeankorea.com/menu/list.asp?category=6', category: '디저트', categoryName: '베이커리' },
  { url: 'https://www.coffeebeankorea.com/menu/list.asp?category=4', category: '디저트', categoryName: '케익' },
];

// 가격 추출 헬퍼 함수
function extractPrice(priceText) {
  if (!priceText) return null;
  
  // 숫자만 추출 (콤마 제거)
  const match = priceText.match(/[\d,]+/);
  if (match) {
    return parseInt(match[0].replace(/,/g, ''), 10);
  }
  return null;
}

// 메뉴 이름 정규화 (공백 제거, 통일)
function normalizeMenuName(name) {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ');
}

// 커피빈 홈페이지에서 메뉴 크롤링
async function crawlMenuFromURL(url, category, categoryName) {
  try {
    console.log(`\n📡 크롤링 중: ${categoryName} (${url})`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const menus = [];

    // 커피빈 홈페이지 구조: figure.photo > img[alt] + dl.txt > dt > span.kor (한글 이름) + dd (설명)
    $('figure.photo').each((index, element) => {
      try {
        const $figure = $(element);
        
        // 이미지의 alt 속성에서 영어 이름 추출
        const $img = $figure.find('img');
        const englishName = $img.attr('alt') || '';
        
        // 부모 요소에서 한글 이름과 설명 찾기
        const $parent = $figure.parent();
        const $txt = $parent.find('dl.txt');
        
        // 한글 이름 추출
        let koreanName = $txt.find('dt span.kor').text().trim();
        
        // 한글 이름이 없으면 영어 이름 사용
        if (!koreanName && englishName) {
          koreanName = englishName;
        }
        
        // 설명 추출
        let description = $txt.find('dd').text().trim();
        
        // 가격 추출 (커피빈 홈페이지에는 가격 정보가 없을 수 있음)
        let price = null;
        const priceText = $parent.find('.price, .menu-price').text();
        if (priceText) {
          price = extractPrice(priceText);
        }
        
        // 이름이 있는 경우에만 추가
        if (koreanName && koreanName.length > 0) {
          const normalizedName = normalizeMenuName(koreanName);
          
          // 중복 제거
          if (!menus.find(m => m.name === normalizedName)) {
            menus.push({
              name: normalizedName,
              description: description || `${normalizedName} 메뉴`,
              category: category,
              base_price: price || 5000, // 기본 가격 (크롤링 실패 시)
              sale_status: 'active',
            });
          }
        }
      } catch (error) {
        console.warn(`  ⚠️  메뉴 항목 파싱 오류: ${error.message}`);
      }
    });

    console.log(`  ✅ ${menus.length}개의 메뉴를 찾았습니다.`);
    return menus;
  } catch (error) {
    console.error(`  ❌ 크롤링 실패 (${url}):`, error.message);
    return [];
  }
}

// 모든 URL에서 메뉴 크롤링
async function crawlAllMenus() {
  const allMenus = [];
  
  for (const urlInfo of COFFEE_BEAN_URLS) {
    const menus = await crawlMenuFromURL(urlInfo.url, urlInfo.category, urlInfo.categoryName);
    allMenus.push(...menus);
    
    // 요청 간 딜레이 (서버 부하 방지)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return allMenus;
}

// 데이터베이스에 메뉴 저장
async function saveMenusToDatabase(menus) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('\n💾 데이터베이스에 메뉴 저장 중...');
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const menu of menus) {
      try {
        // 기존 메뉴 확인 (이름으로)
        const existing = await client.query(
          'SELECT id FROM menus WHERE name = $1',
          [menu.name]
        );
        
        if (existing.rows.length > 0) {
          // 기존 메뉴 업데이트
          const updateData = {
            description: menu.description,
          };
          // 가격은 크롤링된 값이 있고 기본값이 아닐 때만 업데이트
          if (menu.base_price && menu.base_price !== 5000) {
            updateData.base_price = menu.base_price;
          }
          await menuModel.updateMenu(existing.rows[0].id, updateData);
          updatedCount++;
        } else {
          // 새 메뉴 생성
          await menuModel.createMenu(menu);
          createdCount++;
        }
      } catch (error) {
        console.warn(`  ⚠️  메뉴 저장 실패 (${menu.name}): ${error.message}`);
        skippedCount++;
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(60));
    console.log('메뉴 저장 완료');
    console.log(`  ✅ 새로 생성된 메뉴: ${createdCount}개`);
    console.log(`  🔄 업데이트된 메뉴: ${updatedCount}개`);
    console.log(`  ⏭️  건너뛴 메뉴: ${skippedCount}개`);
    console.log(`  📊 총 처리된 메뉴: ${menus.length}개`);
    console.log('='.repeat(60));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 데이터베이스 저장 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 메인 실행 함수
async function main() {
  try {
    console.log('='.repeat(60));
    console.log('커피빈 공식 홈페이지 메뉴 크롤링 시작');
    console.log(`총 ${COFFEE_BEAN_URLS.length}개의 카테고리를 크롤링합니다.`);
    console.log('='.repeat(60));
    
    // 모든 메뉴 크롤링
    const menus = await crawlAllMenus();
    
    if (menus.length === 0) {
      console.log('\n⚠️  크롤링된 메뉴가 없습니다.');
      console.log('웹사이트 구조가 변경되었거나 접근이 제한되었을 수 있습니다.');
      return;
    }
    
    // 카테고리별 통계
    const stats = {};
    menus.forEach(menu => {
      stats[menu.category] = (stats[menu.category] || 0) + 1;
    });
    
    console.log('\n📊 크롤링 결과:');
    Object.entries(stats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}개`);
    });
    
    // 데이터베이스에 저장
    await saveMenusToDatabase(menus);
    
    console.log('\n✅ 크롤링 및 저장 완료!');
  } catch (error) {
    console.error('❌ 크롤링 실패:', error);
    throw error;
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
