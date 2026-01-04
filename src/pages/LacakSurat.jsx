import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  formatTanggal,
  getStatusLabel,
  STATUS_COLORS,
} from "../utils/constants";
import {
  Search,
  AlertCircle,
  FileText,
  ChevronRight,
  UserCheck,
  Trash2,
  Mail,
  Plus,
  Download,
  File as FileIcon,
  Send,
  Shield,
  Users,
  Stamp,
  ArrowRight,
  User,
  Building,
  Clock,
  CheckCircle,
  X,
  Eye,
  FileQuestion,
  ClipboardCheck,
  Edit,
  Save,
  Database,
} from "lucide-react";

// Konfigurasi Base URL
const FILE_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://103.179.219.39:8282";

const LacakSurat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [nomorSurat, setNomorSurat] = useState("");
  const [email, setEmail] = useState("");
  const [searchMode, setSearchMode] = useState("nomor");

  const [surat, setSurat] = useState(null);
  const [daftarSurat, setDaftarSurat] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [error, setError] = useState("");
  const [errorEmail, setErrorEmail] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // --- STATE DAFTAR HADIR ---
  const [isEditingHadir, setIsEditingHadir] = useState(true);
  const [daftarHadir, setDaftarHadir] = useState([
    { nama: "", jabatan: "", no_hp: "" },
  ]);
  const [submittedKehadiran, setSubmittedKehadiran] = useState([]);
  const [submittingDaftarHadir, setSubmittingDaftarHadir] = useState(false);
  const [daftarHadirError, setDaftarHadirError] = useState("");

  // --- fetchSuratById (DIPERBAIKI LOGIKA CEK KEHADIRAN) ---
  const fetchSuratById = useCallback(async (idOrObject) => {
    setLoading(true);
    try {
      if (typeof idOrObject === "object" && idOrObject !== null) {
        console.log("🔍 [Debug] Data Surat Diterima:", idOrObject);

        const existingKehadiran =
          idOrObject.kehadirans || idOrObject.kehadiran || [];
        console.log("🔍 [Debug] Data Kehadiran di JSON:", existingKehadiran);

        setSurat({
          data: {
            surat: idOrObject,
            history: idOrObject.disposisis || [],
          },
        });

        if (existingKehadiran.length > 0) {
          console.log("✅ [Debug] Ada data kehadiran, masuk mode Tabel.");
          setSubmittedKehadiran(existingKehadiran);
          setIsEditingHadir(false);
        } else {
          console.log("⚠️ [Debug] Tidak ada data kehadiran, masuk mode Form.");
          setIsEditingHadir(true);
        }

        setLoading(false);
        return;
      }
      throw new Error("Gagal memuat data detail. Data surat tidak lengkap.");
    } catch (err) {
      console.error("❌ [LacakSurat] Error fetchSuratById:", err);
      const message =
        err.response?.data?.message ||
        err.message ||
        "Gagal memuat detail surat.";
      setError(message);
      toast.error(message);
      setSurat(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- fetchSurat (DIPERBAIKI LOGIKA CEK KEHADIRAN) ---
  const fetchSurat = useCallback(async (noSurat) => {
    setLoading(true);
    setError("");
    setSurat(null);

    try {
      const response = await api.get(`/surat/status`, {
        params: { nomor_surat: noSurat },
      });

      let rawResponse = response.data;
      let suratData = rawResponse?.data;

      if (suratData?.surat) {
        suratData = suratData.surat;
      }

      if (suratData) {
        console.log("🔍 [Debug] API Response Full:", suratData);
        const existingKehadiran =
          suratData.kehadirans || suratData.kehadiran || [];
        console.log("🔍 [Debug] Extracted Kehadiran:", existingKehadiran);

        setSurat({
          data: {
            surat: suratData,
            history: suratData.disposisis || [],
          },
        });
        setNomorSurat(noSurat);

        if (existingKehadiran.length > 0) {
          console.log("✅ [Debug] Restore Mode Tabel.");
          setSubmittedKehadiran(existingKehadiran);
          setIsEditingHadir(false);
        } else {
          console.log("⚠️ [Debug] Restore Mode Form (Data Kosong/Null).");
          setIsEditingHadir(true);
        }
      } else {
        throw new Error(`Surat dengan nomor "${noSurat}" tidak ditemukan.`);
      }
    } catch (err) {
      console.error("❌ [LacakSurat] Error fetchSurat (Nomor):", err);
      const message =
        err.response?.data?.message ||
        err.message ||
        "Terjadi kesalahan jaringan.";
      setError(message);
      toast.error(message);
      setSurat(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- fetchByEmailData (Sama seperti sebelumnya) ---
  const fetchByEmailData = useCallback(async (emailValue) => {
    setLoadingEmail(true);
    setErrorEmail("");
    setDaftarSurat([]);
    setSurat(null);

    try {
      const response = await api.get(`/surat/status`, {
        params: { email: emailValue },
      });

      let resData = response.data?.data;

      if (resData?.surat) {
        resData = [resData.surat];
      }

      let data = [];
      if (Array.isArray(resData)) {
        data = resData;
      } else if (typeof resData === "object" && resData !== null) {
        data = [resData];
      }

      if (data.length === 0) {
        setErrorEmail("Tidak ada data surat ditemukan untuk email ini.");
      } else {
        setDaftarSurat(data);
      }
    } catch (err) {
      console.error("❌ [LacakSurat] Error fetchByEmailData:", err);
      setErrorEmail("Gagal mencari surat.");
    } finally {
      setLoadingEmail(false);
    }
  }, []);

  // --- EFFECTS ---
  useEffect(() => {
    const nomorDariURL = searchParams.get("nomor_surat");
    const emailDariURL = searchParams.get("email");

    if (nomorDariURL) {
      setNomorSurat(nomorDariURL);
      setSearchMode("nomor");
      fetchSurat(nomorDariURL);
    } else if (emailDariURL) {
      setEmail(emailDariURL);
      setSearchMode("email");
      fetchByEmailData(emailDariURL);
    }
  }, [searchParams, fetchSurat, fetchByEmailData]);

  const handleTrack = (e) => {
    e.preventDefault();
    const cleanNomorSurat = nomorSurat.trim();
    if (!cleanNomorSurat) return;
    fetchSurat(cleanNomorSurat);
  };

  const handleTrackByEmail = (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;
    fetchByEmailData(cleanEmail);
  };

  const handleShowDetail = (suratItem) => {
    const nomorSurat = suratItem.nomor_surat;

    if (nomorSurat) {
      fetchSurat(nomorSurat);
    } else {
      console.warn(
        "Nomor surat tidak ditemukan di item, menggunakan data cache."
      );
      fetchSuratById(suratItem);
    }
  };

  const handlePreview = async (lampiran) => {
    if (!lampiran || (!lampiran.id && !lampiran.filename)) {
      alert("Data lampiran tidak valid.");
      return;
    }

    setPreviewLoading(true);
    try {
      const fileName =
        lampiran.nama_file || lampiran.filename || `file_${lampiran.id}`;
      const fileExt = fileName.split(".").pop().toLowerCase();

      const response = await api.get(`/lampiran/${lampiran.id}`, {
        responseType: "blob",
      });

      const serverMimeType = response.headers?.["content-type"];
      let mimeType = "application/octet-stream";

      if (serverMimeType) {
        mimeType = serverMimeType;
      } else if (fileExt === "pdf") {
        mimeType = "application/pdf";
      } else if (["jpg", "jpeg"].includes(fileExt)) {
        mimeType = "image/jpeg";
      } else if (fileExt === "png") {
        mimeType = "image/png";
      } else if (fileExt === "gif") {
        mimeType = "image/gif";
      } else if (fileExt === "webp") {
        mimeType = "image/webp";
      }

      const blob = new Blob([response.data], { type: mimeType });
      const blobUrl = window.URL.createObjectURL(blob);

      setSelectedFile({
        name: fileName,
        url: blobUrl,
        type: fileExt,
      });
    } catch (error) {
      console.error("❌ [LacakSurat] Error Preview Lampiran:", error);
      const fileUrl = lampiran.filename || lampiran.url;
      if (fileUrl) {
        toast.error("Preview via API gagal, membuka URL langsung...");
        const fullUrl = fileUrl.startsWith("http")
          ? fileUrl
          : `${FILE_BASE_URL}/${fileUrl}`;
        window.open(fullUrl, "_blank");
      } else {
        toast.error(
          "Gagal memuat file. File mungkin rusak atau tidak didukung."
        );
      }
      setSelectedFile(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (selectedFile && selectedFile.url) {
      window.URL.revokeObjectURL(selectedFile.url);
    }
    setSelectedFile(null);
  };

  // ==========================================
  // 🔥 FUNGSI BARU: DETEKSI PESAN (CATATAN) DARI APPROVALS
  // ==========================================
  const getFinalMessage = () => {
    if (!surat || !surat.data) return "";
    const s = surat.data.surat;

    // 1. Cek field biasa (langka 1)
    if (s.pesan_balasan) return s.pesan_balasan;
    if (s.catatan) return s.catatan;
    if (s.pesan) return s.pesan;

    // 2. Cek riwayat approvals (langka 2) -> Ini untuk kasusmu
    if (s.approvals && Array.isArray(s.approvals)) {
      // Cari approval terakhir (dibalik urutannya)
      const lastAction = [...s.approvals]
        .reverse()
        .find(
          (a) =>
            a.action === "rejected" ||
            a.action === "ditolak" ||
            a.action === "approved" ||
            a.action === "disetujui"
        );

      // Jika ada catatan di approval terakhir, ambil isinya
      if (lastAction && lastAction.catatan) {
        return lastAction.catatan;
      }
    }

    return "";
  };

  // ==========================================
  // 🔥 PERBAIKAN LOGIKA TAHAPAN PROSES
  // ==========================================
  const getTahapanDetails = () => {
    if (!surat || !surat.data || !surat.data.surat) return [];

    const { surat: suratData, history } = surat.data;
    const status = suratData.status;
    const currentUnit = suratData.current_unit;

    // 🔥 PERBAIKAN: Panggil fungsi getFinalMessage()
    const pesanBalasan = getFinalMessage();

    const statusLower = status?.toLowerCase() || "";

    const tahapan = [
      {
        id: 1,
        name: "Pengajuan Surat",
        icon: <Send size={20} className="text-white" />,
        status: "completed",
        description: "Surat berhasil diajukan ke sistem.",
        date: suratData.created_at,
      },
      {
        id: 2,
        name: "Verifikasi Admin",
        icon: <Shield size={20} className="text-white" />,
        status: "pending",
        description: "Menunggu verifikasi oleh Admin.",
        date: null,
      },
      {
        id: 3,
        name: "Proses Disposisi",
        icon: <Users size={20} className="text-white" />,
        status: "pending",
        description: "Surat sedang diproses ke bagian terkait.",
        date: null,
      },
      {
        id: 4,
        name: "Status Akhir",
        icon: <Stamp size={20} className="text-white" />,
        status: "pending",
        description: "Menunggu persetujuan akhir.",
        date: null,
      },
    ];

    const isRejected =
      statusLower.includes("ditolak") || statusLower.includes("rejected");

    if (statusLower === "pending" || !status) {
      tahapan[1].status = "active";
    }

    if (
      suratData.disposisis &&
      Array.isArray(suratData.disposisis) &&
      suratData.disposisis.length > 0
    ) {
      tahapan[1].status = "completed";
      const lastDispo = suratData.disposisis[suratData.disposisis.length - 1];
      tahapan[1].date = lastDispo.created_at;

      if (currentUnit) {
        tahapan[2].status = "active";
        tahapan[2].date = lastDispo.created_at;

        const unitLabels = {
          ketua_dprd: "Pimpinan (Ketua/Wakil)",
          sekretaris_dprd: "Pimpinan (Sekretaris)",
          komisi_i: "Komisi I (Sekwan)",
          komisi_ii: "Komisi II (Sekwan)",
          komisi_iii: "Komisi III (Sekwan)",
          komisi_iv: "Komisi IV (Sekwan)",
          kabag_umum: "Kabag Umum",
          kabag_humas: "Kabag Humas",
          kabag_keuangan: "Kabag Keuangan",
          kabag_persidangan: "Kabag Persidangan",
        };

        const unitName =
          unitLabels[currentUnit] ||
          currentUnit.replace(/_/g, " ").toUpperCase();
        tahapan[2].description = `Sedang diproses oleh ${unitName}.`;
      }
    }

    if (isRejected) {
      tahapan[2].status = "completed";
      tahapan[2].description = "Proses berhenti (Surat Ditolak)";

      tahapan[3].status = "rejected";
      tahapan[3].description = pesanBalasan
        ? `Surat Ditolak. Alasan: "${pesanBalasan}"`
        : "Surat telah ditolak.";
    } else if (
      statusLower.includes("disetujui") ||
      statusLower.includes("diterima") ||
      statusLower.includes("selesai") ||
      statusLower.includes("approved") ||
      statusLower.includes("ok")
    ) {
      tahapan[2].status = "completed";
      tahapan[3].status = "completed";
      tahapan[3].description = "Surat telah disetujui.";
    }

    return tahapan.map((tahap) => {
      const isCompleted = tahap.status === "completed";
      const isActive = tahap.status === "active";
      const isRejected = tahap.status === "rejected";

      let stateClass = "bg-gray-300";
      if (isRejected) stateClass = "bg-red-500";
      else if (isCompleted) stateClass = "bg-green-500";
      else if (isActive) stateClass = "bg-blue-500";

      return {
        ...tahap,
        stateClass,
        isCompleted,
        isActive,
        isRejected,
      };
    });
  };

  // ==========================================
  // 🔥 PERBAIKAN LOGIKA AKSES DAFTAR HADIR
  // ==========================================
  const isSuratDisetujui = () => {
    const status = surat?.data?.surat?.status;
    if (!status) return false;
    const s = status.toLowerCase();

    if (s.includes("ditolak")) return false;

    return (
      s.includes("disetujui") ||
      s.includes("diterima") ||
      s.includes("selesai") ||
      s.includes("approved") ||
      s.includes("ok")
    );
  };

  // --- LOGIKA FORM DAFTAR HADIR ---
  const addPeserta = () => {
    if (isEditingHadir) {
      setDaftarHadir([...daftarHadir, { nama: "", jabatan: "", no_hp: "" }]);
    } else {
      setIsEditingHadir(true);
      setDaftarHadir([
        ...submittedKehadiran,
        { nama: "", jabatan: "", no_hp: "" },
      ]);
    }
  };

  const removePeserta = (index) => {
    if (isEditingHadir) {
      if (daftarHadir.length > 1) {
        const newDaftarHadir = [...daftarHadir];
        newDaftarHadir.splice(index, 1);
        setDaftarHadir(newDaftarHadir);
      }
    } else {
      const newSubmitted = [...submittedKehadiran];
      newSubmitted.splice(index, 1);
      setSubmittedKehadiran(newSubmitted);
      toast.success("Peserta dihapus dari daftar.");
    }
  };

  const handlePesertaChange = (index, field, value) => {
    const newDaftarHadir = [...daftarHadir];
    newDaftarHadir[index][field] = value;
    setDaftarHadir(newDaftarHadir);
  };

  const handleCancelEdit = () => {
    if (submittedKehadiran.length > 0) {
      setIsEditingHadir(false);
      setDaftarHadirError("");
    } else {
      setDaftarHadir([{ nama: "", jabatan: "", no_hp: "" }]);
      setIsEditingHadir(true);
    }
  };

  const handleSubmitDaftarHadir = async (e) => {
    e.preventDefault();
    setSubmittingDaftarHadir(true);
    setDaftarHadirError("");

    const suratId = surat?.data?.surat?.id;

    if (!suratId) {
      setDaftarHadirError(
        "ID Surat tidak ditemukan. Tidak dapat mengirim daftar hadir."
      );
      setSubmittingDaftarHadir(false);
      return;
    }

    try {
      const validPeserta = daftarHadir.filter(
        (p) =>
          p.nama.trim() !== "" &&
          p.jabatan.trim() !== "" &&
          p.no_hp.trim() !== ""
      );

      if (validPeserta.length === 0) {
        setDaftarHadirError("Minimal satu peserta harus diisi dengan lengkap.");
        setSubmittingDaftarHadir(false);
        return;
      }

      const payload = { surat_id: suratId, kehadirans: validPeserta };
      console.log("📤 [LacakSurat] Mengirim Kehadiran:", payload);

      await api.post("/kehadiran", payload);

      console.log("✅ [LacakSurat] Berhasil Terkirim.");
      toast.success("Daftar hadir berhasil disimpan!", { duration: 3000 });

      setSubmittedKehadiran(validPeserta);
      setIsEditingHadir(false);
      setDaftarHadirError("");
    } catch (err) {
      console.error("❌ [LacakSurat] Error Submit Daftar Hadir:", err);
      const errMsg =
        err.response?.data?.message || "Gagal membuat daftar hadir.";
      setDaftarHadirError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmittingDaftarHadir(false);
    }
  };

  // --- COMPONENT: INFO BOX ---
  const InfoBox = ({ label, value, icon: Icon }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
        <Icon size={14} className="text-gray-500" /> {label}
      </label>
      <p className="text-base font-medium text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-200 shadow-sm">
        {value || "-"}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* --- NAVBAR --- */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img
                src="/favicon.ico"
                alt="SINTEN Logo"
                className="h-10 w-10 rounded-lg shadow-md transform transition-all duration-300 hover:scale-110"
              />
              <span className="font-bold text-xl text-gray-900 hidden sm:block hover:text-blue-600 transition-colors duration-300">
                SINTEN
              </span>
            </div>
            <Link
              to="/login"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:shadow-md transition-all"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-lg animate-bounce">
              <Search className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Lacak Status{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
                Surat
              </span>
            </h1>
            <p className="text-lg text-gray-600">
              Masukkan nomor surat atau email Anda.
            </p>
          </div>

          {/* --- SEARCH CONTAINER --- */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
            <div className="flex">
              <button
                className={`flex-1 py-3 px-4 text-center font-medium transition-all duration-300 ${
                  searchMode === "nomor"
                    ? "text-blue-600 bg-blue-50 transform scale-105"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => {
                  setSearchMode("nomor");
                  setErrorEmail("");
                  setError("");
                  setSurat(null);
                  setDaftarSurat([]);
                }}
              >
                <Search size={18} className="inline mr-2" /> Lacak Nomor Surat
              </button>
              <button
                className={`flex-1 py-3 px-4 text-center font-medium transition-all duration-300 ${
                  searchMode === "email"
                    ? "text-indigo-600 bg-indigo-50 transform scale-105"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => {
                  setSearchMode("email");
                  setErrorEmail("");
                  setError("");
                  setSurat(null);
                  setDaftarSurat([]);
                }}
              >
                <Mail size={18} className="inline mr-2" /> Lacak Email
              </button>
            </div>

            {/* Search Mode: Nomor */}
            {searchMode === "nomor" && (
              <div className="p-6 animate-fade-in">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white -mx-6 -mt-6 mb-6 rounded-t-2xl">
                  <h2 className="text-xl font-bold">Cari Nomor Surat</h2>
                  <p className="text-blue-100 mt-1 text-sm">
                    Masukkan kode surat yang Anda terima saat pengajuan
                  </p>
                </div>
                <form onSubmit={handleTrack}>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={nomorSurat}
                      onChange={(e) => setNomorSurat(e.target.value)}
                      placeholder="Contoh: ER-KABAG_KEUANGAN-2025122626"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        "Mencari..."
                      ) : (
                        <>
                          <Search size={20} /> Lacak
                        </>
                      )}
                    </button>
                  </div>
                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-pulse">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Search Mode: Email */}
            {searchMode === "email" && (
              <div className="p-6 animate-fade-in">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white -mx-6 -mt-6 mb-6 rounded-t-2xl">
                  <h2 className="text-xl font-bold">Cari dengan Email</h2>
                  <p className="text-indigo-100 mt-1 text-sm">
                    Masukkan email yang Anda gunakan untuk mengajukan surat
                  </p>
                </div>
                <form onSubmit={handleTrackByEmail}>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@example.com"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loadingEmail}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg hover:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {loadingEmail ? (
                        "Mencari..."
                      ) : (
                        <>
                          <Search size={20} /> Cari
                        </>
                      )}
                    </button>
                  </div>
                  {errorEmail && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-pulse">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="text-sm text-red-600">{errorEmail}</p>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>

          {/* --- DAFTAR SURAT (EMAIL MODE) --- */}
          {daftarSurat.length > 0 && !surat && (
            <div className="max-w-4xl mx-auto mb-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Mail size={24} /> Daftar Surat
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {daftarSurat.map((item) => (
                  <div
                    key={item.id || item.nomor_surat}
                    onClick={() => handleShowDetail(item)}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-all flex justify-between items-center transform hover:-translate-y-1 hover:shadow-md"
                  >
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {item.perihal || item.judul || "Tanpa Perihal"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        ID Surat: #{item.surat_id || item.id}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                        {item.status || "Unknown"}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- DETAIL SURAT --- */}
          {surat && surat.data && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
              {searchMode === "email" && !daftarSurat.length && (
                <button
                  onClick={() => {
                    setSurat(null);
                    setEmail(email);
                    fetchByEmailData(email);
                  }}
                  className="mb-4 flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  &larr; Kembali ke Daftar Surat
                </button>
              )}

              {/* 1. TIMELINE */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <h3 className="text-xl font-bold">Tahapan Proses</h3>
                  <p className="text-blue-100 mt-1">
                    Pantau perkembangan surat Anda
                  </p>
                </div>
                <div className="p-6">
                  {/* Progress Bar Visual */}
                  <div className="relative mb-10">
                    <div className="flex items-center justify-between">
                      {getTahapanDetails().map((tahap) => (
                        <div
                          key={tahap.id}
                          className="flex flex-col items-center flex-1"
                        >
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all duration-500 shadow-lg ${
                              tahap.stateClass
                            } ${
                              tahap.isActive
                                ? "ring-4 ring-blue-200 animate-pulse"
                                : ""
                            }`}
                          >
                            {tahap.icon}
                          </div>
                          <p className="text-xs font-semibold text-gray-700 mt-3 text-center max-w-[100px]">
                            {tahap.name}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="absolute top-6 left-[12.5%] right-[12.5%] h-1 bg-gray-200 -z-10">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-700"
                        style={{
                          width: `${
                            (getTahapanDetails().filter((t) => t.isCompleted)
                              .length /
                              (getTahapanDetails().length - 1)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Tahapan Details */}
                  <div className="space-y-3">
                    {getTahapanDetails().map((tahap, index) => (
                      <div
                        key={tahap.id}
                        className={`border rounded-xl p-4 transition-all duration-300 hover:shadow-md transform hover:-translate-y-1 ${
                          tahap.isCompleted
                            ? "border-green-200 bg-green-50"
                            : tahap.isActive
                            ? "border-blue-200 bg-blue-50"
                            : "border-gray-200 bg-white"
                        }`}
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animation: "fadeInUp 0.5s ease-out forwards",
                          opacity: 0,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tahap.stateClass}`}
                          >
                            {tahap.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {tahap.name}
                            </h4>
                            <p className="text-sm mt-1 text-gray-600">
                              {tahap.description}
                            </p>
                            {tahap.date && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                <Clock size={12} /> {formatTanggal(tahap.date)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 1.5. PESAN BALASAN (FIX: BACA DARI APPROVALS) - DIPINDAH KE SINI */}
              {(() => {
                // 🔥 PERBAIKAN: Panggil getFinalMessage()
                const pesan = getFinalMessage();

                // Hanya render jika ada isinya
                if (pesan) {
                  return (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
                      <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                          <AlertCircle size={16} className="text-blue-600" />{" "}
                          Catatan / Pesan
                        </h3>
                      </div>
                      <div className="p-6">
                        <p className="text-gray-800 italic bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                          "{pesan}"
                        </p>
                      </div>
                    </div>
                  );
                }
                return null; // Jika tidak ada pesan sama sekali, tidak render apa-apa
              })()}

              {/* 2. INFORMASI SURAT */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
                  <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileText size={28} /> Informasi Surat
                      </h2>
                      <p className="text-sm text-blue-100 mt-1">
                        Detail lengkap surat pengajuan Anda
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm font-mono text-blue-100">
                        ID: #{surat.data.surat?.id || "-"}
                      </span>
                      {surat.data.surat?.status && (
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
                            STATUS_COLORS[surat.data.surat.status] ||
                            "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {getStatusLabel(surat.data.surat.status) ||
                            surat.data.surat.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoBox
                      label="Pengirim"
                      value={surat.data.surat?.pengirim || "-"}
                      icon={User}
                    />
                    <InfoBox
                      label="Instansi"
                      value={surat.data.surat?.instansi || "-"}
                      icon={Building}
                    />
                    <InfoBox
                      label="Email"
                      value={surat.data.surat?.email || "-"}
                      icon={Mail}
                    />
                    <InfoBox
                      label="Tujuan"
                      value={surat.data.surat?.tujuan || "-"}
                      icon={ArrowRight}
                    />
                  </div>

                  <div className="space-y-6">
                    <InfoBox
                      label="Perihal"
                      value={surat.data.surat?.perihal || "-"}
                      icon={FileText}
                    />
                    <InfoBox
                      label="Isi Surat"
                      value={
                        surat.data.surat?.isi_surat || "(tidak ada isi surat)"
                      }
                      icon={ClipboardCheck}
                    />
                  </div>

                  {/* Lampiran */}
                  {(() => {
                    const suratItem = surat.data.surat || surat.data;
                    const lampirans =
                      suratItem?.lampirans || suratItem?.lampiran || [];
                    if (!lampirans || lampirans.length === 0) return null;

                    return (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Lampiran
                        </h3>
                        <div className="space-y-3 max-w-2xl mx-auto">
                          {lampirans.map((file, index) => {
                            return (
                              <div
                                key={index}
                                className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-white hover:shadow-md transition-all duration-300"
                              >
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
                                  <FileIcon size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {file.nama_file || file.filename}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    onClick={() => handlePreview(file)}
                                    disabled={previewLoading}
                                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50"
                                    title="Lihat Preview"
                                  >
                                    {previewLoading ? (
                                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <Eye size={18} />
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* 3. DAFTAR HADIR (HANYA JIKA DITERIMA) */}
              {isSuratDisetujui() && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  {/* Header Biru */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <UserCheck size={24} /> Daftar Hadir
                        </h3>
                        <p className="text-blue-100 text-sm mt-1">
                          Kelola peserta kunjungan untuk surat ini.
                        </p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-full">
                        <Users size={24} />
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {daftarHadirError && (
                      <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-center font-medium">
                        {daftarHadirError}
                      </div>
                    )}

                    {/* MODE 1: TAMPIL DATA (TABEL) */}
                    {!isEditingHadir && submittedKehadiran.length > 0 && (
                      <div className="animate-fade-in">
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                          <table className="min-w-full text-sm text-left">
                            <thead className="bg-blue-50 text-blue-900 uppercase font-bold border-b border-blue-200">
                              <tr>
                                <th className="px-4 py-3">No</th>
                                <th className="px-4 py-3">Nama Lengkap</th>
                                <th className="px-4 py-3">Jabatan</th>
                                <th className="px-4 py-3">No. HP</th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {submittedKehadiran.map((p, i) => (
                                <tr key={i} className="hover:bg-blue-50">
                                  <td className="px-4 py-3 text-gray-600">
                                    {i + 1}
                                  </td>
                                  <td className="px-4 py-3 font-medium text-gray-900">
                                    {p.nama}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">
                                    {p.jabatan}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">
                                    {p.no_hp}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => removePeserta(i)}
                                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-1 rounded transition-colors"
                                      title="Hapus"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                          <button
                            onClick={() => setIsEditingHadir(true)}
                            className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 font-medium text-sm flex items-center gap-2 transition-all"
                          >
                            <Edit size={16} /> Edit / Tambah Peserta
                          </button>
                        </div>
                      </div>
                    )}

                    {/* MODE 2: FORM INPUT (GRID) */}
                    {isEditingHadir && (
                      <div className="animate-fade-in">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                          <p className="text-sm text-blue-800 flex items-center gap-2">
                            <AlertCircle size={16} />
                            Pastikan data peserta diisi dengan benar. Data akan
                            tersimpan dan muncul di dashboard admin.
                          </p>
                        </div>

                        <form
                          onSubmit={handleSubmitDaftarHadir}
                          className="space-y-6"
                        >
                          <div className="space-y-4">
                            {daftarHadir.map((p, i) => (
                              <div
                                key={i}
                                className="flex flex-col md:flex-row gap-3 items-start md:items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                              >
                                <div className="flex-1 w-full space-y-1">
                                  <label className="text-xs font-bold text-gray-500 uppercase">
                                    Nama
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Nama Peserta"
                                    value={p.nama}
                                    onChange={(e) =>
                                      handlePesertaChange(
                                        i,
                                        "nama",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                    required
                                  />
                                </div>

                                <div className="flex-1 w-full space-y-1">
                                  <label className="text-xs font-bold text-gray-500 uppercase">
                                    Jabatan
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Jabatan"
                                    value={p.jabatan}
                                    onChange={(e) =>
                                      handlePesertaChange(
                                        i,
                                        "jabatan",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                    required
                                  />
                                </div>

                                <div className="flex-1 w-full space-y-1">
                                  <label className="text-xs font-bold text-gray-500 uppercase">
                                    No. HP
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="08..."
                                    value={p.no_hp}
                                    onChange={(e) =>
                                      handlePesertaChange(
                                        i,
                                        "no_hp",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                    required
                                  />
                                </div>

                                <div className="pt-6 md:pt-0 flex items-center justify-end">
                                  {daftarHadir.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removePeserta(i)}
                                      className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                      title="Hapus Baris"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={addPeserta}
                              className="px-4 py-2 bg-white border border-dashed border-gray-300 text-gray-600 hover:text-blue-600 hover:border-blue-300 rounded-lg hover:bg-blue-50 transition-all font-medium text-sm flex items-center gap-2"
                            >
                              <Plus size={16} /> Tambah Baris
                            </button>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm"
                              >
                                Batal
                              </button>
                              <button
                                type="submit"
                                disabled={submittingDaftarHadir}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium disabled:opacity-50 shadow-md flex items-center gap-2"
                              >
                                {submittingDaftarHadir ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>{" "}
                                    Menyimpan...
                                  </>
                                ) : (
                                  <>
                                    <Save size={16} /> Simpan Daftar
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* STATE KOSONG */}
                    {!isEditingHadir && submittedKehadiran.length === 0 && (
                      <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <UserCheck
                          size={48}
                          className="mx-auto text-gray-300 mb-4"
                        />
                        <p className="text-gray-500 font-medium">
                          Belum ada daftar hadir yang dibuat.
                        </p>
                        <button
                          onClick={addPeserta}
                          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md font-medium text-sm flex items-center justify-center gap-2 mx-auto"
                        >
                          <Plus size={16} /> Buat Daftar Baru
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-500">
            &copy; 2025 SINTEN. Sistem Informasi Penataan Tujuan.
          </p>
        </div>
      </footer>

      {/* Preview Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden border border-gray-200 relative">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0 z-10">
              <div className="flex items-center gap-3 truncate">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FileIcon size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 truncate">
                  {selectedFile.name}
                </h3>
              </div>
              <button
                onClick={handleClosePreview}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 bg-gray-200 relative w-full overflow-hidden min-h-0">
              {/* LOGIKA 1: Jika PDF */}
              {selectedFile.type === "pdf" ? (
                <iframe
                  src={selectedFile.url}
                  title={selectedFile.name}
                  className="w-full h-full border-none block"
                  loading="lazy"
                />
              ) : /* LOGIKA 2: Jika Gambar (JPG, PNG, dll) */
              ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(
                  selectedFile.type
                ) ? (
                <div className="w-full h-full flex items-center justify-center p-4 overflow-auto bg-black">
                  <img
                    src={selectedFile.url}
                    alt={selectedFile.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                  />
                </div>
              ) : (
                /* LOGIKA 3: Fallback jika file tidak dikenal */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-white">
                  <FileQuestion size={64} className="text-gray-300 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-700">
                    Preview Tidak Tersedia
                  </h4>
                  <p className="text-sm text-gray-500 mt-2 max-w-md">
                    File ini tidak dapat dipreview langsung di browser.
                  </p>
                  <a
                    href={selectedFile.url}
                    download={selectedFile.name}
                    className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all shadow-md"
                  >
                    <Download size={18} /> Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
      `}</style>
    </div>
  );
};

export default LacakSurat;
