import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    company: { type: String, required: true },
    location: {
      type: String,
      enum: ["Remote", "On-site", "Hybrid"],
      default: "On-site"
    },
    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Temporary"],
      default: "Full-time"
    },
    skills: { type: [String], default: [] },
    experienceLevel: {
      type: String,
      enum: ["Entry", "Mid", "Senior", "Lead"],
      default: "Entry"
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    applyUrl: String,
    aiQuestions: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

export const Job = mongoose.model("Job", jobSchema);