import { sendSuccess } from '../../utils/response.js';
import * as reportsService from './reports.service.js';

export const getSummary = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const summary = await reportsService.getSalesReportSummary(start_date, end_date);
    return sendSuccess(res, summary, "Today's sales report summary retrieved successfully");
  } catch (error) {
    next(error);
  }
};
