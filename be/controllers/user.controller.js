import axios from "axios";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";
import crypto from "crypto";
import { successResponse } from "../utils/response.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { User } from "../models/user.model.js";


import OpenAI from "openai";
// import { PineconeClient } from "@pinecone-database/pinecone";

// const pinecone = new PineconeClient();
// await pinecone.init({
//   apiKey: process.env.PINECONE_API_KEY,
//   environment: process.env.PINECONE_ENVIRONMENT,
// });

// const index = pinecone.Index("linkedin-resume-match");


dotenv.config();

const LINKED_CLIENT_ID = process.env.LINKED_CLIENT_ID;
const LINKED_CLIENT_SECRET = process.env.LINKED_CLIENT_SECRET;
const REDIRECT_URI = process.env.BACKEND_URL + "/api/users/auth/linkedin/callback";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// /auth/linkedin
export const auth = asyncHandler(async (req, res) => {
    const scope = "profile email openid";
    const state = req.query.user

    const authURL = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKED_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
    )}&state=${state}&scope=${encodeURIComponent(scope)}`;

    res.redirect(authURL);
});

export const upload_resume = asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).send({ error: "No file uploaded" });

    const data = new Uint8Array(fs.readFileSync(req.file.path));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        fullText += strings.join(" ") + "\n";
    }

    fs.unlinkSync(req.file.path);
    const linkedInData = await fetchLinkedInData("https://www.linkedin.com/in/owais372k/")
    const percentage = await calculateMatch(linkedInData, fullText)

    successResponse(res, { profile_matched: percentage }, "PDF parsed successfully (pdfjs-dist)");
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
                    isProfileCompleted: false,
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

async function getEmbedding(text) {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small", // or text-embedding-3-large for more accuracy
        input: text,
    });
    return response.data[0].embedding;
}

// async function storeInPinecone(id, embedding) {
//   await index.upsert({
//     upsertRequest: {
//       vectors: [{ id, values: embedding }],
//     },
//   });
// }

function cosineSimilarity(vecA, vecB) {
    const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    return dot / (magA * magB);
}

async function calculateMatch(linkedInText, resumeText) {
    const linkedInEmbedding = await getEmbedding(linkedInText);
    const resumeEmbedding = await getEmbedding(resumeText);

    const similarity = cosineSimilarity(linkedInEmbedding, resumeEmbedding);
    const percentage = (similarity * 100).toFixed(2);
    return percentage;
}

async function fetchLinkedInData(linkedInURL) {
    try {
        const data = { link: linkedInURL };

        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://realtime-linkedin-fresh-data.p.rapidapi.com/person',
            headers: {
                'x-rapidapi-key': 'bced091194msh291021e27e760d7p1b5f00jsn82b5a498a10b',
                'x-rapidapi-host': 'realtime-linkedin-fresh-data.p.rapidapi.com/calculate',
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

    const user = await User.find({ loginToken: token });
    if (!user) throw new Error("Invalid email or password");

    const jwtToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );

    successResponse(res, { jwtToken, user }, "Login successful");
});