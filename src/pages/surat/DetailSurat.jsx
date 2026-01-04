import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
// Import helper logika role yang ada
import { isAdmin, isKetua, isSekwan, isKabag } from "../../utils/constants";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  FileText,
  User,
  Calendar,
  AlertCircle,
  File,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
  Clock,
} from "lucide-react";

// --- KONFIGURASI GRUP DISPOSISI (REFERENSI) ---
const DISPOSISI_LABELS = {
  ketua_dprd: "Ketua DPRD",
  wakil_ketua_i: "Wakil Ketua I",
  wakil_ketua_ii: "Wakil Ketua II",
  wakil_ketua_iii: "Wakil Ketua III",
  sekretaris_dprd: "Sekretaris DPRD",
  komisi_i: "Komisi I",
  komisi_ii: "Komisi II",
  komisi_iii: "Komisi III",
  komisi_iv: "Komisi IV",
  kabag_umum: "Kabag Umum",
  kabag_humas: "Kabag Humas",
  kabag_keuangan: "Kabag Keuangan",
  kabag_persidangan: "Kabag Persidangan",
};

// --- NORMALISASI DATA ---
const normalizeSurat = (raw = {}) => {
  if (!raw || typeof raw !== "object") return {};

  // 🔥 PERBAIKAN FLEKSIBILITAS ID
  const id = raw.id || raw._id || raw.kode_surat || raw.nomor_surat;

  const kode = raw.kode_surat || raw.nomor_surat || raw.kode || raw.nomor || "";
  const pengirim = raw.pengirim || raw.nama_pengirim || "";
  const email = raw.email || raw.email.pengirim || "";
  const instansi =
    raw.instansi || raw.InstansiPengirim || raw.nama_instansi || "";
  const judul = raw.perihal || raw.judul || "";
  const isi = raw.isi_surat || raw.isi || "";
  const tujuan = raw.tujuan || raw.tujuan_unit || "";
  const status = raw.status || "";
  const pesan_balasan = raw.catatan || raw.pesan || raw.pesan_balasan || "";

  let lampirans = [];
  if (raw.lampirans && Array.isArray(raw.lampirans)) {
    lampirans = raw.lampirans;
  } else if (raw.lampiran) {
    lampirans = [raw.lampiran];
  }

  const waktu = raw.created_at || raw.waktu_dibuat;
  let createdAt = null;
  try {
    createdAt = waktu ? new Date(waktu) : null;
  } catch {}

  return {
    id,
    kode,
    pengirim,
    instansi,
    email,
    judul,
    isi,
    tujuan,
    status,
    pesan_balasan,
    lampirans,
    createdAt,
  };
};

