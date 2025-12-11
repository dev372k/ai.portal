import express from "express";
import multer from "multer";
import {
auth,callback,getToken,upload_resume
} from "../controllers/user.controller.js";

import {
    authGuard, authorizeRoles
} from "../middlewares/authMiddleware.js";
const router = express.Router();
const upload = multer({ dest: "uploads/" }); 


router.get("/auth/linkedin", auth);
router.get("/auth/linkedin/callback", callback);
router.get("/get-token", getToken);
router.post("/upload_resume", upload.single('file'), upload_resume);

export default router;
