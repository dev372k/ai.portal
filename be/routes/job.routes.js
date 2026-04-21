import express from "express";
import {
  createJob,
  getJobs,
  getSingleJob,
  updateJob,
  deleteJob,
  applyToJob,
  getMyAppliedJobs,
  getMyJobs,
  getJobApplications,
  updateApplicationStatus,
  getSingleApplication,
  getAllJobs
} from "../controllers/job.controller.js";

import {
  authGuard,
  authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = express.Router();

/* =====================================================
   CANDIDATE ROUTES
===================================================== */

router.post(
  "/apply",
  authGuard,
  authorizeRoles("candidate"),
  applyToJob
);

router.get(
  "/applied-jobs",
  authGuard,
  authorizeRoles("candidate"),
  getMyAppliedJobs
);

/* =====================================================
   EMPLOYER JOB ROUTES (STATIC FIRST)
===================================================== */

router.get(
  "/my-jobs",
  authGuard,
  authorizeRoles("employer"),
  getMyJobs
);

router.get(
  "/:jobId/applications",
  authGuard,
  authorizeRoles("employer"),
  getJobApplications
);

/* =====================================================
   APPLICATION ROUTES
===================================================== */

router.patch(
  "/applications/:id/status",
  authGuard,
  authorizeRoles("employer"),
  updateApplicationStatus
);

router.get(
  "/applications/:id",
  authGuard,
  authorizeRoles("employer"),
  getSingleApplication
);

/* =====================================================
   MAIN JOB ROUTES
===================================================== */

router.post(
  "/",
  authGuard,
  authorizeRoles("employer"),
  createJob
);

router.get("/all", authGuard, authorizeRoles("admin"), getAllJobs);

router.get(
  "/",
  authGuard,
  getJobs
);

/* =====================================================
   DYNAMIC JOB ROUTES (MUST BE LAST)
===================================================== */

router.get(
  "/:id",
  authGuard,
  getSingleJob
);

router.put(
  "/:id",
  authGuard,
  authorizeRoles("employer"),
  updateJob
);

router.delete(
  "/:id",
  authGuard,
  authorizeRoles("employer", "admin"),
  deleteJob
);
export default router;