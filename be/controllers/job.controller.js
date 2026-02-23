import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import axios from "axios";

/* =====================================================
   ASYNC HANDLER
===================================================== */

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* =====================================================
   CREATE JOB (EMPLOYER ONLY)
===================================================== */

export const createJob = asyncHandler(async (req, res) => {

  if (req.user.role !== "employer") {
    return res.status(403).json({ message: "Only employers can post jobs" });
  }

  const { title, description, company, location, type, skills, applyUrl } = req.body;

  if (!title || !description || !company) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const aiQuestions = await generateJobQuestions(description, skills);

  const job = await Job.create({
    title,
    description,
    company,
    location,
    type,
    skills,
    applyUrl,
    postedBy: req.user.id,
    aiQuestions
  });

  res.status(201).json({
    success: true,
    data: job
  });
});

/* =====================================================
   GET JOBS (ROLE BASED)
===================================================== */

export const getJobs = asyncHandler(async (req, res) => {

  let jobs;

  if (req.user.role === "employer") {

    jobs = await Job.find({ postedBy: req.user.id }).lean();

    const jobIds = jobs.map(job => job._id);

    const applications = await Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: "$jobId", count: { $sum: 1 } } }
    ]);

    const applicationMap = {};
    applications.forEach(a => {
      applicationMap[a._id.toString()] = a.count;
    });

    jobs = jobs.map(job => ({
      ...job,
      applicationsCount: applicationMap[job._id.toString()] || 0
    }));

  } else {

    jobs = await Job.find({ isActive: true }).lean();

    const userApplications = await Application.find({
      userId: req.user.id
    }).select("jobId");

    const appliedJobIds = userApplications.map(a =>
      a.jobId.toString()
    );

    jobs = jobs.map(job => ({
      ...job,
      isApplied: appliedJobIds.includes(job._id.toString())
    }));
  }

  res.json({
    success: true,
    data: jobs
  });
});

/* =====================================================
   GET SINGLE JOB
===================================================== */

export const getSingleJob = asyncHandler(async (req, res) => {

  const job = await Job.findById(req.params.id)
    .populate("postedBy", "name email");

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  res.json({
    success: true,
    data: job
  });
});

/* =====================================================
   UPDATE JOB (OWNER ONLY)
===================================================== */

export const updateJob = asyncHandler(async (req, res) => {

  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  if (job.postedBy.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const oldDescription = job.description;
  const newDescription = req.body.description;

  Object.assign(job, req.body);

  if (
    newDescription &&
    newDescription.trim() !== oldDescription.trim()
  ) {
    const newQuestions = await generateJobQuestions(newDescription);
    job.aiQuestions = newQuestions;
  }

  await job.save();

  res.json({
    success: true,
    data: job
  });
});

/* =====================================================
   DELETE JOB (OWNER ONLY)
===================================================== */

export const deleteJob = asyncHandler(async (req, res) => {

  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  if (job.postedBy.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  await job.deleteOne();

  res.json({
    success: true,
    message: "Job deleted successfully"
  });
});

/* =====================================================
   APPLY TO JOB (CANDIDATE ONLY)
   WITH SAFE AI SCORE NORMALIZATION
===================================================== */

export const applyToJob = asyncHandler(async (req, res) => {

  if (req.user.role !== "candidate") {
    return res.status(403).json({ message: "Only candidates can apply" });
  }

  const { jobId, answers } = req.body;

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({
      message: "Answers are required"
    });
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  /* ================= AI EVALUATION ================= */

  const aiResult = await evaluateApplicationAnswers(
    job.description,
    answers
  );

  if (!aiResult || !aiResult.results) {
    return res.status(500).json({
      message: "AI evaluation failed"
    });
  }

  /* ================= MERGE GRADES ================= */

  const gradedAnswers = answers.map((ans) => {
    const aiMatch = aiResult.results.find(
      r => r.question === ans.question
    );

    return {
      question: ans.question,
      answer: ans.answer,
      grade: aiMatch ? Number(aiMatch.grade) : 0
    };
  });

  /* ================= SAFE SCORE NORMALIZATION ================= */

  let overallScore = Number(aiResult.overallScore) || 0;

  const totalQuestions = gradedAnswers.length;

  // If AI accidentally returned total score instead of average
  if (overallScore > 5 && totalQuestions > 0) {
    overallScore = overallScore / totalQuestions;
  }

  // Clamp safely between 0 and 5
  const safeScore = Math.min(5, Math.max(0, overallScore));

  /* ================= SAVE APPLICATION ================= */

  try {
    const application = await Application.create({
      userId: req.user.id,
      jobId,
      answers: gradedAnswers,
      aiOverallScore: safeScore
    });

    res.status(201).json({
      success: true,
      message: "Application submitted and AI evaluated successfully",
      data: application
    });

  } catch (error) {

    // Handle duplicate application safely
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Already applied to this job"
      });
    }

    console.error("Application Error:", error);
    res.status(500).json({
      message: "Something went wrong"
    });
  }
});
/* =====================================================
   GET MY APPLIED JOBS (CANDIDATE)
===================================================== */

