import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: { type: String, enum: ['candidate', 'employer'], default: 'candidate' },
    isProfileCompleted: { type: Boolean, default: false },
    profilePic: String,
    linkedInUrl: String,
    linkedInToken: String,
    loginToken: String,
    resumeText: String,
    linkedInResumeText: String,
    profileMatchPercentage: Number,
});

export const User = mongoose.model("user", userSchema);
