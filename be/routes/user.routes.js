import express from "express";
import multer from "multer";

import {
  auth,
  callback,
  getToken,
  upload_resume
} from "../controllers/user.controller.js";

import { authGuard } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* =====================================================
   MULTER CONFIGURATION (VERCEL SAFE)
===================================================== */

// ✅ Use memory storage (NO filesystem usage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"), false);
    }
    cb(null, true);
  }
});

/* =====================================================
   LINKEDIN AUTH
===================================================== */

router.get("/auth/linkedin", auth);
router.get("/auth/linkedin/callback", callback);

/* =====================================================
   TOKEN EXCHANGE
===================================================== */

router.get("/get-token", getToken);

/* =====================================================
   RESUME UPLOAD (PROTECTED)
===================================================== */

router.post(
  "/upload_resume",
  authGuard,
  upload.single("resume"), // must match frontend field name
  upload_resume
);

export default router;