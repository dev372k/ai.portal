<template>
  <div class="p-8 max-w-7xl mx-auto">

    <!-- HEADER -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800">
        Applicants
      </h1>
      <p class="text-gray-500 mt-2">
        Manage applicants for your job postings
      </p>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="text-gray-500">
      Loading jobs...
    </div>

    <!-- JOB CARDS -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

      <div v-for="job in jobs" :key="job._id"
        class="bg-white p-6 rounded-2xl shadow border flex flex-col justify-between">

        <div>
          <h2 class="text-lg font-bold">
            {{ job.title }}
          </h2>

          <p class="text-gray-500 mt-1">{{ job.company }}</p>

          <div class="flex flex-wrap gap-2 mt-3">
            <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              {{ job.location }}
            </span>
            <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs">
              {{ job.type }}
            </span>
            <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs">
              {{ job.experienceLevel }}
            </span>
          </div>

          <p class="text-sm text-gray-400 mt-3">
            Applicants: {{ job.applicantCount || 0 }}
          </p>
        </div>

        <button @click="openApplicantsModal(job)"
          class="mt-6 w-full px-4 py-2 border border-blue-500 text-blue-600 rounded hover:bg-blue-50 transition font-medium">
          View Applicants
        </button>

      </div>
    </div>

    <!-- ================= APPLICANTS MODAL ================= -->

    <div v-if="showApplicantsModal" class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">

      <div class="bg-white p-6 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">

        <h2 class="text-xl font-semibold mb-4">
          Applicants for {{ selectedJob?.title }}
        </h2>

        <div v-if="loadingApplicants" class="text-gray-500">
          Loading applicants...
        </div>

        <table v-else class="w-full border text-sm">

          <thead class="bg-gray-100">
            <tr>
              <th class="p-2 border text-left">Name</th>
              <th class="p-2 border text-left">Email</th>
              <th class="p-2 border text-left">Test Score</th>
              <th class="p-2 border text-left">Resume Match %</th>
              <th class="p-2 border text-left">Status</th>
              <th class="p-2 border text-left">Applied On</th>
              <th class="p-2 border text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(app, index) in applicants" :key="app._id" class="hover:bg-gray-50">

              <!-- NAME + RANK BADGE -->
              <td class="p-2 flex items-center gap-2">

                <!-- Ranking Badge -->
                <span v-if="index === 0"
                  class="px-2 py-0.5">
                  🥇
                </span>

                <span v-else-if="index === 1"
                  class="px-2 py-0.5">
                  🥈
                </span>

                <span v-else-if="index === 2"
                  class="px-2 py-0.5">
                  🥉
                </span>

                <span>
                  {{ app.user?.name }}
                </span>

              </td>

              <td class="p-2 border">
                {{ app.user?.email }}
              </td>

              <td class="p-2 border font-semibold" :class="scoreColor(app.aiOverallScore)">
                {{ app.aiOverallScore.toFixed(1) }} / 5.0
              </td>

              <td class="p-2 border font-semibold" :class="percentageColor(app.user.profileMatchPercentage)">
                {{ app.user.profileMatchPercentage }}%
              </td>

              <td class="p-2 border capitalize">
                {{ app.status }}
              </td>

              <td class="p-2 border">
                {{ formatDate(app.createdAt) }}
              </td>

              <td class="p-2 border space-x-2">

                <button @click="updateStatus(app._id, 'accepted')"
                  class="px-3 py-1 bg-green-600 text-white rounded text-xs">
                  Accept
                </button>

                <button @click="updateStatus(app._id, 'rejected')"
                  class="px-3 py-1 bg-red-600 text-white rounded text-xs">
                  Reject
                </button>

              </td>

            </tr>

            <tr v-if="applicants.length === 0">
              <td colspan="6" class="p-4 text-center text-gray-500">
                No applicants yet
              </td>
            </tr>

          </tbody>
        </table>

        <div class="flex justify-end mt-6">
          <button @click="closeApplicantsModal" class="px-4 py-2 bg-gray-300 rounded">
            Close
          </button>
        </div>

      </div>
    </div>

    <!-- ================= APPLICATION DETAILS MODAL ================= -->

    <div v-if="showApplicationDetails" class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">

      <div class="bg-white p-6 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

        <h2 class="text-xl font-semibold mb-4">
          Application Details
        </h2>

        <div v-for="(qa, index) in selectedApplication?.answers" :key="index" class="mb-6">

          <p class="font-medium">
            {{ index + 1 }}. {{ qa.question }}
          </p>

          <p class="text-gray-700 mt-2">
            {{ qa.answer }}
          </p>

          <p class="text-sm mt-1 text-blue-600">
            Score: {{ qa.grade }}/5
          </p>

        </div>

        <div class="flex justify-end">
          <button @click="closeApplicationDetails" class="px-4 py-2 bg-gray-300 rounded">
            Close
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL + "/api";
const token = localStorage.getItem("auth_token");

const jobs = ref([]);
const loading = ref(false);

const showApplicantsModal = ref(false);
const showApplicationDetails = ref(false);

const selectedJob = ref(null);
const applicants = ref([]);
const selectedApplication = ref(null);
const loadingApplicants = ref(false);

/* ================= FETCH JOBS ================= */

onMounted(fetchJobs);

async function fetchJobs() {
  loading.value = true;
  const res = await axios.get(`${API}/jobs/my-jobs`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  jobs.value = res.data.data;
  loading.value = false;
}

/* ================= FETCH APPLICANTS ================= */

async function openApplicantsModal(job) {
  selectedJob.value = job;
  showApplicantsModal.value = true;

  loadingApplicants.value = true;

  const res = await axios.get(
    `${API}/jobs/${job._id}/applications`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  applicants.value = res.data.data;
  loadingApplicants.value = false;
}

function closeApplicantsModal() {
  showApplicantsModal.value = false;
  applicants.value = [];
}

/* ================= VIEW APPLICATION ================= */

async function viewApplication(id) {
  const res = await axios.get(
    `${API}/jobs/applications/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  selectedApplication.value = res.data.data;
  showApplicationDetails.value = true;
}

function closeApplicationDetails() {
  showApplicationDetails.value = false;
}

/* ================= UPDATE STATUS ================= */

async function updateStatus(id, status) {
  await axios.patch(
    `${API}/jobs/applications/${id}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const app = applicants.value.find(a => a._id === id);
  if (app) app.status = status;
}

/* ================= UTIL ================= */

function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

function scoreColor(score) {
  if (score >= 4) return "text-green-600";
  if (score >= 2) return "text-yellow-600";
  return "text-red-600";
}

function percentageColor(score) {
  const value = Number(score) || 0;

  if (value >= 80) {
    return "text-green-600 font-semibold";
  }

  if (value >= 50) {
    return "text-amber-500 font-semibold";
  }

  return "text-red-600 font-semibold";
}
</script>

<style scoped>
th,
td {
  border-color: #e5e7eb;
}
</style>