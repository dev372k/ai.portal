import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/response.js";

// ✅ Authenticate JWT OR Admin Header
export const authGuard = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ✅ ADD THIS BLOCK (admin mock support)
  if (req.headers["x-admin"] === "true") {
    req.user = {
      role: "admin"
    };
    return next();
  }

  // ⬇️ KEEP EVERYTHING BELOW SAME
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(res, "Unauthorized access", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    return errorResponse(res, "Invalid or expired token", 401);
  }
};

// ✅ Role-based guard
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, "Unauthorized access", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, "Forbidden: Access denied", 403);
    }

    next();
  };
};
