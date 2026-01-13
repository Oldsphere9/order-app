import pool from '../config/database.js';
import * as memberModel from '../models/memberModel.js';
import * as orderModel from '../models/orderModel.js';
import * as menuModel from '../models/menuModel.js';
import * as optionModel from '../models/optionModel.js';

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
    
    // Orders 테이블에 저장
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
        }
      );
      
      orderIds.push(order.id);
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
