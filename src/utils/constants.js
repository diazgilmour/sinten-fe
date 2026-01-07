// /www/wwwroot/sinten-fe/sinten/src/utils/constants.js

// =========================================
// 1. HELPER FORMAT TANGGAL
// =========================================
export const formatTanggal = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error("Invalid date string received:", dateString);
      return "-";
    }
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch (error) {
    console.error(
      "Error formatting date:",
      error,
      "for dateString:",
      dateString
    );
    return "-";
  }
};

// =========================================
// 2. HELPER LABEL & WARNA STATUS
// =========================================
export const getStatusLabel = (status) => {
  const map = {
    diproses: "Sedang Diproses",
    diterima: "Disetujui",
    ditolak: "Ditolak",
    selesai: "Selesai",
  };
  return map[status] || status;
};

export const STATUS_COLORS = {
  diproses: "bg-yellow-100 text-yellow-800 border-yellow-200",
  diterima: "bg-green-100 text-green-800 border-green-200",
  ditolak: "bg-red-100 text-red-800 border-red-200",
  selesai: "bg-blue-100 text-blue-800 border-blue-200",
};

// =========================================
// 3. DAFTAR TUJUAN SURAT (UPDATED)
// =========================================
export const TUJUAN_SURAT = [
  { value: "ketua_dprd", label: "Ketua DPRD" },
  // Split Wakil Ketua sesuai role baru
  { value: "wakil_ketua_i", label: "Wakil Ketua I" },
  { value: "wakil_ketua_ii", label: "Wakil Ketua II" },
  { value: "wakil_ketua_iii", label: "Wakil Ketua III" },

  { value: "sekretaris_dprd", label: "Sekretaris DPRD" },
  { value: "kabag_umum", label: "Kabag Umum" },
  { value: "kabag_humas", label: "Kabag Humas" },
  { value: "kabag_keuangan", label: "Kabag Keuangan" },
  { value: "kabag_persidangan", label: "Kabag Persidangan" },
  { value: "komisi_i", label: "Komisi I" },
  { value: "komisi_ii", label: "Komisi II" },
  { value: "komisi_iii", label: "Komisi III" },
  { value: "komisi_iv", label: "Komisi IV" },
];

// =========================================
// 4. GRUP ROLE & HELPER (UPDATED)
// =========================================

export const ROLE_GROUPS = {
  // Grup Pimpinan (Termasuk Ketua & Wakil Ketua I-III)
  KETUA: [
    "ketua_dprd",
    "wakil_ketua_i",
    "wakil_ketua_ii",
    "wakil_ketua_iii",
    "sekretaris_dprd",
  ],

  // Grup Komisi (Jika butuh pemisahan khusus)
  KOMISI: ["komisi_i", "komisi_ii", "komisi_iii", "komisi_iv"],

  // Grup Kepala Bagian
  KABAG: ["kabag_umum", "kabag_humas", "kabag_keuangan", "kabag_persidangan"],
};

// Helper: Cek apakah user adalah Admin
export const isAdmin = (role) => role === "admin";

// Helper: Cek apakah user termasuk Pimpinan (Ketua, Wakil, Sekretaris)
export const isKetua = (role) => ROLE_GROUPS.KETUA.includes(role);

// Helper: Cek apakah user termasuk Sekwan (Biasanya merujuk ke Sekretaris DPRD, atau Komisi tergantung struktur org)
// Note: Sesuaikan logika ini jika 'sekretaris' dan 'komisi' beda bagian.
// Disini saya buat isSekwan mencakup Komisi sesuai kode sebelumnya di constants.js
export const isSekwan = (role) => ROLE_GROUPS.KOMISI.includes(role);

// Helper: Cek apakah user termasuk Kabag
export const isKabag = (role) => ROLE_GROUPS.KABAG.includes(role);
