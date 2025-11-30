import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient = null;

export async function connectRedis() {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return null;
  }
}

export function getRedisClient() {
  return redisClient;
}

export async function disconnectRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
