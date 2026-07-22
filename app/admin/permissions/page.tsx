"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Shield, 
  LockKeyhole, 
  User, 
  Users, 
  Search, 
  Eye, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Check,
  AlertCircle,
  FileText
} from "lucide-react";
import { useToast } from "@/app/admin/_components/CustomToast";
import { permissionsService, MatrixItemDto, UserMatrixItemDto, Flags, PageDto } from "@/lib/services/permissions";
import { staffService, StaffRole, StaffItem } from "@/lib/services/staff";

export default function PermissionsDashboard() {
  const toast = useToast();
  
  // View mode switcher: 'role' or 'user' or 'pages'
  const [viewMode, setViewMode] = useState<"role" | "user" | "pages">("role");
  
  // Alert Banner State
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Common Loading State
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------
  // BY ROLE STATE
  // -------------------------------------------------------------
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [roleMatrix, setRoleMatrix] = useState<MatrixItemDto[]>([]);
  const [roleSaving, setRoleSaving] = useState(false);
  const [modifiedRoleMatrix, setModifiedRoleMatrix] = useState<Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>>({});

  // -------------------------------------------------------------
  // BY USER STATE
  // -------------------------------------------------------------
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null);
  const [userMatrix, setUserMatrix] = useState<UserMatrixItemDto[]>([]);
  const [userSaving, setUserSaving] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [localUserOverrides, setLocalUserOverrides] = useState<Record<string, { view: boolean | null; create: boolean | null; edit: boolean | null; delete: boolean | null }>>({});
  const [rolesBaseline, setRolesBaseline] = useState<Record<string, Flags>>({});

  // -------------------------------------------------------------
  // PAGES STATE
  // -------------------------------------------------------------
  const [pagesList, setPagesList] = useState<PageDto[]>([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [pagesSearchQuery, setPagesSearchQuery] = useState("");

  // Auto-clear success banner after 5 seconds
  useEffect(() => {
    if (successBanner) {
      const timer = setTimeout(() => {
        setSuccessBanner(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successBanner]);

  // Load roles & initial baseline data on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const rolesRes = await staffService.getRoles();
        if (rolesRes.data?.success && Array.isArray(rolesRes.data.data)) {
          const fetchedRoles = rolesRes.data.data;
          setRoles(fetchedRoles);
          
          // Select Admin role by default (or SuperAdmin if Admin doesn't exist)
          const defaultRole = fetchedRoles.find(r => r.name === "Admin") || fetchedRoles[0];
          if (defaultRole) {
            setSelectedRole(defaultRole.name);
          }
        }
      } catch (err) {
        console.error("Failed to load roles list:", err);
        toast.error("Failed to load staff roles");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [toast]);

  // Load staff list when user switches to 'user' mode
  useEffect(() => {
    if (viewMode === "user" && staffList.length === 0) {
      const fetchStaff = async () => {
        try {
          const res = await staffService.getAll({ pageSize: 1000 });
          if (res.data?.success && res.data.data?.items) {
            const list = res.data.data.items;
            setStaffList(list);
            if (list.length > 0) {
              setSelectedStaff(list[0]);
            }
          }
        } catch (err) {
          console.error("Failed to load staff list:", err);
          toast.error("Failed to load staff members");
        }
      };
      fetchStaff();
    }
  }, [viewMode, staffList.length, toast]);

  // Load pages list when pages view mode is selected
  useEffect(() => {
    if (viewMode === "pages" && pagesList.length === 0) {
      const fetchPages = async () => {
        setPagesLoading(true);
        try {
          const res = await permissionsService.getPages();
          if (res.data?.success && Array.isArray(res.data.data)) {
            setPagesList(res.data.data);
          }
        } catch (err) {
          console.error("Failed to load pages list:", err);
          toast.error("Failed to load pages");
        } finally {
          setPagesLoading(false);
        }
      };
      fetchPages();
    }
  }, [viewMode, pagesList.length, toast]);

  // Fetch Matrix for the selected Role
  useEffect(() => {
    if (viewMode === "role" && selectedRole) {
      const fetchRoleMatrixData = async () => {
        setLoading(true);
        try {
          const res = await permissionsService.getRoleMatrix(selectedRole);
          if (res.data?.success && Array.isArray(res.data.data)) {
            const matrixItems = res.data.data;
            setRoleMatrix(matrixItems);
            
            // Build the local modification state
            const initialMods: Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }> = {};
            matrixItems.forEach(item => {
              initialMods[item.pageId] = {
                view: item.canView,
                create: item.canCreate,
                edit: item.canEdit,
                delete: item.canDelete
              };
            });
            setModifiedRoleMatrix(initialMods);
          }
        } catch (err) {
          console.error("Failed to fetch role matrix:", err);
          toast.error(`Failed to load permissions matrix for role: ${selectedRole}`);
        } finally {
          setLoading(false);
        }
      };
      fetchRoleMatrixData();
    }
  }, [selectedRole, viewMode, toast]);

  // Fetch Overrides Matrix and Baseline permissions for selected User
  useEffect(() => {
    if (viewMode === "user" && selectedStaff) {
      const fetchUserData = async () => {
        setLoading(true);
        try {
          const res = await permissionsService.getUserMatrix(selectedStaff.id);
          if (res.data?.success && Array.isArray(res.data.data)) {
            const userMatrixItems = res.data.data;
            setUserMatrix(userMatrixItems);
            
            // Populate local overrides state
            const initialOverrides: Record<string, { view: boolean | null; create: boolean | null; edit: boolean | null; delete: boolean | null }> = {};
            userMatrixItems.forEach(item => {
              initialOverrides[item.pageId] = {
                view: item.override.view,
                create: item.override.create,
                edit: item.override.edit,
                delete: item.override.delete
              };
            });
            setLocalUserOverrides(initialOverrides);
          }
          
          // Fetch role baseline to calculate live effective indicators
          const baselineMap: Record<string, Flags> = {};
          for (const r of selectedStaff.roles) {
            try {
              const roleRes = await permissionsService.getRoleMatrix(r);
              if (roleRes.data?.success && Array.isArray(roleRes.data.data)) {
                roleRes.data.data.forEach(item => {
                  if (!baselineMap[item.pageId]) {
                    baselineMap[item.pageId] = { view: false, create: false, edit: false, delete: false };
                  }
                  baselineMap[item.pageId].view = baselineMap[item.pageId].view || item.canView;
                  baselineMap[item.pageId].create = baselineMap[item.pageId].create || item.canCreate;
                  baselineMap[item.pageId].edit = baselineMap[item.pageId].edit || item.canEdit;
                  baselineMap[item.pageId].delete = baselineMap[item.pageId].delete || item.canDelete;
                });
              }
            } catch (roleErr) {
              console.error(`Error loading matrix for baseline role ${r}:`, roleErr);
            }
          }
          setRolesBaseline(baselineMap);
        } catch (err) {
          console.error("Failed to load user permissions overrides:", err);
          toast.error("Failed to load user permissions data");
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }
  }, [selectedStaff, viewMode, toast]);

  // -------------------------------------------------------------
  // BY ROLE HANDLERS
  // -------------------------------------------------------------
  const isSuperAdmin = selectedRole.toLowerCase() === "superadmin";

  const handleRoleToggleCheckbox = (pageId: string, action: "view" | "create" | "edit" | "delete") => {
    if (isSuperAdmin) return;
    setModifiedRoleMatrix(prev => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        [action]: !prev[pageId][action]
      }
    }));
  };

  const handleRoleToggleRow = (pageId: string) => {
    if (isSuperAdmin) return;
    setModifiedRoleMatrix(prev => {
      const current = prev[pageId];
      const allChecked = current.view && current.create && current.edit && current.delete;
      return {
        ...prev,
        [pageId]: {
          view: !allChecked,
          create: !allChecked,
          edit: !allChecked,
          delete: !allChecked
        }
      };
    });
  };

  const handleRoleBulkAction = (action: "view" | "create" | "edit" | "delete", value: boolean) => {
    if (isSuperAdmin) return;
    setModifiedRoleMatrix(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(pageId => {
        updated[pageId] = {
          ...updated[pageId],
          [action]: value
        };
      });
      return updated;
    });
  };

  const handleSaveRolePermissions = async () => {
    if (isSuperAdmin) return;
    setRoleSaving(true);
    try {
      const payload = Object.entries(modifiedRoleMatrix).map(([pageId, flags]) => ({
        pageId,
        canView: flags.view,
        canCreate: flags.create,
        canEdit: flags.edit,
        canDelete: flags.delete
      }));
      
      await permissionsService.setRoleMatrix(selectedRole, payload);
      setSuccessBanner(`Your changes for role '${selectedRole}' have been saved. Website updates may take up to 1 minute to reflect.`);
      toast.success("Role permissions updated successfully");
    } catch (err: any) {
      console.error("Failed to save role permissions:", err);
      toast.error(err.message || "Failed to save role permissions");
    } finally {
      setRoleSaving(false);
    }
  };

  // Group role matrix rows by upper-case Group property
  const groupedRoleMatrix = useMemo(() => {
    const groups: Record<string, MatrixItemDto[]> = {};
    roleMatrix.forEach(item => {
      const groupName = item.group || "GENERAL";
      const upperGroup = groupName.toUpperCase();
      if (!groups[upperGroup]) {
        groups[upperGroup] = [];
      }
      groups[upperGroup].push(item);
    });
    return groups;
  }, [roleMatrix]);

  // -------------------------------------------------------------
  // BY USER HANDLERS
  // -------------------------------------------------------------
  const filteredStaffList = useMemo(() => {
    if (!staffSearchQuery.trim()) return staffList;
    const q = staffSearchQuery.trim().toLowerCase();
    return staffList.filter(s => 
      s.fullName.toLowerCase().includes(q) || 
      s.email.toLowerCase().includes(q)
    );
  }, [staffList, staffSearchQuery]);

  const handleUserOverrideChange = (pageId: string, action: "view" | "create" | "edit" | "delete", value: boolean | null) => {
    setLocalUserOverrides(prev => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        [action]: value
      }
    }));
  };

  const getEffectivePermission = (pageId: string, action: "view" | "create" | "edit" | "delete"): boolean => {
    if (selectedStaff?.roles.some(r => r.toLowerCase() === "superadmin")) {
      return true;
    }
    
    // Check override state
    const override = localUserOverrides[pageId]?.[action];
    if (override === true) return true;
    if (override === false) return false;
    
    // Fall back to baseline
    return !!rolesBaseline[pageId]?.[action];
  };

  const handleSaveUserOverrides = async () => {
    if (!selectedStaff) return;
    setUserSaving(true);
    try {
      const payload = Object.entries(localUserOverrides).map(([pageId, overrides]) => ({
        pageId,
        canView: overrides.view,
        canCreate: overrides.create,
        canEdit: overrides.edit,
        canDelete: overrides.delete
      }));
      
      await permissionsService.setUserMatrix(selectedStaff.id, payload);
      setSuccessBanner(`Your changes for user '${selectedStaff.fullName}' have been saved. Website updates may take up to 1 minute to reflect.`);
      toast.success("User overrides updated successfully");
    } catch (err: any) {
      console.error("Failed to save user overrides:", err);
      toast.error(err.message || "Failed to save overrides");
    } finally {
      setUserSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Group user matrix rows by upper-case Group property
  const groupedUserMatrix = useMemo(() => {
    const groups: Record<string, UserMatrixItemDto[]> = {};
    userMatrix.forEach(item => {
      const groupName = item.group || "GENERAL";
      const upperGroup = groupName.toUpperCase();
      if (!groups[upperGroup]) {
        groups[upperGroup] = [];
      }
      groups[upperGroup].push(item);
    });
    return groups;
  }, [userMatrix]);


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1329] text-slate-800 dark:text-slate-100 p-6 space-y-6">
      
      {/* 1. Alerts & Warnings */}
      {successBanner && (
        <div className="flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-sm transition-all duration-300 animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="font-medium">{successBanner}</p>
          <button 
            onClick={() => setSuccessBanner(null)} 
            className="ml-auto hover:opacity-80 font-bold text-xs"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* 2. Page Header */}
      <div className="bg-white dark:bg-[#111c40]/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-violet-500/20 dark:hover:border-violet-500/10 transition group shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg shadow-violet-500/10 group-hover:scale-105 transition duration-300">
            <LockKeyhole className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Page Permissions</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Grant access per page & action. A role's permissions apply to every user in that role; per-user overrides fine-tune individuals.
            </p>
          </div>
        </div>
      </div>

      {/* 3. View Switcher Tabs */}
      <div className="flex bg-white dark:bg-[#111c40]/80 p-1 border border-slate-200 dark:border-slate-800 rounded-xl w-fit shadow-sm dark:shadow-none">
        <button
          onClick={() => setViewMode("role")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            viewMode === "role"
              ? "bg-slate-100 dark:bg-[#1f2e61] text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200 dark:border-violet-500/15"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          By Role
        </button>
        <button
          onClick={() => setViewMode("user")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            viewMode === "user"
              ? "bg-slate-100 dark:bg-[#1f2e61] text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200 dark:border-violet-500/15"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <User className="w-4 h-4" />
          By User
        </button>
        <button
          onClick={() => setViewMode("pages")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            viewMode === "pages"
              ? "bg-slate-100 dark:bg-[#1f2e61] text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200 dark:border-violet-500/15"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Eye className="w-4 h-4" />
          Pages
        </button>
      </div>

      {/* Main Grid View */}
      {viewMode === "role" ? (
        // =====================================================================
        // BY ROLE VIEW
        // =====================================================================
        <div className="space-y-6">
          {/* Horizontal Role Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {roles.map(r => {
              const isSelected = selectedRole === r.name;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.name)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 border rounded-lg font-medium text-sm transition-all ${
                    isSelected
                      ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/35"
                      : "bg-white dark:bg-[#111c40]/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <span className="capitalize">{r.name}</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-full text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
                    {r.userCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Row & Matrix Grid */}
          <div className="bg-white dark:bg-[#111c40]/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111c40]/70">
              <div className="text-sm">
                <span className="text-slate-500 dark:text-slate-400">Editing</span>{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-bold capitalize">{selectedRole}</span>
              </div>
              
              <div className="flex items-center gap-3">
                {isSuperAdmin && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
                    SuperAdmin permissions cannot be modified
                  </span>
                )}
                {!isSuperAdmin && (
                  <button
                    onClick={handleSaveRolePermissions}
                    disabled={roleSaving || loading}
                    className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 dark:text-slate-950 font-bold text-sm rounded-lg transition-all"
                  >
                    {roleSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Save changes
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400 text-sm gap-2">
                <Loader2 className="w-8 h-8 text-violet-500 dark:text-violet-400 animate-spin" />
                Loading role baseline matrix...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-[#0b1329]/40 tracking-wider">
                      <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Page</th>
                      <th className="py-3 px-4 text-center w-[120px]">
                        <div className="flex flex-col items-center">
                          <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><Eye className="w-3 h-3"/> View</span>
                          <div className="flex items-center gap-1.5 text-[9px] lowercase font-normal mt-1 text-slate-400 dark:text-slate-500">
                            <button disabled={isSuperAdmin} onClick={() => handleRoleBulkAction("view", true)} className="hover:text-green-600 dark:hover:text-green-400 transition">all</button>
                            <span>|</span>
                            <button disabled={isSuperAdmin} onClick={() => handleRoleBulkAction("view", false)} className="hover:text-red-600 dark:hover:text-red-400 transition">none</button>
                          </div>
                        </div>
                      </th>
                      <th className="py-3 px-4 text-center w-[120px]">
                        <div className="flex flex-col items-center">
                          <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1"><Plus className="w-3 h-3"/> Create</span>
                          <div className="flex items-center gap-1.5 text-[9px] lowercase font-normal mt-1 text-slate-400 dark:text-slate-500">
                            <button disabled={isSuperAdmin} onClick={() => handleRoleBulkAction("create", true)} className="hover:text-purple-600 dark:hover:text-purple-400 transition">all</button>
                            <span>|</span>
                            <button disabled={isSuperAdmin} onClick={() => handleRoleBulkAction("create", false)} className="hover:text-red-600 dark:hover:text-red-400 transition">none</button>
                          </div>
                        </div>
                      </th>
                      <th className="py-3 px-4 text-center w-[120px]">
                        <div className="flex flex-col items-center">
                          <span className="text-orange-600 dark:text-orange-400 flex items-center gap-1"><Edit className="w-3 h-3"/> Edit</span>
                          <div className="flex items-center gap-1.5 text-[9px] lowercase font-normal mt-1 text-slate-400 dark:text-slate-500">
                            <button disabled={isSuperAdmin} onClick={() => handleRoleBulkAction("edit", true)} className="hover:text-orange-600 dark:hover:text-orange-400 transition">all</button>
                            <span>|</span>
                            <button disabled={isSuperAdmin} onClick={() => handleRoleBulkAction("edit", false)} className="hover:text-red-600 dark:hover:text-red-400 transition">none</button>
                          </div>
                        </div>
                      </th>
                      <th className="py-3 px-4 text-center w-[120px]">
                        <div className="flex flex-col items-center">
                          <span className="text-red-600 dark:text-red-400 flex items-center gap-1"><Trash2 className="w-3 h-3"/> Delete</span>
                          <div className="flex items-center gap-1.5 text-[9px] lowercase font-normal mt-1 text-slate-400 dark:text-slate-500">
                            <button disabled={isSuperAdmin} onClick={() => handleRoleBulkAction("delete", true)} className="hover:text-red-600 dark:hover:text-red-400 transition">all</button>
                            <span>|</span>
                            <button disabled={isSuperAdmin} onClick={() => handleRoleBulkAction("delete", false)} className="hover:text-red-600 dark:hover:text-red-400 transition">none</button>
                          </div>
                        </div>
                      </th>
                      <th className="py-3 px-4 text-center w-[100px] text-[10px] font-bold text-slate-400 dark:text-slate-550">Toggle</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-transparent">
                    {Object.entries(groupedRoleMatrix).map(([group, items]) => (
                      <React.Fragment key={group}>
                        {/* Section Group Header */}
                        <tr className="bg-slate-50 dark:bg-[#0b1329]/80 border-y border-slate-200 dark:border-slate-800">
                          <td colSpan={6} className="py-2 px-4 text-xs font-bold text-violet-600 dark:text-violet-400 tracking-wider">
                            {group}
                          </td>
                        </tr>
                        
                        {items.map(item => {
                          const localState = modifiedRoleMatrix[item.pageId] || {
                            view: item.canView,
                            create: item.canCreate,
                            edit: item.canEdit,
                            delete: item.canDelete
                          };

                          return (
                            <tr 
                              key={item.pageId} 
                              className={`hover:bg-slate-50/80 dark:hover:bg-[#111c40]/20 transition-all border-b border-slate-100 dark:border-slate-800/40 ${
                                isSuperAdmin ? "opacity-90" : ""
                              }`}
                            >
                              <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 text-sm">
                                {item.name}
                              </td>
                              
                              {/* View Action Checkbox */}
                              <td className="py-3 px-4 text-center">
                                <label className="inline-flex items-center justify-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSuperAdmin ? true : localState.view}
                                    disabled={isSuperAdmin}
                                    onChange={() => handleRoleToggleCheckbox(item.pageId, "view")}
                                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-green-500 focus:ring-green-500/20 w-4 h-4 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                  />
                                </label>
                              </td>

                              {/* Create Action Checkbox */}
                              <td className="py-3 px-4 text-center">
                                <label className="inline-flex items-center justify-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSuperAdmin ? true : localState.create}
                                    disabled={isSuperAdmin}
                                    onChange={() => handleRoleToggleCheckbox(item.pageId, "create")}
                                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-purple-500 focus:ring-purple-500/20 w-4 h-4 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                  />
                                </label>
                              </td>

                              {/* Edit Action Checkbox */}
                              <td className="py-3 px-4 text-center">
                                <label className="inline-flex items-center justify-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSuperAdmin ? true : localState.edit}
                                    disabled={isSuperAdmin}
                                    onChange={() => handleRoleToggleCheckbox(item.pageId, "edit")}
                                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-orange-500 focus:ring-orange-500/20 w-4 h-4 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                  />
                                </label>
                              </td>

                              {/* Delete Action Checkbox */}
                              <td className="py-3 px-4 text-center">
                                <label className="inline-flex items-center justify-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSuperAdmin ? true : localState.delete}
                                    disabled={isSuperAdmin}
                                    onChange={() => handleRoleToggleCheckbox(item.pageId, "delete")}
                                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-red-500 focus:ring-red-500/20 w-4 h-4 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                  />
                                </label>
                              </td>

                              {/* Row Toggle Trigger */}
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  disabled={isSuperAdmin}
                                  onClick={() => handleRoleToggleRow(item.pageId)}
                                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 font-semibold px-2 py-1 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-[#1a254a] border border-slate-200 dark:border-slate-800 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Toggle
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === "user" ? (
        // =====================================================================
        // BY USER VIEW
        // =====================================================================
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Staff List Sidebar */}
          <div className="lg:col-span-1 bg-white dark:bg-[#111c40]/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col h-[70vh] gap-4 shadow-sm dark:shadow-none">
            
            {/* Staff Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search staff..."
                value={staffSearchQuery}
                onChange={e => setStaffSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            
            {/* Sidebar Scroll List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
              {filteredStaffList.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-500 text-xs py-8">
                  No staff members found
                </div>
              ) : (
                filteredStaffList.map(s => {
                  const isSelected = selectedStaff?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStaff(s)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                        isSelected
                          ? "bg-slate-100 dark:bg-[#1f2e61] border border-slate-200 dark:border-violet-500/20"
                          : "border border-transparent hover:bg-slate-50 dark:hover:bg-[#111c40]/30"
                      }`}
                    >
                      {/* Circle Initials Avatar */}
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white uppercase flex-shrink-0">
                        {getInitials(s.fullName)}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-900 dark:text-white text-xs font-semibold truncate">
                          {s.fullName}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize truncate mt-0.5">
                          {s.primaryRole || s.roles.join(", ") || "No role"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Override Details Panel */}
          <div className="lg:col-span-3 bg-white dark:bg-[#111c40]/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[70vh] shadow-sm dark:shadow-none">
            {selectedStaff ? (
              <>
                {/* Header Information Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111c40]/70">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Overriding{" "}
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold capitalize">
                        {selectedStaff.fullName}
                      </span>{" "}
                      · role:{" "}
                      <span className="text-slate-500 dark:text-slate-400 font-normal italic">
                        {selectedStaff.roles.join(", ")}
                      </span>
                    </h2>
                  </div>
                  
                  <div>
                    <button
                      onClick={handleSaveUserOverrides}
                      disabled={userSaving || loading}
                      className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 dark:text-slate-950 font-bold text-sm rounded-lg transition-all"
                    >
                      {userSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Save overrides
                    </button>
                  </div>
                </div>

                {/* Overrides Info Explainer Banner */}
                <div className="px-4 py-2 bg-slate-50 dark:bg-[#0b1329]/50 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-650 dark:text-slate-400 space-y-1">
                  <p>
                    <span className="text-blue-600 dark:text-blue-455 font-bold">Inherit</span> = Follow the role baseline permission.
                    <span className="text-green-600 dark:text-green-455 font-bold ml-3">Allow</span> = Explicitly grant, overriding role denial.
                    <span className="text-red-600 dark:text-red-455 font-bold ml-3">Deny</span> = Explicitly block, overriding role grant.
                  </p>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400 text-sm gap-2 flex-1">
                    <Loader2 className="w-8 h-8 text-violet-500 dark:text-violet-400 animate-spin" />
                    Loading user overrides...
                  </div>
                ) : (
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-550 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-[#0b1329]/40 tracking-wider">
                          <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Page</th>
                          <th className="py-3 px-4 text-center w-[160px]">
                            <span className="text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                              <Eye className="w-3 h-3"/> View
                            </span>
                          </th>
                          <th className="py-3 px-4 text-center w-[160px]">
                            <span className="text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1">
                              <Plus className="w-3 h-3"/> Create
                            </span>
                          </th>
                          <th className="py-3 px-4 text-center w-[160px]">
                            <span className="text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1">
                              <Edit className="w-3 h-3"/> Edit
                            </span>
                          </th>
                          <th className="py-3 px-4 text-center w-[160px]">
                            <span className="text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
                              <Trash2 className="w-3 h-3"/> Delete
                            </span>
                          </th>
                          <th className="py-3 px-4 text-center w-[110px] text-slate-500 dark:text-slate-400">Effective</th>
                        </tr>
                      </thead>
                      
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-transparent">
                        {Object.entries(groupedUserMatrix).map(([group, items]) => (
                          <React.Fragment key={group}>
                            {/* Section Group Header */}
                            <tr className="bg-slate-50 dark:bg-[#0b1329]/80 border-y border-slate-200 dark:border-slate-800">
                              <td colSpan={6} className="py-2 px-4 text-xs font-bold text-violet-600 dark:text-violet-400 tracking-wider">
                                {group}
                              </td>
                            </tr>
                            
                            {items.map(item => {
                              const pageId = item.pageId;
                              const overrides = localUserOverrides[pageId] || {
                                view: item.override.view,
                                create: item.override.create,
                                edit: item.override.edit,
                                delete: item.override.delete
                              };

                              // Mini Segmented Toggle Component
                              const OverrideToggle = ({ action }: { action: "view" | "create" | "edit" | "delete" }) => {
                                const currentVal = overrides[action];
                                return (
                                  <div className="inline-flex bg-slate-50 dark:bg-[#0b1329] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                                    {/* Inherit Toggle */}
                                    <button
                                      type="button"
                                      onClick={() => handleUserOverrideChange(pageId, action, null)}
                                      className={`px-2.5 py-0.5 text-[9px] rounded font-bold transition-all ${
                                        currentVal == null 
                                          ? "bg-slate-200 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-sm"
                                          : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                                      }`}
                                    >
                                      Inh
                                    </button>
                                    
                                    {/* Allow Toggle */}
                                    <button
                                      type="button"
                                      onClick={() => handleUserOverrideChange(pageId, action, true)}
                                      className={`px-2.5 py-0.5 text-[9px] rounded font-bold transition-all ${
                                        currentVal === true
                                          ? "bg-green-600 dark:bg-green-500/20 text-white dark:text-green-400 border border-green-600 dark:border-green-500/40 shadow-sm"
                                          : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                                      }`}
                                    >
                                      Allw
                                    </button>
                                    
                                    {/* Deny Toggle */}
                                    <button
                                      type="button"
                                      onClick={() => handleUserOverrideChange(pageId, action, false)}
                                      className={`px-2.5 py-0.5 text-[9px] rounded font-bold transition-all ${
                                        currentVal === false
                                          ? "bg-red-650 dark:bg-red-500/20 text-white dark:text-red-400 border border-red-600 dark:border-red-500/40 shadow-sm"
                                          : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                                      }`}
                                    >
                                      Deny
                                    </button>
                                  </div>
                                );
                              };

                              // Calculate current live effective statuses
                              const isViewAllowed = getEffectivePermission(pageId, "view");
                              const isCreateAllowed = getEffectivePermission(pageId, "create");
                              const isEditAllowed = getEffectivePermission(pageId, "edit");
                              const isDeleteAllowed = getEffectivePermission(pageId, "delete");

                              return (
                                <tr key={pageId} className="hover:bg-slate-50/80 dark:hover:bg-[#111c40]/20 transition">
                                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 text-xs">
                                    {item.name}
                                  </td>
                                  
                                  {/* View Toggle */}
                                  <td className="py-2 px-2 text-center">
                                    <OverrideToggle action="view" />
                                  </td>
                                  
                                  {/* Create Toggle */}
                                  <td className="py-2 px-2 text-center">
                                    <OverrideToggle action="create" />
                                  </td>
                                  
                                  {/* Edit Toggle */}
                                  <td className="py-2 px-2 text-center">
                                    <OverrideToggle action="edit" />
                                  </td>
                                  
                                  {/* Delete Toggle */}
                                  <td className="py-2 px-2 text-center">
                                    <OverrideToggle action="delete" />
                                  </td>
                                  
                                  {/* Live Effective Permission Dots */}
                                  <td className="py-2 px-2 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {/* View Dot (Green) */}
                                      <span 
                                        className={`inline-block w-2.5 h-2.5 rounded-full transition-all ${
                                          isViewAllowed ? "bg-green-600 dark:bg-green-400 animate-pulse" : "bg-slate-300 dark:bg-slate-700/60"
                                        }`} 
                                        title={isViewAllowed ? "View allowed" : "View denied"}
                                      />
                                      
                                      {/* Create Dot (Purple) */}
                                      <span 
                                        className={`inline-block w-2.5 h-2.5 rounded-full transition-all ${
                                          isCreateAllowed ? "bg-purple-600 dark:bg-purple-400" : "bg-slate-300 dark:bg-slate-700/60"
                                        }`} 
                                        title={isCreateAllowed ? "Create allowed" : "Create denied"}
                                      />
                                      
                                      {/* Edit Dot (Orange) */}
                                      <span 
                                        className={`inline-block w-2.5 h-2.5 rounded-full transition-all ${
                                          isEditAllowed ? "bg-orange-500 dark:bg-orange-400" : "bg-slate-300 dark:bg-slate-700/60"
                                        }`} 
                                        title={isEditAllowed ? "Edit allowed" : "Edit denied"}
                                      />
                                      
                                      {/* Delete Dot (Red) */}
                                      <span 
                                        className={`inline-block w-2.5 h-2.5 rounded-full transition-all ${
                                          isDeleteAllowed ? "bg-red-600 dark:bg-red-400" : "bg-slate-300 dark:bg-slate-700/60"
                                        }`} 
                                        title={isDeleteAllowed ? "Delete allowed" : "Delete denied"}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-400 dark:text-slate-500 py-16 text-sm gap-2">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                Select a staff member from the left sidebar to edit overrides.
              </div>
            )}
          </div>
        </div>
      ) : (
        // =====================================================================
        // PAGES VIEW
        // =====================================================================
        <div className="space-y-5">
          {/* Header bar */}
          <div className="bg-white dark:bg-[#111c40]/40 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name, key or group..."
                  value={pagesSearchQuery}
                  onChange={e => setPagesSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition"
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg">
                <FileText className="w-3.5 h-3.5 text-violet-500" />
                {pagesList.length} pages registered
              </div>
            </div>
          </div>

          {/* Table */}
          {pagesLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 dark:text-slate-400 text-sm gap-3">
              <Loader2 className="w-9 h-9 text-violet-500 dark:text-violet-400 animate-spin" />
              <span className="text-slate-400 dark:text-slate-500">Loading registered pages...</span>
            </div>
          ) : (() => {
            const groupBadgeMap: Record<string, string> = {
              General: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
              Catalog: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700',
              Sales:   'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
              Content: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
              System:  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
            };
            const groupDotMap: Record<string, string> = {
              General: 'bg-blue-500', Catalog: 'bg-orange-500', Sales: 'bg-green-500', Content: 'bg-purple-500', System: 'bg-slate-400',
            };

            const filtered = pagesList.filter(page =>
              page.name.toLowerCase().includes(pagesSearchQuery.toLowerCase()) ||
              page.key.toLowerCase().includes(pagesSearchQuery.toLowerCase()) ||
              (page.group || '').toLowerCase().includes(pagesSearchQuery.toLowerCase())
            );

            if (filtered.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500 text-sm gap-3">
                  <Search className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                  <span>No pages found matching <strong>&quot;{pagesSearchQuery}&quot;</strong></span>
                </div>
              );
            }

            // Group pages preserving sort order within each group
            const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, page) => {
              const g = page.group || 'General';
              if (!acc[g]) acc[g] = [];
              acc[g].push(page);
              return acc;
            }, {});

            return (
              <div className="bg-white dark:bg-[#111c40]/40 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  {/* Table header */}
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0b1329]/60 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-8">#</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Page Name</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Permission Key</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Group</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center w-28">Sort Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(grouped).map(([group, pages]) => (
                      <React.Fragment key={group}>
                        {/* Group separator row */}
                        <tr className="bg-slate-100/70 dark:bg-slate-800/30 border-y border-slate-200 dark:border-slate-800/60">
                          <td colSpan={5} className="py-2 px-5">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${groupDotMap[group] ?? 'bg-violet-500'}`} />
                              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                {group}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-full ml-1">
                                {pages.length}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Page rows */}
                        {pages.map((page, idx) => (
                          <tr
                            key={page.id}
                            className={`border-b border-slate-100 dark:border-slate-800/40 hover:bg-violet-50/40 dark:hover:bg-violet-900/10 transition-colors duration-150 ${
                              idx % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-900/20'
                            }`}
                          >
                            {/* Row number */}
                            <td className="py-3.5 px-5 text-xs font-mono text-slate-400 dark:text-slate-600 w-8">
                              {idx + 1}
                            </td>

                            {/* Page name with icon */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 flex-shrink-0 rounded-md bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                  <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                </div>
                                <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                                  {page.name}
                                </span>
                              </div>
                            </td>

                            {/* Permission key */}
                            <td className="py-3.5 px-4">
                              <code className="text-[12px] font-mono text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 px-2.5 py-1 rounded-md">
                                {page.key}
                              </code>
                            </td>

                            {/* Group badge */}
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${groupBadgeMap[group] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${groupDotMap[group] ?? 'bg-violet-500'}`} />
                                {group}
                              </span>
                            </td>

                            {/* Sort order */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-block text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg tabular-nums min-w-[40px]">
                                {page.sortOrder}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}
      
    </div>
  );
}
