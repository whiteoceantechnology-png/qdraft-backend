/**
 * Authentication Service - Sequelize for MariaDB
 * Multi-tenant support with tenant_id in JWT
 */

import passport from 'passport';
import LocalStrategy from 'passport-local';
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt';

import User from '../models/user.model.js';
import Tenant from '../models/tenant.model.js';
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
          attributes: ['tenant_id', 'tenant_name', 'is_active', 'subscription_plan', 'features'],
        }],
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
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('JWT'),
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
        attributes: ['tenant_id', 'tenant_name', 'is_active', 'subscription_plan', 'features'],
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

    // Attach tenant info to user object
    return done(null, {
      user_id: user.user_id,
      tenant_id: user.tenant_id,
      username: user.username,
      email: user.email,
      role: user.role,
      user_fname: user.user_fname,
      tenant: user.tenant,
    });
  } catch (e) {
    return done(e, false);
  }
});

passport.use(localLogin);
passport.use(jwtLogin);

export const authLocal = passport.authenticate('local', { session: false });
export const authJwt = passport.authenticate('jwt', { session: false });
