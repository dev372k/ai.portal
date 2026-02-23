<template>
  <div class="p-8 max-w-7xl mx-auto">

    <!-- HEADER -->
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800">
        {{ isEmployer ? "Manage Jobs" : "Available Jobs" }}
      </h1>

      <button v-if="isEmployer" @click="openAddModal" :disabled="submitting"
        class="bg-blue-600 text-white px-5 py-3 rounded-xl shadow hover:bg-blue-700 disabled:opacity-50">
        ＋ Add Job
      </button>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="text-center py-10 text-gray-500">
      Loading jobs...
    </div>

    <!-- JOB GRID -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

      <div v-for="job in jobs" :key="job._id"
        class="bg-white p-6 rounded-2xl shadow border flex flex-col justify-between">

        <div>
          <h2 @click="openDetailsModal(job)"
            class="text-lg font-bold cursor-pointer hover:text-blue-600 hover:underline">
            {{ job.title }}
          </h2>

          <p class="text-gray-500 mt-1">{{ job.company }}</p>

          <div class="flex flex-wrap gap-2 mt-3">
            <span class="badge bg-blue-100 text-blue-700">{{ job.location }}</span>
            <span class="badge bg-purple-100 text-purple-700">{{ job.type }}</span>
            <span class="badge bg-orange-100 text-orange-700">{{ job.experienceLevel }}</span>
          </div>

          <div class="flex flex-wrap gap-2 mt-3">
            <span v-for="skill in job.skills" :key="skill" class="px-2 py-1 bg-gray-200 rounded text-xs">
              {{ skill }}
            </span>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="mt-6">

          <!-- Candidate -->
          <template v-if="!isEmployer">

            <!-- Already Applied -->
            <span v-if="job.isApplied"
              class="w-full inline-block text-center px-4 py-2 bg-green-100 text-green-700 rounded text-sm font-medium">
              Applied ✓
            </span>

            <!-- Apply Button -->
            <button v-else @click="user.isProfileCompleted && openApplicationModal(job)"
              :disabled="!user?.isProfileCompleted"
              :title="!user?.isProfileCompleted ? 'Please complete your profile first' : ''"
              class="w-full px-4 py-2 rounded border transition font-medium" :class="user?.isProfileCompleted
                ? 'border-blue-600 text-blue-600 hover:bg-blue-50'
                : 'border-gray-300 text-gray-400 cursor-not-allowed'">

              Apply Now

            </button>

          </template>

          <!-- Employer -->
          <template v-else>
            <div class="flex gap-2">

              <!-- Edit (Outline Neutral) -->
              <button @click="openEditModal(job)" :disabled="submitting"
                class="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition disabled:opacity-50">
                Edit
              </button>

              <!-- Delete (Outline Danger) -->
              <button @click="deleteJob(job._id)" :disabled="deletingId === job._id"
                class="flex-1 px-3 py-2 border border-red-500 text-red-600 rounded hover:bg-red-50 transition disabled:opacity-50">
                {{ deletingId === job._id ? "Deleting..." : "Delete" }}
              </button>

            </div>
          </template>

        </div>
      </div>
    </div>

    <!-- ================= ADD / EDIT MODAL ================= -->

    <div v-if="showAddModal || showEditModal"
      class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">

      <div class="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        <h2 class="text-xl font-semibold mb-4">
          {{ showEditModal ? "Edit Job" : "Add Job" }}
        </h2>

        <input v-model="form.title" placeholder="Job Title" class="w-full border px-3 py-2 rounded mb-3" />

        <input v-model="form.company" placeholder="Company" class="w-full border px-3 py-2 rounded mb-3" />

        <!-- LOCATION -->
        <select v-model="form.location" class="w-full border px-3 py-2 rounded mb-3">
          <option value="Remote">Remote</option>
          <option value="On-site">On-site</option>
          <option value="Hybrid">Hybrid</option>
        </select>

        <!-- TYPE -->
        <select v-model="form.type" class="w-full border px-3 py-2 rounded mb-3">
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Contract">Contract</option>
          <option value="Internship">Internship</option>
          <option value="Temporary">Temporary</option>
        </select>

        <!-- EXPERIENCE -->
        <select v-model="form.experienceLevel" class="w-full border px-3 py-2 rounded mb-3">
          <option value="Entry">Entry</option>
          <option value="Mid">Mid</option>
          <option value="Senior">Senior</option>
          <option value="Lead">Lead</option>
        </select>

        <input v-model="skillsInput" placeholder="Skills (comma separated)"
          class="w-full border px-3 py-2 rounded mb-3" />

        <textarea v-model="form.description" placeholder="Job Description"
          class="w-full border px-3 py-2 rounded mb-3 h-40">
    </textarea>

        <div class="flex justify-end gap-3">
          <button @click="closeJobModal" class="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>

          <button @click="showEditModal ? updateJob() : createJob()" :disabled="submitting"
            class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            {{ submitting ? "Processing..." : (showEditModal ? "Update" : "Create") }}
          </button>
        </div>

      </div>
    </div>
    <!-- ================= JOB DETAILS MODAL ================= -->

    <div v-if="showDetailsModal" class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">

      <div class="bg-white p-6 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

        <h2 class="text-2xl font-bold mb-2">
          {{ selectedJob?.title }}
        </h2>

        <p class="text-gray-600 mb-4">
          {{ selectedJob?.company }}
        </p>

        <div class="flex flex-wrap gap-2 mb-4">
          <span class="badge bg-blue-100 text-blue-700">
            {{ selectedJob?.location }}
          </span>
          <span class="badge bg-purple-100 text-purple-700">
            {{ selectedJob?.type }}
          </span>
          <span class="badge bg-orange-100 text-orange-700">
            {{ selectedJob?.experienceLevel }}
          </span>
        </div>

        <h3 class="font-semibold mb-2">Job Description</h3>
        <p class="text-gray-700 whitespace-pre-line mb-6">
          {{ selectedJob?.description }}
        </p>

        <h3 class="font-semibold mb-2">Required Skills</h3>
        <div class="flex flex-wrap gap-2">
          <span v-for="skill in selectedJob?.skills" :key="skill" class="px-3 py-1 bg-gray-200 rounded text-xs">
            {{ skill }}
          </span>
        </div>

        <div class="flex justify-end mt-6">
          <button @click="closeDetailsModal" class="px-4 py-2 bg-gray-300 rounded">
            Close
          </button>
        </div>

      </div>
    </div>
    <!-- ================= APPLICATION MODAL ================= -->

    <div v-if="showApplicationModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

      <div class="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        <!-- HEADER -->
        <div class="p-6 border-b">
          <h2 class="text-xl">
            Apply for <span class="font-semibold">{{ selectedJob?.title }}</span>
          </h2>
        </div>

        <!-- SCROLLABLE BODY -->
        <div class="p-6 overflow-y-auto flex-1">

          <div v-for="(question, index) in selectedJob?.aiQuestions" :key="index" class="mb-6">

            <p class="font-medium mb-2">
              {{ index + 1 }}. {{ question }}
            </p>

            <textarea v-model="answers[index]" class="w-full border rounded px-3 py-2 h-24"
              placeholder="Max 30 words..."></textarea>

            <p class="text-xs mt-1" :class="isWordValid(index) ? 'text-green-600' : 'text-red-500'">
              {{ wordCount(index) }} / 30 words
            </p>

          </div>

        </div>

        <!-- FOOTER -->
        <div class="p-6 border-t flex justify-end gap-3">
          <button @click="closeApplicationModal" class="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>

          <button @click="submitApplication" :disabled="!isAnswersValid || submittingApplication"
            class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            {{ submittingApplication ? "Submitting..." : "Submit Application" }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import axios from "axios";

const API = "http://localhost:3000/api/jobs";
const token = localStorage.getItem("auth_token");

const jobs = ref([]);
const loading = ref(false);
const submitting = ref(false);
const deletingId = ref(null);

const showAddModal = ref(false);
const showEditModal = ref(false);
const showApplicationModal = ref(false);
const showDetailsModal = ref(false);

const selectedJob = ref(null);
const answers = ref([]);
const submittingApplication = ref(false);

const user = ref(JSON.parse(localStorage.getItem("user")));
const isEmployer = computed(() => user.value?.role === "employer");

const form = ref({
  title: "",
  company: "",
  description: "",
  location: "On-site",
  type: "Full-time",
  experienceLevel: "Entry",
  skills: []
});

const skillsInput = ref("");

onMounted(() => {
  fetchJobs();
  document.addEventListener("visibilitychange", handleVisibilityChange);
  document.addEventListener("contextmenu", disableRightClick);
  document.addEventListener("keydown", preventKeySecurity);

  devtoolsInterval = setInterval(detectDevTools, 1000);
});

onUnmounted(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  document.removeEventListener("contextmenu", disableRightClick);
  document.removeEventListener("keydown", preventKeySecurity);

  clearInterval(devtoolsInterval);
});

