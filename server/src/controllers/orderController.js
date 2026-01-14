import pool from '../config/database.js';
import * as memberModel from '../models/memberModel.js';
import * as orderModel from '../models/orderModel.js';
import * as menuModel from '../models/menuModel.js';
import * as optionModel from '../models/optionModel.js';
import * as memberMenuPreferenceModel from '../models/memberMenuPreferenceModel.js';

// 옵션 가격 계산
const calculateOptionPrice = async (menuId, options) => {
  let totalPrice = 0;
  
  // 메뉴 기본 가격 조회
  const menu = await menuModel.getMenuById(menuId);
  if (!menu) {
    throw new Error('메뉴를 찾을 수 없습니다.');
  }
  
  totalPrice = menu.base_price;
  
  // 옵션별 가격 추가
  const allOptions = await optionModel.getOptions({ menu_id: menuId });
  
  if (options.size) {
    const sizeOption = allOptions.find(opt => opt.name === options.size && opt.option_type === 'size');
    if (sizeOption) totalPrice += sizeOption.price;
  }
  
  if (options.shot) {
    const shotOption = allOptions.find(opt => opt.name === options.shot && opt.option_type === 'shot');
    if (shotOption) totalPrice += shotOption.price;
  }
  
  if (options.extra) {
    const extraOption = allOptions.find(opt => opt.name === options.extra && opt.option_type === 'extra');
    if (extraOption) totalPrice += extraOption.price;
  }
  
  return totalPrice;
};

export const createOrder = async (req, res, next) => {
  let client;
  
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    
    const { team, name, employee_id, menus } = req.body;
    
    // 입력 검증
    if (!team || !name || !employee_id || !menus || !Array.isArray(menus) || menus.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({
        success: false,
        error: '필수 입력 항목이 누락되었습니다.',
        code: 'INVALID_INPUT'
      });
    }
    
    // 메뉴 유효성 검증 및 Season off 체크
    for (const menuItem of menus) {
      const menu = await menuModel.getMenuById(menuItem.menu_id);
      
      if (!menu) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({
          success: false,
          error: `메뉴를 찾을 수 없습니다. (menu_id: ${menuItem.menu_id})`,
          code: 'MENU_NOT_FOUND'
        });
      }
      
      if (menu.sale_status === 'season_off') {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({
          success: false,
          error: 'Season off 메뉴로 주문이 안됩니다.',
          menu_name: menu.name,
          code: 'MENU_SEASON_OFF'
        });
      }
    }
    
    // Members 테이블에 저장/업데이트
    const member = await memberModel.findOrCreateMember({ team, name, employee_id });
    
    // Orders 테이블에 저장 및 선호도 업데이트
    const orderIds = [];
    for (const menuItem of menus) {
      const unitPrice = await calculateOptionPrice(menuItem.menu_id, menuItem.options);
      const totalPrice = unitPrice * menuItem.quantity;
      
      const order = await orderModel.createOrder(
        member.id,
        menuItem.menu_id,
        {
          quantity: menuItem.quantity,
          options: menuItem.options,
          unit_price: unitPrice,
          total_price: totalPrice
        },
        client
      );
      
      orderIds.push(order.id);
      
      // 현재 시간 기준으로 요일과 시간대 계산 (한국 시간대)
      const now = new Date();
      const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      const dayOfWeek = koreaTime.getDay(); // 0(일요일) ~ 6(토요일)
      const hour = koreaTime.getHours();
      const timeSlot = memberMenuPreferenceModel.getTimeSlot(hour);
      
      // 선호도 업데이트 (주문 횟수만큼 반복)
      for (let i = 0; i < menuItem.quantity; i++) {
        await memberMenuPreferenceModel.upsertPreference(member.id, menuItem.menu_id, dayOfWeek, timeSlot, client);
      }
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: '주문이 완료되었습니다.',
      order_ids: orderIds,
      member_id: member.id
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const { team, name, employee_id } = req.query;
    const filters = {};
    
    if (team) filters.team = team;
    if (name) filters.name = name;
    if (employee_id) filters.employee_id = employee_id;
    
    const orders = await orderModel.getOrders(filters);
    
    // 팀별로 그룹화
    const groupedOrders = {};
    orders.forEach(row => {
      const key = `${row.member_id}`;
      if (!groupedOrders[key]) {
        groupedOrders[key] = {
          member: {
            id: row.member_id,
            team: row.team,
            name: row.name,
            employee_id: row.employee_id
          },
          orders: []
        };
      }
      
      groupedOrders[key].orders.push({
        id: row.order_id,
        menu: {
          id: row.menu_id,
          name: row.menu_name,
          category: row.menu_category
        },
        quantity: row.quantity,
        options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
        unit_price: row.unit_price,
        total_price: row.total_price,
        created_at: row.created_at
      });
    });
    
    res.json(Object.values(groupedOrders));
  } catch (error) {
    next(error);
  }
};

