import * as menuModel from '../models/menuModel.js';

export const getMenus = async (req, res, next) => {
  try {
    const { category, status } = req.query;
    const filters = {};
    
    if (category) filters.category = category;
    if (status) filters.status = status;
    
    const menus = await menuModel.getMenus(filters);
    res.json(menus);
  } catch (error) {
    next(error);
  }
};

export const getMenuById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const menu = await menuModel.getMenuById(id);
    
    if (!menu) {
      return res.status(404).json({
        success: false,
        error: '메뉴를 찾을 수 없습니다.',
        code: 'MENU_NOT_FOUND'
      });
    }
    
    res.json(menu);
  } catch (error) {
    next(error);
  }
};

export const updateMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, sale_status } = req.body;
    
    // 최소 하나의 필드는 업데이트해야 함
    if (!name && !description && !sale_status) {
      return res.status(400).json({
        success: false,
        error: '업데이트할 필드가 필요합니다. (name, description, sale_status 중 하나 이상)',
        code: 'INVALID_INPUT'
      });
    }
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (sale_status !== undefined) updates.sale_status = sale_status;
    
    const menu = await menuModel.updateMenu(id, updates);
    
    if (!menu) {
      return res.status(404).json({
        success: false,
        error: '메뉴를 찾을 수 없습니다.',
        code: 'MENU_NOT_FOUND'
      });
    }
    
    res.json(menu);
  } catch (error) {
    next(error);
  }
};
