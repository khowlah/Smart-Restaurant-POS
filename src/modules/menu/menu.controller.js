import { sendSuccess } from '../../utils/response.js';
import * as menuService from './menu.service.js';

export const getMenu = async (req, res, next) => {
  try {
    const { category, is_available } = req.query;
    const items = await menuService.getMenu({ category, is_available });
    return sendSuccess(res, items, 'Menu items retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (req, res, next) => {
  try {
    const item = await menuService.createMenuItem(req.body);
    return sendSuccess(res, item, 'Menu item created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;
    const updated = await menuService.updateAvailability(id, is_available);
    return sendSuccess(res, updated, `Menu item availability updated to ${is_available}`);
  } catch (error) {
    next(error);
  }
};
