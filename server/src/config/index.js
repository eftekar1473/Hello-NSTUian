import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_hello_nstuian_key_32chars_long',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  allowedEduMailDomains: (process.env.ALLOWED_EDUMAIL_DOMAINS || 'student.nstu.edu.bd,nstu.edu.bd')
    .split(',')
    .map((d) => d.trim().toLowerCase()),
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    localDir: path.resolve(__dirname, '../../storage/uploads'),
    maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB, 10) || 25,
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    bucket: process.env.SUPABASE_STORAGE_BUCKET || 'question-papers',
  },
};
