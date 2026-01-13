import * as optionModel from '../models/optionModel.js';

export const getOptions = async (req, res, next) => {
  try {
    const { menu_id, option_type } = req.query;
    const filters = {};
    
    if (menu_id) filters.menu_id = parseInt(menu_id);
    if (option_type) filters.option_type = option_type;
    
    const options = await optionModel.getOptions(filters);
    res.json(options);
  } catch (error) {
    next(error);
  }
};
