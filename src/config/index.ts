import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const { NODE_ENV, PORT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE, SECRET_KEY, LOG_FORMAT, LOG_DIR, ORIGIN } = process.env;
export const { S3_BUCKET_NAME, S3_BUCKET_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_CDN_URL } = process.env;
export const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
