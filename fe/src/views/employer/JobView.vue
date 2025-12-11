<template>
  <div class="p-8 max-w-7xl mx-auto">

    <!-- HEADER -->
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800">Manage Jobs</h1>

      <button 
        @click="openAddModal"
        class="bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
        <span class="text-xl">＋</span> Add Job
      </button>
    </div>

    <!-- SKELETON LOADER -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="n in 6" :key="n" class="p-5 bg-white border rounded-2xl shadow animate-pulse">
        <div class="h-5 w-40 bg-gray-300 rounded mb-4"></div>
        <div class="h-4 w-28 bg-gray-200 rounded mb-2"></div>
        <div class="h-4 w-20 bg-gray-200 rounded"></div>

        <div class="mt-6 h-10 bg-gray-200 rounded"></div>
      </div>
    </div>

    <!-- JOB CARDS -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="job in jobs"
        :key="job._id"
        class="p-6 bg-white border rounded-2xl shadow hover:shadow-xl transition cursor-pointer flex flex-col justify-between">

        <!-- Title -->
        <div>
          <h2 class="text-xl font-bold text-gray-800">{{ job.title }}</h2>
          <p class="text-gray-500 mt-1">{{ job.company }}</p>

          <div class="mt-3 flex gap-2">
            <span class="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-xl">{{ job.location }}</span>
            <span class="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-xl">{{ job.type }}</span>
          </div>
        </div>

        <!-- Skills -->
        <div class="mt-4 flex flex-wrap gap-2">
          <span 
            v-for="skill in job.skills"
            :key="skill"
            class="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">
            {{ skill }}
          </span>
        </div>

        <!-- Buttons -->
        <div class="mt-6 flex gap-3">
          <button 
            @click.stop="openEditModal(job)"
            class="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Edit
          </button>
          <button 
            @click.stop="deleteJob(job._id)"
            class="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div 
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 backdrop-blur-sm">

      <div class="bg-white p-6 rounded-2xl w-full max-w-xl shadow-lg animate-fade-in">

        <h2 class="text-xl font-semibold mb-4">
          {{ isEditing ? "Update Job" : "Add New Job" }}
        </h2>

        <!-- FORM -->
        <div class="grid gap-4">
          <input v-model="form.title" placeholder="Job Title" class="input" />
          <input v-model="form.company" placeholder="Company" class="input" />
          <textarea v-model="form.description" placeholder="Job Description" class="input h-24"></textarea>

          <select v-model="form.location" class="input">
            <option>Remote</option>
            <option>On-site</option>
            <option>Hybrid</option>
          </select>

          <select v-model="form.type" class="input">
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Contract</option>
            <option>Internship</option>
            <option>Temporary</option>
          </select>

          <select v-model="form.experienceLevel" class="input">
            <option>Entry</option>
            <option>Mid</option>
            <option>Senior</option>
            <option>Lead</option>
          </select>

          <input v-model="form.applyUrl" placeholder="Apply URL" class="input" />

          <!-- SKILLS -->
          <div>
            <input 
              v-model="skillInput"
              @keyup.enter="addSkill"
              placeholder="Add skill & press Enter"
              class="input" />

            <div class="flex flex-wrap gap-2 mt-2">
              <span 
                v-for="(skill, index) in form.skills"
                :key="index"
                class="px-3 py-1 bg-gray-200 rounded-xl flex items-center gap-2 text-sm">
                {{ skill }}
                <button @click="removeSkill(index)" class="text-red-500">✕</button>
              </span>
            </div>
          </div>
        </div>

        <!-- ACTIONS -->
        <div class="mt-6 flex justify-end gap-3">
          <button 
            @click="closeModal"
            class="px-4 py-2 bg-gray-200 rounded-lg">
            Cancel
          </button>

          <button 
            @click="isEditing ? updateJob() : saveJob()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg">
            {{ isEditing ? "Update" : "Save" }}
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const loading = ref(true);
const jobs = ref([]);

const showModal = ref(false);
const isEditing = ref(false);

const form = ref({
  _id: null,
  title: "",
  company: "",
  description: "",
  location: "Remote",
  type: "Full-time",
  experienceLevel: "Entry",
  applyUrl: "",
  skills: []
});

const skillInput = ref("");

onMounted(() => {
  setTimeout(() => {
    jobs.value = [
      {
        _id: "123",
        title: "Frontend Developer",
        company: "Beechmind Technology",
        description: "Vue.js Developer Needed",
        location: "Remote",
        type: "Full-time",
        experienceLevel: "Mid",
        skills: ["Vue", "JavaScript", "Tailwind"],
        applyUrl: ""
      }
    ];
    loading.value = false;
  }, 1000);
});

/* ---- MODAL ---- */
function openAddModal() {
  resetForm();
  isEditing.value = false;
  showModal.value = true;
}

function openEditModal(job) {
  form.value = { ...job };
  isEditing.value = true;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

/* ---- SKILLS ---- */
function addSkill() {
  if (skillInput.value.trim() !== "") {
    form.value.skills.push(skillInput.value.trim());
    skillInput.value = "";
  }
}

function removeSkill(index) {
  form.value.skills.splice(index, 1);
}

/* ---- CRUD ---- */
function saveJob() {
  form.value._id = Date.now();
  jobs.value.push({ ...form.value });
  closeModal();
}

function updateJob() {
  const index = jobs.value.findIndex(j => j._id === form.value._id);
  jobs.value[index] = { ...form.value };
  closeModal();
}

function deleteJob(id) {
  jobs.value = jobs.value.filter(j => j._id !== id);
}

function resetForm() {
  form.value = {
    _id: null,
    title: "",
    company: "",
    description: "",
    location: "Remote",
    type: "Full-time",
    experienceLevel: "Entry",
    applyUrl: "",
    skills: []
  };
}
</script>

<style scoped>
.input {
  @apply w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none;
}

.animate-fade-in {
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
