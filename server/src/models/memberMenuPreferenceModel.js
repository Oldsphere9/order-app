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

// 시간대 구분 함수 export
export { getTimeSlot };
