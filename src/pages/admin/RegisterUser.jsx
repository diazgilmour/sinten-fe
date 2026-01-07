import { useState, useEffect } from "react";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";

import {
  UserCheck,
  Mail,
  Lock,
  Shield,
  AlertCircle,
  CheckCircle,
  X,
  UserPlus,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  Filter,
} from "lucide-react";

const RegisterUser = () => {
  // --- STATE REGISTRASI ---
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // --- STATE DAFTAR USER (BARU) ---
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // --- STATE MODAL EDIT ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  // --- DAFTAR ROLE (UPDATE: Mencakup detail Pimpinan & Jabatan) ---
  const roles = [
    { value: "", label: "Pilih Role atau Jabatan" },
    { value: "admin", label: "Admin Superuser" },

    // Pimpinan
    { value: "ketua_dprd", label: "Ketua DPRD" },
    { value: "wakil_ketua_i", label: "Wakil Ketua I" },
    { value: "wakil_ketua_ii", label: "Wakil Ketua II" },
    { value: "wakil_ketua_iii", label: "Wakil Ketua III" },

    // Sekretariat DPRD
    { value: "sekretaris_dprd", label: "Sekretaris DPRD" },

    // Kepala Bagian (Kabag)
    { value: "kabag_umum", label: "Kabag Umum" },
    { value: "kabag_humas", label: "Kabag Humas" },
    { value: "kabag_keuangan", label: "Kabag Keuangan" },
    { value: "kabag_persidangan", label: "Kabag Persidangan" },

    // Komisi
    { value: "komisi_i", label: "Komisi I" },
    { value: "komisi_ii", label: "Komisi II" },
    { value: "komisi_iii", label: "Komisi III" },
    { value: "komisi_iv", label: "Komisi IV" },
  ];

  // Helper: Konversi Role Code ke Label (Untuk Tampilan Tabel)
  const getRoleLabel = (roleValue) => {
    const found = roles.find((r) => r.value === roleValue);
    return found ? found.label : roleValue;
  };

  // --- FETCH USERS ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/users"); // Pastikan endpoint backend benar
      // Fallback jika response format beda
      let data = res?.data?.data || res?.data || [];
      if (!Array.isArray(data)) data = [];
      setUsers(data);
    } catch (err) {
      console.error("Gagal fetch users:", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // --- FETCH SAAT MOUNT ---
  useEffect(() => {
    fetchUsers();
  }, []);

  // --- HANDLER FORM REGISTRASI ---
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await api.post("/register/users", formData);
      setMessage({ type: "success", text: "User berhasil didaftarkan!" });

      // Reset Form
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
      });

      // Refresh Tabel User
      fetchUsers();
    } catch (err) {
      console.error("Gagal register:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Gagal mendaftarkan user.",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER MODAL EDIT ---
  const openEditModal = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoadingUpdate(true);

    try {
      // Kirim data update
      await api.put(`/users/${editingUser.id}`, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        // Password tidak dikirim jika kosong agar tidak di-overwrite dengan string kosong
      });

      alert("User berhasil diupdate!");
      setIsModalOpen(false);
      fetchUsers(); // Refresh tabel
    } catch (err) {
      console.error("Gagal update user:", err);
      alert(err.response?.data?.message || "Gagal mengupdate user.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  // --- HANDLER DELETE ---
  const handleDelete = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus user "${name}"?`)) {
      try {
        await api.delete(`/users/${id}`);
        alert("User berhasil dihapus.");
        fetchUsers(); // Refresh tabel
      } catch (err) {
        console.error("Gagal hapus user:", err);
        alert("Gagal menghapus user.");
      }
    }
  };

  return (
    <AdminLayout title="Kelola Pengguna">
      <div className="space-y-8">
        {/* =========================================
             BAGIAN 1: REGISTER USER (FORM)
        ========================================= */}

        {message.text && (
          <div
            className={`mb-4 p-4 rounded-xl shadow-sm flex items-start gap-3 animate-fade-in ${
              message.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                message.type === "success"
                  ? "bg-green-100 animate-pulse"
                  : "bg-red-100"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <h3
                className={`text-sm font-bold mb-1 ${
                  message.type === "success" ? "text-green-800" : "text-red-800"
                }`}
              >
                {message.type === "success" ? "Berhasil!" : "Terjadi Kesalahan"}
              </h3>
              <p
                className={`text-sm mt-0 ${
                  message.type === "success" ? "text-green-700" : "text-red-700"
                }`}
              >
                {message.text}
              </p>
            </div>
            <button
              onClick={() => setMessage({ type: "", text: "" })}
              className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Kolom Kiri: Form Registrasi */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-lg">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <UserPlus className="h-6 w-6" />
                  Tambah User Baru
                </h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Input Nama */}
                  <div className="transform transition-all duration-200 group">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors duration-200"
                    >
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-blue-600 transition-colors duration-200">
                        <Shield
                          size={18}
                          className="text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200"
                        />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="pl-10 pr-3 py-3 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                  </div>

                  {/* Input Email */}
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
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="pl-10 pr-3 py-3 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                        placeholder="nama@email.com"
                      />
                    </div>
                  </div>

                  {/* Input Password */}
                  <div className="transform transition-all duration-200 group">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors duration-200"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-blue-600 transition-colors duration-200">
                        <Lock
                          size={18}
                          className="text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200"
                        />
                      </div>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="pl-10 pr-3 py-3 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                        placeholder="Minimal 6 karakter"
                      />
                    </div>
                  </div>

                  {/* Input Role */}
                  <div className="transform transition-all duration-200 group">
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors duration-200"
                    >
                      Role / Jabatan
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-blue-600 transition-colors duration-200">
                        <UserCheck
                          size={18}
                          className="text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200"
                        />
                      </div>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        className="pl-10 pr-10 py-3 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-white cursor-pointer"
                      >
                        {roles.map((role) => (
                          <option
                            key={role.value}
                            value={role.value}
                            disabled={role.value === ""}
                          >
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw className="animate-spin h-5 w-5" />
                          Memproses...
                        </span>
                      ) : (
                        "Daftarkan User"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Informasi & Panduan (Original) */}
          <div className="lg:w-96">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 transform transition-all duration-300 hover:shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <UserCheck className="h-6 w-6 text-blue-600" />
                Panduan Pendaftaran
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3 transform transition-all duration-200 hover:scale-105 group">
                  <span className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium group-hover:bg-blue-700 transition-colors duration-200">
                    1
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                      Isi Data Diri
                    </p>
                    <p className="text-xs text-gray-600">
                      Masukkan nama lengkap dan email yang valid dan aktif.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 transform transition-all duration-200 hover:scale-105 group">
                  <span className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium group-hover:bg-blue-700 transition-colors duration-200">
                    2
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                      Tentukan Akses
                    </p>
                    <p className="text-xs text-gray-600">
                      Pilih role atau jabatan yang sesuai untuk user baru.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 transform transition-all duration-200 hover:scale-105 group">
                  <span className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium group-hover:bg-blue-700 transition-colors duration-200">
                    3
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                      Buat Akun
                    </p>
                    <p className="text-xs text-gray-600">
                      Klik "Daftarkan User" untuk membuat akun. Password
                      sementara akan dibuat.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 transform transition-all duration-200 hover:scale-105 group">
                  <span className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium group-hover:bg-blue-700 transition-colors duration-200">
                    4
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                      Berikan Kredensial
                    </p>
                    <p className="text-xs text-gray-600">
                      Informasikan email dan password kepada user untuk login
                      pertama kali.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200 transform transition-all duration-200 hover:shadow-md group">
                <p className="text-xs font-medium text-blue-800 mb-1 group-hover:text-blue-600 transition-colors duration-200">
                  💡 Catatan Penting:
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li className="group-hover:text-blue-600 transition-colors duration-200">
                    • Pastikan email yang digunakan valid.
                  </li>
                  <li className="group-hover:text-blue-600 transition-colors duration-200">
                    • User dapat mengubah password setelah login pertama.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
             BAGIAN 2: DAFTAR USER (TABEL)
        ========================================= */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full max-h-[600px]">
          {/* Header Card + Search */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <UserCheck size={24} className="text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Daftar Pengguna
                </h2>
                <p className="text-xs text-gray-500">
                  Kelola akses user di sistem
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <button
                onClick={fetchUsers}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-blue-600 transition-all"
                title="Refresh Data"
              >
                <RefreshCw
                  size={18}
                  className={loadingUsers ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-white border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 w-10">No</th>
                  <th className="px-6 py-3">Nama Lengkap</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role / Jabatan</th>
                  <th className="px-6 py-3 text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loadingUsers ? (
                  // Skeleton Loading
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-4 mx-auto"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      <Filter className="mx-auto h-12 w-12 mb-3 opacity-20" />
                      <p>Tidak ada data user ditemukan.</p>
                    </td>
                  </tr>
                ) : (
                  users
                    .filter(
                      (u) =>
                        u.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        u.email
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                    )
                    .map((user, index) => (
                      <tr
                        key={user.id}
                        className="hover:bg-blue-50 transition-colors duration-150 group"
                      >
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id, user.name)}
                              className="p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-transparent hover:border-red-200"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================
           MODAL EDIT USER (OVERLAY)
      ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Pencil size={18} /> Edit User
              </h3>
              <button
                onClick={closeEditModal}
                className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body Form */}
            <div className="p-6 space-y-4">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, role: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                  >
                    {roles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Password tidak perlu diubah.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loadingUpdate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {loadingUpdate ? (
                      <>
                        <RefreshCw className="animate-spin h-4 w-4" />{" "}
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Perubahan"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default RegisterUser;
