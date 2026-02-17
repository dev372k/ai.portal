<template>
  <div class="max-w-6xl mx-auto p-8">

    <h1 class="text-3xl font-bold text-gray-800 mb-8">My Profile</h1>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div class="animate-pulse flex gap-6 items-center">
        <div class="w-28 h-28 bg-gray-300 rounded-full"></div>
        <div class="flex-1 space-y-2">
          <div class="h-6 bg-gray-300 rounded w-3/4"></div>
          <div class="h-4 bg-gray-300 rounded w-1/2"></div>
          <div class="h-4 bg-gray-300 rounded w-1/3"></div>
        </div>
      </div>
      <div class="h-48 bg-gray-300 rounded"></div>
    </div>

    <div v-else class="grid md:grid-cols-2 gap-8">

      <!-- ================= LEFT CARD ================= -->
      <div class="bg-white shadow-lg rounded-xl p-6 flex flex-col gap-4">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">
          Personal Details
        </h2>

        <div class="flex flex-col items-center gap-4">
          <img
            :src="user.profilePic || '/default-avatar.png'"
            class="w-28 h-28 rounded-full object-cover shadow-md"
          />

          <div class="text-center">
            <h3 class="text-lg font-semibold text-gray-800">
              {{ user.name }}
            </h3>
            <p class="text-gray-500">{{ user.email }}</p>
            <p class="text-gray-500 capitalize">{{ user.role }}</p>
          </div>
        </div>

        <!-- Profile Warning -->
        <div
          v-if="user.role === 'candidate' && !user.isProfileCompleted"
          class="bg-yellow-50 text-yellow-700 border border-yellow-300 rounded-xl mt-4 p-4 text-sm"
        >
          <p class="font-semibold">⚠ Profile Not Completed</p>
        </div>

        <!-- ✅ AI SUMMARY -->
        <div
          v-if="user.role === 'candidate' && user.summary && user.summary.length"
          class="bg-gray-50 border rounded-lg p-4 text-sm text-gray-700 mt-4"
        >
          <h3 class="font-semibold mb-2 text-gray-800">
            AI Resume Analysis
          </h3>
          <p class="leading-relaxed whitespace-pre-line">
            {{ user.summary }}
          </p>
        </div>
      </div>

      <!-- ================= RIGHT CARD ================= -->
      <div
        v-if="user.role === 'candidate'"
        class="bg-white shadow-lg rounded-xl p-6 flex flex-col gap-6"
      >

        <div>
          <h2 class="text-xl font-semibold text-gray-800 mb-2">
            Resume & LinkedIn
          </h2>
          <p class="text-sm text-gray-500">
            Upload your resume and compare it with LinkedIn profile.
          </p>
        </div>

        <!-- MATCH SCORE -->
        <div class="flex flex-col gap-2">

          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-gray-700">
              Profile Match Score
            </span>
            <span :class="matchColor(matchPercentage)" class="font-semibold text-sm">
              {{ matchPercentage }}%
            </span>
          </div>

          <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              class="h-3 rounded-full transition-all duration-500"
              :class="matchBarColor(matchPercentage)"
              :style="{ width: matchPercentage + '%' }"
            ></div>
          </div>

          <span class="text-xs font-medium" :class="matchColor(matchPercentage)">
            {{ matchLabel(matchPercentage) }}
          </span>
        </div>

        <!-- FILE INFO -->
        <div
          v-if="user.resumeFileName"
          class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm"
        >
          <p class="text-blue-700 font-medium">
            📄 Uploaded Resume
          </p>
          <p class="text-gray-700 mt-1">
            {{ user.resumeFileName }}
          </p>
          <p
            v-if="user.resumeUpdatedAt"
            class="text-xs text-gray-500 mt-2"
          >
            Last updated:
            {{ formatDate(user.resumeUpdatedAt) }}
          </p>
        </div>

        <!-- LINKEDIN INPUT -->
        <div class="flex flex-col gap-2">
          <label class="font-medium text-gray-700">
            LinkedIn Profile URL
          </label>
          <input
            type="text"
            v-model="linkedInUrl"
            class="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <!-- FILE INPUT -->
        <div class="flex flex-col gap-2">
          <label class="font-medium text-gray-700">
            Upload Resume
          </label>

          <input
            type="file"
            @change="handleResumeUpload"
            accept=".pdf"
            class="border border-gray-300 rounded-lg p-2 w-full cursor-pointer"
          />

          <p v-if="resumeFile" class="text-gray-500 text-sm">
            Selected file: {{ resumeFile.name }}
          </p>
        </div>

        <!-- SAVE BUTTON -->
        <button
          :disabled="saving"
          class="mt-auto py-3 rounded-xl font-semibold transition"
          :class="saving
            ? 'bg-blue-400 text-white cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'"
          @click="saveProfile"
        >
          {{ saving ? "Saving..." : "Save Changes" }}
        </button>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import axios from "axios";

/* ================= STATE ================= */

const loading = ref(true);
const saving = ref(false);
const matchPercentage = ref(0);

const user = ref({});
const linkedInUrl = ref("");
const resumeFile = ref(null);

const API_BASE = "http://localhost:3000/api/users";

/* ================= LOAD USER ================= */

onMounted(() => {
  const storedUser = localStorage.getItem("user");

  if (storedUser) {
    const parsed = JSON.parse(storedUser);

    if (!parsed.summary) parsed.summary = "";

    user.value = parsed;
    linkedInUrl.value = parsed.linkedInUrl || "";
    matchPercentage.value = parsed.profileMatchPercentage || 0;
  }

  loading.value = false;
});

/* ================= FILE HANDLER ================= */

function handleResumeUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.name.endsWith(".pdf")) return;

  resumeFile.value = file;
}


/* ================= SAVE PROFILE ================= */

async function saveProfile() {
  if (!resumeFile.value) return;

  saving.value = true;

  try {
    const token = localStorage.getItem("auth_token");

    const formData = new FormData();
    formData.append("resume", resumeFile.value);
    formData.append("linkedInUrl", linkedInUrl.value);

    const response = await axios.post(
      `${API_BASE}/upload_resume`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const updatedUser = response.data.data.user;

    user.value = updatedUser;

    matchPercentage.value = updatedUser.profileMatchPercentage || 0;

    localStorage.setItem("user", JSON.stringify(updatedUser));


    await nextTick();

  } catch (err) {
    console.error(err);
  } finally {
    saving.value = false;
  }
}

/* ================= HELPERS ================= */

function formatDate(date) {
  return new Date(date).toLocaleString();
}

function matchColor(value) {
  if (value >= 80) return "text-green-600";
  if (value >= 50) return "text-yellow-600";
  return "text-red-600";
}

function matchBarColor(value) {
  if (value >= 80) return "bg-green-500";
  if (value >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function matchLabel(value) {
  if (value >= 80) return "Strong Alignment";
  if (value >= 50) return "Moderate Alignment";
  return "Low Alignment – Improve Resume";
}
</script>