import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || '',
  directUrl: process.env.DIRECT_URL || '',
  leetCodeApiUrl: process.env.LEETCODE_API_URL || 'https://leetcode.com/graphql',
  leetCodeApiKey: process.env.LEETCODE_API_KEY || '',
  timezone: 'Asia/Kolkata',
  concurrency: 5,
};
