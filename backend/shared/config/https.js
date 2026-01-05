import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY_PATH = path.join(__dirname, "../certs/key.pem");
const CERT_PATH = path.join(__dirname, "../certs/cert.pem");

let httpsOptions = null;
try {
  if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
    httpsOptions = {
      key: fs.readFileSync(KEY_PATH),
      cert: fs.readFileSync(CERT_PATH)
    };
  } else {
    logger.warn(`HTTPS certificates not found at ${KEY_PATH} ${CERT_PATH}`);
  }
} catch (err) {
  logger.warn(`Error while reading HTTPS certificates: ${err.message}`);
  httpsOptions = null;
}

export { httpsOptions };
