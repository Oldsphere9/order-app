import pool from '../config/database.js';

// 시간대 구분 함수 (한국 시간 기준)
const getTimeSlot = (hour) => {
  if (hour >= 6 && hour < 11) return 'morning'; // 아침: 06:00-11:00
  if (hour >= 11 && hour < 15) return 'lunch'; // 점심: 11:00-15:00
  if (hour >= 15 && hour < 18) return 'afternoon'; // 오후: 15:00-18:00
  if (hour >= 18 && hour < 22) return 'evening'; // 저녁: 18:00-22:00
  return 'night'; // 밤: 22:00-06:00
};

// 주문 인원별 메뉴 선호도 조회 (요일 및 시간대 기반)
export const getPreferencesByMemberId = async (memberId, currentDayOfWeek = null, currentTimeSlot = null, limit = 1) => {
  let query = `
    SELECT 
      mmp.id,
      mmp.member_id,
      mmp.menu_id,
      mmp.order_count,
      mmp.last_ordered_at,
      mmp.time_pattern,
      m.name,
      m.description,
      m.category,
      m.base_price,
      m.sale_status
    FROM member_menu_preferences mmp
    INNER JOIN menus m ON mmp.menu_id = m.id
    WHERE mmp.member_id = $1 
      AND m.sale_status = 'active'
  `;
  
  const params = [memberId];
  let paramIndex = 2;
  
  // 요일과 시간대가 제공된 경우 해당 패턴 점수 계산
  if (currentDayOfWeek !== null && currentTimeSlot !== null) {
    const patternKey = `${currentDayOfWeek}_${currentTimeSlot}`;
    params.push(patternKey);
    query += `
      ORDER BY 
        COALESCE((mmp.time_pattern->>$${paramIndex})::int, 0) DESC,
        mmp.order_count DESC,
        mmp.last_ordered_at DESC
    `;
    paramIndex++;
  } else {
    query += `
      ORDER BY mmp.order_count DESC, mmp.last_ordered_at DESC
    `;
  }
  
  query += ` LIMIT $${paramIndex}`;
  params.push(limit);
  
  const result = await pool.query(query, params);
  return result.rows.map(row => ({
    id: row.menu_id,
    name: row.name,
    description: row.description,
    category: row.category,
    base_price: row.base_price,
    sale_status: row.sale_status,
    order_count: row.order_count,
    last_ordered_at: row.last_ordered_at,
    time_pattern: row.time_pattern
  }));
};

// 주문 인원별 메뉴 선호도 업데이트 또는 생성 (요일 및 시간대 패턴 포함)
export const upsertPreference = async (memberId, menuId, dayOfWeek, timeSlot, client = pool) => {
  const patternKey = `${dayOfWeek}_${timeSlot}`;
  
  const query = `
    INSERT INTO member_menu_preferences (member_id, menu_id, order_count, last_ordered_at, time_pattern)
    VALUES ($1, $2, 1, NOW(), jsonb_build_object($3::text, 1))
    ON CONFLICT (member_id, menu_id)
    DO UPDATE SET
      order_count = member_menu_preferences.order_count + 1,
      last_ordered_at = NOW(),
      updated_at = NOW(),
      time_pattern = COALESCE(member_menu_preferences.time_pattern, '{}'::jsonb) || jsonb_build_object($3::text, COALESCE((member_menu_preferences.time_pattern->>$3::text)::int, 0) + 1)
    RETURNING *
  `;
  
  const result = await client.query(query, [memberId, menuId, patternKey]);
  return result.rows[0];
};

// closed_orders에서 주문 패턴 분석하여 member_menu_preferences 업데이트
export const updatePreferencesFromClosedOrders = async (client = pool) => {
  // closed_orders에서 최근 주문 데이터 조회 (최근 30일)
  const query = `
    SELECT 
      co.member_id,
      co.menu_id,
      co.quantity,
      co.closed_at,
      EXTRACT(DOW FROM co.closed_at) as day_of_week,
      EXTRACT(HOUR FROM co.closed_at) as hour
    FROM closed_orders co
    WHERE co.closed_at >= NOW() - INTERVAL '30 days'
    ORDER BY co.closed_at DESC
  `;
  
  const result = await client.query(query);
  
  // 각 주문에 대해 선호도 업데이트
  for (const row of result.rows) {
    const dayOfWeek = parseInt(row.day_of_week);
    const hour = parseInt(row.hour);
    const timeSlot = getTimeSlot(hour);
    
    // 수량만큼 반복하여 선호도 업데이트
    for (let i = 0; i < row.quantity; i++) {
      await upsertPreference(row.member_id, row.menu_id, dayOfWeek, timeSlot, client);
    }
  }
  
  return result.rows.length;
};

