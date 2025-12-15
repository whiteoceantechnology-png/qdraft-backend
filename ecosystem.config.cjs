/**
 * PM2 Ecosystem Configuration
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 start ecosystem.config.cjs --env development
 */

// Load .env file for development
const path = require('path');
const fs = require('fs');

function loadEnvFile(envPath) {
  const envVars = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key) {
          let value = valueParts.join('=');
          // Remove surrounding quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          envVars[key.trim()] = value;
        }
      }
    });
  }
  return envVars;
}

const envFile = loadEnvFile(path.join(__dirname, '.env'));

module.exports = {
  apps: [
    {
      name: 'draftq-prod',
      script: './src/index.js',
      
      // Instances and execution mode
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
      
      // Auto-restart settings
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 4000,
      
      // Memory management
      max_memory_restart: '500M',
      
      // Logging
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Environment variables for development (loads from .env file)
      env: {
        ...envFile,
        NODE_ENV: 'development',
        PORT: envFile.PORT || 3000,
      },
      
      // Environment variables for production
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Environment variables for staging
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
      },
      
      // Node.js arguments
      node_args: [
        '--experimental-specifier-resolution=node',
      ],
      
      // Exponential backoff restart delay
      exp_backoff_restart_delay: 100,
      
      // Cron restart (optional - restart daily at midnight)
      // cron_restart: '0 0 * * *',
    },
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/qb-server.git',
      path: '/var/www/draftq-prod',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': '',
    },
  },
};
