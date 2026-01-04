import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FileText,
  Clock,
  RefreshCw,
  ArrowRight,
  Search,
  BarChart3,
  Activity,
  Users,
  Briefcase,
  User,
  MoreHorizontal,
  CheckCircle,
  Inbox,
} from "lucide-react";

const DashboardAdmin = () => {
  const navigate = useNavigate();

  const [allSurat, setAllSurat] = useState([]);
  const [allDaftarHadir, setAllDaftarHadir] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    ratio: "0%",
  });

  const [categoryStats, setCategoryStats] = useState({
    "Kunjungan Kerja": 0,
    "Kunjungan Tamu": 0,
    Lainnya: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSuratList, setFilteredSuratList] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/surat");
      let suratData = res?.data?.data || res?.data;

      if (!Array.isArray(suratData)) {
        suratData = [];
      }

      const activeSurat = suratData.filter(
        (s) =>
          s.status?.toLowerCase() === "pending" ||
          s.status?.toLowerCase() === "diproses" ||
          s.status?.toLowerCase() === "disposisi"
      );

      setAllSurat(activeSurat);

      const statsData = {
        total: activeSurat.length,
        pending: activeSurat.filter(
          (s) =>
            s.status?.toLowerCase() === "pending" ||
            s.status?.toLowerCase() === "diproses"
        ).length,
      };

      const ratio =
        statsData.total > 0
          ? Math.round((statsData.pending / statsData.total) * 100)
          : 0;

      setStats({
        ...statsData,
        ratio: `${ratio}%`,
      });

      const catStats = {
        "Kunjungan Kerja": 0,
        "Kunjungan Tamu": 0,
        Lainnya: 0,
      };

      activeSurat.forEach((s) => {
        const perihal = s.perihal || "";
        if (perihal.includes("Kunjungan Kerja")) {
          catStats["Kunjungan Kerja"]++;
        } else if (perihal.includes("Kunjungan Tamu")) {
          catStats["Kunjungan Tamu"]++;
        } else {
          catStats["Lainnya"]++;
        }
      });

      setCategoryStats(catStats);

      const pendingSurat = activeSurat
        .filter(
          (s) =>
            s.status?.toLowerCase() === "pending" ||
            s.status?.toLowerCase() === "diproses"
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setFilteredSuratList(pendingSurat);

      const resDh = await api.get("/daftar-hadir");
      let dhData = resDh?.data?.data || resDh?.data;
      if (!Array.isArray(dhData)) {
        dhData = [];
      }
      setAllDaftarHadir(dhData);
    } catch (err) {
      console.error("Gagal fetch data:", err);
      setAllSurat([]);
      setFilteredSuratList([]);
      setAllDaftarHadir([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    let filtered = allSurat;

    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.perihal?.toLowerCase().includes(searchQuery) ||
          s.pengirim?.toLowerCase().includes(searchQuery) ||
          s.nomor_surat?.toLowerCase().includes(searchQuery)
      );
    }

    const pendingList = filtered
      .filter(
        (s) =>
          s.status?.toLowerCase() === "pending" ||
          s.status?.toLowerCase() === "diproses"
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    setFilteredSuratList(pendingList);
  }, [allSurat, searchQuery]);

  const MainStatWidget = ({ title, value, color, icon: Icon, isImportant }) => (
    <div
      className={`
        bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden transition-all duration-300
        ${
          isImportant
            ? "ring-2 ring-blue-500/20 border-blue-200 hover:shadow-md"
            : "hover:shadow-lg"
        }
      `}
    >
      <div className="absolute -right-4 -top-4 w-20 h-20 opacity-5">
        <Icon size={80} />
      </div>

      <div className="flex items-start justify-between relative z-10 mb-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {title}
          </p>
          {isImportant ? (
            <h3 className="text-4xl font-extrabold text-gray-900">{value}</h3>
          ) : (
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
          )}
        </div>

        <div
          className={`p-3.5 rounded-xl shadow-sm ${color} group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  const CategoryChart = () => {
    const data = [
      {
        label: "Kunjungan Kerja",
        value: categoryStats["Kunjungan Kerja"],
        color: "bg-blue-600",
        icon: <Briefcase size={20} />,
      },
      {
        label: "Kunjungan Tamu",
        value: categoryStats["Kunjungan Tamu"],
        color: "bg-purple-600",
        icon: <User size={20} />,
      },
      {
        label: "Lainnya",
        value: categoryStats["Lainnya"],
        color: "bg-slate-500",
        icon: <MoreHorizontal size={20} />,
      },
    ];

    const maxVal = Math.max(...data.map((d) => d.value), 1);

    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col justify-center">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" /> Distribusi Surat
          </h3>
          <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
            {stats.total} Aktif
          </span>
        </div>

        <div className="space-y-5">
          {data.map((item, index) => {
            const percentage = (item.value / maxVal) * 100;
            return (
              <div key={index}>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span
                      className={`p-1.5 rounded-md ${item.color} bg-opacity-10`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {item.value}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`${item.color} h-3 rounded-full transition-all duration-1000 ease-out shadow-[0_2px_4px_rgba(0,0,0,0.1)]`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="text-right text-[10px] text-gray-400 mt-0.5 font-mono">
                  {percentage.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard Admin">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-8 text-white h-32 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl shadow-sm h-32 animate-pulse"
              />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard Admin">
      <div className="mb-10">
        <p className="text-gray-500 text-base mt-2 leading-relaxed">
          Selamat datang! Ini adalah pusat kendali untuk memverifikasi surat
          masuk dan mengatur akses pengguna.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <MainStatWidget
          title="Total Surat"
          value={stats.total}
          color="bg-blue-50 text-blue-600"
          icon={Activity}
        />

        <MainStatWidget
          title="Menunggu Verifikasi"
          value={stats.pending}
          color="bg-yellow-50 text-yellow-600"
          icon={Inbox}
          isImportant={true}
        />

        <MainStatWidget
          title="Total Daftar Hadir"
          value={allDaftarHadir.length}
          color="bg-green-50 text-green-600"
          icon={CheckCircle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Surat Perlu Tindakan
                </h3>
                <p className="text-xs text-gray-500">
                  {filteredSuratList.length > 0
                    ? "5 surat pending terbaru"
                    : "Antrian kosong"}
                </p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari..."
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-40 lg:w-56"
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase font-medium text-xs border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3">Perihal</th>
                  <th className="px-6 py-3">Pengirim</th>
                  <th className="px-6 py-3">Tgl Masuk</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuratList.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle className="w-12 h-12 mb-3 text-green-300" />
                        <p className="font-medium">
                          Tidak ada surat perlu ditindaklanjuti.
                        </p>
                        <p className="text-xs mt-1 text-gray-400">
                          Semua beres!
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSuratList.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-blue-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {s.perihal}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {s.instansi}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{s.pengirim}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {s.created_at
                          ? new Date(s.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => navigate(`/admin/surat/${s.id}`)}
                          className="text-xs font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Proses
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-100 text-center">
            <button
              onClick={() => navigate("/admin/surat-masuk?mode=pending")}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              Lihat Semua Surat Masuk <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex-1 flex flex-col justify-center">
              <CategoryChart />
            </div>
          </div>

          <div
            onClick={() => navigate("/admin/register")}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group flex flex-col justify-center h-full min-h-[160px]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Users size={32} />
              </div>
              <ArrowRight
                className="text-gray-300 group-hover:text-indigo-600 transition-colors"
                size={24}
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Kelola User</h3>
              <p className="text-sm text-gray-500 mt-1">
                Atur akses Admin & Unit
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate("/admin/daftar-hadir")}
            className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer group transform hover:-translate-y-1 text-white flex flex-col justify-center min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Daftar Hadir</h3>
                <p className="text-blue-100 text-xs mt-1">
                  Cetak PDF kehadiran surat disetujui
                </p>
              </div>
              <div className="p-2 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
                <FileText size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardAdmin;
