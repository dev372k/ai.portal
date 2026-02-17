import express from "express";
import multer from "multer";

import {
  auth,
  callback,
  getToken,
  upload_resume
} from "../controllers/user.controller.js";

import {
  authGuard
} from "../middlewares/authMiddleware.js";

const router = express.Router();

/* =====================================================
   MULTER CONFIGURATION
===================================================== */

// Store files temporarily in /uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF
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
  authGuard,                  // 🔐 must be logged in
  upload.single("resume"),    // 🔥 MUST match frontend field name
  upload_resume
);

export default router;