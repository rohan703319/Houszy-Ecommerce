// app/admin/not-found.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  Search,
  ArrowLeft,
  AlertTriangle,
  BarChart3,
  Package,
  Users,
  Settings,
  FileText,
  ShoppingCart,
  Layers,
  TrendingUp,
  Clock,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

// ✅ Analytics & Error Logging Interface
interface ErrorLog {
  path: string;
  timestamp: string;
  referrer: string;
  userAgent: string;
  sessionId: string;
}

export default function AdminNotFound() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);

    // ✅ Log 404 error for analytics (Production-ready)
    if (typeof window !== 'undefined') {
      const errorLog: ErrorLog = {
        path: pathname || 'unknown',
        timestamp: new Date().toISOString(),
        referrer: document.referrer || 'direct',
        userAgent: navigator.userAgent,
        sessionId: localStorage.getItem('sessionId') || 'anonymous'
      };

      // ✅ Log to console (Replace with your analytics service)
      console.group('🚨 Admin 404 Error Log');
      console.error('Path:', errorLog.path);
      console.error('Time:', new Date(errorLog.timestamp).toLocaleString());
      console.error('Referrer:', errorLog.referrer);
      console.groupEnd();

      // ✅ Send to analytics service (Uncomment for production)
      /*
      fetch('/api/analytics/404', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog)
      }).catch(err => console.error('Analytics error:', err));
      */

      // ✅ Store locally for debugging (Optional)
      const errors = JSON.parse(localStorage.getItem('404_errors') || '[]');
      errors.push(errorLog);
      if (errors.length > 50) errors.shift(); // Keep last 50 errors
      localStorage.setItem('404_errors', JSON.stringify(errors));
    }
  }, [pathname]);

  // ✅ Quick Navigation Links (Customize based on your admin structure)
  const quickLinks = [
    {
      icon: BarChart3,
      label: 'Dashboard',
      href: '/admin',
      description: 'Analytics & Overview',
      color: 'violet',
      bgColor: 'bg-violet-500/10',
      textColor: 'text-violet-400',
      borderColor: 'border-violet-500/30',
      hoverBg: 'hover:bg-violet-500/20',
      hoverBorder: 'hover:border-violet-500'
    },
    {
      icon: Package,
      label: 'Products',
      href: '/admin/products',
      description: 'Manage Inventory',
      color: 'cyan',
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
      hoverBg: 'hover:bg-cyan-500/20',
      hoverBorder: 'hover:border-cyan-500'
    },
    {
      icon: ShoppingCart,
      label: 'Orders',
      href: '/admin/orders',
      description: 'Track Order History',
      color: 'orange',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-400',
      borderColor: 'border-orange-500/30',
      hoverBg: 'hover:bg-orange-500/20',
      hoverBorder: 'hover:border-orange-500'
    },
    {
      icon: Users,
      label: 'Customers',
      href: '/admin/customers',
      description: 'User Management',
      color: 'pink',
      bgColor: 'bg-pink-500/10',
      textColor: 'text-pink-400',
      borderColor: 'border-pink-500/30',
      hoverBg: 'hover:bg-pink-500/20',
      hoverBorder: 'hover:border-pink-500'
    },
    {
      icon: Layers,
      label: 'Categories',
      href: '/admin/categories',
      description: 'Organize Products',
      color: 'orange',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-400',
      borderColor: 'border-orange-500/30',
      hoverBg: 'hover:bg-orange-500/20',
      hoverBorder: 'hover:border-orange-500'
    },
    {
      icon: FileText,
      label: 'Reports',
      href: '/admin/reports',
      description: 'Analytics & Insights',
      color: 'blue',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      hoverBg: 'hover:bg-blue-500/20',
      hoverBorder: 'hover:border-blue-500'
    },
    {
      icon: TrendingUp,
      label: 'Marketing',
      href: '/admin/marketing',
      description: 'Campaigns & Promotions',
      color: 'purple',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      hoverBg: 'hover:bg-purple-500/20',
      hoverBorder: 'hover:border-purple-500'
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/admin/settings',
      description: 'System Configuration',
      color: 'slate',
      bgColor: 'bg-slate-500/10',
      textColor: 'text-slate-400',
      borderColor: 'border-slate-500/30',
      hoverBg: 'hover:bg-slate-500/20',
      hoverBorder: 'hover:border-slate-500'
    }
  ];

  // ✅ Recent Actions (Customize based on your needs)
  const recentActions = [
    { label: 'View Latest Orders', href: '/admin/orders?sort=latest', icon: ShoppingCart },
    { label: 'Check Inventory', href: '/admin/products?filter=low-stock', icon: Package },
    { label: 'System Logs', href: '/admin/logs', icon: FileText },
    { label: 'Support Tickets', href: '/admin/support', icon: AlertTriangle }
  ];

  // ✅ Handle Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // ✅ Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* ✅ Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* ✅ Gradient Orbs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />

      {/* ✅ Main Content */}
      <div className="relative z-10 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">

          {/* ✅ Header Section */}
          <div className="text-center mb-12 pt-8">
            {/* 404 Hero Animation */}
            <div className="mb-8 relative">
              {/* Background Number */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5">
                <div className="text-[400px] font-black text-white leading-none select-none">
                  404
                </div>
              </div>

              {/* Main 404 Display */}
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500 blur-3xl opacity-30 animate-pulse" />
                  <h1 className="text-[180px] sm:text-[220px] lg:text-[280px] font-black bg-gradient-to-br from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent leading-none tracking-tighter relative">
                    404
                  </h1>
                </div>
              </div>
            </div>

            {/* Error Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/30 rounded-full mb-6 backdrop-blur-sm">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-sm font-semibold text-red-400">Admin Page Not Found</span>
            </div>

            {/* Error Message */}
            <div className="space-y-4 mb-8">
              <h2 className="text-4xl sm:text-5xl font-bold text-white">
                Oops! This page doesn't exist
              </h2>

              <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">
                The admin page you're looking for might have been moved, deleted, or never existed.
              </p>

              {/* Path Display */}
              {pathname && (
                <div className="inline-block px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                  <p className="text-sm font-mono text-slate-400">
                    Path: <span className="text-violet-400">{pathname}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative flex items-center">
                  <Search className="absolute left-5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, orders, customers..."
                    className="w-full pl-14 pr-5 py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-5 py-2 bg-gradient-to-r from-violet-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/50 transition-all font-semibold"
                  >
                    Search
                  </button>
                </div>
              </div>
            </form>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={() => router.back()}
                className="group flex items-center gap-2 px-8 py-4 bg-slate-800/50 border border-slate-700 text-white rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all duration-300 font-semibold"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Go Back
              </button>

              <Link
                href="/admin"
                className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500 text-white rounded-xl hover:shadow-xl hover:shadow-violet-500/50 transition-all duration-300 font-semibold"
              >
                <Home className="w-5 h-5" />
                Dashboard
                <TrendingUp className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={() => window.location.reload()}
                className="group flex items-center gap-2 px-8 py-4 bg-slate-800/50 border border-slate-700 text-white rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all duration-300 font-semibold"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Reload
              </button>
            </div>
          </div>

          {/* ✅ Quick Navigation Grid */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 mb-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Quick Navigation</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group relative flex flex-col p-6 ${link.bgColor} border ${link.borderColor} rounded-2xl ${link.hoverBg} ${link.hoverBorder} transition-all duration-300 hover:shadow-lg hover:scale-105`}
                  >
                    {/* Icon */}
                    <div className={`w-14 h-14 ${link.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-7 h-7 ${link.textColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h4 className="text-white font-bold text-lg mb-1 group-hover:text-white transition-colors">
                        {link.label}
                      </h4>
                      <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                        {link.description}
                      </p>
                    </div>

                    {/* Arrow Icon */}
                    <div className={`absolute top-4 right-4 w-6 h-6 ${link.textColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all`}>
                      <ExternalLink className="w-5 h-5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ✅ Recent Actions */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">Quick Actions</h3>
              </div>

              <div className="space-y-3">
                {recentActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={index}
                      href={action.href}
                      className="group flex items-center gap-4 p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:bg-slate-800/50 hover:border-violet-500/50 transition-all"
                    >
                      <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                        <Icon className="w-5 h-5 text-violet-400" />
                      </div>
                      <span className="flex-1 text-slate-300 group-hover:text-white transition-colors font-medium">
                        {action.label}
                      </span>
                      <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-gradient-to-br from-violet-500/10 to-cyan-500/10 backdrop-blur-xl border border-violet-500/20 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">Need Help?</h3>
              </div>

              <div className="space-y-4">
                <p className="text-slate-300">
                  If you believe this is an error or need assistance:
                </p>

                <div className="space-y-3">
                  <Link
                    href="/admin/support"
                    className="flex items-center gap-2 px-5 py-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 hover:border-violet-500 transition-all text-white font-medium"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    Contact Support
                  </Link>

                  <Link
                    href="/admin/docs"
                    className="flex items-center gap-2 px-5 py-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 hover:border-cyan-500 transition-all text-white font-medium"
                  >
                    <FileText className="w-5 h-5" />
                    View Documentation
                  </Link>

                  <Link
                    href="/admin/logs"
                    className="flex items-center gap-2 px-5 py-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 hover:border-pink-500 transition-all text-white font-medium"
                  >
                    <FileText className="w-5 h-5" />
                    System Logs
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              Error ID: <span className="font-mono text-slate-400">{Date.now()}</span>
              {' '} • {' '}
              <span className="font-mono text-slate-400">{new Date().toLocaleString()}</span>
            </p>
          </div>

        </div>
      </div>

      {/* ✅ Animation Styles */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
