import { supabaseAdmin, supabaseAnon } from '../../config/supabase.js';
import { DEMO_USERS } from '../../middleware/authenticate.js';
import { AppError } from '../../utils/response.js';

export const loginUser = async (email, password) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Fast check for demo accounts in offline / testing mode
  if (normalizedEmail === 'manager@restaurant.pos' && password === 'manager123') {
    return {
      token: 'demo-manager-token',
      user: DEMO_USERS.manager
    };
  }
  if (normalizedEmail === 'cashier@restaurant.pos' && password === 'cashier123') {
    return {
      token: 'demo-cashier-token',
      user: DEMO_USERS.cashier
    };
  }
  if (normalizedEmail === 'kitchen@restaurant.pos' && password === 'kitchen123') {
    return {
      token: 'demo-kitchen-token',
      user: DEMO_USERS.kitchen
    };
  }

  // Live Supabase Auth sign-in
  try {
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (authError || !authData.session) {
      throw new AppError('Invalid email or password credentials', 401);
    }

    // Retrieve database user profile for verified role
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, is_active')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !userProfile) {
      throw new AppError('User profile does not exist in POS database', 401);
    }

    if (!userProfile.is_active) {
      throw new AppError('Account is currently disabled', 403);
    }

    return {
      token: authData.session.access_token,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name,
        role: userProfile.role
      }
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Invalid email or password credentials', 401);
  }
};

export const getCurrentUserProfile = async (userId) => {
  // Check demo users
  for (const key of Object.keys(DEMO_USERS)) {
    if (DEMO_USERS[key].id === userId) {
      return DEMO_USERS[key];
    }
  }

  const { data: userProfile, error } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, role, is_active, created_at')
    .eq('id', userId)
    .single();

  if (error || !userProfile) {
    throw new AppError('User profile not found', 404);
  }

  return userProfile;
};
