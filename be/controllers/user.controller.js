import axios from "axios";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
// import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";


import fs from "fs";
import crypto from "crypto";
import { successResponse } from "../utils/response.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { User } from "../models/user.model.js";

import OpenAI from "openai";

dotenv.config();

const LINKED_CLIENT_ID = process.env.LINKED_CLIENT_ID;
const LINKED_CLIENT_SECRET = process.env.LINKED_CLIENT_SECRET;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;
const REDIRECT_URI = process.env.BACKEND_URL + "/api/users/auth/linkedin/callback";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// /auth/linkedin
export const auth = asyncHandler(async (req, res) => {
    const scope = "profile email openid";
    const state = req.query.user
    console.log("Initiating LinkedIn OAuth flow for user type:", state);
    const authURL = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKED_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
    )}&state=${state}&scope=${encodeURIComponent(scope)}`;

    res.redirect(authURL);
});

export const upload_resume_obselete = asyncHandler(async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            message: "No file uploaded"
        });
    }

    // 1️⃣ Extract PDF Text
    const data = new Uint8Array(
        fs.readFileSync(req.file.path)
    );

    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        fullText += strings.join(" ") + "\n";
    }

    // Remove file after reading
    fs.unlinkSync(req.file.path);

    // 2️⃣ Get User
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    // 3️⃣ Fetch LinkedIn Data
    let linkedInSummary = "";

    if (user.linkedInUrl) {
        linkedInSummary = await fetchLinkedInData(user.linkedInUrl);
    }

    // 4️⃣ Calculate Match %
    let percentage = 0;

    if (linkedInSummary && fullText) {
        percentage = await calculateMatch(
            linkedInSummary,
            fullText
        );
    }

    // 5️⃣ Update User Profile
    user.resumeText = fullText;
    user.linkedInResumeText = linkedInSummary;
    user.profileMatchPercentage = Number(percentage.percentage);
    user.isProfileCompleted = true;
    user.summary = percentage.summary;
    user.resumeFileName = req.file.originalname;

    await user.save();

    successResponse(
        res,
        {
            user : user
        },
        "Resume uploaded and profile updated successfully"
    );
});

export const upload_resume = asyncHandler(async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded"
            });
        }

        // ✅ Get file buffer directly (memoryStorage)
        const buffer = req.file.buffer;

        // ✅ ESM-safe import
        const { default: pdf } = await import("pdf-parse");

        const pdfData = await pdf(buffer);
        const fullText = pdfData.text?.trim() || "";

        if (!fullText) {
            return res.status(400).json({
                message: "Could not extract text from PDF"
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        let linkedInSummary = "";

        if (user.linkedInUrl) {
            linkedInSummary = await fetchLinkedInData(user.linkedInUrl);
        }

        let percentageResult = {
            percentage: 0,
            summary: ""
        };

        if (linkedInSummary && fullText) {
            percentageResult = await calculateMatch(
                linkedInSummary,
                fullText
            );
        }

        user.resumeText = fullText;
        user.linkedInResumeText = linkedInSummary;
        user.profileMatchPercentage = Number(percentageResult.percentage || 0);
        user.summary = percentageResult.summary || "";
        user.resumeFileName = req.file.originalname;
        user.isProfileCompleted = true;

        await user.save();

        return successResponse(
            res,
            { user },
            "Resume uploaded and profile updated successfully"
        );

    } catch (error) {

        console.error("Resume Upload Error:", error);

        return res.status(500).json({
            message: "Something went wrong while processing resume",
            error: error.message
        });
    }
});

// 2) LinkedIn redirects here with "code"
// /auth/linkedin/callback
export const callback = asyncHandler(async (req, res) => {
    console.log("Callback received:", req.query);

    const { code, state, error, error_description } = req.query;

    // Handle errors from LinkedIn
    if (error) {
        return res.status(400).send({
            error,
            error_description
        });
    }
    // Verify state to prevent CSRF attacks
    if (state !== "candidate" && state !== "employer") {
        return res.status(400).send("State mismatch - possible CSRF attack");
    }

    if (!code) {
        return res.status(400).send("No authorization code received");
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            null,
            {
                params: {
                    grant_type: "authorization_code",
                    code,
                    redirect_uri: REDIRECT_URI,
                    client_id: LINKED_CLIENT_ID,
                    client_secret: LINKED_CLIENT_SECRET,
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const accessToken = tokenResponse.data.access_token;
        console.log("Access token obtained:", accessToken.substring(0, 20) + "...");

        // === Fetch basic profile using the new API ===
        const profileRes = await axios.get(
            "https://api.linkedin.com/v2/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        const profileData = profileRes.data;
        const token = crypto.randomBytes(8).toString("hex");

        const user = await User.findOneAndUpdate(
            { email: profileData.email },
            {
                $set: {
                    name: profileData.name,
                    email: profileData.email,
                    linkedInToken: accessToken,
                    loginToken: token,
                    profilePic: profileData.picture
                },
                $setOnInsert: {
                    role: state
                }
            },
            { upsert: true, new: true }
        );

        res.redirect(process.env.FRONTEND_URL + "/loginSuccess?token=" + token);

    } catch (err) {
        console.error("Error details:", err.response?.data || err.message);
        res.status(500).send({
            error: "Authentication failed",
            details: err.response?.data || err.message
        });
    }
});

async function calculateMatch(linkedInText, resumeText) {
  try {
    const response = await axios.post(
      "https://sharp-gpt.ai/PostAPIRequest",
      {
        inputPrompt: "Compare Resume and LinkedIn profile",
        ChatMessage: [
          {
            role: "system",
            content:
              "You are a resume analyzer. Compare the LinkedIn profile text with the resume text and return ONLY valid JSON. No markdown. Format: {\"percentage\":0,\"summary\":\"\"}. Percentage should represent similarity from 0 to 100."
          },
          {
            role: "user",
            content: JSON.stringify({
              linkedInProfile: linkedInText,
              resume: resumeText
            })
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
    return finalJSON; // { percentage: 78, summary: "..." }

  } catch (error) {
    console.error("AI Match Error:", error.message);
    return { percentage: 0, summary: "Evaluation failed" };
  }
}

async function fetchLinkedInData(linkedInURL) {
    try {
        const data = { link: linkedInURL };

        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://realtime-linkedin-fresh-data.p.rapidapi.com/person',
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data)
        };

        const response = await axios.request(config);
        // Summarize the LinkedIn data using your function
        const linkedInSummary = summarizeLinkedIn(response.data);

        return linkedInSummary;

    } catch (error) {
        console.error("Error fetching LinkedIn data:", error.response?.data || error.message);
        return "Error fetching LinkedIn data";
    }
}

function summarizeLinkedIn(linkedInResponse) {
    const data = linkedInResponse.data || {};

    // About section
    const aboutText = data.about || "";

    // Experiences
    const experiences = data.experiences || [];
    const experienceText = experiences
        .map(exp => {
            const title = exp.title || "";
            const company = exp.companyName || exp.subtitle || "";
            const duration = exp.caption || "";
            return `${title} at ${company} (${duration})`;
        })
        .join("; ");

    // Education
    const educations = data.educations || [];
    const educationText = educations
        .map(ed => {
            const degree = ed.subtitle || "";
            const school = ed.schoolName || ed.title || "";
            const duration = ed.caption || "";
            return `${degree} from ${school} (${duration})`;
        })
        .join("; ");

    // Combine all
    const summary = `About: ${aboutText}. Experience: ${experienceText}. Education: ${educationText}.`;

    return summary;
}

export const getToken = asyncHandler(async (req, res) => {
    const { token } = req.query;

    const user = await User.findOne({ loginToken: token });
    if (!user) throw new Error("Invalid email or password");
    
    const jwtToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );

    successResponse(res, { jwtToken, user }, "Login successful");
});