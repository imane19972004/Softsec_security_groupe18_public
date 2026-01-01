export async function register(req, res, next) {
  try {
    // Auth complète en Semaine 2 (Membre B)
    res.status(501).json({
      message: "Auth not implemented yet"
    });
  } catch (err) {
    next(err);
  }
}
