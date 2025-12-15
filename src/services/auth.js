/**
 * Authentication Service - Sequelize for MariaDB
 * Multi-tenant support with tenant_id in JWT
 */

import passport from 'passport';
import LocalStrategy from 'passport-local';
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt';

import { User, Tenant } from '../models/index.js';
import constants from '../config/constants.js';

/**
 * Local Strategy Auth
 * Authenticates user with username and password
 * Also validates tenant is active
 */
const localOpts = {
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true, // Pass request to get tenant info if needed
};

const localLogin = new LocalStrategy(
  localOpts,
  async (req, username, password, done) => {
    try {
      // Find user by username (username is unique per tenant)
      const user = await User.findOne({
        where: { username },
        include: [{
          model: Tenant,
          as: 'tenant',
          attributes: ['tenant_id', 'tenant_name', 'is_active', 'subscription_plan', 'subscription_start', 'subscription_end', 'features'],
        },
      ],
        attributes: ['user_id', 'tenant_id', 'username', 'password', 'is_active', 'role', 'user_fname', 'subject_id'
      ],
      });

      if (!user) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      // Check if user is active
      if (!user.is_active) {
        return done(null, false, { message: 'User account is deactivated' });
      }

      // Check if tenant is active
      if (!user.tenant || !user.tenant.is_active) {
        return done(null, false, { message: 'Tenant account is inactive' });
      }

      // Check subscription dates for non-super_admin users
      if (user.role !== 'super_admin' && user.tenant) {
        const now = new Date();
        const startDate = user.tenant.subscription_start ? new Date(user.tenant.subscription_start) : null;
        const endDate = user.tenant.subscription_end ? new Date(user.tenant.subscription_end) : null;

        // Check if subscription hasn't started yet
        if (startDate && now < startDate) {
          return done(null, false, { message: 'Tenant subscription has not started yet' });
        }

        // Check if subscription has expired
        if (endDate && now > endDate) {
          return done(null, false, { message: 'Tenant subscription has expired. Please contact administrator.' });
        }
      }

      // Verify password
      if (!user.authenticateUser(password)) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      // Update last login
      await user.update({ last_login: new Date() });

      // Return auth response with tenant info
      return done(null, {
        ...user.toAuthJSON(),
        tenant: {
          tenant_id: user.tenant.tenant_id,
          tenant_name: user.tenant.tenant_name,
          subscription_plan: user.tenant.subscription_plan,
          features: user.tenant.features,
        },
      });
    } catch (e) {
      return done(e, false);
    }
  },
);

/**
 * JWT Strategy Auth
 * Validates JWT token and extracts user + tenant info
 */
const jwtOpts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: constants.JWT_SECRET,
};

const jwtLogin = new JWTStrategy(jwtOpts, async (payload, done) => {
  try {
    // Validate required fields in payload
    if (!payload.user_id || !payload.tenant_id) {
      return done(null, false, { message: 'Invalid token payload' });
    }

    // Find user with tenant info
    const user = await User.findOne({
      where: {
        user_id: payload.user_id,
        tenant_id: payload.tenant_id,
      },
      include: [{
        model: Tenant,
        as: 'tenant',
        attributes: ['tenant_id', 'tenant_name', 'is_active', 'subscription_plan', 'subscription_start', 'subscription_end', 'features'],
      }],
    });

    if (!user) {
      return done(null, false, { message: 'User not found' });
    }

    // Check if user is active
    if (!user.is_active) {
      return done(null, false, { message: 'User account is deactivated' });
    }

    // Check if tenant is active
    if (!user.tenant || !user.tenant.is_active) {
      return done(null, false, { message: 'Tenant account is inactive' });
    }

    // Check subscription dates for non-super_admin users
    if (user.role !== 'super_admin' && user.tenant) {
      const now = new Date();
      const startDate = user.tenant.subscription_start ? new Date(user.tenant.subscription_start) : null;
      const endDate = user.tenant.subscription_end ? new Date(user.tenant.subscription_end) : null;

      // Check if subscription hasn't started yet
      if (startDate && now < startDate) {
        return done(null, false, { message: 'Tenant subscription has not started yet' });
      }

      // Check if subscription has expired
      if (endDate && now > endDate) {
        return done(null, false, { message: 'Tenant subscription has expired' });
      }
    }

    // Attach tenant info to user object
    return done(null, {
      user_id: user.user_id,
      tenant_id: user.tenant_id,
      username: user.username,
      email: user.email,
      role: user.role,
      user_fname: user.user_fname,
      tenant: user.tenant,
      subject_id: user.subject_id,
    });
  } catch (e) {
    return done(e, false);
  }
});

passport.use(localLogin);
passport.use(jwtLogin);

/**
 * Custom middleware for local authentication with proper error handling
 */
export const authLocal = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    // Handle passport errors
    if (err) {
      console.error('Passport authentication error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during authentication',
        code: 'AUTH_ERROR',
      });
    }

    // Handle authentication failure with custom info
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Invalid username or password',
        code: info?.code || 'AUTH_FAILED',
      });
    }

    // Attach user to request and proceed
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Custom middleware for JWT authentication with proper error handling
 */
export const authJwt = (req, res, next) => {
  // Check if Authorization header exists
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token is required',
      code: 'TOKEN_REQUIRED',
    });
  }

  if (!authHeader.startsWith('Bearer')) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token format. Use: Bearer <token>',
      code: 'INVALID_TOKEN_FORMAT',
    });
  }

  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      console.error('JWT authentication error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during authentication',
        code: 'AUTH_ERROR',
      });
    }
    console.log('JWT authentication info:', info);  
    console.log('JWT authentication info:', user);  
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Invalid or expired token',
        code: info?.code || 'INVALID_TOKEN',
      });
    }
    console.log('Authenticated user:', user);
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware to check if user is admin (super_admin or tenant_admin)
 * @deprecated Use requireSuperAdmin or requireTenantAdmin from role.middleware.js instead
 */
export const authAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  if (!['super_admin', 'tenant_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      code: 'ADMIN_REQUIRED',
    });
  }

  next();
};
