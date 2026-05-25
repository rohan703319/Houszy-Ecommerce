"use client";

import { useRouter } from "next/navigation";
import {
  Mail, Phone, User, Calendar, ShoppingBag, PoundSterling,
  ShieldCheck, User2, Cake, BriefcaseBusiness, IdCard, AwardIcon, Pencil, CheckCircle2,
  MapPin, Clock,
  PhoneCall
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Stat from "../ui/Stat";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/toast/CustomToast";

export default function ProfileTab({ user, initials }: any) {
  const { accessToken, refreshProfile } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState<any>(user);
  const [editOpen, setEditOpen] = useState(false);

  const handleRedirect = (tab: string) => {
    router.push(`/account?tab=${tab}`);
  };

  const [form, setForm] = useState({
    firstName: "", lastName: "", phoneNumber: "", gender: "",
    dateOfBirth: "", accountType: "Personal", companyName: "", companyNumber: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (user) setProfile(user);
  }, [user]);

  useEffect(() => {
    if (!editOpen || !profile) return;
    setForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      phoneNumber: profile.phoneNumber?.replace("+44", "") || "",
      gender: profile.gender || "",
      dateOfBirth: profile.dateOfBirth?.split("T")[0] || "",
      accountType: profile.accountType || "Personal",
      companyName: profile.companyName || "",
      companyNumber: profile.companyNumber || "",
    });
    setErrors({});
  }, [editOpen, profile]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const newErrors: any = {};

    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
    else if (!/^\d{10}$/.test(form.phoneNumber)) newErrors.phoneNumber = "Must be 10 digits";

    if (form.dateOfBirth) {
      const selected = new Date(form.dateOfBirth);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected > today) newErrors.dateOfBirth = "Cannot be in future";
    }

    if (form.accountType === "Business") {
      if (!form.companyName.trim()) newErrors.companyName = "Required";
      if (!form.companyNumber.trim()) newErrors.companyNumber = "Required";
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setIsSaving(false);
      return;
    }

    try {
      const payload: any = {};
      if (form.firstName !== profile?.firstName) payload.firstName = form.firstName;
      if (form.lastName !== profile?.lastName) payload.lastName = form.lastName;
      if (`+44${form.phoneNumber}` !== profile?.phoneNumber) payload.phoneNumber = "+44" + form.phoneNumber;
      if (form.gender !== profile?.gender) payload.gender = form.gender;
      if (form.dateOfBirth !== profile?.dateOfBirth?.split("T")[0])
        payload.dateOfBirth = form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : null;
      if (form.accountType !== profile.accountType) payload.accountType = form.accountType;
      if (form.accountType === "Business") {
        payload.companyName = form.companyName;
        payload.companyNumber = form.companyNumber;
      }

      if (!Object.keys(payload).length) {
        setEditOpen(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update failed");
      const data = await res.json();
      setProfile(data.user);
      await refreshProfile();
      toast.success(data?.message || "Profile updated");
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    const f = profile?.firstName || user?.firstName || "";
    const l = profile?.lastName || user?.lastName || "";
    return `${f[0] || ""}${l[0] || ""}`.toUpperCase();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-4xl mx-auto -mt-6">

      {/* PREMIUM HEADER BANNER */}
      <div className="relative bg-gradient-to-br from-gray-900 to-black rounded p-4 pb-8 md:p-5 md:pb-10 shadow-xl overflow-hidden text-white">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f38918] rounded mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#f38918] rounded mix-blend-multiply filter blur-3xl opacity-10 translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-row items-center md:items-start justify-between gap-2 md:gap-4">
          <div className="flex flex-row items-center md:items-start gap-3 md:gap-4 text-left min-w-0">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded bg-white text-gray-900 flex items-center justify-center text-xl md:text-2xl font-black shadow-lg border-2 border-white/10 shrink-0">
              {getInitials()}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-3xl font-black tracking-tight mb-0.5 md:mb-1 flex flex-nowrap items-center gap-1.5 md:gap-2">
                <span className="truncate">{profile?.firstName} {profile?.lastName}</span>
                {profile?.accountType && (
                  <span className="px-1.5 py-0.5 md:px-2 md:py-0.5 bg-[#f38918]/20 border border-[#f38918]/30 text-[#f38918] text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded flex items-center gap-1 shrink-0 whitespace-nowrap">
                    <ShieldCheck size={10} className="md:hidden" strokeWidth={3} />
                    <ShieldCheck size={14} className="hidden md:block" strokeWidth={3} />
                    {profile.accountType}
                  </span>
                )}
              </h1>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-start gap-x-4 gap-y-0.5 text-[10px] md:text-[11px] font-medium text-gray-400 min-w-0 mt-1 md:mt-0">
                <span className="flex items-center gap-1.5 truncate max-w-full"><Mail size={12} className="text-gray-500 shrink-0" /> <span className="truncate">{user.email}</span></span>
                {profile?.phoneNumber && (
                  <span className="flex items-center gap-1.5 truncate max-w-full"><Phone size={12} className="text-gray-500 shrink-0" /> <span className="truncate">{profile.phoneNumber}</span></span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 p-2 md:px-4 md:py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-md shrink-0"
          >
            <Pencil size={14} className="md:w-3 md:h-3" /> <span className="hidden md:inline">Edit</span>
          </button>
        </div>
      </div>

      {/* OVERLAPPING STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-3 sm:px-6 -mt-10 sm:-mt-12 relative z-20">
        <Stat
          icon={<ShoppingBag />}
          label="Total Orders"
          value={user.totalOrders ?? 0}
          onClick={() => handleRedirect("orders")}
        />
        <Stat
          icon={<PoundSterling />}
          label="Total Spent"
          value={`£${user.totalSpent?.toFixed(2) ?? "0.00"}`}
        />
        <Stat
          icon={<AwardIcon />}
          label="Loyalty Points"
          value={`${user.loyaltyPoints?.currentBalance ?? 0}`}
          onClick={() => handleRedirect("loyalty")}
        />
        <Stat
          icon={<Calendar />}
          label="Member Since"
          value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
        />
      </div>

      {/* PROFILE DETAILS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

        {/* Personal Details Card */}
        <div className="bg-white rounded p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <div className="p-2 bg-gray-50 rounded text-gray-900"><User2 size={16} /></div>
            <h3 className="text-base font-black text-gray-900 tracking-tight">Personal Details</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 flex justify-center text-gray-300"><User size={16} /></div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Name</p>
                <p className="text-xs font-bold text-gray-900 leading-tight">{profile?.firstName} {profile?.lastName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 flex justify-center text-gray-300"><User size={16} /></div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Gender</p>
                <p className="text-xs font-bold text-gray-900 leading-tight">{profile?.gender || "Not specified"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 flex justify-center text-gray-300"><Cake size={16} /></div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Date of Birth</p>
                <p className="text-xs font-bold text-gray-900 leading-tight">{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 flex justify-center text-gray-300"><PhoneCall size={16} /></div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Phone</p>
                <p className="text-xs font-bold text-gray-900 leading-tight">{profile?.phoneNumber || "Not provided"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Details Card */}
        <div className="bg-white rounded p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <div className="p-2 bg-gray-50 rounded text-gray-900"><BriefcaseBusiness size={16} /></div>
            <h3 className="text-base font-black text-gray-900 tracking-tight">Account Settings</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 flex justify-center text-gray-300"><ShieldCheck size={16} /></div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Account Type</p>
                <p className="text-xs font-bold text-gray-900 leading-tight">{profile?.accountType || "Personal"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 flex justify-center text-gray-300">
                <Mail size={16} />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Email Address
                </p>
                <p className="text-xs font-bold text-gray-900 leading-tight">
                  {profile?.email || "—"}
                </p>
              </div>
            </div>
            {profile?.accountType === "Business" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-6 flex justify-center text-gray-300"><BriefcaseBusiness size={16} /></div>
                  <div className="flex flex-col">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Company Name</p>
                    <p className="text-xs font-bold text-gray-900 leading-tight">{profile?.companyName || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 flex justify-center text-gray-300"><IdCard size={16} /></div>
                  <div className="flex flex-col">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Registration No.</p>
                    <p className="text-xs font-bold text-gray-900 leading-tight">{profile?.companyNumber || "—"}</p>
                  </div>
                </div>
              </>
            )}


          </div>
        </div>

      </div>

      {/* EDIT MODAL */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded">
          <DialogHeader className="bg-gradient-to-br from-gray-900 to-black px-6 py-5 text-left text-white border-b border-gray-800">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <div className="p-2 bg-white/10 rounded backdrop-blur-md"><User2 size={18} /></div>
              Edit Profile
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5 text-sm space-y-4 bg-white">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">First Name *</label>
                <Input
                  className="h-10 rounded bg-gray-50 border-gray-200 focus-visible:ring-[#f38918] font-medium"
                  value={form.firstName}
                  onChange={(e) => {
                    setForm({ ...form, firstName: e.target.value });
                    if (errors.firstName) setErrors((prev: any) => ({ ...prev, firstName: undefined }));
                  }}
                />
                {errors.firstName && <p className="text-[11px] text-red-500 mt-1.5 font-bold">{errors.firstName}</p>}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Last Name</label>
                <Input
                  className="h-10 rounded bg-gray-50 border-gray-200 focus-visible:ring-[#f38918] font-medium"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Phone *</label>
                <div className="flex rounded overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-[#f38918] bg-gray-50">
                  <span className="px-3 flex items-center bg-gray-100/50 border-r border-gray-200 text-[10px] font-bold text-gray-600">+44</span>
                  <Input
                    className="h-10 rounded border-0 focus-visible:ring-0 bg-transparent font-medium px-3 text-xs"
                    value={form.phoneNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setForm({ ...form, phoneNumber: val });
                      if (errors.phoneNumber) setErrors((prev: any) => ({ ...prev, phoneNumber: undefined }));
                    }}
                  />
                </div>
                {errors.phoneNumber && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.phoneNumber}</p>}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">DOB</label>
                <Input
                  type="date"
                  className="h-10 rounded bg-gray-50 border-gray-200 focus-visible:ring-[#f38918] font-medium text-xs"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full h-10 border border-gray-200 rounded px-3 bg-gray-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#f38918]"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Account Type</label>
                <select
                  value={form.accountType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({
                      ...form, accountType: val,
                      ...(val === "Personal" && { companyName: "", companyNumber: "" }),
                    });
                  }}
                  className="w-full h-10 border border-gray-200 rounded px-3 bg-gray-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#f38918]"
                >
                  <option value="Personal">Personal</option>
                  <option value="Business">Business</option>
                </select>
              </div>
            </div>

            {form.accountType === "Business" && (
              <div className="grid grid-cols-2 gap-3 p-4 rounded bg-orange-50/50 border border-orange-100">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-orange-600/80 mb-1 block">Company Name</label>
                  <Input
                    className="h-10 rounded bg-white border-orange-200/50 focus-visible:ring-[#f38918] text-xs"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-orange-600/80 mb-1 block">Reg Number</label>
                  <Input
                    className="h-10 rounded bg-white border-orange-200/50 focus-visible:ring-[#f38918] text-xs"
                    value={form.companyNumber}
                    onChange={(e) => setForm({ ...form, companyNumber: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setEditOpen(false)}
                className="w-full h-10 rounded font-bold text-[11px] uppercase tracking-widest text-gray-600 bg-white border-2 border-gray-100 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full h-10 rounded font-bold text-[11px] uppercase tracking-widest text-white bg-black hover:bg-gray-900 transition-colors disabled:bg-gray-300 shadow-sm"
              >
                {isSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}