// closed_orders와 member_menu_preferences를 통합하여 추천 메뉴 조회
export const getPreferencesByMemberIdWithHistory = async (memberId, currentDayOfWeek = null, currentTimeSlot = null, limit = 1) => {
  try {
    // member_menu_preferences 기반 추천
    const preferences = await getPreferencesByMemberId(memberId, currentDayOfWeek, currentTimeSlot, limit);
    console.log(`[추천 메뉴] member_menu_preferences에서 ${preferences.length}개 조회됨`);
    
    // closed_orders에서 최근 주문 패턴 분석
    let closedOrdersQuery = `
      SELECT 
        co.menu_id,
        COUNT(*) as order_count,
        MAX(co.closed_at) as last_ordered_at,
        SUM(co.quantity) as total_quantity
      FROM closed_orders co
      WHERE co.member_id = $1
    `;
  
  const params = [memberId];
  let paramIndex = 2;
  
  // 현재 요일과 시간대가 제공된 경우 해당 패턴 필터링
  if (currentDayOfWeek !== null && currentTimeSlot !== null) {
    // 시간대 범위 계산
    let hourStart, hourEnd;
    switch (currentTimeSlot) {
      case 'morning': hourStart = 6; hourEnd = 11; break;
      case 'lunch': hourStart = 11; hourEnd = 15; break;
      case 'afternoon': hourStart = 15; hourEnd = 18; break;
      case 'evening': hourStart = 18; hourEnd = 22; break;
      default: hourStart = 22; hourEnd = 6;
    }
    
    closedOrdersQuery += `
      AND EXTRACT(DOW FROM co.closed_at) = $${paramIndex}
    `;
    params.push(currentDayOfWeek);
    paramIndex++;
    
    if (hourStart < hourEnd) {
      // 일반적인 시간대 (6시~22시)
      closedOrdersQuery += `
        AND EXTRACT(HOUR FROM co.closed_at) >= $${paramIndex}
        AND EXTRACT(HOUR FROM co.closed_at) < $${paramIndex + 1}
      `;
      params.push(hourStart, hourEnd);
      paramIndex += 2;
    } else {
      // 밤 시간대 (22시~6시)
      closedOrdersQuery += `
        AND (EXTRACT(HOUR FROM co.closed_at) >= $${paramIndex} OR EXTRACT(HOUR FROM co.closed_at) < $${paramIndex + 1})
      `;
      params.push(hourStart, hourEnd);
      paramIndex += 2;
    }
  }
  
  closedOrdersQuery += `
    GROUP BY co.menu_id
    ORDER BY order_count DESC, last_ordered_at DESC
    LIMIT $${paramIndex}
  `;
  params.push(limit);
  
  const closedOrdersResult = await pool.query(closedOrdersQuery, params);
  
  // 메뉴 정보 조회
  if (closedOrdersResult.rows.length > 0) {
    const menuIds = closedOrdersResult.rows.map(row => row.menu_id);
    const menuQuery = `
      SELECT id, name, description, category, base_price, sale_status
      FROM menus
      WHERE id = ANY($1) AND sale_status = 'active'
    `;
    const menuResult = await pool.query(menuQuery, [menuIds]);
    
    // 메뉴 정보와 주문 통계 결합
    const closedOrdersRecommendations = closedOrdersResult.rows.map(coRow => {
      const menu = menuResult.rows.find(m => m.id === coRow.menu_id);
      if (!menu) return null;
      
      return {
        id: menu.id,
        name: menu.name,
        description: menu.description,
        category: menu.category,
        base_price: menu.base_price,
        sale_status: menu.sale_status,
        order_count: parseInt(coRow.order_count),
        last_ordered_at: coRow.last_ordered_at,
        from_closed_orders: true
      };
    }).filter(Boolean);
    
    // preferences와 closed_orders 결과를 합치고 중복 제거
    const allRecommendations = [...preferences, ...closedOrdersRecommendations];
    const uniqueRecommendations = [];
    const seenMenuIds = new Set();
    
    for (const rec of allRecommendations) {
      if (!seenMenuIds.has(rec.id)) {
        seenMenuIds.add(rec.id);
        uniqueRecommendations.push(rec);
      }
    }
    
    // 정렬: order_count DESC, last_ordered_at DESC
    uniqueRecommendations.sort((a, b) => {
      if (b.order_count !== a.order_count) {
        return b.order_count - a.order_count;
      }
      return new Date(b.last_ordered_at) - new Date(a.last_ordered_at);
    });
    
    console.log(`[추천 메뉴] 통합 결과: ${uniqueRecommendations.length}개`);
    return uniqueRecommendations.slice(0, limit);
  }
  
  console.log(`[추천 메뉴] closed_orders 결과 없음, preferences 반환: ${preferences.length}개`);
  return preferences;
  } catch (error) {
    console.error('[추천 메뉴] getPreferencesByMemberIdWithHistory 에러:', error);
    // 에러 발생 시 빈 배열 반환
    return [];
  }
};

// 시간대 구분 함수 export
export { getTimeSlot };
