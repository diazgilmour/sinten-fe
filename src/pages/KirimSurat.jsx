import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Building,
  FileText,
  Send,
  ArrowRight,
  CheckCircle,
  Paperclip,
  Phone,
  XCircle,
  UploadCloud,
  File,
  LogIn,
  Copy,
  Search,
  Truck,
} from "lucide-react";
import api from "../services/api";

// --- IMPORT LOGO ---
import logoSinten from "../assets/sinten.png";
// ------------------

// --- DATA TUJUAN SURAT (UPDATE: Mencakup semua bagian disposisi) ---
// Data ini diambil dari referensi DetailSurat.jsx agar sinkron
const TUJUAN_SURAT = [
  // Pimpinan
  { value: "ketua_dprd", label: "Ketua DPRD" },
  { value: "wakil_ketua_i", label: "Wakil Ketua I" },
  { value: "wakil_ketua_ii", label: "Wakil Ketua II" },
  { value: "wakil_ketua_iii", label: "Wakil Ketua III" },

  // Sekretariat DPRD
  { value: "sekretaris_dprd", label: "Sekretaris DPRD" },
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
// ---------------------------------------------------------------

const KirimSurat = () => {
  // --- 1. STATE FORMULIR ---
  const [formData, setFormData] = useState({
    pengirim: "",
    email: "",
    no_hp: "",
    instansi: "",
    tujuan: "",
    perihal: "",
    isi_surat: "",
    lampiran: null,
  });

  // --- 2. STATE FILE (Support Multiple & Drag & Drop) ---
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- STATE BARU: TRACKING ---
  const [trackingQuery, setTrackingQuery] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingMode, setTrackingMode] = useState("nomor"); // 'nomor' atau 'email'

  // --- FUNGSI SALIN TEKS (OTOMATIS + FALLBACK) ---
  const copyText = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
          return true;
        } catch (err) {
          console.error("Fallback copy gagal", err);
          return false;
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error("Copy gagal total", err);
      return false;
    }
  };

  const handleChange = (e) => {
    if (e.target.name === "lampiran") {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      setFilePreviews(selectedFiles.map((f) => f.name));
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  // --- FUNGSI TRACKING SURAT (UPDATE LOGIKA REDIRECT) ---
  const handleCheckStatus = (e) => {
    e.preventDefault();
    if (!trackingQuery.trim()) {
      toast.error("Mohon masukkan data pencarian terlebih dahulu.");
      return;
    }

    setTrackingLoading(true);
    // Simulasi request API agar terasa loading
    setTimeout(() => {
      setTrackingLoading(false);
      toast.success("Mengarahkan ke halaman pelacakan...", {
        duration: 1500,
      });

      // Redirect Logic berdasarkan Mode
      setTimeout(() => {
        if (trackingMode === "nomor") {
          window.location.href = `/lacak?nomor_surat=${trackingQuery}`;
        } else {
          window.location.href = `/lacak?email=${trackingQuery}`;
        }
      }, 1000);
    }, 800);
  };

  // --- FITUR DRAG & DROP ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);

    // 🔥 PERBAIKAN: Izinkan PDF, JPG, JPEG, PNG
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    const validFiles = droppedFiles.filter((f) =>
      allowedTypes.includes(f.type)
    );

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      setFilePreviews((prev) => [...prev, ...validFiles.map((f) => f.name)]);
    } else {
      toast.error("Format file tidak didukung (Hanya PDF, JPG, JPEG, PNG).");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleRemoveFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = filePreviews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const resetForm = () => {
    setFormData({
      pengirim: "",
      email: "",
      no_hp: "",
      instansi: "",
      tujuan: "",
      perihal: "",
      isi_surat: "",
      lampiran: null,
    });
    setFiles([]);
    setFilePreviews([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("pengirim", formData.pengirim);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("no_hp", formData.no_hp);
      formDataToSend.append("instansi", formData.instansi);
      formDataToSend.append("tujuan", formData.tujuan);
      formDataToSend.append("perihal", formData.perihal);
      formDataToSend.append("isi_surat", formData.isi_surat);

      if (files.length > 0) {
        files.forEach((file) => {
          formDataToSend.append("lampiran", file);
        });
      }

      const response = await api.post("/kirim-surat", formDataToSend);

      const level1 = response.data;
      const level2 = level1?.data;
      const nomorSurat = level1?.nomor_surat || level2?.nomor_surat;

      if (!nomorSurat) {
        toast.error("Nomor surat tidak ditemukan.");
        resetForm();
      } else {
        const isAutoCopied = await copyText(nomorSurat);
        resetForm();

        toast.success(
          (t) => (
            <div className="w-full">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500 w-5 h-5" />
                <span className="font-bold text-gray-900">Surat Terkirim!</span>
              </div>
              <p className="text-xs text-gray-600 mt-1 mb-2">
                Nomor Surat Anda:
              </p>
              <div className="bg-gray-100 p-2 rounded border border-gray-200 text-sm font-mono text-gray-800 select-all mb-3">
                {nomorSurat}
              </div>

              {isAutoCopied ? (
                <div className="text-xs text-green-600 text-center font-medium">
                  ✅ Otomatis tersalin!
                </div>
              ) : (
                <button
                  onClick={() => {
                    copyText(nomorSurat);
                    toast.success("Berhasil disalin!", { id: "copy-success" });
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow transition-colors flex items-center justify-center gap-2"
                >
                  <Copy size={16} /> SALIN NOMOR
                </button>
              )}
            </div>
          ),
          {
            duration: 6000,
          }
        );

        // Redirect ke halaman lacak otomatis dengan membawa nomor surat
        setTimeout(() => {
          window.location.href = `/lacak?nomor_surat=${nomorSurat}`;
        }, 3000);
      }
    } catch (err) {
      console.error("Error submitting:", err);
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Gagal mengirim surat. Cek kembali data Anda."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pb-10">
      {/* --- NAVBAR --- */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              {/* --- LOGO GAMBAR --- */}
              <img
                src={logoSinten}
                alt="Logo Sinten"
                className="h-8 w-auto object-contain sm:h-10 transform transition-all duration-300 group-hover:scale-110"
              />
              {/* ------------------ */}

              <span className="font-bold text-xl text-gray-900 hidden sm:block group-hover:text-blue-600 transition-colors duration-300">
                SINTEN
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-sm"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-20 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* KIRI: HERO & INFO + WIDGET TRACKING */}
          <div className="space-y-8 lg:sticky lg:top-28 w-full order-1 lg:order-1">
            {/* 1. BAGIAN TEKS HERO */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center justify-center lg:justify-start gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                <CheckCircle size={18} />
                Selamat Datang di SINTEN
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                Kirim Surat Cepat{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Aspirasi Tepat
                </span>{" "}
                Layanan Hebat
              </h1>

              <p className="text-base lg:text-lg text-gray-600 leading-relaxed">
                Tak Perlu Antre, Tak Perlu Menunggu. Dengan SINTEN, Kirim Surat
                ke Sekretariat Dewan Jadi Semudah Mengirim Pesan.
              </p>
            </div>

            {/* 2. BAGIAN TRACKING (BAWAH TEKS) */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

              <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8 overflow-hidden">
                {/* Icon Truk dibuat absolute agar tidak memakan tempat di flow layout */}
                <Truck className="absolute -right-6 -bottom-6 text-9xl text-blue-50 opacity-50 transform -rotate-12 pointer-events-none" />

                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Search className="text-blue-600" size={24} />
                    Lacak Status Surat
                  </h3>
                  <p className="text-sm text-gray-500 mb-5">
                    Masukkan data untuk melihat progress surat Anda secara
                    real-time.
                  </p>

                  <form onSubmit={handleCheckStatus} className="space-y-4">
                    {/* Pilihan Mode Tracking */}
                    <div className="flex gap-4 bg-gray-100 p-1 rounded-lg">
                      <label
                        className={`flex-1 text-center cursor-pointer py-2 rounded-md text-sm font-medium transition-all ${
                          trackingMode === "nomor"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="trackMode"
                          value="nomor"
                          checked={trackingMode === "nomor"}
                          onChange={() => setTrackingMode("nomor")}
                          className="hidden"
                        />
                        Nomor Resi
                      </label>
                      <label
                        className={`flex-1 text-center cursor-pointer py-2 rounded-md text-sm font-medium transition-all ${
                          trackingMode === "email"
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="trackMode"
                          value="email"
                          checked={trackingMode === "email"}
                          onChange={() => setTrackingMode("email")}
                          className="hidden"
                        />
                        Email
                      </label>
                    </div>

                    <div className="relative">
                      {trackingMode === "nomor" && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-400 font-mono text-xs">
                            #
                          </span>
                        </div>
                      )}
                      <input
                        type={trackingMode === "email" ? "email" : "text"}
                        value={trackingQuery}
                        onChange={(e) => setTrackingQuery(e.target.value)}
                        placeholder={
                          trackingMode === "nomor"
                            ? "ER-KABAG_KEUANGAN-2025122626"
                            : "nama@email.com"
                        }
                        className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block transition-all outline-none hover:bg-white focus:bg-white ${
                          trackingMode === "nomor" ? "pl-8 font-mono" : ""
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={trackingLoading}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-md transition-all transform active:scale-95 disabled:opacity-70"
                    >
                      {trackingLoading ? (
                        "Mencari..."
                      ) : (
                        <>
                          Cek Status <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* KANAN: FORM CARD */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden order-2 lg:order-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <h2 className="text-2xl font-bold">Kirim Surat Baru</h2>
              <p className="text-blue-100 mt-1 text-sm">
                Isi form di bawah ini untuk mengajukan surat.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-6 lg:p-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label
                    htmlFor="pengirim"
                    className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
                  >
                    <User size={16} className="text-blue-600" /> Nama Pengirim
                  </label>
                  <input
                    type="text"
                    id="pengirim"
                    name="pengirim"
                    value={formData.pengirim}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    placeholder="Nama Lengkap Anda"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
                  >
                    <Mail size={16} className="text-blue-600" /> Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    placeholder="nama@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label
                    htmlFor="no_hp"
                    className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
                  >
                    <Phone size={16} className="text-blue-600" /> No. HP
                  </label>
                  <input
                    type="tel"
                    id="no_hp"
                    name="no_hp"
                    value={formData.no_hp}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                <div>
                  <label
                    htmlFor="instansi"
                    className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
                  >
                    <Building size={16} className="text-blue-600" /> Instansi
                  </label>
                  <input
                    type="text"
                    id="instansi"
                    name="instansi"
                    value={formData.instansi}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    placeholder="Nama Instansi / Lembaga"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="tujuan"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Tujuan Surat
                </label>
                <div className="relative">
                  <select
                    id="tujuan"
                    name="tujuan"
                    value={formData.tujuan}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
                  >
                    <option value="">Pilih Tujuan Surat</option>
                    {TUJUAN_SURAT.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
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

              {/* PERIHAL DROPDOWN */}
              <div className="relative">
                <label
                  htmlFor="perihal"
                  className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
                >
                  <FileText size={16} className="text-blue-600" /> Perihal
                </label>
                <select
                  id="perihal"
                  name="perihal"
                  value={formData.perihal}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
                >
                  <option value="" disabled>
                    Pilih Perihal Surat...
                  </option>
                  <option value="Kunjungan Kerja">Kunjungan Kerja</option>
                  <option value="Kunjungan Tamu">Kunjungan Tamu</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500 mt-6">
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

              <div>
                <label
                  htmlFor="isi_surat"
                  className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
                >
                  <FileText size={16} className="text-blue-600" /> Isi Surat
                </label>
                <textarea
                  id="isi_surat"
                  name="isi_surat"
                  value={formData.isi_surat}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white resize-none"
                  placeholder="Tuliskan isi surat Anda di sini..."
                />
              </div>

              {/* --- UI LAMPIRAN (UPDATE: MENDUKUNG PDF, JPG, PNG) --- */}
              <div>
                <label
                  htmlFor="lampiran"
                  className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
                >
                  <Paperclip size={16} className="text-blue-600" /> Lampiran
                  (PDF, JPG, PNG)
                </label>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 text-center cursor-pointer
                    ${
                      isDragging
                        ? "border-blue-500 bg-blue-50 scale-[1.02]"
                        : "border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-white"
                    }
                  `}
                >
                  {/* 🔥 UPDATE: accept attribute */}
                  <input
                    type="file"
                    id="lampiran"
                    name="lampiran"
                    accept=".pdf, .jpg, .jpeg, .png"
                    multiple
                    onChange={handleChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  <div className="pointer-events-none">
                    <UploadCloud className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                    <p
                      className={`font-semibold text-lg mb-1 ${
                        isDragging ? "text-blue-600" : "text-gray-700"
                      }`}
                    >
                      {isDragging
                        ? "Lepaskan File di Sini..."
                        : "Klik atau Tarik File ke Sini"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Format: PDF, JPG, JPEG, PNG
                    </p>
                  </div>
                </div>
              </div>

              {/* List File Terpilih */}
              {filePreviews.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    File Terpilih ({filePreviews.length})
                  </p>
                  {filePreviews.map((name, idx) => {
                    const fileSize = files[idx]
                      ? formatFileSize(files[idx].size)
                      : "";
                    return (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-white hover:shadow-md transition-all duration-300"
                      >
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0">
                          <File size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {name}
                          </p>
                          <p className="text-xs text-gray-500">{fileSize}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
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
                          d="M4 12a8 8 0 018-8V0c5.373 0 9.598 4.054 9.598 8v10h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send size={20} /> Kirim Surat
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 SINTEN. All Rights Reserved. Sistem Informasi Tamu
            Sekretariat Dewan Kab. Serang.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default KirimSurat;
