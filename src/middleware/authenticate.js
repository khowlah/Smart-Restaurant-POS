import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/response.js';

// Predefined mock users for offline tests and development demonstration
export const DEMO_USERS = {
  manager: {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'manager@restaurant.pos',
    full_name: 'Chef Ramsey (Manager)',
    role: 'manager'
  },
  cashier: {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'cashier@restaurant.pos',
    full_name: 'Sarah Jenkins (Cashier)',
    role: 'cashier'
  },
  kitchen: {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'kitchen@restaurant.pos',
    full_name: 'Marco Pierre (Head Cook)',
    role: 'kitchen'
  }
};

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token missing or invalid format', 401);
    }

    const token = authHeader.split(' ')[1]?.trim();
    if (!token) {
      throw new AppError('Authentication token is required', 401);
    }

    // Fast-path for testing / demo tokens
    if (token === 'mock-token-manager' || token === 'demo-manager-token') {
      req.user = DEMO_USERS.manager;
      return next();
    }
    if (token === 'mock-token-cashier' || token === 'demo-cashier-token') {
      req.user = DEMO_USERS.cashier;
      return next();
    }
    if (token === 'mock-token-kitchen' || token === 'demo-kitchen-token') {
      req.user = DEMO_USERS.kitchen;
      return next();
    }

    // Supabase JWT verification
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      throw new AppError('Invalid or expired authentication token', 401);
    }

    // Query user profile from database to get enforced role
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, is_active')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !userProfile) {
      throw new AppError('User account profile not found', 401);
    }

    if (!userProfile.is_active) {
      throw new AppError('User account is deactivated', 403);
    }

    req.user = {
      id: userProfile.id,
      email: userProfile.email,
      full_name: userProfile.full_name,
      role: userProfile.role
    };

    next();
  } catch (error) {
    next(error);
  }
};
