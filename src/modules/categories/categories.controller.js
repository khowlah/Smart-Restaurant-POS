import { sendSuccess } from '../../utils/response.js';
import * as categoriesService from './categories.service.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await categoriesService.getCategories();
    return sendSuccess(res, categories, 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const category = await categoriesService.createCategory(req.body);
    return sendSuccess(res, category, 'Category created successfully', 201);
  } catch (error) {
    next(error);
  }
};
