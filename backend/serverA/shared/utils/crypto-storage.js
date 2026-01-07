import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGO = 'aes-256-gcm';

if (!process.env.STORAGE_ENCRYPTION_KEY) {
  throw new Error('STORAGE_ENCRYPTION_KEY must be defined');
}

const KEY = crypto
  .createHash('sha256')
  .update(process.env.STORAGE_ENCRYPTION_KEY)
  .digest();

export function encryptForStorage(plainText) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag().toString('hex');

  return JSON.stringify({
    iv: iv.toString('hex'),
    tag,
    data: encrypted
  });
}

export function decryptFromStorage(cipherText) {
  const { iv, tag, data } = JSON.parse(cipherText);

  const decipher = crypto.createDecipheriv(
    ALGO,
    KEY,
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
