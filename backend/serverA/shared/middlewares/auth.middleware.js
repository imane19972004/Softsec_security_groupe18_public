import { verifyToken } from '../utils/crypto.js';
import { AuthError } from '../utils/errors.js';


export default function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AuthError('Unauthorized');
    }

    const token = header.split(' ')[1];
    req.user = verifyToken(token);
    next();
  } catch (err) {
   // Si c'est une erreur JWT (token invalide/expiré)
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.status(401).json({ error: 'Unauthorized' });
  }
}
    
   

   
 