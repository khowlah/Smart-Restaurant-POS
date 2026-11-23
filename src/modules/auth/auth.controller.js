import { sendSuccess } from '../../utils/response.js';
import * as authService from './auth.service.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    return sendSuccess(res, result, 'Login successful', 200);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUserProfile(req.user.id);
    return sendSuccess(res, user, 'User profile retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};
