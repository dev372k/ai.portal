<template>
  <div class="min-h-screen bg-gray-100">

    <!-- ================= LOGIN ================= -->
    <div v-if="!isAuthenticated" class="flex items-center justify-center min-h-screen">
      <div class="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">

        <h2 class="text-2xl font-bold text-center mb-6">Admin Login</h2>

        <input v-model="loginForm.email" type="email" placeholder="Email"
          class="w-full border rounded-lg px-4 py-3 mb-4" />

        <input v-model="loginForm.password" type="password" placeholder="Password"
          class="w-full border rounded-lg px-4 py-3 mb-6" />

        <button @click="login"
          class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
          Login
        </button>

        <p v-if="error" class="text-red-500 text-sm mt-4 text-center">
          {{ error }}
        </p>
      </div>
    </div>

    <!-- ================= ADMIN PANEL ================= -->
    <div v-else class="p-8">

      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <h2 class="text-2xl font-bold">Admin Panel</h2>
        <button @click="logout"
          class="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200">
          Logout
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex gap-4 mb-6">
        <button @click="activeTab='profile'" :class="tabClass('profile')">Profile</button>
        <button @click="activeTab='users'; loadUsers()" :class="tabClass('users')">Users</button>
        <button @click="activeTab='jobs'; loadJobs()" :class="tabClass('jobs')">Jobs</button>
      </div>

      <!-- PROFILE -->
      <div v-if="activeTab==='profile'" class="bg-white p-6 rounded-xl shadow max-w-lg">
        <h3 class="text-xl font-semibold mb-4">Admin Profile</h3>
        <p><strong>Name:</strong> {{ admin.name }}</p>
        <p><strong>Email:</strong> {{ admin.email }}</p>
        <p><strong>Role:</strong> {{ admin.role }}</p>
      </div>

      <!-- USERS -->
      <div v-if="activeTab==='users'" class="bg-white p-6 rounded-xl shadow">
        <h3 class="text-xl font-semibold mb-6">Users</h3>

        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-3 border">Name</th>
              <th class="p-3 border">Email</th>
              <th class="p-3 border">Role</th>
              <th class="p-3 border">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="user in paginatedUsers" :key="user._id">
              <td class="p-3 border">{{ user.name }}</td>
              <td class="p-3 border">{{ user.email }}</td>
              <td class="p-3 border capitalize">{{ user.role }}</td>
              <td class="p-3 border">
                <button @click="deleteUser(user._id)" class="text-red-600">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex justify-center mt-4 gap-2">
          <span>Page {{ currentPageUsers }} / {{ totalUserPages }}</span>
          <button @click="currentPageUsers--" :disabled="currentPageUsers===1"
          class="px-3 py-1 border rounded">Prev</button>


          <button @click="currentPageUsers++" :disabled="currentPageUsers===totalUserPages"
            class="px-3 py-1 border rounded">Next</button>
        </div>
      </div>

      <!-- JOBS -->
      <div v-if="activeTab==='jobs'" class="bg-white p-6 rounded-xl shadow">
        <h3 class="text-xl font-semibold mb-6">Jobs</h3>

        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-3 border">Title</th>
              <th class="p-3 border">Company</th>
              <th class="p-3 border">Description</th>
              <th class="p-3 border">Skills</th>
              <th class="p-3 border">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="job in paginatedJobs" :key="job._id">
              <td class="p-3 border font-medium">{{ job.title }}</td>
              <td class="p-3 border">{{ job.company }}</td>

              <td class="p-3 border max-w-xs truncate" :title="job.description">
                {{ job.description }}
              </td>

              <td class="p-3 border">
                <div class="flex flex-wrap gap-2">
                  <span v-for="skill in job.skills" :key="skill"
                    class="px-2 py-1 bg-gray-200 rounded text-xs">
                    {{ skill }}
                  </span>
                </div>
              </td>

              <td class="p-3 border text-center">
                <button @click="deleteJobAdmin(job._id)" class="text-red-600">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex justify-center mt-4 gap-2">
          <span>Page {{ currentPageJobs }} / {{ totalJobPages }}</span>
          <button @click="currentPageJobs--" :disabled="currentPageJobs===1"
            class="px-3 py-1 border rounded">Prev</button>


          <button @click="currentPageJobs++" :disabled="currentPageJobs===totalJobPages"
            class="px-3 py-1 border rounded">Next</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL + "/api";

const loginForm = ref({ email:"", password:"" });
const error = ref("");
const activeTab = ref("profile");

const admin = ref(null);
const users = ref([]);
const jobs = ref([]);

const isAuthenticated = computed(() => !!admin.value);

/* Pagination */
const currentPageUsers = ref(1);
const currentPageJobs = ref(1);
const perPage = 5;

/* Computed */
const paginatedUsers = computed(()=>{
  const start = (currentPageUsers.value-1)*perPage;
  return users.value.slice(start,start+perPage);
});

const paginatedJobs = computed(()=>{
  const start = (currentPageJobs.value-1)*perPage;
  return jobs.value.slice(start,start+perPage);
});

const totalUserPages = computed(()=> Math.ceil(users.value.length/perPage));
const totalJobPages = computed(()=> Math.ceil(jobs.value.length/perPage));

/* Auth */
onMounted(()=>{
  const stored = localStorage.getItem("admin");
  if(stored){
    admin.value = JSON.parse(stored);
    loadUsers();
  }
});

function login(){
  if(loginForm.value.email==="admin" && loginForm.value.password==="admin"){
    admin.value = {name:"Super Admin",email:"admin",role:"admin"};
    localStorage.setItem("admin", JSON.stringify(admin.value));
    loadUsers();
  } else error.value="Invalid credentials";
}

function logout(){
  localStorage.removeItem("admin");
  admin.value=null;
}

/* Users */
async function loadUsers(){
  const res = await axios.get(`${API}/users`,{headers:{"x-admin":"true"}});
  users.value = res.data.data;
  currentPageUsers.value=1;
}

async function deleteUser(id){
  await axios.delete(`${API}/users/${id}`,{headers:{"x-admin":"true"}});
  users.value = users.value.filter(u=>u._id!==id);
}

/* Jobs */
async function loadJobs(){
  const res = await axios.get(`${API}/jobs/all`,{headers:{"x-admin":"true"}});
  jobs.value = res.data.data;
  currentPageJobs.value=1;
}

async function deleteJobAdmin(id){
  await axios.delete(`${API}/jobs/${id}`,{headers:{"x-admin":"true"}});
  jobs.value = jobs.value.filter(j=>j._id!==id);
}

/* UI */
function tabClass(tab){
  return [
    "px-4 py-2 rounded-lg",
    activeTab.value===tab ? "bg-blue-600 text-white":"bg-gray-200"
  ];
}
</script>