import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Home,
  Users,
  LogOut,
  Menu,
  X,
  Inbox,
  User,
  ChevronDown,
  Briefcase,
  MoreHorizontal,
  FileText,
  Bell,
  Layers,
  CheckCircle,
} from "lucide-react";

// --- IMPORT LOGO ---
import logoSinten from "../assets/sinten.png";
// ------------------

// --- PERBAIKAN: Role Label menjadi "Apa Adanya" ---
const ROLE_LABELS = {
  admin: "admin",
  ketua_dprd: "ketua_dprd",
  wakil_ketua_dprd: "wakil_ketua_dprd",
  sekretaris_dprd: "sekretaris_dprd",
  kabag_umum: "kabag_umum",
  kabag_keuangan: "kabag_keuangan",
  kabag_persidangan: "kabag_persidangan",
  komisi_i: "komisi_i",
  komisi_ii: "komisi_ii",
  komisi_iii: "komisi_iii",
  komisi_iv: "komisi_iv",
};
// -------------------------------------------------

const AdminLayout = ({ children, title, actions }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isKotakMasukOpen, setIsKotakMasukOpen] = useState(false);

  // Otomatis buka dropdown menu jika URL mengandung /surat-masuk
  useEffect(() => {
    if (location.pathname.includes("/surat-masuk")) {
      setIsKotakMasukOpen(true);
    } else {
      setIsKotakMasukOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getMenuItems = () => {
    if (!user || !user?.role) return [];

    const baseMenu = [
      {
        path: `/${user.role}/dashboard`,
        label: "Dashboard",
        icon: <Home className="h-5 w-5" />,
      },
      {
        label: "Kotak Masuk",
        icon: <Inbox className="h-5 w-5" />,
        hasDropdown: true,
        // 🔥 PENTING: Parent Kotak Masuk jadi Link ke halaman Utama (Default: Semua Surat)
        path: `/${user.role}/surat-masuk`,
        dropdownItems: [
          {
            path: `/${user.role}/surat-masuk?filter=kunjungan-kerja`,
            label: "Kunjungan Kerja",
            icon: <Briefcase className="h-4 w-4" />,
          },
          {
            path: `/${user.role}/surat-masuk?filter=kunjungan-tamu`,
            label: "Kunjungan Tamu",
            icon: <User className="h-4 w-4" />,
          },
          {
            path: `/${user.role}/surat-masuk?filter=lainnya`,
            label: "Lainnya",
            icon: <MoreHorizontal className="h-4 w-4" />,
          },
        ],
      },
    ];

    // Hanya Admin yang punya menu ini
    if (user.role === "admin") {
      baseMenu.push({
        path: "/admin/daftar-hadir",
        label: "Daftar Hadir",
        icon: <Bell className="h-5 w-5" />,
      });

      baseMenu.push({
        path: "/admin/register",
        label: "Kelola User",
        icon: <Users className="h-5 w-5" />,
      });
    }

    return baseMenu;
  };

  const menuItems = getMenuItems();

  // Helper Cek Aktif
  const isDropdownItemActive = (dropdownItems) => {
    if (!dropdownItems) return false;

    // Cek apakah path saat ini sesuai dengan salah satu item dropdown
    return dropdownItems.some((item) => {
      const pathMatch = location.pathname === item.path.split("?")[0];
      const filterMatch = location.search.includes(
        item.path.split("?")[1] || ""
      );
      return pathMatch && filterMatch;
    });
  };

  // Cek Aktif untuk Parent Item "Kotak Masuk"
  // Aktif jika URL-nya sama ATAU sedang melihat salah satu child dropdown
  const isParentActive = (item) => {
    if (item.path && location.pathname === item.path) return true;
    if (item.hasDropdown && isDropdownItemActive(item.dropdownItems))
      return true;
    return false;
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 transition-all duration-300 flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
              >
                {isSidebarOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

              <Link to="/" className="flex items-center gap-2 group">
                {/* --- LOGO GAMBAR (PENGGANTI KOTAK 'S') --- */}
                <img
                  src={logoSinten}
                  alt="Logo Sinten"
                  className="h-10 w-auto object-contain transform transition-all duration-300 group-hover:scale-110"
                />
                {/* ----------------------------------------- */}

                <span className="font-bold text-xl text-gray-900 hidden sm:block group-hover:text-blue-600 transition-colors duration-300">
                  SINTEN
                </span>
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md transform transition-all duration-300 group-hover:scale-110">
                    {user?.nama?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.nama || "User"}
                    </div>
                    {/* --- PERBAIKAN DI SINI: Gunakan user?.role Langsung --- */}
                    <div className="text-xs text-gray-500">
                      {user?.role || "-"}
                    </div>
                    {/* --------------------------------------------- */}
                  </div>
                  <svg
                    className={`hidden sm:block w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-all duration-300 ${
                      isProfileDropdownOpen ? "rotate-180" : ""
                    }`}
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
                </button>

                {/* Dropdown Profile */}
                <div
                  className={`absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-1 z-[60] transform transition-all duration-300 origin-top-right ${
                    isProfileDropdownOpen
                      ? "opacity-100 translate-y-0 visible"
                      : "opacity-0 translate-y-2 invisible pointer-events-none"
                  }`}
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {user?.nama || "User"}
                        </p>
                        {/* --- PERBAIKAN DI SINI: Gunakan user?.role Langsung --- */}
                        <p className="text-xs text-gray-500">
                          {user?.role || ""}
                        </p>
                        {/* ------------------------------------------------- */}
                      </div>
                    </div>
                  </div>

                  {/* 🔥 MENU PENGATURAN DIHAPUS KARENA BELUM ADA API */}

                  <div className="border-t border-gray-100 my-1 mx-4"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors rounded-lg"
                  >
                    <LogOut className="w-5 h-5 text-red-500" /> Keluar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Wrapper Utama Sidebar & Main Content */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-16 left-0 z-40
            w-64 bg-white border-r border-gray-200 shadow-sm
            transform transition-transform duration-300 ease-in-out
            h-[calc(100vh-4rem)] lg:h-auto
            ${
              isSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }
          `}
        >
          <nav className="p-4 space-y-2 overflow-y-auto h-full">
            {menuItems.map((item, index) => {
              // Tentukan Tab Aktif
              let isActive = false;

              if (item.hasDropdown) {
                // Parent Aktif jika sedang di halaman ini ATAU sedang melihat salah satu child filternya
                isActive = isParentActive(item);
              } else {
                // Biasa
                isActive = location.pathname === item.path;
              }

              // Tentukan Child Aktif (untuk styling)
              const isDropdownActive = item.hasDropdown
                ? isDropdownItemActive(item.dropdownItems)
                : false;

              return (
                <div key={index}>
                  {item.hasDropdown ? (
                    <div>
                      {/* 🔥 PENTING: Parent Kotak Masuk dijadikan Link */}
                      <Link
                        to={item.path}
                        onClick={() => {
                          setIsSidebarOpen(false);
                          setIsKotakMasukOpen(false); // Reset state saat klik parent
                        }}
                        className={`
                          flex items-center justify-between w-full px-4 py-3 rounded-lg
                          transition-all duration-300 transform hover:scale-105 cursor-pointer
                          ${
                            isActive
                              ? "bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-200"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            isKotakMasukOpen ? "rotate-180" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            setIsKotakMasukOpen(!isKotakMasukOpen);
                          }}
                        />
                      </Link>

                      {/* Dropdown Items */}
                      {isKotakMasukOpen && (
                        <div className="mt-1 ml-4 space-y-1">
                          {item.dropdownItems.map(
                            (dropdownItem, dropdownIndex) => {
                              const isItemActive = isDropdownItemActive([
                                dropdownItem,
                              ]);

                              return (
                                <Link
                                  key={dropdownIndex}
                                  to={dropdownItem.path}
                                  onClick={() => setIsSidebarOpen(false)}
                                  className={`
                                  flex items-center gap-3 px-4 py-2.5 rounded-lg
                                  transition-all duration-300 transform hover:scale-105 cursor-pointer
                                  ${
                                    isItemActive
                                      ? "bg-blue-600 text-white font-medium shadow-md"
                                      : "text-gray-600 hover:bg-white hover:text-blue-700 hover:border hover:border-gray-200 hover:shadow-sm border border-transparent"
                                  }
                                `}
                                >
                                  {dropdownItem.icon}
                                  <span>{dropdownItem.label}</span>
                                </Link>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Menu Biasa (Dashboard, Daftar Hadir, dll)
                    <Link
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg
                        transition-all duration-300 transform hover:scale-105 cursor-pointer
                        ${
                          isActive
                            ? "bg-blue-600 text-white font-semibold shadow-md"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }
                      `}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-gray-50 w-full">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {title}
              </h1>
              {actions && <div className="flex gap-2">{actions}</div>}
            </div>
          </div>
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
