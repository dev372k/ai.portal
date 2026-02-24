<template>
  <div class="p-8 max-w-7xl mx-auto">

    <!-- HEADER -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800">
        My Applications
      </h1>
      <p class="text-gray-500 mt-2">
        Track and manage your job applications
      </p>
    </div>

    <!-- ERROR -->
    <div v-if="error"
         class="bg-red-100 text-red-700 p-3 rounded mb-6">
      {{ error }}
    </div>

    <!-- LOADING -->
    <div v-if="loading"
         class="text-center py-16 text-gray-500">
      Loading applications...
    </div>

    <!-- EMPTY STATE -->
    <div v-else-if="applications.length === 0"
         class="bg-white p-10 rounded-xl shadow text-center">

      <h2 class="text-xl font-semibold text-gray-700">
        No Applications Yet
      </h2>

      <p class="text-gray-500 mt-2">
        Start applying to jobs and they will appear here.
      </p>

    </div>

    <!-- APPLICATION GRID -->
    <div v-else
         class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

      <div
        v-for="item in applications"
        :key="item.applicationId"
        class="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition flex flex-col justify-between">

        <!-- JOB INFO -->
        <div>

          <h2 class="text-lg font-bold text-gray-800">
            {{ item.job.title }}
          </h2>

          <p class="text-gray-500 mt-1">
            {{ item.job.company }}
          </p>

          <div class="flex flex-wrap gap-2 mt-3">
            <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              {{ item.job.location }}
            </span>
            <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs">
              {{ item.job.type }}
            </span>
          </div>

          <p class="text-xs text-gray-400 mt-4">
            Applied on:
            {{ formatDate(item.appliedAt) }}
          </p>

        </div>

        <!-- FOOTER -->
        <div class="mt-6 flex justify-between items-center">

          <span
            :class="statusClass(item.status)"
            class="px-3 py-1 rounded-full text-xs font-medium capitalize">
            {{ item.status }}
          </span>

          <!-- <button
            v-if="item.status === 'pending'"
            @click="withdrawApplication(item.applicationId)"
            class="text-red-600 text-sm hover:underline">
            Withdraw
          </button> -->

        </div>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const API_GET = import.meta.env.VITE_BACKEND_URL + "/api/jobs/applied-jobs";
const API_DELETE = import.meta.env.VITE_BACKEND_URL + "/api/applications";

const applications = ref([]);
const loading = ref(false);
const error = ref("");

const token = localStorage.getItem("auth_token");

onMounted(fetchApplications);

/* ================= FETCH ================= */

async function fetchApplications() {
  loading.value = true;
  error.value = "";

  try {
    const res = await axios.get(API_GET, {
      headers: { Authorization: `Bearer ${token}` }
    });

    applications.value = res.data.data;

  } catch (err) {
    error.value =
      err.response?.data?.message || "Failed to load applications";
  }

  loading.value = false;
}

/* ================= WITHDRAW ================= */

async function withdrawApplication(applicationId) {
  if (!confirm("Are you sure you want to withdraw this application?"))
    return;

  try {
    await axios.delete(`${API_DELETE}/${applicationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    applications.value = applications.value.filter(
      (a) => a.applicationId !== applicationId
    );

  } catch (err) {
    alert(err.response?.data?.message || "Failed to withdraw");
  }
}

/* ================= HELPERS ================= */

function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

function statusClass(status) {
  switch (status) {
    case "accepted":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}
</script>