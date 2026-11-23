import { sendSuccess } from '../../utils/response.js';
import * as tablesService from './tables.service.js';

export const getTables = async (req, res, next) => {
  try {
    const tables = await tablesService.getTables();
    return sendSuccess(res, tables, 'Dining tables retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateTableStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedTable = await tablesService.updateTableStatus(id, status);
    return sendSuccess(res, updatedTable, `Table status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};
