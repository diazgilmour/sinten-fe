import { Routes, Route, Navigate } from "react-router-dom";

// Import Halaman Publik
import Login from "./pages/Login";
import KirimSurat from "./pages/KirimSurat";
import LacakSurat from "./pages/LacakSurat";

// Import Halaman Admin
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import DashboardSurat from "./pages/admin/DashboardSurat";
import RegisterUser from "./pages/admin/RegisterUser";
import DaftarHadir from "./pages/admin/DaftarHadir";

// Import Halaman Unit
import UnitDashboard from "./pages/unit/UnitDashboard";
import SuratUnit from "./pages/unit/SuratUnit";

// Import Halaman Detail
import DetailSurat from "./pages/surat/DetailSurat";

// --- DAFTAR ROLE UNIT (UPDATED) ---
// Pastikan list ini SAMA PERSIS dengan opsi di RegisterUser
const UNIT_ROLES = [
  "ketua_dprd",
  // Ubah generic "wakil_ketua_dprd" menjadi spesifik:
  "wakil_ketua_i",
  "wakil_ketua_ii",
  "wakil_ketua_iii",
  "sekretaris_dprd",
  "kabag_umum",
  "kabag_humas",
  "kabag_keuangan",
  "kabag_persidangan",
  "komisi_i",
  "komisi_ii",
  "komisi_iii",
  "komisi_iv",
];

// --- KOMPONEN PROTEKSI HALAMAN ---
const ProtectedRoute = ({ children, roleAllowed }) => {
  const role = localStorage.getItem("role");

  if (!role) return <Navigate to="/login" replace />;

  let isAuthorized = false;

  // Jika roleAllowed adalah string (admin)
  if (typeof roleAllowed === "string") {
    isAuthorized = role === roleAllowed;
  }
  // Jika roleAllowed adalah Array (Unit Roles)
  else if (Array.isArray(roleAllowed)) {
    isAuthorized = roleAllowed.includes(role);
  }

  // Jika tidak berhak, tendang ke login (atau bisa diarahkan ke dashboard lain jika perlu)
  if (!isAuthorized) {
    console.warn("Akses ditolak. Role:", role, "Diizinkan:", roleAllowed);
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* =========================================
           RUTE PUBLIK
      ======================================== */}
      <Route path="/" element={<KirimSurat />} />
      <Route path="/lacak" element={<LacakSurat />} />
      <Route path="/kirim-surat" element={<KirimSurat />} />
      <Route path="/login" element={<Login />} />

      {/* =========================================
           RUTE ADMIN (Protected)
      ======================================== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roleAllowed="admin">
            <Navigate to="/admin/dashboard" replace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roleAllowed="admin">
            <DashboardAdmin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/surat-masuk"
        element={
          <ProtectedRoute roleAllowed="admin">
            <DashboardSurat />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/lihat-semua-surat"
        element={
          <ProtectedRoute roleAllowed="admin">
            <Navigate to="/admin/surat-masuk?mode=semua" replace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/daftar-hadir"
        element={
          <ProtectedRoute roleAllowed="admin">
            <DaftarHadir />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/register"
        element={
          <ProtectedRoute roleAllowed="admin">
            <RegisterUser />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/surat/:id"
        element={
          <ProtectedRoute roleAllowed="admin">
            <DetailSurat />
          </ProtectedRoute>
        }
      />

      {/* =========================================
           RUTE UNIT (Protected) - FIXED
      ======================================== */}
      <Route
        path="/unit/dashboard"
        element={
          <ProtectedRoute roleAllowed={UNIT_ROLES}>
            <UnitDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/unit/surat"
        element={
          <ProtectedRoute roleAllowed={UNIT_ROLES}>
            <SuratUnit />
          </ProtectedRoute>
        }
      />

      <Route
        path="/unit/surat/:id"
        element={
          <ProtectedRoute roleAllowed={UNIT_ROLES}>
            <DetailSurat />
          </ProtectedRoute>
        }
      />

      {/* =========================================
           FALLBACK
      ======================================== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