async function fetchJobs() {
  loading.value = true;
  try {
    const res = await axios.get(API, {
      headers: { Authorization: `Bearer ${token}` }
    });
    jobs.value = res.data.data;
  } finally {
    loading.value = false;
  }
}

/* ===== EMPLOYER ===== */

function resetForm() {
  form.value = {
    title: "",
    company: "",
    description: "",
    location: "On-site",
    type: "Full-time",
    experienceLevel: "Entry",
    skills: []
  };
  skillsInput.value = "";
}

function openAddModal() {
  resetForm();
  showAddModal.value = true;
}

function openEditModal(job) {
  form.value = { ...job };
  skillsInput.value = job.skills?.join(", ") || "";
  showEditModal.value = true;
}

function openDetailsModal(job) {
  selectedJob.value = job;
  showDetailsModal.value = true;
}

function closeDetailsModal() {
  showDetailsModal.value = false;
  selectedJob.value = null;
}

function closeJobModal() {
  showAddModal.value = false;
  showEditModal.value = false;
  resetForm();
}

async function createJob() {
  submitting.value = true;
  try {
    form.value.skills = skillsInput.value.split(",").map(s => s.trim());
    const res = await axios.post(API, form.value, {
      headers: { Authorization: `Bearer ${token}` }
    });
    jobs.value.push(res.data.data);
    closeJobModal();
  } finally {
    submitting.value = false;
  }
}

