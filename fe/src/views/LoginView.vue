<template>
  <div class="min-h-screen flex">

    <!-- Left: Branding / Illustration -->
    <div class="w-9/12 bg-gradient-to-tr from-blue-800 to-blue-500 flex flex-col justify-center items-center text-white p-12">
      <h1 class="text-5xl font-extrabold mb-6">Authentix</h1>
      <p class="text-lg max-w-lg text-center leading-relaxed">
        Strip away the spin. Hire proven talent, not polished narratives.
      </p>
      <!-- Optional Illustration -->
      <!-- <img src="/illustration-login.svg" alt="Illustration" class="mt-10 w-96" /> -->
    </div>

    <!-- Right: Login Panel -->
    <div class="w-3/12 flex items-center justify-center bg-gray-50 p-12">
      <div class="w-full max-w-sm text-center space-y-6">

        <!-- Logo / Welcome -->
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Welcome Back</h2>
          <p class="text-gray-500 mt-2">Sign in to continue</p>
        </div>

        <!-- LinkedIn Login Options -->
        <div class="space-y-4">
          <button
            @click="loginWithLinkedIn('candidate')"
            class="w-full py-3 flex items-center justify-center gap-3 bg-blue-50 text-blue-600 font-semibold rounded-xl shadow hover:text-white hover:bg-blue-800 transition duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="currentColor" viewBox="0 0 448 512">
              <path d="M100.28 448H7.4V148.9h92.88zm-46.44-341C24 107 0 83 0 53.6A53.6 53.6 0 0 1 53.6 0C83 0 107 24 107 53.6a53.6 53.6 0 0 1-53.16 53.4zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.24-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.7V148.9h89v40.8h1.3c12.4-23.4 42.6-48.2 87.8-48.2 93.8 0 111 61.8 111 142.3z"/>
            </svg>
            Login as Candidate
          </button>

          <!-- Separator -->
          <div class="flex items-center text-gray-400 font-semibold my-2">
            <hr class="flex-grow border-t border-gray-300" />
            <span class="mx-2 text-sm">or</span>
            <hr class="flex-grow border-t border-gray-300" />
          </div>

          <button
            @click="loginWithLinkedIn('employer')"
            class="w-full py-3 flex items-center justify-center gap-3 bg-blue-50 text-blue-600 font-semibold rounded-xl shadow hover:text-white hover:bg-blue-800 transition duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="currentColor" viewBox="0 0 448 512">
              <path d="M100.28 448H7.4V148.9h92.88zm-46.44-341C24 107 0 83 0 53.6A53.6 53.6 0 0 1 53.6 0C83 0 107 24 107 53.6a53.6 53.6 0 0 1-53.16 53.4zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.24-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.7V148.9h89v40.8h1.3c12.4-23.4 42.6-48.2 87.8-48.2 93.8 0 111 61.8 111 142.3z"/>
            </svg>
            Login as Recruiter
          </button>
        </div>

        <!-- Optional Footer -->
        <p class="text-gray-400 text-sm mt-4">
          © 2025 Authentix. All rights reserved.
        </p>

      </div>
    </div>

  </div>
</template>

<script setup>
function loginWithLinkedIn(role) {
  // role is 'candidate' or 'employer'
  const baseUrl = "http://localhost:3000/api/users/auth/linkedin";
  window.location.href = `${baseUrl}?user=${role}`;
}
</script>

<style scoped>
/* Optional smooth gradient transition on left panel */
.bg-gradient-to-tr {
  transition: background 0.3s ease;
}
</style>
