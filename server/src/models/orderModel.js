import pool from '../config/database.js';

// 주문 생성
export const createOrder = async (memberId, menuId, orderData, client = pool) => {
  const { quantity, options, unit_price, total_price } = orderData;
  
  const result = await client.query(
    'INSERT INTO orders (member_id, menu_id, quantity, options, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [memberId, menuId, quantity, JSON.stringify(options), unit_price, total_price]
  );
  
  return result.rows[0];
};

// 주문 목록 조회 (팀별 그룹화) - 모든 주문 조회
export const getOrders = async (filters = {}) => {
  const { team, name, employee_id } = filters;
  
  // 모든 주문 조회 (최신 주문만이 아닌)
  let query = `
    SELECT 
      m.id as member_id,
      m.team,
      m.name,
      m.employee_id,
      o.id as order_id,
      o.menu_id,
      o.quantity,
      o.options,
      o.unit_price,
      o.total_price,
      o.created_at,
      menu.name as menu_name,
      menu.category as menu_category
    FROM orders o
    INNER JOIN members m ON o.member_id = m.id
    INNER JOIN menus menu ON o.menu_id = menu.id
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;

  if (team) {
    query += ` AND m.team = $${paramIndex}`;
    params.push(team);
    paramIndex++;
  }

  if (name) {
    query += ` AND m.name = $${paramIndex}`;
    params.push(name);
    paramIndex++;
  }

  if (employee_id) {
    query += ` AND m.employee_id = $${paramIndex}`;
    params.push(employee_id);
    paramIndex++;
  }

  query += ` ORDER BY m.team, m.name, o.created_at DESC`;

  const result = await pool.query(query, params);
  return result.rows;
};

// 주문 통계 조회 - 모든 주문 집계
export const getOrderStats = async () => {
  // 모든 주문 집계 (최신 주문만이 아닌)
  const query = `
    SELECT 
      COALESCE(SUM(quantity), 0) as total_quantity,
      COUNT(DISTINCT member_id) as team_count,
      COALESCE(SUM(total_price), 0) as total_amount
    FROM orders
  `;

  const result = await pool.query(query);
  return result.rows[0];
};

// 주문 마감: 현재 주문을 closed_orders로 이동
export const closeOrders = async (client = pool) => {
  const query = `
    INSERT INTO closed_orders (
      original_order_id,
      member_id,
      member_team,
      member_name,
      member_employee_id,
      menu_id,
      menu_name,
      menu_category,
      quantity,
      options,
      unit_price,
      total_price,
      closed_at,
      created_at
    )
    SELECT 
      o.id,
      m.id,
      m.team,
      m.name,
      m.employee_id,
      menu.id,
      menu.name,
      menu.category,
      o.quantity,
      o.options,
      o.unit_price,
      o.total_price,
      NOW(),
      o.created_at
    FROM orders o
    INNER JOIN members m ON o.member_id = m.id
    INNER JOIN menus menu ON o.menu_id = menu.id
    RETURNING id, closed_at
  `;
  
  const result = await client.query(query);
  console.log(`[주문 마감] ${result.rows.length}건의 주문이 closed_orders에 저장됨`);
  if (result.rows.length > 0) {
    console.log(`[주문 마감] 첫 번째 마감 시간: ${result.rows[0].closed_at}`);
  }
  return result.rows;
};

// 모든 주문 삭제 (주문 리셋)
// 중요: closed_orders 테이블은 삭제하지 않음 (추천 메뉴 기능에 사용됨)
export const resetAllOrders = async (client = pool) => {
  // orders 테이블의 모든 주문 삭제 (closed_orders는 보존)
  const deleteOrdersResult = await client.query('DELETE FROM orders RETURNING id');
  console.log(`[주문 리셋] orders 테이블에서 ${deleteOrdersResult.rows.length}건 삭제됨`);
  
  // closed_orders 보존 확인
  const closedOrdersCheck = await client.query('SELECT COUNT(*) as count FROM closed_orders');
  const closedOrdersCount = parseInt(closedOrdersCheck.rows[0].count);
  console.log(`[주문 리셋] closed_orders 테이블 보존 확인: ${closedOrdersCount}건 유지됨 (추천 메뉴 기능에 사용)`);
  
  // 주문이 없는 멤버들도 삭제
  // 단, closed_orders에 기록이 있는 멤버는 보존 (추천 메뉴 기능에 사용)
  const deleteMembersResult = await client.query(`
    DELETE FROM members 
    WHERE id NOT IN (
      SELECT DISTINCT member_id FROM orders
      UNION
      SELECT DISTINCT member_id FROM closed_orders
    )
  `);
  console.log(`[주문 리셋] 주문이 없고 closed_orders에도 기록이 없는 멤버 ${deleteMembersResult.rowCount}명 삭제됨`);
  
  return {
    deleted_orders_count: deleteOrdersResult.rows.length,
    deleted_members_count: deleteMembersResult.rowCount
  };
};
