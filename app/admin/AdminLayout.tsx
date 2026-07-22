// app/admin/layout.tsx
"use client";

import { ReactNode, useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useToast } from "@/app/admin/_components/CustomToast";
import { usePathname, useRouter } from "next/navigation";
import ChangePasswordModal from "@/app/admin/_components/ChangePasswordModal";

import {
  FolderKanban,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Store,
  Settings,
  LogOut,
  Bell,
  Search,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Tag,
  Image as ImageIcon,
  Percent,
  Layers,
  TrendingUp,
  UserCircle,
  Gift,
  Cog,
  FileText,
  MessageSquare,
  Moon,
  Sun,
  Star,
  PackageOpen,
  Receipt,
  Clock,
  LockKeyhole,
  User,
  Mail,

  MapPin,
  Ship,
  Truck,
  Activity, // ✅ NEW ICON FOR ACTIVITY LOGS
  Shield,
  Award,
  Coins,
  Sliders,
  ClipboardList,
  PoundSterling,
  Warehouse,
  ShieldCheck,
  FileSpreadsheet,
  Monitor, // ✅ Added for Import/Export
  CreditCard,
  GiftIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/admin/_context/theme-provider";
import { authService } from "@/lib/services/auth";
import ErrorBoundary from "@/app/admin/_components/ErrorBoundary";
import ScrollToTopButton from "./_components/ScrollToTopButton";
import { useAdminLogoutShortcut } from "./_hooks/useAdminLogoutShortcut";
import { useAuth } from "./_context/auth-context";

interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  permissionKey?: string;
  children?: NavigationItem[];
}


// Navigation with clean group organization mapped to permission keys
const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, permissionKey: 'dashboard' },

  {
    name: 'Catalog',
    icon: Layers,
    children: [
      { name: 'Products', href: '/admin/products', icon: Package, permissionKey: 'products' },
      { name: 'Inventory', href: '/admin/inventory', icon: Warehouse, permissionKey: 'inventory' },
      { name: 'Categories', href: '/admin/categories', icon: FolderTree, permissionKey: 'categories' },
      { name: 'Brands', href: '/admin/brands', icon: Tag, permissionKey: 'brands' },
      { name: 'Product Reviews', href: '/admin/productReview', icon: Star, permissionKey: 'reviews' },
      { name: 'Pharmacy Q&A', href: '/admin/pharmacy-questions', icon: ClipboardList, permissionKey: 'pharmacy' },
    ],
  },
  {
    name: 'Sales',
    icon: TrendingUp,
    children: [
      { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, permissionKey: 'orders' },
      { name: 'Payments', href: '/admin/payments', icon: CreditCard, permissionKey: 'orders' },
      { name: 'Customers', href: '/admin/customers', icon: Users, permissionKey: 'customers' },
    ],
  },
  {
    name: 'Marketing',
    icon: Gift,
    children: [
      { name: 'Discounts', href: '/admin/discounts', icon: Percent, permissionKey: 'discounts' },
      { name: 'Subscriptions', href: '/admin/subscriptions', icon: PackageOpen, permissionKey: 'subscriptions' },
      { name: 'Newsletter', href: '/admin/newsletter', icon: Mail, permissionKey: 'newsletter' },
      { name: 'Loyalty Points', href: '/admin/loyalty-points', icon: Coins, permissionKey: 'loyalty' },
      { name: 'Loyalty Config', href: '/admin/loyalty-config', icon: Sliders, permissionKey: 'loyalty' },
    ],
  },

  // ✅ SHIPPING SECTION - Delivery Strip YAHAN ADD KARO
  {
    name: 'Shipping',
    icon: Truck,
    children: [
      { name: 'Shipping Settings', href: '/admin/shipping', icon: Settings, permissionKey: 'shipping' },
      { name: 'Delivery Strips', href: '/admin/DeliveryStrip', icon: PackageOpen, permissionKey: 'shipping' },
    ],
  },

  {
    name: 'Finance',
    icon: PoundSterling,
    children: [
      { name: 'VAT Rates', href: '/admin/vatRates', icon: PoundSterling, permissionKey: 'settings' },
    ],
  },
  { name: 'Import / Export', href: '/admin/import-export', icon: FileSpreadsheet, permissionKey: 'products' },
  {
    name: 'Content',
    icon: FileText,
    children: [
      { name: 'Banners', href: '/admin/banners', icon: ImageIcon, permissionKey: 'banners' },

      // ✅ ADDED
      { name: 'Homepage Preview', href: '/admin/HomepagePreview', icon: Monitor, permissionKey: 'banners' },

      { name: 'A+ Templates', href: '/admin/aplus-templates', icon: Sparkles, permissionKey: 'products' },
      { name: 'Blog Categories', href: '/admin/BlogCategories', icon: FolderKanban, permissionKey: 'blogs' },
      { name: 'Blog Posts', href: '/admin/BlogPosts', icon: FileText, permissionKey: 'blogs' },
      { name: 'Blog Comments', href: '/admin/comments', icon: MessageSquare, permissionKey: 'blogs' },
      { name: 'Contact Requests', href: '/admin/contact', icon: Mail, permissionKey: 'contact' },
    ],
  },
  {
    name: 'Staff Management',
    icon: Users,
    children: [
      { name: 'Staff', href: '/admin/staff', icon: User, permissionKey: 'staff' },
      { name: 'Staff Roles', href: '/admin/staff-roles', icon: ShieldCheck, permissionKey: 'staff' },
      { name: 'Page Permissions', href: '/admin/permissions', icon: LockKeyhole, permissionKey: 'staff' },
    ],
  },


  {
    name: 'System',
    icon: Shield,
    children: [
      { name: 'Activity Logs', href: '/admin/ActivityLogs', icon: Activity, permissionKey: 'activitylogs' },
      { name: 'Settings', href: '/admin/settings', icon: Settings, permissionKey: 'settings' },
    ],
  },
];



