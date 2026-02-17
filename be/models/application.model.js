import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },

    answers: [
      {
        question: {
          type: String,
          required: true
        },
        answer: {
          type: String,
          required: true
        },
        grade: {
          type: Number,
          min: 0,
          max: 5,
          default: 0
        }
      }
    ],

    aiOverallScore: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

// Prevent duplicate application
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export const Application = mongoose.model("Application", applicationSchema);