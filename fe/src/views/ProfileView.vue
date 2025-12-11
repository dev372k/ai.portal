<template>
  <div class="max-w-6xl mx-auto p-8">

    <h1 class="text-3xl font-bold text-gray-800 mb-8">My Profile</h1>

    <!-- Loading Skeleton -->
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

    <!-- Profile Sections -->
    <div v-else class="grid md:grid-cols-2 gap-8">

      <!-- Section 1: Personal Details -->
      <div class="bg-white shadow-lg rounded-xl p-6 flex flex-col gap-4">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Personal Details</h2>

        <div class="flex flex-col items-center gap-4">
          <img :src="user.profilePic || '/default-avatar.png'"
               class="w-28 h-28 rounded-full object-cover shadow-md" />

          <div class="text-center">
            <h3 class="text-lg font-semibold text-gray-800">{{ user.name }}</h3>
            <p class="text-gray-500">{{ user.email }}</p>
            <p class="text-gray-500 capitalize">{{ user.role }}</p>
          </div>
        </div>

        <!-- Profile Completed Alert -->
        <div v-if="user.role === 'candidate' && !user.isProfileCompleted"
             class="bg-yellow-50 text-yellow-700 border border-yellow-300 rounded-xl mt-4 p-4 text-sm flex flex-col gap-2">
          <p class="font-semibold">⚠ Profile Not Completed</p>
        </div>
      </div>

      <!-- Section 2: Resume & LinkedIn (Only for candidates) -->
      <div v-if="user.role === 'candidate'"
           class="bg-white shadow-lg rounded-xl p-6 flex flex-col gap-4">

        <h2 class="text-xl font-semibold text-gray-800 mb-4">Resume & LinkedIn</h2>

        <!-- LinkedIn Profile Input -->
        <div class="flex flex-col gap-2">
          <label class="font-medium text-gray-700">LinkedIn Profile URL</label>
          <input
            type="text"
            v-model="linkedInId"
            placeholder="Enter LinkedIn Profile ID"
            class="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>

        <!-- Resume Upload -->
        <div class="flex flex-col gap-2">
          <label class="font-medium text-gray-700">Upload Resume</label>
          <input
            type="file"
            @change="handleResumeUpload"
            accept=".pdf,.doc,.docx"
            class="border border-gray-300 rounded-lg p-2 w-full cursor-pointer"
          />
          <p v-if="resumeFile" class="text-gray-500 text-sm">
            Selected file: {{ resumeFile.name }}
          </p>
        </div>

        <!-- Save Changes -->
        <button
          class="mt-auto bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
          @click="saveProfile"
        >
          Save Changes
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

// Loading state
const loading = ref(true);

// User
const user = ref({});

// Resume + LinkedIn fields
const linkedInId = ref("");
const resumeFile = ref(null);

onMounted(() => {
  setTimeout(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"))[0];
    user.value = storedUser || {};

    // Only show LinkedIn token if candidate
    linkedInId.value = user.value.role === "candidate" ? (user.value.linkedInToken || "") : "";

    loading.value = false;
  }, 800);
});

function handleResumeUpload(event) {
  const file = event.target.files[0];
  if (file) resumeFile.value = file;
}

function saveProfile() {
  console.log("LinkedIn ID:", linkedInId.value);
  console.log("Resume File:", resumeFile.value);
  alert("Profile saved! (API integration pending)");
}
</script>
