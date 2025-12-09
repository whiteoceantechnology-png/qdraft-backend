/**
 * Configuration of the server middlewares.
 */

import bodyParser from 'body-parser';
import compression from 'compression';
import passport from 'passport';
import methodOverride from 'method-override';
import helmet from 'helmet';
import cors from 'cors';
import expressStatusMonitor from 'express-status-monitor';
import { requestLogger } from '../services/log.js';

const enableRequestLogging = process.env.ENABLE_REQUEST_LOGGING === 'true';

export default app => {
  app.use(compression());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
  app.use(passport.initialize());
  app.use(helmet());
  app.use(cors());
  app.use(expressStatusMonitor());
  
  // Optional request logging (enable via ENABLE_REQUEST_LOGGING=true)
  if (enableRequestLogging) {
    app.use(requestLogger);
  }
  app.use(methodOverride());
};
