import { sendSuccess } from '../../utils/response.js';
import * as kdsService from './kds.service.js';

export const getKdsOrders = async (req, res, next) => {
  try {
    const orders = await kdsService.getActiveKdsOrders();
    return sendSuccess(res, orders, 'Active kitchen display orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await kdsService.updateOrderStatus(id, status);
    return sendSuccess(res, updated, `Order status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};
