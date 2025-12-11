import axios from "axios";
import { useToast } from "vue-toastification";

const toast = useToast();

const API_BASE = import.meta.env.VITE_BACKEND_URL; // ⚙️ Change for production

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// ✅ Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Handle expired/unauthorized tokens globally
let isRedirecting = false;

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401 || message?.toLowerCase().includes("token")) {
      localStorage.removeItem("token");

      if (!isRedirecting) {
        isRedirecting = true;
        // Wait a bit before redirect (prevents navigation conflicts)
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
      }
    }

    return Promise.reject(error);
  }
);

// ✅ Simplified request helper with toast on error
export const apiRequest = async (method, url, data = {}, params = {}) => {
  try {
    const res = await api({ method, url, data, params });
    if(method.toLowerCase() !== "get")
      toast.success(res.data?.message);

    console.log(res.data)
    return res.data;
  } catch (error) {
    const response = error.response || {};
    const message =
      response.data?.message ||
      error.message ||
      "Something went wrong.";

    // 🔹 Show toast error globally
    toast.error(message);

    return {
      status: "error",
      message,
      code: response.status || 500,
    };
  }
};

export default api;
