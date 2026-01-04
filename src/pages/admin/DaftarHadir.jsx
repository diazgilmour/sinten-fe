import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  RefreshCw,
  Search,
  Download,
  UserCheck,
  Users,
  X,
  FileText,
  File as FileIcon,
  AlertCircle,
  Calendar,
} from "lucide-react";

const DaftarHadir = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // --- DATA STATES ---
  const [suratList, setSuratList] = useState([]);
  const [displayedList, setDisplayedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // --- PREVIEW MODAL STATES (PDF) ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  // --- FETCH DATA LOGIC ---
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Ambil data Surat dan Kehadiran
      const responseSurat = await api.get("/surat");
      const dataSurat = responseSurat.data.data || responseSurat.data || [];

      const responseKehadiran = await api.get("/daftar-hadir");
      const dataKehadiran = responseKehadiran.data.data || [];

      // 2. Buat Map untuk surat agar pencarian cepat
      const suratMap = new Map();
      dataSurat.forEach((s) => {
        suratMap.set(Number(s.id), s);
      });

      // 3. Gabungkan data
      const mergedPromises = dataKehadiran.map(async (itemKehadiran) => {
        // Paksa surat_id jadi Number
        const id = Number(itemKehadiran.surat_id);
        let surat = suratMap.get(id);

        // Jika tidak ketemu di list utama, fetch manual
        if (!surat) {
          console.log(
            `ID ${id} tidak ditemukan di list utama, mencoba fetch manual...`
          );
          try {
            const detailRes = await api.get(`/surat/${id}`);
            const detailData = detailRes.data.data;

            // Handle struktur response
            if (detailData && detailData.surat) {
              surat = detailData.surat;
            } else if (detailData) {
              surat = detailData;
            }
          } catch (err) {
            console.error(`Gagal fetch surat ID ${id}`, err);
          }
        }

        return {
          id: id,
          nomor_surat: surat ? surat.nomor_surat : `#${id}`,
          perihal: surat ? surat.perihal : "Data Surat Hilang",
          pengirim: surat ? surat.pengirim : "-",
          instansi: surat ? surat.instansi : "-",
          created_at: surat ? surat.created_at : null,
          totalHadir: itemKehadiran.kehadirans
            ? itemKehadiran.kehadirans.length
            : 0,
          kehadirans: itemKehadiran.kehadirans || [],
        };
      });

      const mergedList = await Promise.all(mergedPromises);

      // 4. SORTING: Urutkan dari Terbaru ke Terlama (Newest First)
      const sortedList = mergedList.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // Descending
      });

      setSuratList(sortedList);
      setDisplayedList(sortedList);
    } catch (err) {
      console.error("Gagal fetch data:", err);
      setSuratList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- FILTER LOGIC (SEARCH + DATE) ---
  useEffect(() => {
    let filtered = suratList;

    // Filter Search Text
    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.nomor_surat?.toLowerCase().includes(search) ||
          s.perihal?.toLowerCase().includes(search) ||
          s.pengirim?.toLowerCase().includes(search) ||
          s.instansi?.toLowerCase().includes(search)
      );
    }

    setDisplayedList(filtered);

    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [suratList, search]);

  // --- HANDLE PREVIEW ---
  const handlePreview = async (id, perihal) => {
    setPreviewLoading(true);
    setPreviewError("");
    try {
      // Ambil PDF sebagai Blob
      const res = await api.get(`/daftar-hadir/${id}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);

      setSelectedFile({
        id: id,
        name: `daftar-hadir-${id}`,
        url: blobUrl,
        perihal: perihal,
      });
    } catch (err) {
      console.error("Gagal memuat PDF:", err);
      setPreviewError("Gagal memuat file PDF. Cek koneksi.");
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

  // --- INIT DATA ---
  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLE REFRESH ---
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- HELPER FORMAT TANGGAL ---
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AdminLayout title="Daftar Hadir">
      <div className="space-y-6">
        {/* --- HEADER & SEARCH & FILTER --- */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan No. Surat, Perihal, atau Instansi..."
                value={search}
                onChange={(e) => setSearch(e.target.value.toLowerCase())}
                className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* --- TABLE CARD --- */}
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0 z-10">
            <div className="flex items-center gap-3">
              <UserCheck size={22} className="text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">
                Daftar Kehadiran
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              <span className="text-sm text-gray-500">Total:</span>
              <span className="text-sm font-bold text-blue-700">
                {displayedList.length}
              </span>
              <span className="text-sm text-gray-500">surat</span>
            </div>
            <button
              onClick={handleRefresh}
              className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-full bg-gray-100 rounded-lg h-12 animate-pulse"
                ></div>
              ))}
            </div>
          ) : displayedList.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex-1 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mb-4">
                <UserCheck size={32} />
              </div>
              <p>
                {search
                  ? "Tidak ada data yang cocok."
                  : "Belum ada data kehadiran yang tersedia."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1 min-h-0">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-left w-[160px]">NO. SURAT</th>
                    <th className="px-6 py-4 text-left">PERIHAL</th>
                    <th className="px-6 py-4 text-left">PENGIRIM</th>
                    <th className="px-6 py-4 text-left">INSTANSI</th>
                    <th className="px-6 py-4 text-center">JUMLAH HADIR</th>
                    <th className="px-6 py-4 text-left">TANGGAL</th>
                    <th className="px-6 py-4 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedList.map((s, index) => {
                    const isEven = index % 2 === 0;
                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-blue-50 transition-colors duration-200 ${
                          isEven ? "bg-white" : "bg-gray-50/30"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700 border-b border-gray-100">
                          {s.nomor_surat}
                        </td>
                        <td className="px-6 py-4 text-gray-600 border-b border-gray-100 font-medium">
                          {s.perihal}
                        </td>
                        <td className="px-6 py-4 text-gray-600 border-b border-gray-100">
                          {s.pengirim}
                        </td>
                        <td className="px-6 py-4 text-gray-600 border-b border-gray-100">
                          {s.instansi}
                        </td>
                        <td className="px-6 py-4 text-center border-b border-gray-100">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                            <Users size={12} /> {s.totalHadir} Orang
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs border-b border-gray-100">
                          {formatDate(s.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right border-b border-gray-100">
                          <div className="flex justify-end">
                            <button
                              onClick={() => handlePreview(s.id, s.perihal)}
                              className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-all duration-200 shadow-sm font-semibold border border-blue-200 flex items-center justify-center gap-2"
                            >
                              <FileText size={16} /> Preview
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL PREVIEW PDF --- */}
      {selectedFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden border border-gray-200 relative">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 border-b border-blue-200 flex justify-between items-center flex-shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 text-white rounded-lg">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Preview Daftar Hadir
                  </h3>
                  <p className="text-blue-100 text-xs">
                    {selectedFile.perihal} - ID: {selectedFile.id}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClosePreview}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content PDF */}
            <div className="flex-1 bg-gray-200 relative w-full overflow-hidden min-h-0">
              {previewLoading ? (
                <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="ml-4 text-sm font-medium">Memuat PDF...</p>
                </div>
              ) : previewError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white">
                  <AlertCircle size={64} className="text-red-400 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-700">
                    Gagal Memuat File
                  </h4>
                  <p className="text-sm text-gray-500 mt-2">{previewError}</p>
                </div>
              ) : (
                <iframe
                  src={selectedFile.url}
                  title="Preview Daftar Hadir"
                  className="w-full h-full border-none block"
                  loading="lazy"
                />
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </AdminLayout>
  );
};

export default DaftarHadir;
