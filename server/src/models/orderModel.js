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

// 주문 목록 조회 (팀별 그룹화)
export const getOrders = async (filters = {}) => {
  const { team, name, employee_id } = filters;
  
  // 각 멤버의 최신 주문만 조회
  let query = `
    WITH member_latest_orders AS (
      SELECT 
        m.id as member_id,
        m.team,
        m.name,
        m.employee_id,
        MAX(o.created_at) as latest_created_at
      FROM members m
      INNER JOIN orders o ON m.id = o.member_id
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

  query += `
      GROUP BY m.id, m.team, m.name, m.employee_id
    )
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
    FROM member_latest_orders mlo
    INNER JOIN members m ON mlo.member_id = m.id
    INNER JOIN orders o ON m.id = o.member_id AND o.created_at = mlo.latest_created_at
    INNER JOIN menus menu ON o.menu_id = menu.id
    ORDER BY m.team, m.name, o.created_at DESC
  `;

  const result = await pool.query(query, params);
  return result.rows;
};

// 주문 통계 조회
export const getOrderStats = async () => {
  // 동일 employee_id의 최신 주문만 집계
  const query = `
    WITH latest_orders AS (
      SELECT DISTINCT ON (o.member_id, o.menu_id, o.options)
        o.*
      FROM orders o
      INNER JOIN (
        SELECT member_id, MAX(created_at) as max_created_at
        FROM orders
        GROUP BY member_id
      ) latest ON o.member_id = latest.member_id AND o.created_at = latest.max_created_at
    )
    SELECT 
      COALESCE(SUM(quantity), 0) as total_quantity,
      COUNT(DISTINCT member_id) as team_count,
      COALESCE(SUM(total_price), 0) as total_amount
    FROM latest_orders
  `;

  const result = await pool.query(query);
  return result.rows[0];
};
