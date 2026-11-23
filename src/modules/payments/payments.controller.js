import { sendSuccess } from '../../utils/response.js';
import * as paymentsService from './payments.service.js';

export const settlePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await paymentsService.settlePayment(id, req.body, req.user);
    return sendSuccess(res, result, 'Order settled and table released successfully', 200);
  } catch (error) {
    next(error);
  }
};
