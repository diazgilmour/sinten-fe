// /www/wwwroot/sinten-fe/sinten/src/utils/constants.js

// =========================================
// 1. HELPER FORMAT TANGGAL
// =========================================
export const formatTanggal = (dateString) => {
  // 1. Jika inputnya null, undefined, atau string kosong, kembali "-"
  if (!dateString) {
    return "-";
  }

  try {
    // 2. Coba buat objek Date dari string
    const date = new Date(dateString);

    // 3. Periksa apakah hasilnya adalah tanggal yang valid
    if (isNaN(date.getTime())) {
      console.error("Invalid date string received:", dateString);
      return "-";
    }

    // 4. Jika valid, format tanggalnya
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch (error) {
    // 5. Tangkap error tak terduga lainnya
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
// 3. DAFTAR TUJUAN SURAT (Untuk Formulir Kirim)
// =========================================
export const TUJUAN_SURAT = [
  { value: "ketua_dprd", label: "Ketua DPRD" },
  { value: "wakil_ketua_dprd", label: "Wakil Ketua DPRD" },
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
// 4. 🔥 PERBAIKAN BARU: GRUP ROLE & HELPER DISPOSISI
// =========================================

export const ROLE_GROUPS = {
  // Grup Pimpinan (Menerima dari Admin, Bisa Disposisi ke Sekwan)
  KETUA: [
    "ketua_dprd",
    "wakil_ketua_dprd",
    "sekretaris_dprd", // Sesuai permintaan: sekretaris di grup ini
  ],

  // Grup Sekretariat / Sekwan (Menerima dari Admin/Ketua, Bisa Disposisi ke Kabag)
  SEKWAN: ["komisi_i", "komisi_ii", "komisi_iii", "komisi_iv"],

  // Grup Kepala Bagian (Menerima dari Sekwan, Akhir rantai: Setujui/Tolak saja)
  KABAG: ["kabag_umum", "kabag_keuangan", "kabag_persidangan"],
};

// Helper: Cek apakah user adalah Admin
export const isAdmin = (role) => role === "admin";

// Helper: Cek apakah user termasuk Pimpinan (Ketua, Wakil, Sekretaris)
export const isKetua = (role) => ROLE_GROUPS.KETUA.includes(role);

// Helper: Cek apakah user termasuk Sekwan (Komisi I-IV)
export const isSekwan = (role) => ROLE_GROUPS.SEKWAN.includes(role);

// Helper: Cek apakah user termasuk Kabag (Umum, Keuangan, Persidangan)
export const isKabag = (role) => ROLE_GROUPS.KABAG.includes(role);
