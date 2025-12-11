<template>
  <div class="flex h-screen bg-gray-100">

    <!-- Sidebar -->
    <aside class="w-72 bg-white shadow-xl border-r border-gray-200 flex flex-col py-6 px-5">
      
      <!-- Company Logo -->
      <!-- <div class="flex justify-center mb-2">
        <img src="../assets/verified.png" alt="Company Logo" class="w-12 h-auto object-contain" />
      </div> -->

      <!-- Profile Section -->
      <div class="flex flex-col items-center gap-3 pb-6 border-b border-gray-200">
        <img :src="user?.profilePic || '/default-avatar.png'" class="w-20 h-20 rounded-full object-cover shadow" />
        <h3 class="text-lg font-semibold text-gray-800">
          {{ user?.name || "User" }}
        </h3>
        <p class="text-sm text-gray-500 capitalize">
          {{ role }}
        </p>
      </div>

      <!-- Profile Not Completed Alert -->
      <div v-if="role === 'candidate' && !isProfileCompleted"
           class="bg-yellow-50 text-yellow-700 border border-yellow-300 rounded-xl mt-4 p-4 text-sm flex flex-col gap-2">
        <p class="font-semibold">⚠ Profile Not Completed</p>
        <p>Please complete your profile to get better job visibility.</p>
        <RouterLink :to="completeProfileLink"
                    class="text-yellow-800 font-medium underline hover:text-yellow-900">
          Complete Now →
        </RouterLink>
      </div>

      <!-- Navigation -->
      <nav class="flex flex-col gap-2 mt-6 flex-grow">
        <RouterLink v-for="item in menuItems" :key="item.path" :to="item.path"
          class="p-3 rounded-xl flex items-center gap-4 transition font-medium group"
          :class="{
            'bg-blue-50 text-blue-600': isActive(item.path),
            'hover:bg-blue-50 hover:text-blue-600 text-gray-700': !isActive(item.path)
          }">
          <component :is="item.icon" class="w-6 h-6 transition" :class="{
            'text-blue-600': isActive(item.path),
            'text-gray-600 group-hover:text-blue-600': !isActive(item.path)
          }" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <!-- User Actions -->
      <div class="mt-auto pt-6 border-t border-gray-200">
        <button class="flex items-center gap-3 p-3 rounded-xl font-medium bg-red-50 text-red-600
                       hover:bg-red-100 transition w-full" @click="logout">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8"
               stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Logout
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 p-7 overflow-y-auto">
      <RouterView />
    </main>

  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  HomeIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  PencilSquareIcon,
  UsersIcon,
} from "@heroicons/vue/24/outline";

const router = useRouter();
const route = useRoute();

const user = JSON.parse(localStorage.getItem("user"))[0];
const role = user?.role || "candidate";
const isProfileCompleted = user?.isProfileCompleted ?? false;
const completeProfileLink = computed(() => "/profile");

const candidateMenu = [
  { label: "Dashboard", path: "/dashboard", icon: HomeIcon },
  { label: "Applied Jobs", path: "/applied", icon: BriefcaseIcon },
  { label: "Profile", path: "/profile", icon: UsersIcon },
];

const employerMenu = [
  { label: "Dashboard", path: "/dashboard", icon: HomeIcon },
  { label: "Post a Job", path: "/jobs", icon: PencilSquareIcon },
  { label: "Applicants", path: "/applicants", icon: UsersIcon },
  { label: "Profile", path: "/profile", icon: UsersIcon },
];

const menuItems = computed(() => role === "employer" ? employerMenu : candidateMenu);
function isActive(path) { return route.path === path; }
function logout() { localStorage.clear(); router.push("/login"); }
</script>
