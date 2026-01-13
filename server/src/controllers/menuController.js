// TODO: 데이터베이스 연동 후 구현
export const getMenus = async (req, res, next) => {
  try {
    const { category, status } = req.query;
    
    // 임시 데이터
    const menus = [];
    
    res.json(menus);
  } catch (error) {
    next(error);
  }
};

export const getMenuById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // TODO: 데이터베이스에서 메뉴 조회
    
    res.status(404).json({
      success: false,
      error: '메뉴를 찾을 수 없습니다.',
      code: 'MENU_NOT_FOUND'
    });
  } catch (error) {
    next(error);
  }
};

export const updateMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sale_status } = req.body;
    
    // TODO: 데이터베이스에서 메뉴 업데이트
    
    res.status(404).json({
      success: false,
      error: '메뉴를 찾을 수 없습니다.',
      code: 'MENU_NOT_FOUND'
    });
  } catch (error) {
    next(error);
  }
};
