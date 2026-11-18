const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}

function isPrivileged(user) {
  return user.role === 'admin' || user.role === 'operator';
}

async function canAccessVehicle(db, user, vehicleId) {
  if (isPrivileged(user)) return true;
  const column = user.role === 'farmer' ? 'owner_id' : 'driver_id';
  const result = await db.query(
    `SELECT 1 FROM vehicles WHERE vehicle_id = $1 AND ${column} = $2`,
    [vehicleId, user.user_id]
  );
  return result.rowCount > 0;
}

module.exports = { authenticate, allowRoles, isPrivileged, canAccessVehicle };
