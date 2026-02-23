<template>
  <div class="min-h-screen bg-gray-100">

    <!-- ================= LOGIN ================= -->
    <div v-if="!isAuthenticated"
         class="flex items-center justify-center min-h-screen">

      <div class="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">

        <h2 class="text-2xl font-bold text-center mb-6">
          Admin Login
        </h2>

        <input
          v-model="loginForm.email"
          type="email"
          placeholder="Email"
          class="w-full border rounded-lg px-4 py-3 mb-4"
        />

        <input
          v-model="loginForm.password"
          type="password"
          placeholder="Password"
          class="w-full border rounded-lg px-4 py-3 mb-6"
        />

        <button
          @click="login"
          class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
          Login
        </button>

        <p v-if="error"
           class="text-red-500 text-sm mt-4 text-center">
          {{ error }}
        </p>

      </div>
    </div>

    <!-- ================= ADMIN PANEL ================= -->
    <div v-else class="p-8">

      <!-- Top Bar -->
      <div class="flex justify-between items-center mb-8">
        <h2 class="text-2xl font-bold">Admin Panel</h2>

        <button
          @click="logout"
          class="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition">
          Logout
        </button>
      </div>

      <!-- Simple Navigation Buttons -->
      <div class="flex gap-4 mb-6">
        <button
          @click="activeTab = 'profile'"
          :class="tabClass('profile')">
          Profile
        </button>

        <button
          @click="activeTab = 'users'"
          :class="tabClass('users')">
          Users
        </button>
      </div>

      <!-- ================= PROFILE ================= -->
      <div v-if="activeTab === 'profile'"
           class="bg-white p-6 rounded-xl shadow max-w-lg">

        <h3 class="text-xl font-semibold mb-4">
          Admin Profile
        </h3>

        <p class="mb-3">
          <strong>Name:</strong> {{ admin.name }}
        </p>

        <p>
          <strong>Email:</strong> {{ admin.email }}
        </p>
      </div>

      <!-- ================= USERS ================= -->
      <div v-if="activeTab === 'users'"
           class="bg-white p-6 rounded-xl shadow">

        <h3 class="text-xl font-semibold mb-6">
          Users
        </h3>

        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-gray-100 text-left">
              <th class="p-3 border">Name</th>
              <th class="p-3 border">Email</th>
              <th class="p-3 border">Role</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users"
                :key="user.id"
                class="hover:bg-gray-50">
              <td class="p-3 border">{{ user.name }}</td>
              <td class="p-3 border">{{ user.email }}</td>
              <td class="p-3 border capitalize">{{ user.role }}</td>
            </tr>
          </tbody>
        </table>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

/* ================= STATE ================= */

const loginForm = ref({
  email: "",
  password: ""
});

const error = ref("");
const activeTab = ref("profile");

const admin = ref(null);
const users = ref([]);

/* ================= AUTH ================= */

const isAuthenticated = computed(() => !!admin.value);

onMounted(() => {
  const storedAdmin = localStorage.getItem("admin");
  if (storedAdmin) {
    admin.value = JSON.parse(storedAdmin);
    loadUsers();
  }
});

function login() {
  if (
    loginForm.value.email === "admin" &&
    loginForm.value.password === "admin"
  ) {
    admin.value = {
      name: "Super Admin",
      email: loginForm.value.email
    };

    localStorage.setItem("admin", JSON.stringify(admin.value));
    loadUsers();
    error.value = "";
  } else {
    error.value = "Invalid admin credentials";
  }
}

function logout() {
  localStorage.removeItem("admin");
  admin.value = null;
}

/* ================= USERS ================= */

function loadUsers() {
  users.value = [
    { id: 1, name: "John Doe", email: "john@gmail.com", role: "candidate" },
    { id: 2, name: "Sarah Smith", email: "sarah@gmail.com", role: "employer" },
    { id: 3, name: "Ali Khan", email: "ali@gmail.com", role: "candidate" }
  ];
}

/* ================= UI ================= */

function tabClass(tab) {
  return [
    "px-4 py-2 rounded-lg font-medium transition",
    activeTab.value === tab
      ? "bg-blue-600 text-white"
      : "bg-gray-200 hover:bg-blue-100 text-gray-700"
  ];
}
</script>