export const getOrderStats = async (req, res, next) => {
  try {
    const stats = await orderModel.getOrderStats();
    
    res.json({
      total_quantity: parseInt(stats.total_quantity) || 0,
      team_count: parseInt(stats.team_count) || 0,
      total_amount: parseInt(stats.total_amount) || 0
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (req, res, next) => {
  let client;
  
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // 주문 존재 여부 확인
    const orderCheck = await client.query(
      'SELECT id, member_id FROM orders WHERE id = $1',
      [id]
    );
    
    if (orderCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다.',
        code: 'ORDER_NOT_FOUND'
      });
    }
    
    // 주문 삭제
    await client.query('DELETE FROM orders WHERE id = $1', [id]);
    
    // 해당 멤버의 다른 주문이 있는지 확인
    const remainingOrders = await client.query(
      'SELECT COUNT(*) as count FROM orders WHERE member_id = $1',
      [orderCheck.rows[0].member_id]
    );
    
    // 다른 주문이 없으면 멤버도 삭제
    if (parseInt(remainingOrders.rows[0].count) === 0) {
      await client.query('DELETE FROM members WHERE id = $1', [orderCheck.rows[0].member_id]);
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: '주문이 삭제되었습니다.'
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    next(error);
  }
};

export const deleteMemberOrders = async (req, res, next) => {
  let client;
  
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    
    const { member_id } = req.params;
    
    // 멤버 존재 여부 확인
    const memberCheck = await client.query(
      'SELECT id FROM members WHERE id = $1',
      [member_id]
    );
    
    if (memberCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({
        success: false,
        error: '주문 인원을 찾을 수 없습니다.',
        code: 'MEMBER_NOT_FOUND'
      });
    }
    
    // 해당 멤버의 모든 주문 삭제
    const deleteResult = await client.query(
      'DELETE FROM orders WHERE member_id = $1 RETURNING id',
      [member_id]
    );
    
    // 멤버도 삭제
    await client.query('DELETE FROM members WHERE id = $1', [member_id]);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: '주문 인원의 모든 주문이 삭제되었습니다.',
      deleted_orders_count: deleteResult.rows.length
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    next(error);
  }
};

// 주문 마감: 현재 주문을 closed_orders로 저장하고 orders에서 삭제
export const closeOrders = async (req, res, next) => {
  let client;
  
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    
    // 현재 주문이 있는지 확인
    const orderCheck = await client.query('SELECT COUNT(*) as count FROM orders');
    const orderCount = parseInt(orderCheck.rows[0].count);
    
    if (orderCount === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({
        success: false,
        error: '마감할 주문이 없습니다.',
        code: 'NO_ORDERS'
      });
    }
    
    // 주문을 closed_orders로 복사
    const closedOrders = await orderModel.closeOrders(client);
    
    // orders 테이블의 모든 주문 삭제
    await client.query('DELETE FROM orders');
    
    // 주문이 없는 멤버들도 삭제
    await client.query(`
      DELETE FROM members 
      WHERE id NOT IN (SELECT DISTINCT member_id FROM orders)
    `);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: '주문이 마감되었습니다.',
      closed_orders_count: closedOrders.length
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    next(error);
  }
};

// 주문 리셋: 모든 주문 삭제
export const resetAllOrders = async (req, res, next) => {
  let client;
  
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    
    // 모든 주문 삭제
    const result = await orderModel.resetAllOrders(client);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: '모든 주문이 삭제되었습니다.',
      deleted_orders_count: result.deleted_orders_count
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    next(error);
  }
};