async function updateJob() {
  submitting.value = true;
  try {
    form.value.skills = skillsInput.value.split(",").map(s => s.trim());
    const res = await axios.put(
      `${API}/${form.value._id}`,
      form.value,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const index = jobs.value.findIndex(j => j._id === form.value._id);
    jobs.value[index] = res.data.data;
    closeJobModal();
  } finally {
    submitting.value = false;
  }
}

async function deleteJob(id) {
  if (!confirm("Delete this job?")) return;
  deletingId.value = id;
  try {
    await axios.delete(`${API}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    jobs.value = jobs.value.filter(j => j._id !== id);
  } finally {
    deletingId.value = null;
  }
}

/* ===== CANDIDATE ===== */

function openApplicationModal(job) {
  const randomQuestions = getRandomQuestions(job.aiQuestions, 4);

  selectedJob.value = {
    ...job,
    aiQuestions: randomQuestions
  };

  answers.value = randomQuestions.map(() => "");
  showApplicationModal.value = true;
}

function closeApplicationModal() {
  showApplicationModal.value = false;
  selectedJob.value = null;
  answers.value = [];
}

function wordCount(index) {
  if (!answers.value[index]) return 0;
  return answers.value[index].trim().split(/\s+/).filter(Boolean).length;
}

function isWordValid(index) {
  const count = wordCount(index);
  return count > 0 && count <= 30;
}

const isAnswersValid = computed(() =>
  answers.value.length > 0 &&
  answers.value.every((_, i) => isWordValid(i))
);

async function submitApplication() {
  submittingApplication.value = true;
  try {
    const formattedAnswers = selectedJob.value.aiQuestions.map(
      (question, index) => ({
        question,
        answer: answers.value[index]
      })
    );

    await axios.post(
      `${API}/apply`,
      {
        jobId: selectedJob.value._id,
        answers: formattedAnswers
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const job = jobs.value.find(j => j._id === selectedJob.value._id);
    if (job) job.isApplied = true;

    closeApplicationModal();
  } finally {
    submittingApplication.value = false;
  }
}

/* ===== RANDOM QUESTION SELECTOR ===== */

function getRandomQuestions(questions, count = 4) {
  if (!questions || questions.length <= count) return questions;

  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
/* ===== SECURITY ENHANCEMENTS ===== */

function preventKeySecurity(e) {
  if (!showApplicationModal.value) return;

  // Block copy / cut / select all
  if (
    (e.ctrlKey || e.metaKey) &&
    ["c", "x", "a", "s", "u"].includes(e.key.toLowerCase())
  ) {
    e.preventDefault();
  }

  // Block F12
  if (e.key === "F12") {
    e.preventDefault();
  }

  // Block Ctrl+Shift+I / J
  if (
    (e.ctrlKey || e.metaKey) &&
    e.shiftKey &&
    ["i", "j"].includes(e.key.toLowerCase())
  ) {
    e.preventDefault();
  }
}

function disableRightClick(e) {
  if (showApplicationModal.value) {
    e.preventDefault();
  }
}

function handleVisibilityChange() {
  if (document.hidden && showApplicationModal.value) {
    document.body.style.filter = "blur(20px)";
    alert("Switching tabs is not allowed during application.");
    window.location.href = "/";
  } else {
    document.body.style.filter = "none";
  }
}

let devtoolsOpen = false;
let devtoolsInterval;

function detectDevTools() {
  if (!showApplicationModal.value) return;

  const threshold = 160;

  if (
    window.outerWidth - window.innerWidth > threshold ||
    window.outerHeight - window.innerHeight > threshold
  ) {
    if (!devtoolsOpen) {
      devtoolsOpen = true;
      alert("Developer tools are not allowed.");
      window.location.href = "/";
    }
  } else {
    devtoolsOpen = false;
  }
}
</script>

<style scoped>
.badge {
  @apply px-3 py-1 rounded text-xs;
}
</style>