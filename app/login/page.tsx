"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, Sparkles, TrendingUp, Users2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { authService } from "@/lib/services/auth";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: result } = await authService.login(formData);

      if (!result?.accessToken && !result?.token) {
        setError("Token not received from server");
        return;
      }

      const token = result.accessToken ?? result.token!;

      // ✅ COMPLETE LOCALSTORAGE SYNC (for AuthContext compatibility)
      localStorage.setItem("accessToken", token);
      localStorage.setItem("authToken", token);
      localStorage.setItem("refreshToken", result.refreshToken || "");
      
      if (result.user) {
        localStorage.setItem("user", JSON.stringify(result.user));
        localStorage.setItem("userData", JSON.stringify(result.user)); // Backward compatibility
        localStorage.setItem("userId", result.user.id);
        localStorage.setItem("userEmail", result.user.email);
        localStorage.setItem("userName", `${result.user.firstName || ''} ${result.user.lastName || ''}`);
        localStorage.setItem("userFirstName", result.user.firstName || "");
        localStorage.setItem("userLastName", result.user.lastName || "");
      } else {
        localStorage.setItem("userEmail", formData.email);
      }

      // Cookie for SSR (optional)
      document.cookie = `authToken=${token}; path=/; max-age=86400`;

      console.log("✅ Login successful, data stored");

      // Redirect to admin
      setTimeout(() => {
        window.location.href = "/admin";
      }, 200);

    } catch (err: any) {
      console.error("❌ Login error:", err);
      setError(err.response?.data?.message || "Invalid email or password");
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Gradient Orbs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
          <div>
     

<div className="flex items-center gap-4 mb-14">
  <div className="relative rounded-2xl border border-slate-700/70 bg-slate-900/70 backdrop-blur-xl px-5 py-4 shadow-2xl">

    <div className="flex items-center gap-5">
      
      {/* Logo */}
      <div className="bg-white rounded-xl px-3 py-2 shadow-md">
        <img
          src="/logo/logo.png"
          alt="Direct Care"
          className="h-12 w-auto object-contain"
        />
      </div>


      <div className="w-px h-12 bg-slate-700" />
      {/* Brand */}
      <div>
          <p className="text-xs tracking-[0.35em] uppercase text-slate-400 mt-2">
          Admin Dashboard
        </p>
      </div>

    </div>
  </div>
</div>

            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Welcome to the<br />
              <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
                Future of Commerce
              </span>
            </h1>

            <p className="text-slate-400 text-lg mb-12 max-w-md">
              Manage your entire e-commerce empire from one powerful dashboard. Analytics, inventory, and customer insights at your fingertips.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-lg">
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-5">
                <TrendingUp className="w-8 h-8 text-violet-400 mb-3" />
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-sm text-slate-400">Uptime</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-5">
                <Users2 className="w-8 h-8 text-cyan-400 mb-3" />
                <div className="text-2xl font-bold text-white">10k+</div>
                <div className="text-sm text-slate-400">Merchants</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-5">
                <BarChart3 className="w-8 h-8 text-pink-400 mb-3" />
                <div className="text-2xl font-bold text-white">$2M+</div>
                <div className="text-sm text-slate-400">Daily Sales</div>
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-500">
            © 2026 EcomPanel. All rights reserved.
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-10 text-center">
              <div className="inline-flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">EcomPanel</span>
              </div>
            </div>

            {/* Login Card */}
            <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
                <p className="text-slate-400">Enter your credentials to access the dashboard</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Email</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="admin@ecompanel.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900" />
                    <span className="text-sm text-slate-400">Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500 text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-violet-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 text-center">
                <Link href="/" className="text-sm text-slate-400 hover:text-slate-300 transition-colors inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Store
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
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
