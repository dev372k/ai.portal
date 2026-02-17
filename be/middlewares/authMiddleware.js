import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/response.js";

// ✅ Authenticate JWT
export const authGuard = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(res, "Unauthorized access", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT:", decoded);
    req.user = decoded; // attach user info (id, email, role, etc.)
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
    console.log("User role:", req.user, "Allowed roles:", allowedRoles);
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, "Forbidden: Access denied", 403);
    }

    next();
  };
};
