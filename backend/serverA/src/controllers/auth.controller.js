import createAuthService from '../../../shared/services/auth.service.js';
import ReplicationService from '../../../shared/services/replicationService.js';
import config from '../config.js';

const authService = createAuthService(config.DATA_DIR);
const replicationService = new ReplicationService(
  config.PEER_SERVER_URL, config.REPLICATION_SECRET
);

async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await authService.register(email, password);

    await replicationService.replicateUserCreate({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt
    });
    
    res.status(201).json({ email: user.email });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const token = await authService.login(email, password);
    res.json({ token });
  } catch (err) {
    next(err);
  }
}

export default { register, login };
