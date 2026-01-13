// TODO: 데이터베이스 연동 후 구현
export const getOptions = async (req, res, next) => {
  try {
    const { menu_id, option_type } = req.query;
    
    // 임시 데이터
    const options = [];
    
    res.json(options);
  } catch (error) {
    next(error);
  }
};
