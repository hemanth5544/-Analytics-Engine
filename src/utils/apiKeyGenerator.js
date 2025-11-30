import crypto from 'crypto';

export function generateApiKey() {
  const prefix = 'ak_';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return prefix + randomBytes;
}
