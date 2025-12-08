import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',

  database: {
    url: process.env.DATABASE_URL || '',
    useDatabase: process.env.USE_DATABASE === 'true' || process.env.NODE_ENV === 'production',
  },

  redis: {
    url: process.env.REDIS_URL || '',
    useRedis: process.env.USE_REDIS === 'true' || process.env.NODE_ENV === 'production',
  },

  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
    redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/auth/callback',
    scopes: ['user.read', 'files.read', 'files.read.all'],
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4-turbo-preview',
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  storage: {
    connectionString: process.env.STORAGE_CONNECTION_STRING || '',
    containerName: process.env.STORAGE_CONTAINER_NAME || 'aixiliary-exports',
  },

  appInsights: {
    instrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY || '',
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'MICROSOFT_CLIENT_ID',
  'MICROSOFT_CLIENT_SECRET',
  'OPENAI_API_KEY',
];

if (config.nodeEnv === 'production') {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}
