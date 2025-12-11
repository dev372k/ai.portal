<template>
  <div class="flex h-screen items-center justify-center">
    <p class="text-gray-600 text-lg">Logging you in...</p>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { apiRequest } from "../services/api";
import { useToast } from "vue-toastification";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const tempToken = route.query.token;

if (!tempToken) {
  toast.error("Invalid login callback");
  router.push("/login");
} else {
  handleTokenExchange();
}

async function handleTokenExchange() {
  try {
    // Call backend to exchange temporary token
    const data = await apiRequest("GET",`/api/users/get-token?token=${tempToken}`);

    if (data.data.jwtToken) {
      localStorage.setItem("auth_token", data.data.jwtToken);
      localStorage.setItem("user", JSON.stringify(data.data.user));
    }

    toast.success("Logged in successfully!");

    router.push("/dashboard");

  } catch (err) {
    toast.error("Login failed");
    router.push("/login");
  }
}
</script>
