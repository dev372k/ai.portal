import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/user.routes.js";
import jobRoutes from "./routes/job.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ==========================================
   MONGODB CACHED CONNECTION
========================================== */

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/* ==========================================
   ROUTES
========================================== */

app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);

app.get("/", (req, res) => {
  res.send("App is running...");
});

/* ==========================================
   LOCAL DEVELOPMENT SUPPORT
========================================== */

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;

  connectDB().then(() => {
    app.listen(PORT, () =>
      console.log(`🚀 Server running locally on port ${PORT}`)
    );
  });
}

/* ==========================================
   VERCEL SERVERLESS EXPORT
========================================== */

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}