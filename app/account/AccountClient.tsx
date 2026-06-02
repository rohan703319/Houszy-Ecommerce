"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import clsx from "clsx";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, EyeOff, ShoppingBag, User, Mail, Phone, Lock, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import AccountDashboard from "./components/AccountDashboard";
import { forgotPassword } from "@/app/lib/api/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AccountClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromCheckout = searchParams.get("from") === "checkout";
  const fromBuyNow = searchParams.get("from") === "buy-now";
  const { cart } = useCart();
  const { login, register, isAuthenticated, user, isReady } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Guest Email
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Forgot Password
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState("");

  // Register
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regError, setRegError] = useState("");
  const [regFieldErrors, setRegFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const showGuestOption = fromCheckout || fromBuyNow;

  // Shake animation
  const [shake, setShake] = useState(false);
  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    if (score <= 1) return "weak";
    if (score === 2) return "medium";
    return "strong";
  };

  const isValidPassword = (password: string) =>
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const validateEmail = () => {
    setEmailError("");
    const value = email.trim();
    if (!value) { setEmailError("Email is required."); triggerShake(); return false; }
    if (value.includes("..")) { setEmailError("Enter a valid email address."); triggerShake(); return false; }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) { setEmailError("Enter a valid email address."); triggerShake(); return false; }
    return true;
  };

  const handleGuestContinue = () => {
    if (!showGuestOption) return;
    setEmailError("");
    if (cart.some((c) => c.type === "subscription")) {
      setEmailError("Please login to purchase subscription products.");
      return;
    }
    if (!validateEmail()) return;
    localStorage.setItem("guestEmail", email);
    router.push("/checkout");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      if (fromCheckout || fromBuyNow) {
        router.replace("/checkout");
      } else {
        router.replace("/account");
      }
    } catch (error: any) {
      setLoginError(error?.message || "Invalid email or password");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccessMessage("");
    if (!forgotEmail.trim()) { setForgotError("Email is required"); return; }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(forgotEmail.trim())) { setForgotError("Enter a valid email address"); return; }
    try {
      setForgotLoading(true);
      const data = await forgotPassword(forgotEmail.trim());
      const message = data?.message || "Something went wrong";
      if (message.toLowerCase().includes("not registered")) {
        setForgotError(message);
        setForgotSuccessMessage("");
      } else {
        setForgotSuccessMessage(message);
        setForgotError("");
      }
    } catch (error: any) {
      const msg = error?.message || "Something went wrong";
      if (msg.toLowerCase().includes("not registered")) {
        setForgotError(msg);
      } else {
        setForgotError(msg);
      }
      setForgotSuccessMessage("");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegFieldErrors({});
    const errors: any = {};
    if (!regFirstName.trim()) errors.firstName = "First name is required";
    if (!regEmail.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) errors.email = "Enter a valid email";
    if (!regPassword) errors.password = "Password is required";
    else if (!isValidPassword(regPassword)) errors.password = "Password must be at least 8 characters, contain 1 uppercase & 1 special character";
    if (!regConfirmPassword) errors.confirmPassword = "Confirm password is required";
    else if (regPassword !== regConfirmPassword) errors.confirmPassword = "Passwords do not match";
    if (!regPhone.trim()) { errors.phone = "Phone number is required"; }
    else if (!/^\d{10}$/.test(regPhone)) { errors.phone = "Phone number must be 10 digits"; }
    if (Object.keys(errors).length) { setRegFieldErrors(errors); triggerShake(); return; }
    setLoading(true);
    try {
      const payload: any = {
        email: regEmail,
        password: regPassword,
        firstName: regFirstName,
        lastName: regLastName,
        phoneNumber: "+44" + regPhone,
      };
      await register(payload);
      if (fromCheckout || fromBuyNow) {
        router.replace("/checkout");
      } else {
        router.replace("/account");
      }
    } catch (error: any) {
      const msg = error?.errors?.[0] || "Registration failed";
      setRegError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "register" ? "register" : "login";
  const [tab, setTab] = useState(activeTab);

  if (!isReady) return null;
  if (isAuthenticated && user) return <AccountDashboard />;

  return (
    <div className="min-h-[80vh] bg-gray-50 flex items-start md:items-center justify-center pt-8 pb-16 md:py-12 px-4">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.45s ease; }
        .tab-active {
          background: #f39a16 !important;
          color: #000 !important;
          font-weight: 700;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(243,154,22,0.25);
        }
      `}</style>

      <div className={clsx(
        "w-full gap-6 flex flex-col lg:flex-row items-start justify-center",
        showGuestOption ? "max-w-5xl" : "max-w-md"
      )}>

        {/* ===== GUEST CHECKOUT CARD ===== */}
        {showGuestOption && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 w-full lg:w-[420px] flex-shrink-0">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#f39a16]" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-gray-900">Continue as Guest</h2>
                <p className="text-xs text-gray-500">No account needed</p>
              </div>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => { e.preventDefault(); handleGuestContinue(); }}
            >
              <div>
                <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
                  Email Address <span className="text-[#f39a16]">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
                    className={clsx(
                      "h-11 pl-10 bg-gray-50 border-gray-200 rounded-xl text-sm focus:border-[#f39a16] focus:ring-[#f39a16]/20",
                      emailError && "border-red-400 ring-2 ring-red-100",
                      shake && "animate-shake"
                    )}
                  />
                </div>
                {emailError && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">⚠ {emailError}</p>}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-black hover:bg-[#f39a16] hover:text-black text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
              >
                Continue to Checkout <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">🔒 Your information is secure & encrypted</p>
            </div>
          </div>
        )}

        {/* ===== LOGIN / REGISTER CARD ===== */}
        <div className={clsx(
          "bg-white rounded-2xl shadow-md border border-gray-100 p-8 w-full",
          !showGuestOption && "max-w-md mx-auto"
        )}>
          {/* Brand header */}
          <div className="text-center mb-6">

            <h1 className="text-[22px] font-bold text-gray-900">
              {tab === "login" ? "Sign in to your account" : "Create your account"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {tab === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setTab(tab === "login" ? "register" : "login")}
                className="text-[#f39a16] font-semibold hover:underline"
              >
                {tab === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            {/* Custom Tab Switcher */}
            <TabsList className="grid grid-cols-2 bg-gray-100 p-1 rounded-xl mb-7 h-auto gap-1">
              <TabsTrigger
                value="login"
                className={clsx(
                  "py-2.5 text-sm font-semibold rounded-lg transition-all",
                  tab === "login" ? "tab-active" : "text-gray-500 hover:text-gray-800"
                )}
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className={clsx(
                  "py-2.5 text-sm font-semibold rounded-lg transition-all",
                  tab === "register" ? "tab-active" : "text-gray-500 hover:text-gray-800"
                )}
              >
                Register
              </TabsTrigger>
            </TabsList>

            {/* ===== LOGIN TAB ===== */}
            <TabsContent value="login">
              <form className="space-y-5" onSubmit={handleLogin}>
                {/* Email */}
                <div>
                  <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="h-11 pl-10 bg-gray-50 border-gray-200 rounded-xl text-sm focus:border-[#f39a16]"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="h-11 pl-10 pr-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:border-[#f39a16]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl flex items-center gap-2">
                    ⚠ {loginError}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#f39a16] hover:bg-black text-black hover:text-white font-bold rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Please wait...</span>
                  ) : (
                    <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotOpen(true);
                      setForgotSubmitted(false);
                      setForgotEmail(loginEmail);
                      setForgotError("");
                      setForgotSuccessMessage("");
                    }}
                    className="text-[13px] text-gray-500 hover:text-[#f39a16] hover:underline transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            </TabsContent>

            {/* ===== REGISTER TAB ===== */}
            <TabsContent value="register">
              <form className="space-y-4" onSubmit={handleRegister} autoComplete="off">

                {/* Name Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
                      First Name <span className="text-[#f39a16]">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={regFirstName}
                        onChange={(e) => {
                          setRegFirstName(e.target.value);
                          if (regFieldErrors.firstName) setRegFieldErrors((p) => ({ ...p, firstName: undefined }));
                        }}
                        className={clsx("h-11 pl-10 bg-gray-50 border-gray-200 rounded-xl text-sm", regFieldErrors.firstName && "border-red-400")}
                      />
                    </div>
                    {regFieldErrors.firstName && <p className="text-xs text-red-500 mt-1">⚠ {regFieldErrors.firstName}</p>}
                  </div>

                  <div>
                    <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">Last Name</label>
                    <Input
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      className="h-11 bg-gray-50 border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
                    Email <span className="text-[#f39a16]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      name="new-email"
                      autoComplete="off"
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        if (regError) setRegError("");
                        if (regFieldErrors.email) setRegFieldErrors((p) => ({ ...p, email: undefined }));
                      }}
                      onBlur={() => {
                        if (regEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
                          setRegFieldErrors((p) => ({ ...p, email: "Enter a valid email address" }));
                        }
                      }}
                      className={clsx("h-11 pl-10 bg-gray-50 border-gray-200 rounded-xl text-sm", regFieldErrors.email && "border-red-400")}
                    />
                  </div>
                  {regFieldErrors.email && <p className="text-xs text-red-500 mt-1">⚠ {regFieldErrors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
                    Password <span className="text-[#f39a16]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showRegPassword ? "text" : "password"}
                      name="new-password"
                      autoComplete="new-password"
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        if (regFieldErrors.password) setRegFieldErrors((p) => ({ ...p, password: undefined }));
                      }}
                      className={clsx("h-11 pl-10 pr-11 bg-gray-50 border-gray-200 rounded-xl text-sm", regFieldErrors.password && "border-red-400")}
                    />
                    <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      {showRegPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {regFieldErrors.password && <p className="text-xs text-red-500 mt-1">⚠ {regFieldErrors.password}</p>}

                  {/* Password Strength Bar */}
                  {regPassword && !regFieldErrors.password && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className={clsx(
                          "h-1.5 rounded-full transition-all duration-300",
                          getPasswordStrength(regPassword) === "weak" && "w-1/3 bg-red-500",
                          getPasswordStrength(regPassword) === "medium" && "w-2/3 bg-yellow-500",
                          getPasswordStrength(regPassword) === "strong" && "w-full bg-green-500"
                        )} />
                      </div>
                      <p className="text-xs mt-1 text-gray-500">
                        Strength:{" "}
                        <span className={clsx(
                          "font-bold",
                          getPasswordStrength(regPassword) === "weak" && "text-red-600",
                          getPasswordStrength(regPassword) === "medium" && "text-yellow-600",
                          getPasswordStrength(regPassword) === "strong" && "text-green-600"
                        )}>
                          {getPasswordStrength(regPassword)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
                    Confirm Password <span className="text-[#f39a16]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirm-password"
                      autoComplete="new-password"
                      value={regConfirmPassword}
                      onChange={(e) => {
                        setRegConfirmPassword(e.target.value);
                        if (regFieldErrors.confirmPassword) setRegFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                      }}
                      className={clsx("h-11 pl-10 pr-11 bg-gray-50 border-gray-200 rounded-xl text-sm", regFieldErrors.confirmPassword && "border-red-400")}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {regFieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">⚠ {regFieldErrors.confirmPassword}</p>}
                  {regConfirmPassword && regPassword === regConfirmPassword && (
                    <p className="text-xs mt-1 text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Passwords match</p>
                  )}
                  {regConfirmPassword && regPassword !== regConfirmPassword && (
                    <p className="text-xs mt-1 text-red-500">⚠ Passwords do not match</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
                    Phone Number <span className="text-[#f39a16]">*</span>
                  </label>
                  <div className="flex">
                    <div className="flex items-center px-3 bg-gray-100 border border-gray-200 border-r-0 rounded-l-xl text-gray-700 text-sm font-semibold whitespace-nowrap">
                      <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> +44
                    </div>
                    <Input
                      value={regPhone}
                      inputMode="numeric"
                      onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/\D/g, "");
                        if (onlyDigits.length > 10) return;
                        setRegPhone(onlyDigits);
                        if (regFieldErrors.phone) setRegFieldErrors((p) => ({ ...p, phone: undefined }));
                      }}
                      className={clsx("h-11 rounded-l-none bg-gray-50 border-gray-200 rounded-r-xl text-sm", regFieldErrors.phone && "border-red-400")}
                    />
                  </div>
                  {regFieldErrors.phone && <p className="text-xs text-red-500 mt-1">⚠ {regFieldErrors.phone}</p>}
                </div>

                {regError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl flex items-center gap-2">
                    ⚠ {regError}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#f39a16] hover:bg-black text-black hover:text-white font-bold rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Please wait…</span>
                  ) : (
                    <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>

                <p className="text-center text-xs text-gray-400">
                  By registering, you agree to our <span className="text-[#f39a16] font-medium cursor-pointer hover:underline">Terms</span> &amp; <span className="text-[#f39a16] font-medium cursor-pointer hover:underline">Privacy Policy</span>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ===== FORGOT PASSWORD DIALOG ===== */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Reset your password</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Enter your email to receive a reset link</p>
          </DialogHeader>

          {forgotError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">⚠ {forgotError}</p>
            </div>
          ) : forgotSuccessMessage ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-green-700">{forgotSuccessMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4 mt-2">
              <div>
                <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      setForgotError("");
                      setForgotSuccessMessage("");
                      if (forgotError) setForgotError("");
                    }}
                    className="h-11 pl-10 bg-gray-50 border-gray-200 rounded-xl text-sm"
                    placeholder="you@example.com"
                  />
                </div>
                {forgotError && <p className="text-xs text-red-500 mt-1">⚠ {forgotError}</p>}
              </div>
              <Button
                type="submit"
                disabled={forgotLoading}
                className="w-full h-11 bg-[#f39a16] hover:bg-black text-black hover:text-white font-bold rounded-xl transition-all"
              >
                {forgotLoading ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Sending...</span>
                ) : "Send Reset Link"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