const DetailSurat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [surat, setSurat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [pesan, setPesan] = useState("");
  const [forwardTo, setForwardTo] = useState("");
  const [waktuKunjungan, setWaktuKunjungan] = useState("");
  const [role, setRole] = useState("");
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  const [lampiranModalOpen, setLampiranModalOpen] = useState(false);
  const [selectedLampiranIndex, setSelectedLampiranIndex] = useState(0);

  const [blobUrl, setBlobUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // --- HELPER ROLE TAMBAHAN (LOGIKA BARU) ---
  // Kita buat helper lokal di sini agar tidak perlu edit file constants luar
  const isKomisi = (r) => r && r.startsWith("komisi_");
  const isPimpinan = (r) =>
    r === "ketua_dprd" ||
    r === "wakil_ketua_dprd" ||
    r.startsWith("wakil_ketua_"); // Menangkap wakil_ketua_i, ii, iii
  const isSekretariat = (r) => r === "sekretaris_dprd";

  // --- AMBIL ROLE DARI STORAGE ---
  useEffect(() => {
    const r =
      JSON.parse(localStorage.getItem("auth"))?.user?.role ||
      JSON.parse(localStorage.getItem("sinten_user"))?.user?.role ||
      localStorage.getItem("role") ||
      "admin";
    setRole(r);
  }, []);

  // --- FETCH SURAT DENGAN DEBUGGING ---
  useEffect(() => {
    if (!role || !id) return;
    const fetchSurat = async () => {
      setLoading(true);
      setError(null);
      try {
        const resAll = await api.get("/surat");
        let allSurat = resAll?.data?.data || resAll?.data;

        if (!Array.isArray(allSurat)) {
          console.warn("Format data tidak array, mencoba diubah ke array...");
          allSurat = [allSurat];
        }

        const found = allSurat.find((s) => {
          if (s.id == id) return true;
          if (s._id == id) return true;
          if (s.nomor_surat == id || s.kode_surat == id) return true;
          return false;
        });

        if (found) {
          setSurat(normalizeSurat(found));
          setTimeout(() => setIsPageLoaded(true), 100);
          return;
        }

        throw new Error(
          `Surat dengan ID '${id}' tidak ditemukan. Mungkin surat sudah dihapus atau Anda tidak memiliki akses.`
        );
      } catch (err) {
        console.error("Gagal fetch surat:", err);
        setError(err.message || "Gagal memuat data surat.");
        setSurat(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSurat();
  }, [role, id]);

  const getSmartUrl = (item) => {
    if (!item) return null;
    if (typeof item === "string") return item;
    if (typeof item === "object") {
      if (item.filename && typeof item.filename === "string")
        return item.filename;
      if (item.url) return item.url;
      if (item.path) return item.path;
      for (const val of Object.values(item)) {
        if (
          typeof val === "string" &&
          val.length > 4 &&
          (val.includes(".") || val.includes("/"))
        ) {
          return val;
        }
      }
    }
    return null;
  };

  // --- LOGIKA BUKA LAMPIRAN ---
  useEffect(() => {
    if (!lampiranModalOpen) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      return;
    }
    if (!surat || !surat.lampirans || !surat.lampirans[selectedLampiranIndex])
      return;

    const fetchFile = async () => {
      setPdfLoading(true);
      const currentItem = surat.lampirans[selectedLampiranIndex];
      const fileUrl = getSmartUrl(currentItem);

      if (!fileUrl) {
        console.warn("URL tidak ditemukan:", currentItem);
        setPdfLoading(false);
        return;
      }

      try {
        const response = await api.get(fileUrl, { responseType: "blob" });
        const mimeType =
          response.headers?.["content-type"] || "application/octet-stream";
        const blobData =
          response.data instanceof Blob
            ? response.data
            : new Blob([response.data], { type: mimeType });
        const fileURL = URL.createObjectURL(blobData);
        setBlobUrl(fileURL);
      } catch (err) {
        console.error("Gagal memuat file:", err);
        setBlobUrl(null);
      } finally {
        setPdfLoading(false);
      }
    };

    fetchFile();

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [lampiranModalOpen, selectedLampiranIndex, surat]);

  // --- LOGIKA DOWNLOAD ---
  const handleDownload = () => {
    const currentItem = surat.lampirans[selectedLampiranIndex];
    const rawUrl = getSmartUrl(currentItem);

    let filename = "lampiran.pdf";
    if (typeof currentItem === "object" && currentItem.filename) {
      filename = currentItem.filename.split("/").pop();
    } else if (typeof currentItem === "string") {
      filename = currentItem.split("/").pop();
    }

    if (blobUrl) {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    let absoluteUrl = rawUrl;
    if (!rawUrl.startsWith("http")) {
      absoluteUrl = `http://103.179.219.39:8282/${rawUrl}`;
    }
    window.open(absoluteUrl, "_blank");
  };

  // --- LOGIKA HANDLE ACTION ---
  const handleAction = async () => {
    if (!surat) return;

    if (modalType === "setuju") {
      if (!waktuKunjungan || waktuKunjungan.trim() === "") {
        alert(
          "Mohon isi 'Waktu Kunjungan' terlebih dahulu sebelum menyetujui surat."
        );
        return;
      }
    }

    setModalOpen(false);
    try {
      if (role === "admin") {
        if (modalType === "disposisi") {
          if (!forwardTo) return alert("Pilih tujuan disposisi!");
          await api.post("/disposisi-surat", {
            surat_id: surat.id,
            ke_unit: forwardTo,
            catatan: pesan,
          });
          alert("Disposisi terkirim!");
          setSurat((prev) => ({
            ...prev,
            status: "Diteruskan ke " + forwardTo,
          }));
        } else if (modalType === "tolak") {
          await api.post("/surat/reject", {
            surat_id: surat.id,
            catatan: pesan,
          });
          alert("Surat ditolak!");
          setSurat((prev) => ({
            ...prev,
            status: "ditolak",
            pesan_balasan: pesan,
          }));
        }
      } else {
        // Logika Unit (Pimpinan/Sekwan/Kabag/Komisi)
        if (modalType === "setuju") {
          const isoWaktuKunjungan = new Date(waktuKunjungan).toISOString();
          await api.post("/surat/approve", {
            surat_id: surat.id,
            catatan: pesan,
            waktu_kunjungan: isoWaktuKunjungan,
          });
          alert("Surat disetujui!");
          setSurat((prev) => ({
            ...prev,
            status: "disetujui",
            pesan_balasan: pesan,
          }));
        } else if (modalType === "tolak") {
          await api.post("/surat/reject", {
            surat_id: surat.id,
            catatan: pesan,
          });
          alert("Surat ditolak!");
          setSurat((prev) => ({
            ...prev,
            status: "ditolak",
            pesan_balasan: pesan,
          }));
        } else if (modalType === "disposisi") {
          if (!forwardTo) return alert("Pilih tujuan disposisi!");
          await api.post("/disposisi-surat", {
            surat_id: surat.id,
            ke_unit: forwardTo,
            catatan: pesan,
          });
          alert("Surat didisposisi!");
          setSurat((prev) => ({
            ...prev,
            status: "Diteruskan ke " + forwardTo,
          }));
        }
      }
      setPesan("");
      setForwardTo("");
      setWaktuKunjungan("");
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem.");
    }
  };

  const isSuratProcessed = () => {
    if (!surat || !surat.status) return false;
    return (
      surat.status.toLowerCase().includes("disetujui") ||
      surat.status.toLowerCase().includes("ditolak")
    );
  };

  // --- LOADING SCREEN ---
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative inline-flex">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-gray-600 animate-pulse">
            Memuat detail surat...
          </p>
        </div>
      </div>
    );

  // --- ERROR SCREEN ---
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500 bg-red-100 p-4 rounded-lg border border-red-300 max-w-md text-center">
          <AlertCircle className="inline w-8 h-8 mb-2" />
          <br />
          {error}
          <div className="mt-4">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* HEADER CARD */}
        <div
          className={`bg-white rounded-2xl shadow-xl overflow-hidden mb-6 transform transition-all duration-700 ${
            isPageLoaded
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
        >
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
            <div className="text-center relative z-10">
              <h1 className="text-4xl font-extrabold mb-3">Detail Surat</h1>
              <div className="inline-flex items-center px-6 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                <FileText className="w-6 h-6 mr-3" />
                <p className="text-blue-100 font-medium">
                  Kode: {surat.kode || "KOSONG"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* INFO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* PENGIRIM */}
          <div
            className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transform transition-all duration-700 hover:shadow-2xl hover:-translate-y-1 ${
              isPageLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: "100ms" }}
          >
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mt-12"></div>
              <h3 className="text-lg font-semibold text-white flex items-center relative z-10">
                <User className="w-5 h-5 mr-2" /> Pengirim
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Nama Pengirim
                </label>
                <p className="mt-1 text-gray-900 font-medium bg-gray-50 p-2 rounded border border-gray-200">
                  {surat.pengirim || "-"}
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Email
                </label>
                <p className="mt-1 text-gray-900 font-medium bg-gray-50 p-2 rounded border border-gray-200 break-words">
                  {surat.email || "-"}
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Instansi
                </label>
                <p className="mt-1 text-gray-900 font-medium bg-gray-50 p-2 rounded border border-gray-200">
                  {surat.instansi || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* INFORMASI SURAT */}
          <div
            className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transform transition-all duration-700 hover:shadow-2xl hover:-translate-y-1 ${
              isPageLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mt-12"></div>
              <h3 className="text-lg font-semibold text-white flex items-center relative z-10">
                <FileText className="w-5 h-5 mr-2" /> Informasi Surat
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Perihal
                </label>
                <p className="mt-1 text-gray-900 font-medium bg-gray-50 p-2 rounded border border-gray-200">
                  {surat.judul || "-"}
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Tujuan
                </label>
                <p className="mt-1 text-gray-900 font-medium bg-gray-50 p-2 rounded border border-gray-200 capitalize">
                  {surat.tujuan || "-"}
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </label>
                <div className="mt-1">
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-sm font-bold border ${
                      surat.status?.toLowerCase().includes("diteruskan")
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : surat.status?.toLowerCase().includes("pending")
                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                        : surat.status?.toLowerCase().includes("ditolak")
                        ? "bg-red-100 text-red-800 border-red-200"
                        : surat.status?.toLowerCase().includes("disetujui")
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                  >
                    {surat.status || "Pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* LAMPIRAN */}
          <div
            className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transform transition-all duration-700 hover:shadow-2xl hover:-translate-y-1 ${
              isPageLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: "300ms" }}
          >
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mt-12"></div>
              <h3 className="text-lg font-semibold text-white flex items-center relative z-10">
                <File className="w-5 h-5 mr-2" /> Lampiran
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {surat.lampirans && surat.lampirans.length > 0 ? (
                <div className="mt-2 flex flex-col gap-2">
                  {surat.lampirans.map((lamp, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedLampiranIndex(i);
                        setLampiranModalOpen(true);
                      }}
                      className="w-full flex items-center justify-between gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-lg transition-all border border-blue-200 transform hover:scale-105 hover:shadow-md"
                    >
                      <div className="flex items-center gap-2">
                        <File className="w-5 h-5" />
                        <span className="text-sm">Lampiran {i + 1}</span>
                      </div>
                      <Eye size={16} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">
                  Tidak ada lampiran.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ISI SURAT */}
        <div
          className={`bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 transform transition-all duration-700 hover:shadow-xl ${
            isPageLoaded
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: "400ms" }}
        >
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-600" /> Isi Surat
            </h3>
          </div>
          <div className="p-8">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">
              {surat.isi || "Tidak ada isi surat."}
            </div>
          </div>
        </div>

        {/* PESAN BALASAN */}
        {surat.pesan_balasan && (
          <div className="bg-blue-50 rounded-2xl p-6 border-l-4 border-blue-500 mb-6">
            <h3 className="text-sm font-bold text-blue-900 uppercase mb-2">
              Catatan / Pesan
            </h3>
            <p className="text-blue-800 italic">"{surat.pesan_balasan}"</p>
          </div>
        )}

        {/* =========================================
             🔥 BAGIAN TOMBOL AKSI (LOGIKA FLOW)
        ========================================= */}
        {!isSuratProcessed() && (
          <div
            className={`flex justify-center gap-4 pt-4 transform transition-all duration-700 ${
              isPageLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: "500ms" }}
          >
            <button
              onClick={() => navigate(-1)}
              className="px-8 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all shadow-md font-bold flex items-center"
            >
              Kembali
            </button>

            {role === "admin" ? (
              // --- ROLE ADMIN ---
              <>
                <button
                  onClick={() => {
                    setModalType("disposisi");
                    setModalOpen(true);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md font-bold flex items-center"
                >
                  Disposisi
                </button>
                <button
                  onClick={() => {
                    setModalType("tolak");
                    setModalOpen(true);
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-md font-bold flex items-center"
                >
                  Tolak
                </button>
              </>
            ) : (
              // --- ROLE UNIT (PIMPINAN / SEKRETARIAT / KOMISI / KABAG) ---
              <>
                {/* Tombol Setujui muncul untuk semua Unit kecuali Admin (seharusnya) */}
                <button
                  onClick={() => {
                    setModalType("setuju");
                    setModalOpen(true);
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-md font-bold flex items-center"
                >
                  Setujui
                </button>

                {/* 
                  🔥 PERUBAHAN LOGIKA TOMBOL DISPOSISI
                  - Tampilkan JIKA (Pimpinan ATAU Sekretariat)
                  - Sembunyikan JIKA (Komisi ATAU Kabag)
                */}
                {(isPimpinan(role) || isSekretariat(role)) && (
                  <button
                    onClick={() => {
                      setModalType("disposisi");
                      setModalOpen(true);
                    }}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-md font-bold flex items-center"
                  >
                    Disposisi
                  </button>
                )}

                <button
                  onClick={() => {
                    setModalType("tolak");
                    setModalOpen(true);
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-md font-bold flex items-center"
                >
                  Tolak
                </button>
              </>
            )}
          </div>
        )}

        {isSuratProcessed() && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => navigate(-1)}
              className="px-8 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all shadow-md font-bold"
            >
              Kembali
            </button>
          </div>
        )}
      </div>

      {/* =========================================
           🔥 MODAL AKSI (LOGIKA DROPDOWN BARU)
      ========================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
            <div
              className={`rounded-t-2xl -mx-6 -mt-6 px-6 py-4 relative overflow-hidden mb-6 ${
                modalType === "tolak"
                  ? "bg-gradient-to-r from-red-600 to-red-700"
                  : modalType === "disposisi"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700"
                  : "bg-gradient-to-r from-green-600 to-green-700"
              }`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mt-12"></div>
              <h3 className="text-xl font-semibold text-white text-center relative z-10">
                {modalType === "setuju"
                  ? "Setujui Surat"
                  : modalType === "disposisi"
                  ? "Disposisi Surat"
                  : "Tolak Surat"}
              </h3>
            </div>
            <div className="space-y-4">
              {modalType === "disposisi" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Tujuan Disposisi
                  </label>
                  <select
                    value={forwardTo}
                    onChange={(e) => setForwardTo(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
                  >
                    <option value="">-- Pilih Tujuan --</option>

                    {/* =========================================
                         SCENARIO 1: ADMIN LOGIN
                         Target: Pimpinan, Sekretariat DPRD, Komisi
                    ========================================= */}
                    {isAdmin(role) && (
                      <>
                        {/* Grup Pimpinan */}
                        <optgroup label="Pimpinan">
                          <option value="ketua_dprd">Ketua DPRD</option>
                          <option value="wakil_ketua_i">Wakil Ketua I</option>
                          <option value="wakil_ketua_ii">
                            Wakil Ketua II
                          </option>
                          <option value="wakil_ketua_iii">
                            Wakil Ketua III
                          </option>
                        </optgroup>

                        {/* Grup Sekretariat DPRD */}
                        <optgroup label="Sekretariat DPRD">
                          <option value="sekretaris_dprd">
                            Sekretaris DPRD
                          </option>
                          <option value="kabag_umum">Kabag Umum</option>
                          <option value="kabag_humas">Kabag Humas</option>
                          <option value="kabag_persidangan">
                            Kabag Persidangan
                          </option>
                          <option value="kabag_keuangan">
                            Kabag Keuangan
                          </option>
                        </optgroup>

                        {/* Grup Komisi */}
                        <optgroup label="Komisi">
                          <option value="komisi_i">Komisi I</option>
                          <option value="komisi_ii">Komisi II</option>
                          <option value="komisi_iii">Komisi III</option>
                          <option value="komisi_iv">Komisi IV</option>
                        </optgroup>
                      </>
                    )}

                    {/* =========================================
                         SCENARIO 2: PIMPINAN LOGIN
                         Target: Wakil Ketua, Komisi, Sekretaris DPRD
                    ========================================= */}
                    {isPimpinan(role) && (
                      <>
                        <optgroup label="Pimpinan Lain">
                          <option value="wakil_ketua_i">Wakil Ketua I</option>
                          <option value="wakil_ketua_ii">
                            Wakil Ketua II
                          </option>
                          <option value="wakil_ketua_iii">
                            Wakil Ketua III
                          </option>
                        </optgroup>

                        <optgroup label="Sekretariat DPRD">
                          <option value="sekretaris_dprd">
                            Sekretaris DPRD
                          </option>
                        </optgroup>

                        <optgroup label="Komisi">
                          <option value="komisi_i">Komisi I</option>
                          <option value="komisi_ii">Komisi II</option>
                          <option value="komisi_iii">Komisi III</option>
                          <option value="komisi_iv">Komisi IV</option>
                        </optgroup>
                      </>
                    )}

                    {/* =========================================
                         SCENARIO 3: SEKRETARIAT DPRD LOGIN (Sekwan)
                         Target: Kabag
                    ========================================= */}
                    {isSekretariat(role) && (
                      <optgroup label="Teruskan ke Bagian (Kabag)">
                        <option value="kabag_umum">Kabag Umum</option>
                        <option value="kabag_humas">Kabag Humas</option>
                        <option value="kabag_keuangan">
                          Kabag Keuangan
                        </option>
                        <option value="kabag_persidangan">
                          Kabag Persidangan
                        </option>
                      </optgroup>
                    )}
                  </select>

                  {/* Info Text Dinamis */}
                  <p className="text-xs text-gray-500 mt-1 italic">
                    {isKomisi(role)
                      ? "*Komisi hanya dapat menerima atau menolak surat."
                      : isAdmin(role)
                      ? "*Admin dapat meneruskan ke Pimpinan, Sekretariat, atau Komisi."
                      : isPimpinan(role)
                      ? "*Pimpinan dapat meneruskan ke Sekretaris atau Komisi."
                      : isSekretariat(role)
                      ? "*Sekretaris DPRD meneruskan ke Kabag terkait."
                      : ""}
                  </p>
                </div>
              )}
              {modalType === "setuju" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waktu Kunjungan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={waktuKunjungan}
                    onChange={(e) => setWaktuKunjungan(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {modalType === "tolak"
                    ? "Alasan"
                    : modalType === "setuju"
                    ? "Pesan"
                    : "Catatan"}
                </label>
                <textarea
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none resize-none"
                  placeholder="Tulis di sini..."
                  value={pesan}
                  onChange={(e) => setPesan(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setPesan("");
                  setForwardTo("");
                  setWaktuKunjungan("");
                }}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleAction}
                className={`px-6 py-2.5 text-white rounded-lg font-medium transition-all hover:shadow-lg transform hover:scale-105 ${
                  modalType === "tolak"
                    ? "bg-gradient-to-r from-red-600 to-red-700"
                    : modalType === "disposisi"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700"
                    : "bg-gradient-to-r from-green-600 to-green-700"
                }`}
              >
                Kirim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LAMPIRAN */}
      {lampiranModalOpen && surat.lampirans.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div
              className="fixed inset-0 backdrop-blur-md bg-black/20 transition-opacity"
              onClick={() => setLampiranModalOpen(false)}
            ></div>

            <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] overflow-hidden z-10 transform transition-all duration-300 scale-100 flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mt-12"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <File className="w-5 h-5 text-white" />
                  <h3 className="text-xl font-semibold text-white">
                    Pratinjau Lampiran
                  </h3>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <button
                    onClick={handleDownload}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-1 transform hover:scale-105"
                  >
                    <Download size={16} /> Download
                  </button>

                  <button
                    onClick={() => setLampiranModalOpen(false)}
                    className="text-white hover:text-gray-200 transition-colors transform hover:scale-110"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Navigation */}
              {surat.lampirans.length > 1 && (
                <div className="bg-gray-100 px-6 py-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
                  <button
                    onClick={() =>
                      setSelectedLampiranIndex((prev) =>
                        prev > 0 ? prev - 1 : surat.lampirans.length - 1
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-all shadow-sm border border-gray-200"
                  >
                    <ChevronLeft size={16} /> Sebelumnya
                  </button>
                  <span className="text-sm text-gray-600 font-medium">
                    {selectedLampiranIndex + 1} / {surat.lampirans.length}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedLampiranIndex((prev) =>
                        prev < surat.lampirans.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-all shadow-sm border border-gray-200"
                  >
                    Selanjutnya <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {/* Content Viewer */}
              <div className="flex-1 relative w-full bg-gray-900 overflow-hidden">
                {(() => {
                  const currentItem = surat.lampirans[selectedLampiranIndex];
                  const originalUrl = getSmartUrl(currentItem);

                  if (!originalUrl) {
                    return (
                      <div className="absolute inset-0 flex items-center justify-center text-white z-20">
                        <div className="text-center p-8 bg-gray-800 rounded-lg max-w-md">
                          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                          <h4 className="text-xl font-bold mb-2">
                            URL Tidak Ditemukan
                          </h4>
                        </div>
                      </div>
                    );
                  }

                  if (pdfLoading) {
                    return (
                      <div className="absolute inset-0 flex items-center justify-center text-white z-20">
                        <div className="flex flex-col items-center justify-center animate-pulse">
                          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                          <p>Memuat dokumen...</p>
                        </div>
                      </div>
                    );
                  }

                  const isPDF = originalUrl.toLowerCase().includes(".pdf");
                  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(
                    originalUrl
                  );

                  if (blobUrl) {
                    if (isPDF) {
                      return (
                        <iframe
                          src={blobUrl}
                          className="absolute inset-0 w-full h-full bg-white"
                          title="PDF Secure Viewer"
                          frameBorder="0"
                          scrolling="yes"
                          loading="eager"
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                          }}
                        />
                      );
                    } else if (isImage) {
                      return (
                        <img
                          src={blobUrl}
                          alt="Preview"
                          className="absolute inset-0 w-full h-full object-contain bg-black"
                        />
                      );
                    }
                  }

                  return (
                    <div className="absolute inset-0 flex items-center justify-center p-8 text-white text-center bg-gray-800">
                      <File className="w-20 h-20 text-gray-400 mb-4" />
                      <p className="text-xl mb-4">
                        Preview tidak tersedia untuk tipe ini
                      </p>
                      <button
                        onClick={handleDownload}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all"
                      >
                        Download File
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailSurat;