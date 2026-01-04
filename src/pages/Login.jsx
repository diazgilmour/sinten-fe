import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";

// --- IMPORT LOGO (GANTI JADI PNG) ---
import logoSinten from "../assets/sinten.png";
// ----------------------------------

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // --- STATE ---
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // --- ANIMASI MOUNT ---
  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  // --- HANDLER SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Kirim ke Backend
      const res = await api.post("/login", {
        email: form.email,
        password: form.password,
      });

      // --- LOGIC AMBIL DATA (FIXED) ---

      // Level 1: Mengambil res.data atau langsung res
      const level1 = res?.data || res;

      // Level 2: Mengambil object user dari dalam level1
      const userObj = level1?.user || {};

      // Ambil Token (Bisa ada di luar atau dalam user)
      const token = level1?.token || userObj?.token;

      // Ambil Role
      const role = userObj?.role || level1?.role;

      // Ambil Nama
      const nama =
        userObj?.nama ||
        userObj?.name ||
        level1?.nama ||
        level1?.name ||
        "User";

      // --- HILANGKAN KONSOL DEBUG (BERSIH) ---

      // 2. Validasi: Apakah Token ada?
      if (!token) {
        setErrorMsg("Login gagal: Token tidak ditemukan di data server.");
        // Log error hanya jika benar-benar kritis
        console.error("Login Error: Token tidak ditemukan", level1, userObj);
      } else {
        // 3. Jika Token Ada -> Simpan ke Context (Auto Login)
        const userData = {
          token: token,
          role: role,
          nama: nama,
        };

        login(userData);

        // 4. Redirect Otomatis berdasarkan Role
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else {
          // 🔥 FIX: Jika selain admin -> Unit Dashboard
          navigate("/unit/dashboard");
        }
      }
    } catch (err) {
      // Error Jaringan / Server 500 / 404
      // Hanya log error di console jika terjadi catch
      console.error("❌ Error Axios / Jaringan:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Terjadi kesalahan koneksi. Coba lagi nanti.";
      setErrorMsg(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 relative px-6 sm:px-10 lg:px-16 overflow-hidden">
      {/* --- BACKGROUND DECORATION (Blur Circles) --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-28 h-28 sm:w-40 sm:h-40 bg-blue-400/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-44 h-44 sm:w-56 sm:h-56 bg-blue-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/3 w-52 h-52 sm:w-64 sm:h-64 bg-blue-200/10 rounded-full blur-2xl animate-pulse"></div>
      </div>

      {/* --- CARD UTAMA (Glassmorphism) --- */}
      <div
        className={`
          w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-white/20
          transform transition-all duration-500 z-10 relative
          ${
            isPageLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }
        `}
      >
        {/* --- SISI KIRI: BRANDING --- */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col justify-center items-center p-8 text-white relative overflow-hidden">
          {/* --- LOGO GAMBAR (TANPA LINGKARAN) --- */}
          <div className="mb-6 animate-bounce">
            <img
              src={logoSinten}
              alt="Logo Sinten"
              className="h-32 w-32 object-contain drop-shadow-2xl"
            />
          </div>
          {/* ------------------------------------ */}

          {/* Teks Intro */}
          <div className="max-w-xs text-center z-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">SINTEN.ID</h1>
            <p className="text-blue-100 text-sm leading-relaxed">
              Sistem Informasi Tamu Setwan
            </p>
          </div>

          {/* Background Pattern Halus */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute top-0 left-0 w-full h-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            ></div>
          </div>
        </div>

        {/* --- SISI KANAN: FORM LOGIN --- */}
        <div className="w-full lg:w-1/2 bg-white p-6 sm:p-8 flex items-center justify-center">
          <div
            className={`
              w-full max-w-xs sm:max-w-sm
              transform transition-all duration-700 delay-700
              ${
                isPageLoaded
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-10"
              }
            `}
          >
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-6 text-center">
              Masuk ke akun Anda
            </h2>

            {/* ALERT ERROR (Muncul jika ada pesan) */}
            {errorMsg && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 flex items-center gap-3 animate-shake"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="block sm:inline text-sm">{errorMsg}</span>
                {/* Ikon X kecil di pojok kanan atas alert */}
                <button
                  onClick={() => setErrorMsg("")}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414l-1.293-1.293a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l-1.293 1.293zM10 13a3 3 0 11-6 0 3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* INPUT EMAIL */}
              <div className="transform transition-all duration-200 group">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors duration-200"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-blue-600 transition-colors duration-200">
                    <Mail
                      size={18}
                      className="text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200"
                    />
                  </div>
                  <input
                    type="email"
                    id="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="pl-10 pr-3 py-3 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    placeholder="Masukkan Email"
                  />
                </div>
              </div>

              {/* INPUT PASSWORD */}
              <div className="transform transition-all duration-200 group">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors duration-200"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-blue-600 transition-colors duration-200">
                    <Lock
                      size={18}
                      className="text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200"
                    />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="pl-10 pr-12 py-3 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    placeholder="Masukkan Kata Sandi"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center transform transition-transform duration-150 hover:scale-110"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff
                        size={20}
                        className="text-gray-500 hover:text-blue-500 transition-colors duration-150"
                      />
                    ) : (
                      <Eye
                        size={20}
                        className="text-gray-500 hover:text-blue-500 transition-colors duration-150"
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      {/* Spinner Loading */}
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Memproses...
                    </span>
                  ) : (
                    "Masuk"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* --- CSS ANIMASI --- */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s;
        }
      `}</style>
    </div>
  );
}
