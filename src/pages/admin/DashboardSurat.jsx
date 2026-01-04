import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import {
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Inbox,
  FileText,
  Calendar,
  Eye,
  Layers,
  List,
  CheckCircle,
} from "lucide-react";

const DashboardSurat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // --- STATE UTAMA (GABUNGAN MODE & FILTER) ---
  // Nilai 'semua' = Tampilkan semua data (Lihat Semua)
  // Nilai lain = Filter kategori
  const [activeCategory, setActiveCategory] = useState("semua");

  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef(null);

  const [suratList, setSuratList] = useState([]);
  const [filteredSuratList, setFilteredSuratList] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- STATE INFINITE SCROLL ---
  const [displayLimit, setDisplayLimit] = useState(9);
  const [itemsPerPage] = useState(9);

  // --- BACA PARAMETER URL (Untuk Menjaga Link Sidebar) ---
  const urlMode = searchParams.get("mode");
  const urlFilter = searchParams.get("filter");

  // --- SYNC STATE DENGAN URL ---
  useEffect(() => {
    if (urlMode === "semua") {
      setActiveCategory("semua");
    } else if (urlFilter) {
      setActiveCategory(urlFilter);
    } else {
      // Jika tidak ada param, default ke 'semua' (Lihat Semua)
      setActiveCategory("semua");
    }
  }, [urlMode, urlFilter]);

  // --- DEFINISI TABS (DROPDOWN KATEGORI) ---
  const tabs = [
    { id: "semua", label: "Semua Surat", icon: <Layers size={18} /> },
    {
      id: "kunjungan-kerja",
      label: "Kunjungan Kerja",
      icon: <Calendar size={18} />,
    },
    { id: "kunjungan-tamu", label: "Kunjungan Tamu", icon: <Eye size={18} /> },
    { id: "lainnya", label: "Lainnya", icon: <List size={18} /> },
  ];

  const fetchSurat = async () => {
    try {
      setLoading(true);
      const res = await api.get("/surat");
      const suratData = res?.data?.data || res?.data || [];
      if (!Array.isArray(suratData)) {
        setSuratList([]);
      } else {
        setSuratList(suratData);
      }
    } catch (err) {
      console.error("❌ Gagal fetch surat:", err);
      setSuratList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- LOGIKA FILTER & PENCARIAN ---
  useEffect(() => {
    let filtered = suratList;

    // 1. Filter Pencarian
    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.perihal?.toLowerCase().includes(searchQuery) ||
          s.pengirim?.toLowerCase().includes(searchQuery) ||
          s.nomor_surat?.toLowerCase().includes(searchQuery)
      );
    }

    // 2. Filter Kategori / Tab
    if (activeCategory !== "semua") {
      const filterMap = {
        "kunjungan-kerja": "Kunjungan Kerja",
        "kunjungan-tamu": "Kunjungan Tamu",
        lainnya: "Lainnya",
      };
      const targetJudul = filterMap[activeCategory];
      if (targetJudul) {
        filtered = filtered.filter((s) => s.perihal === targetJudul);
      }
    }

    setFilteredSuratList(filtered);

    // --- LOGIKA TAMPIL (INSTAN VS SCROLL) ---
    if (activeCategory === "semua") {
      // Mode "Lihat Semua": Tampilkan SEMUA data sekaligus (Gak usah scroll)
      setDisplayLimit(filtered.length);
    } else {
      // Mode Kategori: Tampil bertahap (Scroll)
      setDisplayLimit(9);
    }

    // Reset scroll saat filter berubah
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [suratList, searchQuery, activeCategory]);

  // --- JUDUL HALAMAN ---
  const getPageTitle = () => {
    if (activeCategory === "semua") return "Lihat Semua Surat (Arsip)";
    if (activeCategory === "kunjungan-kerja") return "Kunjungan Kerja";
    if (activeCategory === "kunjungan-tamu") return "Kunjungan Tamu";
    if (activeCategory === "lainnya") return "Lainnya";
    return "Kotak Masuk";
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSurat();
  };

  // --- HANDLE KLIK TAB ---
  const handleTabClick = (tabId) => {
    setSearchQuery(""); // Reset search saat ganti tab
    setActiveCategory(tabId);

    // Update URL Parameter (Opsional, agar link sidebar tetap jalan)
    if (tabId === "semua") {
      // Gunakan mode=semua agar jelas
      setSearchParams({ mode: "semua" });
    } else {
      setSearchParams({ filter: tabId, mode: null });
    }
  };

  // --- LOGIKA SCROLL ---
  const handleScroll = (e) => {
    // Jangan scroll infinite jika sedang mode "Semua Surat" (karena sudah full load)
    if (activeCategory === "semua") return;

    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    // Mentok bawah
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      if (displayLimit < filteredSuratList.length) {
        setDisplayLimit((prev) => prev + itemsPerPage);
      }
    }
  };

  const displayedItems = filteredSuratList.slice(0, displayLimit);

  useEffect(() => {
    fetchSurat();
  }, []);

  // --- SKELETON LOADING ---
  const LoadingSkeleton = () => (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-blue-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
              Nomor Surat
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
              Judul
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
              Pengirim
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
              Tanggal
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {[...Array(itemsPerPage)].map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout title="Daftar Surat Masuk">
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Memuat data...
          </h2>
          <LoadingSkeleton />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Daftar Surat Masuk">
      {/* --- TOOLBAR: SEARCH --- */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari surat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
              className="pl-10 pr-3 py-3 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <button
            onClick={() => {
              setRefreshing(true);
              fetchSurat();
            }}
            className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 px-5 py-3 rounded-lg hover:bg-blue-100 transition-all"
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* --- TAB NAVIGATION (Dropdown Kategori) --- */}
      <div className="bg-white rounded-xl shadow-sm p-3 mb-6 border border-gray-100">
        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => {
            // Tentukan Tab Aktif
            const isActive = activeCategory === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                  isActive
                    ? "bg-indigo-600 text-white scale-105"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {isActive && <CheckCircle size={14} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- DAFTAR SURAT (TABLE) --- */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header Table */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            {activeCategory === "semua"
              ? "Daftar Semua Surat"
              : `Daftar: ${
                  tabs.find((t) => t.id === activeCategory)?.label || "Surat"
                }`}
          </h2>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-500">Tampilkan:</span>
            <span className="text-sm font-bold text-blue-700">
              {displayedItems.length}
            </span>
            <span className="text-sm text-gray-500">dari</span>
            <span className="text-sm font-bold text-gray-700">
              {filteredSuratList.length}
            </span>
            <span className="text-sm text-gray-500">data</span>
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="w-full bg-gray-50 rounded-lg h-8 animate-pulse mb-2"></div>
            <div className="w-3/4 bg-gray-50 rounded-lg h-8 animate-pulse mb-2"></div>
            <div className="w-5/6 bg-gray-50 rounded-lg h-8 animate-pulse"></div>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex-1">
            <Inbox className="mx-auto h-12 w-12 mb-4 opacity-20" />
            <p>
              {searchQuery
                ? "Tidak ada surat yang cocok."
                : "Belum ada surat masuk."}
            </p>
          </div>
        ) : (
          // 🔥 FIX: Container scroll. Gunakan flex-1 min-h-0 agar scroll bekerja.
          <div
            className="overflow-y-auto flex-1"
            onScroll={activeCategory === "semua" ? undefined : handleScroll}
            ref={scrollRef}
          >
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-left bg-gray-50">
                    Nomor Surat
                  </th>
                  <th className="px-6 py-4 text-left bg-gray-50">Judul</th>
                  <th className="px-6 py-4 text-left bg-gray-50">Pengirim</th>
                  <th className="px-6 py-4 text-left bg-gray-50">Tanggal</th>
                  <th className="px-6 py-4 text-left bg-gray-50">Status</th>
                  <th className="px-6 py-4 text-right bg-gray-50">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {displayedItems.map((s, index) => {
                  const statusColor =
                    s.status === "disetujui"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : s.status === "ditolak"
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : "bg-yellow-100 text-yellow-800 border border-yellow-200";

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-blue-50 transition-colors duration-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap  text-gray-900 border-b border-gray-100">
                        {s.nomor_surat || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-900 border-b border-gray-100">
                        {s.perihal || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-900 border-b border-gray-100">
                        {s.pengirim || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 border-b border-gray-100">
                        {s.created_at
                          ? new Date(s.created_at).toLocaleDateString("id-ID")
                          : "-"}
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100">
                        <span
                          className={`inline-block px-2 py-1 rounded-md text-xs font-semibold border ${statusColor}`}
                        >
                          {s.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right border-b border-gray-100">
                        <button
                          onClick={() => navigate(`/admin/surat/${s.id}`)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-all duration-200 shadow-sm"
                        >
                          <Eye size={14} /> Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default DashboardSurat;
