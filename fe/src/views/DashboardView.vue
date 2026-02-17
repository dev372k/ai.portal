<template>
  <div class="p-8 max-w-7xl mx-auto">

    <!-- ================= HEADER ================= -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800">
        {{ isEmployer ? "Employer Dashboard" : "Candidate Dashboard" }}
      </h1>
    </div>

    <!-- ===================================================== -->
    <!-- ================= CANDIDATE DASHBOARD ================ -->
    <!-- ===================================================== -->

    <div v-if="!isEmployer">

      <!-- PROFILE CARD -->
      <div class="bg-white p-6 rounded-xl shadow mb-8">
        <h2 class="text-lg font-semibold mb-2">Profile Overview</h2>

        <p>Status:
          <span :class="user.isProfileCompleted ? 'text-green-600' : 'text-red-600'">
            {{ user.isProfileCompleted ? "Complete" : "Incomplete" }}
          </span>
        </p>

        <p>Resume Match:
          <span class="font-semibold text-blue-600">
            {{ user.profileMatchPercentage }}%
          </span>
        </p>
      </div>

      <!-- STATS -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">

        <div class="stat-card">
          <p class="stat-number">{{ mockApplications.length }}</p>
          <p>Applied</p>
        </div>

        <div class="stat-card bg-green-50">
          <p class="stat-number text-green-600">
            {{ acceptedCount }}
          </p>
          <p>Accepted</p>
        </div>

        <div class="stat-card bg-yellow-50">
          <p class="stat-number text-yellow-600">
            {{ pendingCount }}
          </p>
          <p>Pending</p>
        </div>

        <div class="stat-card bg-red-50">
          <p class="stat-number text-red-600">
            {{ rejectedCount }}
          </p>
          <p>Rejected</p>
        </div>

      </div>

      <!-- APPLICATION TABLE -->
      <div class="bg-white rounded-xl shadow p-6">
        <h2 class="text-lg font-semibold mb-4">My Applications</h2>

        <table class="w-full text-sm border">
          <thead class="bg-gray-100">
            <tr>
              <th class="p-2 border text-left">Job</th>
              <th class="p-2 border text-left">AI Score</th>
              <th class="p-2 border text-left">Final Score</th>
              <th class="p-2 border text-left">Status</th>
              <th class="p-2 border text-left">Applied On</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="app in mockApplications" :key="app._id">
              <td class="p-2 border">
                {{ app.job.title }}
              </td>

              <td class="p-2 border">
                {{ app.aiOverallScore }} / 5
              </td>

              <td class="p-2 border font-semibold">
                {{ app.finalScore }} / 100
              </td>

              <td class="p-2 border capitalize"
                  :class="statusColor(app.status)">
                {{ app.status }}
              </td>

              <td class="p-2 border">
                {{ formatDate(app.createdAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- ===================================================== -->
    <!-- ================= EMPLOYER DASHBOARD ================= -->
    <!-- ===================================================== -->

    <div v-else>

      <!-- OVERVIEW STATS -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">

        <div class="stat-card">
          <p class="stat-number">{{ mockJobs.length }}</p>
          <p>Jobs Posted</p>
        </div>

        <div class="stat-card bg-blue-50">
          <p class="stat-number text-blue-600">
            {{ totalApplicants }}
          </p>
          <p>Total Applicants</p>
        </div>

        <div class="stat-card bg-green-50">
          <p class="stat-number text-green-600">
            {{ totalAccepted }}
          </p>
          <p>Accepted</p>
        </div>

        <div class="stat-card bg-purple-50">
          <p class="stat-number text-purple-600">
            {{ averageFinalScore }}
          </p>
          <p>Avg Final Score</p>
        </div>

      </div>

      <!-- JOBS + APPLICANTS -->
      <div v-for="job in mockJobs" :key="job._id"
           class="bg-white p-6 rounded-xl shadow mb-8">

        <h2 class="text-lg font-semibold mb-4">
          {{ job.title }} ({{ job.applicants.length }} applicants)
        </h2>

        <table class="w-full text-sm border">
          <thead class="bg-gray-100">
            <tr>
              <th class="p-2 border text-left">Rank</th>
              <th class="p-2 border text-left">Name</th>
              <th class="p-2 border text-left">Final Score</th>
              <th class="p-2 border text-left">AI</th>
              <th class="p-2 border text-left">Resume %</th>
              <th class="p-2 border text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(app, index) in job.applicants"
                :key="app._id">

              <td class="p-2 border">
                <span v-if="index === 0">🥇</span>
                <span v-else-if="index === 1">🥈</span>
                <span v-else-if="index === 2">🥉</span>
                <span v-else>#{{ index + 1 }}</span>
              </td>

              <td class="p-2 border">
                {{ app.user.name }}
              </td>

              <td class="p-2 border font-semibold">
                {{ app.finalScore }}
              </td>

              <td class="p-2 border">
                {{ app.aiOverallScore }} / 5
              </td>

              <td class="p-2 border">
                {{ app.user.profileMatchPercentage }}%
              </td>

              <td class="p-2 border capitalize"
                  :class="statusColor(app.status)">
                {{ app.status }}
              </td>

            </tr>
          </tbody>
        </table>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed } from "vue";

/* ================= MOCK USER ================= */

const user = ref({
  role: "employer", // change to "candidate" to test
  isProfileCompleted: true,
  profileMatchPercentage: 82
});

const isEmployer = computed(() => user.value.role === "employer");

/* ================= MOCK CANDIDATE DATA ================= */

const mockApplications = ref([
  {
    _id: "1",
    job: { title: "Frontend Developer" },
    aiOverallScore: 4.8,
    finalScore: 92.4,
    status: "pending",
    createdAt: new Date()
  },
  {
    _id: "2",
    job: { title: "Backend Engineer" },
    aiOverallScore: 4.2,
    finalScore: 85.1,
    status: "accepted",
    createdAt: new Date()
  }
]);

/* ================= MOCK EMPLOYER DATA ================= */

const mockJobs = ref([
  {
    _id: "j1",
    title: "Frontend Developer",
    applicants: [
      {
        _id: "a1",
        aiOverallScore: 5,
        finalScore: 96.4,
        status: "accepted",
        user: {
          name: "Daniel Hughes",
          profileMatchPercentage: 88
        }
      },
      {
        _id: "a2",
        aiOverallScore: 5,
        finalScore: 92.8,
        status: "pending",
        user: {
          name: "S.M. Owais",
          profileMatchPercentage: 76
        }
      }
    ]
  }
]);

/* ================= COMPUTED ================= */

const acceptedCount = computed(() =>
  mockApplications.value.filter(a => a.status === "accepted").length
);

const pendingCount = computed(() =>
  mockApplications.value.filter(a => a.status === "pending").length
);

const rejectedCount = computed(() =>
  mockApplications.value.filter(a => a.status === "rejected").length
);

const totalApplicants = computed(() =>
  mockJobs.value.reduce((sum, job) => sum + job.applicants.length, 0)
);

const totalAccepted = computed(() =>
  mockJobs.value.reduce((sum, job) =>
    sum + job.applicants.filter(a => a.status === "accepted").length, 0)
);

const averageFinalScore = computed(() => {
  const all = mockJobs.value.flatMap(j => j.applicants);
  const avg = all.reduce((sum, a) => sum + a.finalScore, 0) / all.length;
  return avg.toFixed(1);
});

/* ================= UTIL ================= */

function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

function statusColor(status) {
  if (status === "accepted") return "text-green-600";
  if (status === "pending") return "text-yellow-600";
  if (status === "rejected") return "text-red-600";
  return "";
}
</script>

<style scoped>
.stat-card {
  @apply bg-white p-6 rounded-xl shadow text-center;
}

.stat-number {
  @apply text-2xl font-bold;
}
</style>