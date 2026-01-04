import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://103.179.219.39:8282",
});

// 1. Request Interceptor: Menyisipkan Token dari LocalStorage ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. Response Interceptor: Menangani Error Global (Troubleshooting Redirect)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Jika server membalas dengan status 401 (Unauthorized / Token Kadaluarsa)
    if (error.response && error.response.status === 401) {
      console.warn("⛔ Sesi habis atau token tidak valid. Logout otomatis...");

      // Bersihkan data di LocalStorage
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("nama");

      // Redirect paksa ke login jika tidak sedang di halaman login
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