export const getMyAppliedJobs = asyncHandler(async (req, res) => {

  if (req.user.role !== "candidate") {
    return res.status(403).json({
      message: "Only candidates can view applied jobs"
    });
  }

  const applications = await Application.find({
    userId: req.user.id
  })
    .populate("jobId", "title company location type isActive")
    .sort({ createdAt: -1 })
    .lean();

  const formatted = applications.map(app => ({
    applicationId: app._id,
    status: app.status,
    appliedAt: app.createdAt,
    job: app.jobId
  }));

  res.json({
    success: true,
    data: formatted
  });
});

/* =====================================================
   WITHDRAW APPLICATION
===================================================== */

export const withdrawApplication = asyncHandler(async (req, res) => {

  const application = await Application.findById(req.params.id);

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  if (application.userId.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  await application.deleteOne();

  res.json({
    success: true,
    message: "Application withdrawn successfully"
  });
});


/* =====================================================
   GET MY JOBS (EMPLOYER)
===================================================== */

export const getMyJobs = asyncHandler(async (req, res) => {

  if (req.user.role !== "employer") {
    return res.status(403).json({
      message: "Only employers can view their jobs"
    });
  }

  const jobs = await Job.find({ postedBy: req.user.id })
    .lean();

  const jobIds = jobs.map(job => job._id);

  const applications = await Application.aggregate([
    { $match: { jobId: { $in: jobIds } } },
    { $group: { _id: "$jobId", count: { $sum: 1 } } }
  ]);

  const appMap = {};
  applications.forEach(a => {
    appMap[a._id.toString()] = a.count;
  });

  const formatted = jobs.map(job => ({
    ...job,
    applicantCount: appMap[job._id.toString()] || 0
  }));

  res.json({
    success: true,
    data: formatted
  });
});

/* =====================================================
   GET APPLICATIONS FOR A JOB (EMPLOYER ONLY)
   WITH WEIGHTED FINAL RANKING
===================================================== */

export const getJobApplications = asyncHandler(async (req, res) => {

  const { jobId } = req.params;

  const job = await Job.findById(jobId);

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  if (job.postedBy.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const applications = await Application.find({ jobId }).lean();

  const formatted = [];

  for (const app of applications) {

    const user = await User.findById(app.userId)
      .select("-password")
      .lean();

    const aiScore = app.aiOverallScore || 0;
    const resumeMatch = user?.profileMatchPercentage || 0;

    // 🔥 Weighted Score Calculation
    const aiWeighted = (aiScore / 5) * 70;       // 70% weight
    const resumeWeighted = resumeMatch * 0.30;   // 30% weight

    const finalScore = aiWeighted + resumeWeighted;

    formatted.push({
      _id: app._id,
      user: user || null,
      aiOverallScore: aiScore,
      profileMatchPercentage: resumeMatch,
      finalScore: Number(finalScore.toFixed(2)),
      status: app.status,
      createdAt: app.createdAt
    });
  }

  // 🔥 Sort by FINAL SCORE (highest first)
  formatted.sort((a, b) => b.finalScore - a.finalScore);

  res.json({
    success: true,
    data: formatted
  });
});

/* =====================================================
   GET SINGLE APPLICATION DETAILS
===================================================== */

export const getSingleApplication = asyncHandler(async (req, res) => {

  const application = await Application.findById(req.params.id)
    // .populate("userId", "name email")
    // .populate("jobId", "title");

  if (!application) {
    return res.status(404).json({
      message: "Application not found"
    });
  }

  if (application.jobId.postedBy.toString() !== req.user.id) {
    return res.status(403).json({
      message: "Not authorized"
    });
  }

  res.json({
    success: true,
    data: application
  });
});

/* =====================================================
   UPDATE APPLICATION STATUS (EMPLOYER)
===================================================== */

export const updateApplicationStatus = asyncHandler(async (req, res) => {

  const { status } = req.body;

  if (!["accepted", "rejected", "reviewed"].includes(status)) {
    return res.status(400).json({
      message: "Invalid status"
    });
  }

  const application = await Application.findById(req.params.id);

  if (!application) {
    return res.status(404).json({
      message: "Application not found"
    });
  }

  const job = await Job.findById(application.jobId);

  if (!job) {
    return res.status(404).json({
      message: "Job not found"
    });
  }

  if (job.postedBy.toString() !== req.user.id) {
    return res.status(403).json({
      message: "Not authorized"
    });
  }

  application.status = status;
  await application.save();

  res.json({
    success: true,
    data: application
  });
});
/* =====================================================
   AI QUESTION GENERATOR
===================================================== */

async function generateJobQuestions(job_description, skills = "") {
  try {
    const response = await axios.post(
      "https://sharp-gpt.ai/PostAPIRequest",
      {
        inputPrompt: job_description + " Skills required: " + skills,
        ChatMessage: [
          { role: "user", content: "" },
          {
            role: "system",
            content:
              "generate 10 technical questions related to job description also keep them short. Return ONLY valid JSON. Do not include markdown. Format: {\"questions\":[]}"
          }
        ],
        userResume: null
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const parsedOuter = JSON.parse(response.data.data);
    let content = parsedOuter.choices[0].message.content;

    content = content.replace(/```json|```/g, "").trim();

    const finalJSON = JSON.parse(content);

    return finalJSON.questions || [];

  } catch (error) {
    console.error("AI Question Error:", error.message);
    return [];
  }
}

/* =====================================================
   AI ANSWER EVALUATOR
===================================================== */

async function evaluateApplicationAnswers(job_description, answers) {
  try {
    const formattedQA = answers.map((item, index) => ({
      questionNumber: index + 1,
      question: item.question,
      answer: item.answer
    }));

    const response = await axios.post(
      "https://sharp-gpt.ai/PostAPIRequest",
      {
        inputPrompt: job_description,
        ChatMessage: [
          {
            role: "system",
            content:
              "You are a technical interviewer. Grade each answer from 0 to 5 based on correctness, clarity, and relevance to the job description. Return ONLY valid JSON. Do not include markdown. Format: {\"results\":[{\"question\":\"\",\"grade\":0,\"feedback\":\"\"}],\"overallScore\":0}"
          },
          {
            role: "user",
            content: JSON.stringify(formattedQA)
          }
        ],
        userResume: null
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const parsedOuter = JSON.parse(response.data.data);
    let content = parsedOuter.choices[0].message.content;

    content = content.replace(/```json|```/g, "").trim();

    const finalJSON = JSON.parse(content);

    return finalJSON;

  } catch (error) {
    console.error("AI Evaluation Error:", error.message);
    return null;
  }
}