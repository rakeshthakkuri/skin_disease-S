import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  // Environment
  environment: string;
  debug: boolean;
  
  // Database
  databaseUrl: string;
  
  // JWT
  secretKey: string;
  algorithm: string;
  accessTokenExpireMinutes: number;
  
  // CORS
  corsOrigins: string[];
  
  // API
  apiV1Prefix: string;
  
  // Server
  host: string;
  port: number;
  
  // Security
  allowedHosts: string[];
  
  // Logging
  logLevel: string;
  
  // File uploads
  maxUploadSize: number;
  uploadDir: string;
  
  // Gemini API
  geminiApiKey: string;
  
  // Computed properties
  isProduction: boolean;
  isDevelopment: boolean;
}

function parseCorsOrigins(): string[] {
  const origins = process.env.CORS_ORIGINS || 
    'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173';
  return origins
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
}

function parseAllowedHosts(): string[] {
  const hosts = process.env.ALLOWED_HOSTS || '*';
  return hosts
    .split(',')
    .map(host => host.trim())
    .filter(host => host.length > 0);
}

export const config: Config = {
  // Environment
  environment: process.env.ENVIRONMENT || 'development',
  debug: process.env.DEBUG === 'true',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/acneai',
  
  // JWT
  secretKey: process.env.SECRET_KEY || 'your-secret-key-change-in-production',
  algorithm: 'HS256',
  accessTokenExpireMinutes: parseInt(
    process.env.ACCESS_TOKEN_EXPIRE_MINUTES || String(30 * 24 * 60),
    10
  ), // 30 days default
  
  // CORS
  corsOrigins: parseCorsOrigins(),
  
  // API
  apiV1Prefix: '/api/v1',
  
  // Server
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT || '8000', 10),
  
  // Security
  allowedHosts: parseAllowedHosts(),
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'INFO',
  
  // File uploads
  maxUploadSize: parseInt(
    process.env.MAX_UPLOAD_SIZE || String(10 * 1024 * 1024),
    10
  ), // 10MB default
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  
  // Gemini API
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  
  // Computed properties
  get isProduction(): boolean {
    return this.environment.toLowerCase() === 'production';
  },
  
  get isDevelopment(): boolean {
    return this.environment.toLowerCase() === 'development';
  },
};

export default config;

