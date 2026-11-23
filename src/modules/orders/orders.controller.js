import { sendSuccess } from '../../utils/response.js';
import * as ordersService from './orders.service.js';

export const createOrder = async (req, res, next) => {
  try {
    const order = await ordersService.createOrder(req.body, req.user);
    return sendSuccess(res, order, 'Order created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const orders = await ordersService.getOrders();
    return sendSuccess(res, orders, 'Orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await ordersService.getOrderById(req.params.id);
    return sendSuccess(res, order, 'Order details retrieved successfully');
  } catch (error) {
    next(error);
  }
};
