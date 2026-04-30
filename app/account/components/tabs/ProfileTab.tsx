"use client";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  User,
  Calendar,
  Clock,
  ShoppingBag,
  PoundSterling,
  ShieldCheck,
  User2,
  Gift,
  Home,
  FileDigit,
  Pencil,
  Transgender,
  Venus,
  VenusAndMars,
  Cake,
  Building,
  Factory,
  BriefcaseBusiness,
  IdCard,
  AwardIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import Stat from "../ui/Stat";
import Detail from "../ui/Detail";
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
    firstName: "",
    lastName: "",
    phoneNumber: "",
    gender: "",
    dateOfBirth: "",
    accountType: "Personal",
    companyName: "",
    companyNumber: "",
  });
  const [isSaving, setIsSaving] = useState(false);
const [errors, setErrors] = useState<any>({});
 
 useEffect(() => {
  if (user) {
    setProfile(user);
  }
}, [user]);

  // 🔥 Prefill form
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

  setErrors({}); // ✅ reset errors also
}, [editOpen, profile]);

  // 🔥 Save
 const handleSave = async () => {
  if (isSaving) return;


  setIsSaving(true);

    const newErrors: any = {};

if (!form.firstName.trim()) {
  newErrors.firstName = "First name is required";
}
// ✅ Phone validation
if (!form.phoneNumber.trim()) {
  newErrors.phoneNumber = "Phone number is required";
} else if (!/^\d{10}$/.test(form.phoneNumber)) {
  newErrors.phoneNumber = "Phone number must be exactly 10 digits";
}
// ✅ DOB validation
if (form.dateOfBirth) {
  const selected = new Date(form.dateOfBirth);
  const today = new Date();

  // remove time part
  today.setHours(0, 0, 0, 0);

  if (selected > today) {
    newErrors.dateOfBirth = "Date of birth cannot be in the future";
  }
}
if (form.accountType === "Business") {
  if (!form.companyName.trim()) {
    newErrors.companyName = "Company name is required";
  }
  if (!form.companyNumber.trim()) {
    newErrors.companyNumber = "Company number is required";
  }
}

if (Object.keys(newErrors).length) {
  setErrors(newErrors);
  setIsSaving(false); // 🔥 IMPORTANT FIX
  return;
}
    try {
      const payload: any = {};

      if (form.firstName !== profile?.firstName)
        payload.firstName = form.firstName;

      if (form.lastName !== profile?.lastName)
        payload.lastName = form.lastName;

      if (`+44${form.phoneNumber}` !== profile?.phoneNumber)
        payload.phoneNumber = "+44" + form.phoneNumber;

      if (form.gender !== profile?.gender)
        payload.gender = form.gender;

    if (form.dateOfBirth !== profile?.dateOfBirth?.split("T")[0])
      payload.dateOfBirth = form.dateOfBirth
  ? new Date(form.dateOfBirth).toISOString()
  : null;

      if (form.accountType !== profile.accountType)
        payload.accountType = form.accountType;

      if (form.accountType === "Business") {
        payload.companyName = form.companyName;
        payload.companyNumber = form.companyNumber;
      }

      if (!Object.keys(payload).length) {
        setEditOpen(false);
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Auth/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Update failed");

      const data = await res.json();
      setProfile(data.user);

// ✅ GLOBAL USER UPDATE (HEADER FIX)
await refreshProfile();
// ✅ SIMPLE SUCCESS TOAST
toast.success(data?.message || "Profile updated successfully");
      setEditOpen(false);
 } catch (err: any) {
  toast.error(err?.message || "Update failed");
} finally {
  setIsSaving(false);
}
  };

  return (
    <div className="space-y-2">

      {/* HEADER */}
      {/* HEADER */}
<div className="relative overflow-hidden rounded-2xl border shadow-sm bg-gradient-to-br from-[#445D41] to-black p-6 text-white">

  {/* GRID OVERLAY */}
  <div
    className="absolute inset-0 opacity-[0.15]"
    style={{
      backgroundImage: `
        linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)
      `,
      backgroundSize: "42px 42px",
    }}
  />

  <div className="flex items-center gap-4 relative z-10">

    {/* ✅ INITIALS ONLY (IMAGE REMOVED) */}
    <div className="h-16 w-16 rounded-full bg-white/15 flex items-center justify-center text-xl font-bold uppercase">
      {initials}
    </div>

  <div>
  <div className="flex items-center gap-2">
    <p className="text-xl font-semibold leading-tight">
      {profile
        ? `${profile.firstName} ${profile.lastName}`
        : user.fullName || `${user.firstName} ${user.lastName}`}
    </p>

    {/* ✅ EDIT BUTTON INLINE */}
    {/* ✅ EDIT PROFILE BADGE */}
  <button
    onClick={() => setEditOpen(true)}
    className="flex items-center gap-1 rounded-md bg-white/15 px-1 py-0.5 text-xs text-white hover:bg-black transition"
  >
    <Pencil className="h-3 w-3" />
    Edit Profile
  </button>
  </div>

  <p className="text-sm text-white/80 flex items-center gap-1">
    <Mail className="h-4 w-4" />
    {user.email}
  </p>
</div>

    {/* ✅ EDIT BUTTON (UNCHANGED BUT IMPROVED ALIGNMENT) */}
    {/* <button
      onClick={() => setEditOpen(true)}
      className="ml-auto flex items-center gap-1 text-xs hover:text-white/90 transition"
    >
      <Pencil size={14} />
      Edit Profile
    </button> */}
  </div>

  {/* ✅ ACCOUNT TYPE BADGE */}
  {profile?.accountType && (
    <div className="absolute top-2 right-4 flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs text-white z-10">
      <ShieldCheck className="h-4 w-4" />
      {profile.accountType === "Business"
        ? "Business Account"
        : "Personal Account"}
    </div>
  )}
</div>

      {/* STATS */}
     <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
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
  value={`${user.loyaltyPoints?.currentBalance ?? 0} pts`}
  onClick={() => handleRedirect("loyalty")}
/>

<Stat
  icon={<Calendar />}
  label="Member Since"
  value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
/>
</div>

      {/* DETAILS */}
      <div className="bg-white rounded-xl border shadow-sm divide-y">
        <Detail label="Full name"icon={<User2 className="h-4 w-4 text-[#445D41]" />} value={
  profile
    ? `${profile.firstName} ${profile.lastName}`
    : user.fullName || `${user.firstName} ${user.lastName}`
} />
        <Detail label="Email"icon={<Mail className="h-4 w-4 text-[#445D41]" />} value={user.email} />
        <Detail label="Phone"icon={<Phone className="h-4 w-4 text-[#445D41]" />} value={profile?.phoneNumber || user.phoneNumber || "-"} />
       

        {profile?.accountType === "Business" && (
          <>
            <Detail label="Company Name"icon={<BriefcaseBusiness className="h-4 w-4 text-[#445D41]" />}
 value={profile?.companyName || "-"} />
            <Detail label="Company Number"icon={<IdCard className="h-4 w-4 text-[#445D41]" />}
 value={profile?.companyNumber || "-"} />
          </>
        )}

       <Detail label="Gender"icon={<Venus className="h-4 w-4 text-[#445D41]" />}
 value={profile?.gender || "-"} />
        <Detail
          label="Date of Birth"
          icon={<Cake className="h-4 w-4 text-[#445D41]" />}

          value={
  profile?.dateOfBirth
    ? new Date(profile.dateOfBirth).toLocaleDateString()
    : "-"
}
        />
      </div>

      {/* MODAL */}
 <Dialog open={editOpen} onOpenChange={setEditOpen}>
 <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl 
[&>button]:text-white 
[&>button]:text-2xl 
[&>button]:right-4 
[&>button]:top-3 
[&>button]:bg-white/20 
[&>button]:rounded-full 
[&>button]:p-1.5">

    {/* HEADER */}
    <DialogHeader className="bg-[#445D41] text-white px-5 py-3 space-y-0">
      <DialogTitle className="text-lg font-semibold">
        Edit Profile
      </DialogTitle>
      <p className="text-xs text-white/80">
        Update your personal information
      </p>
    </DialogHeader>

    {/* BODY */}
    <div className="px-5 pt-4 pb-5 text-sm space-y-4">

      {/* NAME */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">First Name *</label>
          <Input
            className="h-10"
            value={form.firstName}
            onChange={(e) => {
              setForm({ ...form, firstName: e.target.value });
              if (errors.firstName) {
                setErrors((prev: any) => ({ ...prev, firstName: undefined }));
              }
            }}
          />
          {errors.firstName && (
            <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Last Name</label>
          <Input
            className="h-10"
            value={form.lastName}
            onChange={(e) =>
              setForm({ ...form, lastName: e.target.value })
            }
          />
        </div>
      </div>

      {/* PHONE + DOB */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Phone Number *
          </label>

          <div className="flex">
            <span className="px-2 flex items-center bg-gray-100 border border-r-0 rounded-l-lg text-xs">
              +44
            </span>
            <Input
              className="h-10 rounded-l-none"
              value={form.phoneNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                setForm({ ...form, phoneNumber: value });

                if (errors.phoneNumber) {
                  setErrors((prev: any) => ({
                    ...prev,
                    phoneNumber: undefined,
                  }));
                }
              }}
            />
          </div>

          {errors.phoneNumber && (
            <p className="text-xs text-red-500 mt-1">
              {errors.phoneNumber}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Date of Birth
          </label>
          <Input
            type="date"
            className="h-10"
            value={form.dateOfBirth}
            onChange={(e) =>
              setForm({ ...form, dateOfBirth: e.target.value })
            }
          />
          {errors.dateOfBirth && (
            <p className="text-xs text-red-500 mt-1">
              {errors.dateOfBirth}
            </p>
          )}
        </div>
      </div>

      {/* GENDER + ACCOUNT TYPE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Gender</label>
          <select
            value={form.gender}
            onChange={(e) => {
              setForm({ ...form, gender: e.target.value });
            }}
            className="w-full h-10 border rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#445D41]"
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Account Type
          </label>
          <select
            value={form.accountType}
            onChange={(e) => {
              const value = e.target.value as any;

              setForm({
                ...form,
                accountType: value,
                ...(value === "Personal" && {
                  companyName: "",
                  companyNumber: "",
                }),
              });
            }}
            className="w-full h-10 border rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#445D41]"
          >
            <option value="Personal">Personal</option>
            <option value="Business">Business</option>
          </select>
        </div>
      </div>

      {/* BUSINESS */}
      {form.accountType === "Business" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Company Name
            </label>
            <Input
              className="h-10"
              value={form.companyName}
              onChange={(e) => {
                setForm({ ...form, companyName: e.target.value });
              }}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Company Number
            </label>
            <Input
              className="h-10"
              value={form.companyNumber}
              onChange={(e) => {
                setForm({ ...form, companyNumber: e.target.value });
              }}
            />
          </div>
        </div>
      )}

      {/* SAVE BUTTON */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`w-full h-10 rounded-lg font-semibold transition ${
          isSaving
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gray-900 text-white hover:bg-[#374a36]"
        }`}
      >
        {isSaving ? "Updating..." : "Save Changes"}
      </button>
    </div>
  </DialogContent>
</Dialog>

    </div>
  );
}