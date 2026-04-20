"use client";

import { useState,useEffect } from "react";
import {
  Mail, Phone, MapPin, Clock, User, Building2,
  Send, CheckCircle, AlertCircle, ChevronRight,
  Package, RotateCcw, Truck, Pill, HelpCircle, MessageSquare
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "Order Issue",       label: "Order Issue",       icon: Package },
  { value: "Delivery",          label: "Delivery & Shipping", icon: Truck },
  { value: "Returns/Refunds",   label: "Returns & Refunds", icon: RotateCcw },
  { value: "Pharmacy",          label: "Pharmacy Advice",   icon: Pill },
  { value: "Product Query",     label: "Product Query",     icon: HelpCircle },
  { value: "General",           label: "General Enquiry",   icon: MessageSquare },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function ContactPage() {
 const [form, setForm] = useState({
  name: "",
  email: "",
  phone: "+44",
  orderNumber: "",
  category: "General",
  subject: "",
  message: "",
});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

const validateField = (name: string, value: string) => {
  let error = "";

  if (name === "name" && !value.trim()) {
    error = "Name is required";
  }

  if (name === "email") {
    if (!value.trim()) error = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      error = "Invalid email";
  }

  if (name === "subject" && !value.trim()) {
    error = "Subject is required";
  }

  if (name === "message") {
    if (value.trim().length < 10)
      error = "Minimum 10 characters required";
  }

 if (name === "phone") {
  const digits = value.replace("+44", "");

  if (!digits) {
    error = "Phone is required";
  } else if (digits.length < 10) {
    error = "Enter valid UK number";
  }
}

  setFieldErrors(prev => ({
    ...prev,
    [name]: error,
  }));
};
const validateAllFields = () => {
  const errors: Record<string, string> = {};

  if (!form.name.trim()) {
    errors.name = "Name is required";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Invalid email";
  }

  if (!form.subject.trim()) {
    errors.subject = "Subject is required";
  }

  if (form.message.trim().length < 10) {
    errors.message = "Minimum 10 characters required";
  }

const digits = form.phone.replace("+44", "");

if (!digits) {
  errors.phone = "Phone is required";
} else if (digits.length < 10) {
  errors.phone = "Enter valid UK number";
}

  setFieldErrors(errors);

  return Object.keys(errors).length === 0;
};
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
   if (loading) return; 
const isValid = validateAllFields();

if (!isValid) {
  setError("Please fill the required details above");
  return;
}


  setError("");
  setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/Contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok && json.success !== false) {
        setSuccess(true);
      } else {
        setError(json.message ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Could not send your message. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  const hasError = Object.values(fieldErrors).some(e => e);
  if (!hasError) {
    setError("");
  }
}, [fieldErrors]);
  return (
    <div className="bg-gray-50 min-h-screen">

      {/* HERO */}
<div className="bg-white border-b">
  <div className="max-w-7xl mx-auto px-4 py-2">
    <nav className="flex items-center gap-1.5 text-xs text-gray-500">
      <Link href="/" className="hover:text-gray-800 transition-colors">
        Home
      </Link>
      <ChevronRight className="h-3.5 w-3.5" />
      <span className="text-gray-800 font-medium">
        Contact us
      </span>
    </nav>
  </div>
</div>

      <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT — Contact Info + Map */}
        <div className="space-y-5">

          {/* Info cards */}
          {[
            {
              icon: Phone,
              title: "Call Us",
              lines: ["+44 121 661 6357", "+44 121 461 6835"],
              sub: "Mon–Sat 9:00 AM – 6:00 PM",
            },
            {
              icon: Mail,
              title: "Email Us",
              lines: ["customersupport@direct-care.co.uk"],
              sub: "We aim to reply within 24 hours",
            },
            {
              icon: MapPin,
              title: "Visit Us",
              lines: ["Unit 38A, Plume Street", "Aston, Birmingham, B6 7RN"],
              sub: "Open Mon–Sat",
            },
          ].map(({ icon: Icon, title, lines, sub }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-[#445D41]/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-[#445D41]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{title}</p>
                {lines.map(l => <p key={l} className="text-sm text-gray-700">{l}</p>)}
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            </div>
          ))}

          {/* Working Hours */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-[#445D41]" />
              <p className="font-semibold text-gray-900 text-sm">Working Hours</p>
            </div>
            <div className="space-y-1.5 text-sm">
              {[
                ["Monday – Friday", "9:00 AM – 6:00 PM"],
                ["Saturday",        "9:00 AM – 4:00 PM"],
                ["Sunday",          "Closed"],
                ["Bank Holidays",   "Closed"],
              ].map(([day, hrs]) => (
                <div key={day} className="flex justify-between">
                  <span className="text-gray-500">{day}</span>
                  <span className={`font-medium ${hrs === "Closed" ? "text-red-500" : "text-gray-900"}`}>{hrs}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Business Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="h-5 w-5 text-[#445D41]" />
              <p className="font-semibold text-gray-900 text-sm">Business Information</p>
            </div>
            <div className="space-y-1.5 text-sm black">
              <p><span className="font-medium text-gray-800">Owner:</span> Brijesh Kumar</p>
              <p><span className="font-medium text-gray-800">Pharmacist:</span> Surabhi Kumari (2057840)</p>
              <p><span className="font-medium text-gray-800">Complaints:</span>{" "}
                <a href="mailto:Suby@direct-care.co.uk" className="text-[#445D41] hover:underline">Suby@direct-care.co.uk</a>
              </p>
            </div>
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="bg-white px-4 py-2.5 flex items-center gap-2 border-b border-gray-100">
              <MapPin className="h-4 w-4 text-[#445D41]" />
              <span className="text-sm font-medium text-gray-700">Unit 38A, Plume Street, Aston, Birmingham</span>
            </div>
            <iframe
              title="Direct Care Warehouse Location"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-1.9012%2C52.4884%2C-1.8612%2C52.5084&layer=mapnik&marker=52.4984%2C-1.8812"
              width="100%"
              height="220"
              style={{ border: 0, display: "block" }}
              loading="lazy"
              allowFullScreen
            />
            <a
              href="https://www.openstreetmap.org/?mlat=52.4984&mlon=-1.8812#map=15/52.4984/-1.8812"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-50 text-center text-xs text-[#445D41] py-2 hover:bg-gray-100 transition-colors"
            >
              View larger map →
            </a>
          </div>
        </div>

        {/* RIGHT — Form */}
<div className="lg:col-span-2">
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">

    {success ? (
      <div className="text-center py-10 px-5">
        <CheckCircle className="h-9 w-9 text-green-500 mx-auto mb-2" />
        <h2 className="text-base font-semibold text-gray-900">Message Sent!</h2>
        <p className="text-xs text-gray-500 mt-1">
          Thank you for contacting us. We've sent a confirmation to your email and will respond within 24 hours.
        </p>

        <button
          onClick={() => {
            setSuccess(false);
            setForm({ name:"",email:"",phone:"",orderNumber:"",category:"General",subject:"",message:"" });
          }}
          className="mt-3 px-4 py-1.5 bg-[#445D41] text-white text-xs rounded-md hover:bg-[#3a5237]"
        >
          Send Message Again
        </button>
      </div>
    ) : (
      <>
        {/* HEADER */}
        <div className="px-5 py-2 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Send Us a Message</h2>
                  <p className="text-sm text-gray-500 mt-1">Fill in the form below and we'll get back to you as soon as possible.</p>

        </div>

        <div className="px-5 py-4 space-y-4">

 

          {/* CATEGORY */}
          <div>
            <label className="text-xs font-medium black mb-1 block">
              Select Issue
            </label>

            <div className="relative">
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full h-9 px-2.5 pr-7 text-xs border border-gray-300 rounded-md bg-white
                           focus:border-[#445D41] focus:ring-1 focus:ring-[#445D41]/30 outline-none appearance-none"
              >
                {CATEGORIES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-2">

            {/* GRID */}
            <div className="grid sm:grid-cols-2 gap-1">

              <div className="space-y-1">
                <label className="text-[11px] black">Full Name *</label>
                <input
                  value={form.name}
                 onChange={(e) => {
  set("name", e.target.value);
  validateField("name", e.target.value);
}}
                  required
                 className={`w-full h-9 px-2.5 text-xs border rounded-md outline-none
${fieldErrors.name ? "border-red-400" : "border-gray-300"}
focus:border-[#445D41]`}
                />
                {fieldErrors.name && (
  <p className="text-[10px] text-red-500">{fieldErrors.name}</p>
)}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] black">Email *</label>
                <input
                  type="email"
                  value={form.email}
                 onChange={(e) => {
  set("email", e.target.value);
  validateField("email", e.target.value);
}}
                  required
                  className={`w-full h-9 px-2.5 text-xs border rounded-md outline-none
${fieldErrors.email ? "border-red-400" : "border-gray-300"}
focus:border-[#445D41]`}
                />
                {fieldErrors.email && (
  <p className="text-[10px] text-red-500">{fieldErrors.email}</p>
)}
              </div>

            <div className="space-y-1">
  <label className="text-[11px] black">Phone *</label>

  <div className={`flex items-center border rounded-md overflow-hidden
    ${fieldErrors.phone ? "border-red-400" : "border-gray-300"}
    focus-within:border-[#445D41]`}>

    {/* +44 badge */}
    <div className="px-2 text-xs bg-gray-100 text-gray-700 border-r">
      +44
    </div>

   <input
  type="tel"
  required
  maxLength={10}
  inputMode="numeric"
      value={form.phone.replace("+44", "")}
      onChange={(e) => {
        const cleaned = e.target.value.replace(/\D/g, "");
        const final = "+44" + cleaned;

        set("phone", final);
        validateField("phone", final);
      }}
      className="w-full h-9 px-2 text-xs outline-none"
      placeholder="7xxxxxxxxx"
    />
  </div>

  {fieldErrors.phone && (
    <p className="text-[10px] text-red-500">
      {fieldErrors.phone}
    </p>
  )}
</div>

              <div className="space-y-1">
                <label className="text-[11px] black">Order Number</label>
                <input
                  value={form.orderNumber}
                  onChange={(e) => set("orderNumber", e.target.value)}
                  className="w-full h-9 px-2.5 text-xs border border-gray-300 rounded-md focus:border-[#445D41] outline-none"
                />
              </div>

            </div>

            {/* SUBJECT */}
            <div className="space-y-1">
              <label className="text-[11px] black">Subject *</label>
              <input
                value={form.subject}
                onChange={(e) => {
  set("subject", e.target.value);
  validateField("subject", e.target.value);
}}
                required
               className={`w-full h-9 px-2.5 text-xs border rounded-md outline-none
${fieldErrors.subject ? "border-red-400" : "border-gray-300"}
focus:border-[#445D41]`}
              />
              {fieldErrors.subject && (
  <p className="text-[10px] text-red-500">
    {fieldErrors.subject}
  </p>
)}
            </div>

            {/* MESSAGE */}
            <div className="space-y-1">
              <label className="text-[11px] black">Message *</label>
              <textarea
                value={form.message}
               onChange={(e) => {
  set("message", e.target.value);
  validateField("message", e.target.value);
}}
                rows={3}
                required
               className={`w-full px-2.5 py-2 text-xs border rounded-md resize-none outline-none
${fieldErrors.message ? "border-red-400" : "border-gray-300"}
focus:border-[#445D41]`}
              />
            {fieldErrors.message && (
  <p className="text-[10px] text-red-500">{fieldErrors.message}</p>
)}
            </div>

            {/* FOOTER */}
    <div className="mt-4 pt-4 border-t">

  {/* ERROR */}
  {error && (
    <div className="mb-2 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle size={14} />
      {error}
    </div>
  )}

  {/* BUTTON FULL WIDTH */}
  <button
    type="submit"
    disabled={loading}
    className={`w-full h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200
    ${
      loading
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-[#445D41] hover:bg-[#3a5237] text-white shadow-md hover:shadow-lg"
    }`}
  >
    {loading ? (
      <>
        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
        Sending...
      </>
    ) : (
      <>
        <Send size={16} />
        Send Message
      </>
    )}
  </button>

  {/* SMALL TRUST TEXT */}
  <p className="text-[10px] text-gray-400 text-center mt-2">
    We usually respond within 24 hours
  </p>

</div>

          </form>
        </div>
      </>
    )}
  </div>

  {/* FAQ (restore premium style) */}
  <div className="mt-5 bg-[#445D41]/5 border border-[#445D41]/20 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Looking for quick answers?</p>
              <p className="text-xs text-gray-500 mt-0.5">Check our FAQ for instant help with common questions.</p>
            </div>
            <Link
              href="/faq"
              className="shrink-0 px-4 py-2 bg-[#445D41] text-white text-sm font-semibold rounded-xl hover:bg-[#3a5237] transition-colors"
            >
              View FAQ
            </Link>
          </div>

</div>
      </div>
    </div>
  );
}
