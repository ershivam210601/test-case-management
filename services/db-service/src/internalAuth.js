module.exports = function internalAuth(req, res, next) {
  const key = req.header('x-internal-api-key');
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized internal call' });
  }
  next();
};
