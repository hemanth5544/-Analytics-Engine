import { getRedisClient } from '../config/redis.js';

export async function getCache(key) {
  try {
    const client = getRedisClient();
    if (!client) return null;

    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCache(key, value, expirationInSeconds = 300) {
  try {
    const client = getRedisClient();
    if (!client) return false;

    await client.setEx(key, expirationInSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}

export async function deleteCache(key) {
  try {
    const client = getRedisClient();
    if (!client) return false;

    await client.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}

export async function deleteCachePattern(pattern) {
  try {
    const client = getRedisClient();
    if (!client) return false;

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Cache delete pattern error:', error);
    return false;
  }
}