const getRoutePermissionKey = (path: string): string | null => {
  if (path === '/admin') return 'dashboard';
  if (path.startsWith('/admin/products')) return 'products';
  if (path.startsWith('/admin/categories')) return 'categories';
  if (path.startsWith('/admin/brands')) return 'brands';
  if (path.startsWith('/admin/productReview')) return 'reviews';
  if (path.startsWith('/admin/inventory')) return 'inventory';
  if (path.startsWith('/admin/orders')) return 'orders';
  if (path.startsWith('/admin/payments')) return 'orders';
  if (path.startsWith('/admin/customers')) return 'customers';
  if (path.startsWith('/admin/discounts')) return 'discounts';
  if (path.startsWith('/admin/subscriptions')) return 'subscriptions';
  if (path.startsWith('/admin/shipping') || path.startsWith('/admin/DeliveryStrip')) return 'shipping';
  if (path.startsWith('/admin/loyalty-points') || path.startsWith('/admin/loyalty-config')) return 'loyalty';
  if (path.startsWith('/admin/banners') || path.startsWith('/admin/HomepagePreview')) return 'banners';
  if (path.startsWith('/admin/pharmacy-questions')) return 'pharmacy';
  if (path.startsWith('/admin/newsletter')) return 'newsletter';
  if (path.startsWith('/admin/contact')) return 'contact';
  if (path.startsWith('/admin/staff') || path.startsWith('/admin/staff-roles') || path.startsWith('/admin/permissions')) return 'staff';
  if (path.startsWith('/admin/settings') || path.startsWith('/admin/vatRates')) return 'settings';
  if (path.startsWith('/admin/ActivityLogs')) return 'activitylogs';
  if (path.startsWith('/admin/BlogCategories') || path.startsWith('/admin/BlogPosts') || path.startsWith('/admin/comments')) return 'blogs';
  return null;
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isLoading, logout, hasPermission, permissions } = useAuth();
  const { theme, setTheme } = useTheme();

  const routeKey = getRoutePermissionKey(pathname);
  const isViewAllowed = routeKey && hasPermission ? hasPermission(routeKey, 'view') : true;

  const showPermissionsLoading = isAuthenticated && !permissions;

  const filteredNavigation = useMemo(() => {
    if (!permissions || !hasPermission) return [];

    return navigation
      .map((item: NavigationItem) => {
        if (item.children) {
          const filteredChildren = item.children.filter((child: NavigationItem) => {
            if (!child.permissionKey) return true;
            return hasPermission(child.permissionKey, "view");
          });
          
          if (filteredChildren.length === 0) return null;
          
          return {
            ...item,
            children: filteredChildren,
          };
        }

        if (item.permissionKey && !hasPermission(item.permissionKey, "view")) {
          return null;
        }

        return item;
      })
      .filter(Boolean) as NavigationItem[];
  }, [permissions, hasPermission]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});
  const [isAnimating, setIsAnimating] = useState(false);

  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // ✅ NEW STATE FOR HOVER-BASED EXPANSION
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useAdminLogoutShortcut();
  // Token expiry countdown state
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);

  const isActiveRoute = (navHref: string, currentPath: string) => {
    if (navHref === '/admin') return currentPath === '/admin';

    return (
      currentPath === navHref ||
      currentPath.startsWith(navHref + '/')
    );
  };

  const isParentActive = (children?: NavigationItem[]) => {
    if (!children) return false;
    return children.some(child => child.href && isActiveRoute(child.href, pathname));
  };

  const getGroupColor = (name: string) => {
    const map: Record<string, { icon: string; border: string; bg: string; dot: string }> = {
      Catalog: { icon: 'text-[#f38918]', border: 'border-[#f38918]/30', bg: 'bg-[#f38918]/10', dot: 'bg-[#f38918]' },
      Sales: { icon: 'text-slate-800 dark:text-slate-200', border: 'border-slate-300/60 dark:border-slate-700/60', bg: 'bg-slate-200/50 dark:bg-slate-800/50', dot: 'bg-slate-800 dark:bg-slate-200' },
      Marketing: { icon: 'text-[#f38918]', border: 'border-[#f38918]/30', bg: 'bg-[#f38918]/10', dot: 'bg-[#f38918]' },
      Shipping: { icon: 'text-slate-800 dark:text-slate-200', border: 'border-slate-300/60 dark:border-slate-700/60', bg: 'bg-slate-200/50 dark:bg-slate-800/50', dot: 'bg-slate-800 dark:bg-slate-200' },
      Finance: { icon: 'text-[#f38918]', border: 'border-[#f38918]/30', bg: 'bg-[#f38918]/10', dot: 'bg-[#f38918]' },
      Content: { icon: 'text-slate-800 dark:text-slate-200', border: 'border-slate-300/60 dark:border-slate-700/60', bg: 'bg-slate-200/50 dark:bg-slate-800/50', dot: 'bg-slate-800 dark:bg-slate-200' },
      System: { icon: 'text-[#f38918]', border: 'border-[#f38918]/30', bg: 'bg-[#f38918]/10', dot: 'bg-[#f38918]' },
    };
    return map[name] ?? { icon: 'text-[#f38918]', border: 'border-[#f38918]/30', bg: 'bg-[#f38918]/10', dot: 'bg-[#f38918]' };
  };

  // ✅ UPDATED: Handle click to toggle (for mobile and click behavior)
  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => {
      if (prev[menuName]) {
        return { [menuName]: false };
      }
      return { [menuName]: true };
    });
  };



  const handleMenuLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredMenu(null);
  };

  const handleThemeToggle = () => {
    setIsAnimating(true);
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    if (newTheme === "dark") {
      toast.success("🌙 Dark Mode Enabled", {
        autoClose: 2000,
        position: "top-center"
      });
    } else {
      toast.success("☀️ Light Mode Enabled", {
        autoClose: 2000,
        position: "top-center"
      });
    }

    setTimeout(() => setIsAnimating(false), 600);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Token refresh check
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkAndRefresh = async () => {
      if (authService.isTokenExpiringSoon(10)) {
        console.log("⚠️ Token expiring soon, refreshing...");

        const refreshed = await authService.refreshToken();

        if (refreshed) {
          toast.success("🔄 Session Extended -> Your session has been automatically renewed for 1 hour", {
            position: "top-center",
            autoClose: 5000,
          });

          console.log("✅ Token refreshed successfully at", new Date().toLocaleTimeString());
        } else {
          toast.error("⏰ Session Expired -> Please login again to continue", {
            position: "top-center",
            autoClose: 5000,
          });
          router.replace("/login");
        }
      }
    };

    checkAndRefresh();
    const interval = setInterval(checkAndRefresh, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [router, toast, isAuthenticated]);

  // Calculate time remaining
  const calculateTimeRemaining = () => {
    const expiryDate = authService.getTokenExpiry();

    if (!expiryDate) {
      setTimeRemaining(null);
      return;
    }

    const now = new Date().getTime();
    const expiry = expiryDate.getTime();
    const diff = expiry - now;

    if (diff <= 0) {
      setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, total: 0 });
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeRemaining({ hours, minutes, seconds, total: diff });
  };

  // Auto-expand active parent menu
  useEffect(() => {
    navigation.forEach((item) => {
      if (item.children && isParentActive(item.children)) {
        setExpandedMenus({ [item.name]: true });
      }
    });
  }, [pathname]);

  // Compute user display values from context
  const userEmail = user?.email || 'admin@ecom.com';
  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`.trim()
    : user?.firstName || user?.lastName || 'Admin User';
  const userInitial = user?.firstName
    ? user.firstName[0].toUpperCase()
    : userEmail[0].toUpperCase();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!", {
      position: "top-center",
      autoClose: 1000,
    });
  };

  useEffect(() => {

    if (isLoading) return;

    if (!isAuthenticated) {

      window.location.href = "/login";

      return;
    }

    calculateTimeRemaining();

    const interval = setInterval(
      calculateTimeRemaining,
      1000
    );

    return () => clearInterval(interval);

  }, [isAuthenticated, isLoading]);

  const isSidebarExpanded = !sidebarCollapsed || (sidebarCollapsed && isHovering);
  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64';

  const getTimerColor = () => {
    if (!timeRemaining) return 'text-slate-400';
    const totalMinutes = timeRemaining.hours * 60 + timeRemaining.minutes;

    if (totalMinutes < 5) return 'text-red-400 animate-pulse';
    if (totalMinutes < 15) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <ErrorBoundary>
      <div data-admin className="min-h-screen bg-slate-100 dark:bg-slate-950 relative overflow-hidden transition-colors duration-500">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] transition-all duration-500" />
        <div className="fixed top-0 -left-4 w-96 h-96 bg-violet-500 dark:bg-violet-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-15 animate-blob transition-all duration-500" />
        <div className="fixed top-0 -right-4 w-96 h-96 bg-cyan-500 dark:bg-cyan-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-15 animate-blob animation-delay-2000 transition-all duration-500" />
        <div className="fixed -bottom-8 left-1/2 w-96 h-96 bg-pink-500 dark:bg-pink-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-15 animate-blob animation-delay-4000 transition-all duration-500" />

        <div className="relative z-990 flex h-screen overflow-hidden">
          {/* ✅ DESKTOP SIDEBAR WITH HOVER AUTO-EXPAND */}
          <aside
            onMouseEnter={() => sidebarCollapsed && setIsHovering(true)}
            onMouseLeave={() => {
              if (sidebarCollapsed) {
                setIsHovering(false);
                handleMenuLeave();
              }
            }}
            className={cn(
              "hidden lg:flex fixed h-full bg-slate-900/80 dark:bg-gray-900/90 backdrop-blur-xl border-r border-slate-800 dark:border-gray-800 flex-col transition-all duration-300 z-50",
              sidebarWidth,
              sidebarCollapsed && isHovering && "!w-64 shadow-2xl"
            )}
          >
            {/* Logo */}
            <div
              className={cn(
                "border-b border-slate-800/60 flex-shrink-0 transition-all duration-150",
                isSidebarExpanded
                  ? "px-3 py-2 flex flex-col items-start"
                  : "h-[60px] flex items-center justify-center"
              )}
            >
              {/* Expanded */}
              {isSidebarExpanded ? (
                <div className="w-full">
                  {/* Logo */}
                  <div className="px-2 py-1 bg-white rounded-xl shadow-md border border-slate-200 inline-block">
                    <img
                      src="/logo/logo.png"
                      alt="Houszy"
                      className="h-10 w-auto object-contain"
                    />
                  </div>

                  {/* Text Below */}
                  <p className=" pl-1 text-[11px] font-semibold tracking-[0.28em] uppercase bg-gradient-to-r from-[#f38918] via-amber-400 to-[#f38918] bg-clip-text text-transparent drop-shadow-sm">
                    Admin Dashboard
                  </p>
                </div>
              ) : (
                /* Collapsed */
                <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-slate-200 overflow-hidden">
                  <img
                    src="/logo/logo.png"
                    alt="Houszy"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>


            {/* NAVIGATION WITH HOVER AUTO-EXPAND */}
            <nav className={cn("flex-1 space-y-0.5 overflow-y-auto custom-scrollbar py-2", isSidebarExpanded ? "px-1.5" : "px-1")}>
              {filteredNavigation.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedMenus[item.name];
                const isParentItemActive = hasChildren && isParentActive(item.children);
                const isActive = item.href ? isActiveRoute(item.href, pathname) : false;
                const Icon = item.icon;
                const gc = getGroupColor(item.name);

                if (hasChildren) {
                  return (
                    <div
                      key={item.name}
                      className="space-y-0.5"
                    >
                      <button
                        onClick={() => isSidebarExpanded && toggleMenu(item.name)}
                        className={cn(
                          "w-full flex items-center gap-2.5 py-1.5 rounded-lg transition-all duration-150 group relative",
                          isSidebarExpanded ? "px-2" : "px-0 justify-center",
                          isParentItemActive && isSidebarExpanded
                            ? `${gc.bg} text-white`
                            : "text-slate-400 hover:text-white",
                          !isParentItemActive && isSidebarExpanded && "hover:bg-slate-800/50"
                        )}
                        title={!isSidebarExpanded ? item.name : ""}
                      >
                        {/* Colored icon box */}
                        <div className={cn(
                          "rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150",
                          isSidebarExpanded ? "w-7 h-7" : "w-9 h-9",
                          isParentItemActive
                            ? `${gc.bg} ${gc.icon} shadow-sm`
                            : "bg-slate-800/80 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {isSidebarExpanded && (
                          <>
                            <span className="font-semibold text-xs flex-1 text-left whitespace-nowrap tracking-wide uppercase">
                              {item.name}
                            </span>
                            {isParentItemActive && (
                              <div className={cn("w-1.5 h-1.5 rounded-full mr-1", gc.dot)} />
                            )}
                            <ChevronDown className={cn("h-3.5 w-3.5 transition-all duration-200 text-slate-500", isExpanded && "rotate-180")} />
                          </>
                        )}
                      </button>

                      {isSidebarExpanded && (
                        <div className={cn("overflow-hidden transition-all duration-200 ease-in-out", isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                          <div className={cn("ml-3 mt-0.5 space-y-0.5 border-l-2 pl-2 pb-1", gc.border)}>
                            {item.children?.map((child) => {
                              const ChildIcon = child.icon;
                              const isChildActive = child.href ? isActiveRoute(child.href, pathname) : false;
                              return (
                                <Link
                                  key={child.name}
                                  href={child.href || '#'}
                                  className={cn(
                                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all duration-150 group",
                                    isChildActive
                                      ? "bg-gradient-to-r from-violet-500/90 to-cyan-500/90 text-white shadow-md"
                                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                  )}
                                >
                                  <ChildIcon className={cn("h-3.5 w-3.5 flex-shrink-0 transition-colors", isChildActive ? "text-white" : gc.icon)} />
                                  <span className="text-xs font-medium whitespace-nowrap">{child.name}</span>
                                  {isChildActive && <div className="ml-auto w-1 h-4 rounded-full bg-white/60" />}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // Dashboard (top-level link)
                return (
                  <Link
                    key={item.name}
                    href={item.href || '#'}
                    className={cn(
                      "flex items-center gap-2.5 py-1.5 rounded-lg transition-all duration-150 group",
                      isSidebarExpanded ? "px-2" : "px-0 justify-center",
                      isActive && isSidebarExpanded
                        ? "bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/30"
                        : "text-slate-400 hover:text-white",
                      !isActive && isSidebarExpanded && "hover:bg-slate-800/50"
                    )}
                    title={!isSidebarExpanded ? item.name : ""}
                  >
                    <div className={cn(
                      "rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                      isSidebarExpanded ? "w-7 h-7" : "w-9 h-9",
                      isActive
                        ? "bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-md"
                        : "bg-slate-800/80 text-violet-400 group-hover:bg-slate-700 group-hover:text-white"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {isSidebarExpanded && (
                      <>
                        <span className="font-semibold text-xs flex-1 whitespace-nowrap tracking-wide uppercase">{item.name}</span>
                        {isActive && <ChevronRight className="h-3.5 w-3.5 animate-pulse" />}
                      </>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Links */}
            <div className="p-2 border-t border-slate-800/60 flex-shrink-0 space-y-0.5">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // ✅ IMPORTANT
                  setSidebarOpen(false);
                  window.open("/", "_blank");
                }}
                title="open store in new tab"
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-150 group"
              >
                <div
                  className={cn(
                    "rounded-xl bg-slate-800/80 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-700 transition-colors",
                    isSidebarExpanded ? "w-7 h-7" : "w-9 h-9"
                  )}
                >
                  <Store className="h-4 w-4 text-cyan-400" />
                </div>

                {isSidebarExpanded && (
                  <span className="text-xs font-medium whitespace-nowrap">
                    View Store
                  </span>
                )}
              </a>
            </div>

            {/* User Profile - Expanded */}
            {isSidebarExpanded && (
              <div className="p-3 border-t border-slate-800 dark:border-gray-800 flex-shrink-0 transition-colors duration-150">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/50 dark:bg-gray-800/70 transition-colors duration-150">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 dark:from-violet-600 dark:to-cyan-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 transition-all duration-150 shadow-lg dark:shadow-violet-500/30">
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate transition-colors duration-150">{userName}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-500 truncate transition-colors duration-150">{userEmail}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-slate-400 dark:text-gray-500 hover:text-red-400 dark:hover:text-red-500 transition-colors duration-150"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* User Profile - Collapsed */}
            {!isSidebarExpanded && (
              <div className="p-2 border-t border-slate-800 dark:border-gray-800 flex-shrink-0 transition-colors duration-150">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 dark:from-violet-600 dark:to-cyan-600 flex items-center justify-center text-white font-bold text-sm transition-all duration-150 shadow-lg dark:shadow-violet-500/30">
                    {userInitial}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 dark:text-gray-500 hover:text-red-400 dark:hover:text-red-500 hover:bg-slate-800/50 dark:hover:bg-gray-800/60 transition-all duration-150"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </aside>


          {/* Mobile Sidebar */}
          <aside
            className={cn(
              "fixed lg:hidden h-full w-64 bg-slate-900/80 dark:bg-gray-900/90 backdrop-blur-xl border-r border-slate-800 dark:border-gray-800 flex flex-col transition-all duration-300 z-50",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {/* Mobile Sidebar Header */}
            <div className="p-3 border-b border-slate-800 dark:border-gray-800 flex-shrink-0 transition-colors duration-150">
              <div className="flex flex-col items-start">

                {/* Logo */}
                <div className="px-2 py-1 bg-white rounded-xl shadow-md border border-slate-200">
                  <img
                    src="/logo/logo.png"
                    alt="Houszy"
                    className="h-10 w-auto object-contain"
                  />
                </div>

                {/* Text */}
                <p className="mt-2 pl-1 text-[11px] font-semibold tracking-[0.28em] uppercase bg-gradient-to-r from-[#f38918] via-amber-400 to-[#f38918] bg-clip-text text-transparent drop-shadow-sm">
                  Admin Dashboard
                </p>

              </div>
            </div>

            <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto custom-scrollbar">
              {navigation.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedMenus[item.name];
                const isParentItemActive = hasChildren && isParentActive(item.children);
                const isActive = item.href ? isActiveRoute(item.href, pathname) : false;
                const Icon = item.icon;
                const gc = getGroupColor(item.name);

                if (hasChildren) {
                  return (
                    <div key={item.name} className="space-y-0.5">
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all duration-150 group",
                          isParentItemActive ? `${gc.bg} text-white` : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                        )}
                      >
                        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0", isParentItemActive ? `${gc.bg} ${gc.icon}` : "bg-slate-800/70 text-slate-400")}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-xs flex-1 text-left tracking-wide uppercase">{item.name}</span>
                        {isParentItemActive && <div className={cn("w-1.5 h-1.5 rounded-full", gc.dot)} />}
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-all duration-200 text-slate-500", isExpanded && "rotate-180")} />
                      </button>

                      <div className={cn("overflow-hidden transition-all duration-200 ease-in-out", isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                        <div className={cn("ml-3 mt-0.5 space-y-0.5 border-l-2 pl-2 pb-1", gc.border)}>
                          {item.children?.map((child) => {
                            const ChildIcon = child.icon;
                            const isChildActive = child.href ? isActiveRoute(child.href, pathname) : false;
                            return (
                              <Link
                                key={child.name}
                                href={child.href || '#'}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all duration-150 group",
                                  isChildActive ? "bg-gradient-to-r from-violet-500/90 to-cyan-500/90 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                )}
                              >
                                <ChildIcon className={cn("h-3.5 w-3.5 flex-shrink-0", isChildActive ? "text-white" : gc.icon)} />
                                <span className="text-xs font-medium">{child.name}</span>
                                {isChildActive && <div className="ml-auto w-1 h-4 rounded-full bg-white/60" />}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href || '#'}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all duration-150 group",
                      isActive ? "bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    )}
                  >
                    <div className={cn("w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0", isActive ? "bg-white/20" : "bg-slate-800/70 text-violet-400")}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-xs flex-1 tracking-wide uppercase">{item.name}</span>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 animate-pulse" />}
                  </Link>
                );
              })}
            </nav>

            <div className="p-2 border-t border-slate-800/60 flex-shrink-0 space-y-0.5">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault(); // default navigation roko
                  setSidebarOpen(false); // sidebar close karo
                  window.open("/", "_blank"); // new tab me open karo
                }}
                title="open store in new tab"
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-150 group"
              >
                <div className="w-7 h-7 rounded-md bg-slate-800/70 flex items-center justify-center flex-shrink-0">
                  <Store className="h-4 w-4 text-cyan-400" />
                </div>
                <span className="text-xs font-medium">View Store</span>
              </a>
            </div>

            <div className="p-4 border-t border-slate-800 dark:border-gray-800 flex-shrink-0 transition-colors duration-150">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/50 dark:bg-gray-800/70 transition-colors duration-150">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 dark:from-violet-600 dark:to-cyan-600 flex items-center justify-center text-white font-bold text-sm transition-all duration-150 shadow-lg dark:shadow-violet-500/30">
                  {userInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate transition-colors duration-150">{userName}</p>
                  <p className="text-xs text-slate-400 dark:text-gray-500 truncate transition-colors duration-150">{userEmail}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 dark:text-gray-500 hover:text-red-400 dark:hover:text-red-500 transition-colors duration-150"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>

          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm lg:hidden z-40 transition-all duration-150"
              onClick={() => setSidebarOpen(false)}
            />
          )}


          {/* Main Content */}
          <div
            className={cn(
              "flex-1 flex flex-col overflow-hidden transition-all duration-300",
              sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
            )}
          >
            <header className="flex-shrink-0 bg-yellow-50 dark:bg-gray-900/90 backdrop-blur-xl border-b border-[#d9730c] dark:border-gray-800 z-30 transition-colors duration-150">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between gap-4 relative">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="lg:hidden p-2 text-slate-400 dark:text-gray-500 hover:text-white hover:bg-slate-800 dark:hover:bg-gray-800/70 rounded-lg transition-all duration-150"
                    >
                      {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>

                    <button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="hidden lg:block p-2 text-slate-400 dark:text-gray-500 hover:text-white hover:bg-slate-800 dark:hover:bg-gray-800/70 rounded-lg transition-all duration-150"
                      title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                      <Menu className="h-5 w-5" />
                    </button>

                    {/* <div className="flex-1 max-w-xl">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-gray-600 transition-colors duration-150" />
                      <input
                        type="search"
                        placeholder="Search products, orders, customers..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-800/50 dark:bg-gray-800/70 border border-slate-700 dark:border-gray-700 rounded-lg text-sm text-white placeholder-slate-500 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-600 transition-all duration-150"
                      />
                    </div>
                  </div> */}
                  </div>

                  <div className="flex items-center gap-3">
                    {timeRemaining && (
                      <div
                        className={cn(
                          "hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150",
                          "bg-slate-800/50 dark:bg-gray-800/70 border border-slate-700 dark:border-gray-700",
                          timeRemaining.total < 5 * 60 * 1000 && "border-red-500/50 bg-red-500/10 animate-pulse"
                        )}
                        title="Session expires in"
                      >
                        <Clock className={cn("h-4 w-4", getTimerColor())} />
                        <span className={cn("text-xs font-mono font-semibold", getTimerColor())}>
                          {String(timeRemaining.hours).padStart(2, '0')}:
                          {String(timeRemaining.minutes).padStart(2, '0')}:
                          {String(timeRemaining.seconds).padStart(2, '0')}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        toast.success("No Notifications Right Now");;
                      }}
                      className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-150"
                    >
                      <Bell className="h-5 w-5" />
                    </button>


                    <button
                      onClick={handleThemeToggle}
                      className={cn(
                        "relative p-2 rounded-lg transition-all duration-150 group",
                        "bg-slate-800/50 dark:bg-gray-800/70 hover:bg-slate-800 dark:hover:bg-gray-800",
                        "text-slate-400 dark:text-gray-400 hover:text-white",
                        isAnimating && "scale-110 rotate-180"
                      )}
                      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                      <div className="relative w-5 h-5">
                        <Sun
                          className={cn(
                            "absolute inset-0 h-5 w-5 transition-all duration-500 text-yellow-500",
                            theme === "dark"
                              ? "rotate-90 scale-0 opacity-0"
                              : "rotate-0 scale-100 opacity-100"
                          )}
                        />
                        <Moon
                          className={cn(
                            "absolute inset-0 h-5 w-5 transition-all duration-500 text-blue-400",
                            theme === "dark"
                              ? "rotate-0 scale-100 opacity-100"
                              : "-rotate-90 scale-0 opacity-0"
                          )}
                        />
                      </div>

                      {isAnimating && (
                        <span className="absolute inset-0 rounded-lg bg-violet-500/30 dark:bg-violet-600/40 animate-ping" />
                      )}
                    </button>

                    {/* Profile Dropdown */}
                    <div className="hidden lg:block relative" ref={dropdownRef}>
                      <button
                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        className="flex items-center gap-2.5 pl-3 ml-3 border-l border-slate-800 dark:border-gray-800 transition-colors duration-150 hover:opacity-80"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 dark:from-violet-600 dark:to-cyan-600 flex items-center justify-center text-white font-bold text-sm transition-all duration-150 shadow-lg dark:shadow-violet-500/30">
                          {userInitial}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight transition-colors duration-150">{userName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 bg-green-400 dark:bg-green-500 rounded-full transition-colors duration-150"></div>
                            <p className="text-xs text-slate-400 dark:text-gray-500 transition-colors duration-150">Online</p>
                          </div>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-slate-400 transition-transform duration-200",
                            profileDropdownOpen && "rotate-180"
                          )}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {profileDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-slate-900 dark:bg-gray-900 border border-slate-800 dark:border-gray-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                          <div className="p-3 border-b border-slate-800 dark:border-gray-800">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{userName}</p>
                            <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">{userEmail}</p>
                          </div>

                          <div className="p-2">
                            <button
                              onClick={() => {
                                setProfileDropdownOpen(false);
                                setChangePwdOpen(true);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 dark:hover:bg-gray-800/70 transition-all duration-150 group"
                            >
                              <LockKeyhole className="h-4 w-4 text-violet-400 group-hover:scale-110 transition-transform" />
                              <span className="text-sm font-medium">Change Password</span>
                            </button>

                            <button
                              onClick={() => {
                                setProfileDropdownOpen(false);
                                handleLogout();
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-red-400 dark:hover:text-red-500 hover:bg-red-500/10 transition-all duration-150 group mt-1"
                            >
                              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                              <span className="text-sm font-medium">Logout</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 custom-scrollbar transition-colors duration-500">
              <div className="transition-all duration-150">
                {showPermissionsLoading ? (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                    <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 text-sm">Loading permissions...</p>
                  </div>
                ) : !isViewAllowed ? (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-slate-900/40 border border-slate-800 rounded-lg">
                    <Shield className="h-12 w-12 text-red-500 mb-4 animate-pulse" />
                    <h2 className="text-lg font-semibold text-white">Access Denied</h2>
                    <p className="text-slate-400 text-sm mt-2">
                      You do not have permission to view this page. Please contact your administrator.
                    </p>
                  </div>
                ) : (
                  children
                )}
                <ScrollToTopButton />
              </div>
            </main>
          </div>
        </div>

        <ChangePasswordModal
          open={changePwdOpen}
          onClose={() => setChangePwdOpen(false)}
        />

        <style jsx global>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
          
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { 
            background: rgba(148, 163, 184, 0.3); 
            border-radius: 3px; 
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
            background: rgba(148, 163, 184, 0.5); 
          }
          
          html.dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(107, 114, 128, 0.4);
          }
          html.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(107, 114, 128, 0.6);
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}
