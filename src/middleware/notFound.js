import { sendError } from '../utils/response.js';

export const notFound = (req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};
