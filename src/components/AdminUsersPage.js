"use client";

import { useState, useEffect } from "react";
import {
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Phone,
  AtSign,
  Eye,
  EyeOff,
  Mail,
  AlertCircle,
  Loader2,
  Lock,
  X,
  User as UserIcon,
  BadgeCheck,
  RefreshCw,
} from "lucide-react";

const REGISTER_API_URL = "https://api.crazystory.in/api/admin/register";
const ADMIN_LIST_API_URL = "https://api.crazystory.in/api/admin/list";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
];

// ============================================================
// Add User Modal
// ============================================================
function AddUserModal({ onSubmit, onClose, submitting, apiError }) {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    password_confirmation: "",
    phone: "",
    role: "admin",
  });
  const [touched, setTouched] = useState(false);

  const handleChange = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const passwordsMatch =
    form.password_confirmation.length === 0 || form.password === form.password_confirmation;

  const isValid =
    form.name.trim() &&
    form.email.trim() &&
    form.username.trim() &&
    form.password.length >= 6 &&
    form.password === form.password_confirmation &&
    form.phone.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-5 py-8 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-[460px] p-6 my-auto">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-[10px] bg-fuchsia-500 flex items-center justify-center shrink-0">
              <UserPlus size={17} className="text-white" />
            </span>
            <h3 className="font-brand text-lg font-semibold text-teal-900">Add Admin User</h3>
          </div>
          <button onClick={onClose} className="text-ink-soft hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <p className="text-[12.5px] text-ink-soft mb-5 ml-[46px]">
          Creates a new admin account with dashboard access.
        </p>

        {apiError && (
          <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-[10px] px-4 py-3 mb-4 text-[13px]">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[12.5px] font-medium text-ink mb-1.5">Full name</label>
            <div className="relative">
              <UserIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="New Admin"
                className="w-full pl-9 pr-3.5 py-2.5 border border-line rounded-[9px] text-[13.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="newadmin@athma.com"
                  className="w-full pl-9 pr-3 py-2.5 border border-line rounded-[9px] text-[13px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1.5">Username</label>
              <div className="relative">
                <AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  placeholder="admin456"
                  className="w-full pl-9 pr-3 py-2.5 border border-line rounded-[9px] text-[13px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1.5">Phone</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-9 pr-3 py-2.5 border border-line rounded-[9px] text-[13px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className="w-full px-3 py-2.5 border border-line rounded-[9px] text-[13px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-ink mb-1.5">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 border border-line rounded-[9px] text-[13.5px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-ink mb-1.5">Confirm password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password_confirmation}
                onChange={(e) => handleChange("password_confirmation", e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-9 pr-3.5 py-2.5 border rounded-[9px] text-[13.5px] bg-[#FCFDFC] focus:outline-2 transition-colors ${
                  !passwordsMatch
                    ? "border-rose-400 focus:outline-rose-400"
                    : "border-line focus:outline-teal-500 focus:border-teal-500"
                }`}
              />
            </div>
            {!passwordsMatch && (
              <p className="text-[11.5px] text-rose-500 mt-1.5">Passwords don&apos;t match.</p>
            )}
          </div>

          {touched && !isValid && (
            <p className="text-[11.5px] text-rose-500">
              Please fill all fields correctly (password at least 6 characters, and matching).
            </p>
          )}

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-[9px] border border-line text-ink-soft font-medium text-[13.5px] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[9px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13.5px] transition-colors disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Creating...
                </>
              ) : (
                "Create user"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// User Response Modal
// ============================================================
function UserResponseModal({ response, onClose }) {
  if (!response) return null;
  const { message, data } = response;
  const { user, admin } = data || {};

  const Row = ({ label, value }) => (
    <div className="flex items-center justify-between py-2 border-b border-line last:border-0">
      <span className="text-[12.5px] text-ink-soft">{label}</span>
      <span className="text-[13px] font-medium text-ink">{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-5 py-8 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-[440px] p-6 my-auto">
        <div className="flex flex-col items-center text-center mb-5">
          <span className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
            <CheckCircle2 size={26} className="text-emerald-500" />
          </span>
          <h3 className="font-brand text-lg font-bold text-teal-900">User created</h3>
          <p className="text-[13px] text-ink-soft mt-1">{message}</p>
        </div>

        {user && (
          <div className="mb-4">
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-ink-soft mb-2">
              <UserIcon size={12} /> User account
            </p>
            <div className="bg-[#F7F8F6] rounded-[12px] px-4 py-1">
              <Row label="ID" value={user.id} />
              <Row label="Name" value={user.name} />
              <Row label="Email" value={user.email} />
              <Row label="Username" value={user.username} />
              <Row
                label="Role"
                value={
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11.5px] font-semibold capitalize">
                    {user.role}
                  </span>
                }
              />
              <Row
                label="Is admin"
                value={
                  user.is_admin ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <BadgeCheck size={13} /> Yes
                    </span>
                  ) : (
                    "No"
                  )
                }
              />
            </div>
          </div>
        )}

        {admin && (
          <div className="mb-6">
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-ink-soft mb-2">
              <ShieldCheck size={12} /> Admin profile
            </p>
            <div className="bg-[#F7F8F6] rounded-[12px] px-4 py-1">
              <Row label="Admin ID" value={admin.id} />
              <Row label="Phone" value={admin.phone} />
              <Row label="Department" value={admin.department} />
              <Row label="Designation" value={admin.designation} />
              <Row
                label="Status"
                value={
                  admin.is_active ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 size={13} /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-500 font-semibold">
                      <XCircle size={13} /> Inactive
                    </span>
                  )
                }
              />
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-[9px] bg-teal-900 hover:bg-teal-800 text-white font-semibold text-[13.5px] transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Main AdminUsersPage Component
// ============================================================
export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [registeringUser, setRegisteringUser] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [lastResponse, setLastResponse] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch admin users on mount
  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const getToken = () => {
    const token = localStorage.getItem("athma_admin_token");
    const tokenType = localStorage.getItem("athma_admin_token_type") || "Bearer";
    return { token, tokenType };
  };

  const fetchAdminUsers = async () => {
    try {
      const { token, tokenType } = getToken();
      
      const res = await fetch(ADMIN_LIST_API_URL, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType} ${token}`,
        },
      });
      
      const result = await res.json();
      
      if (result.status === "success") {
        const data = result.data;
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && typeof data === "object") {
          const arrayData = data.data || data.users || data.admins || [];
          setUsers(Array.isArray(arrayData) ? arrayData : []);
        } else {
          setUsers([]);
        }
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Failed to fetch admin users:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdminUsers();
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    );
  });

  const handleRegisterUser = async (form) => {
    setRegisteringUser(true);
    setRegisterError("");

    try {
      const { token, tokenType } = getToken();

      const res = await fetch(REGISTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType} ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          username: form.username.trim(),
          password: form.password,
          password_confirmation: form.password_confirmation,
          phone: form.phone.trim(),
          role: form.role || "admin",
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result || result.status !== "success") {
        setRegisterError(result?.message || "Something went wrong. Please try again.");
        setRegisteringUser(false);
        return;
      }

      setLastResponse(result);
      setAddUserOpen(false);
      setRegisteringUser(false);
      
      // Refresh the user list
      fetchAdminUsers();
    } catch (err) {
      setRegisterError("Couldn't reach the server. Check your connection and try again.");
      setRegisteringUser(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-teal-600" />
        <span className="ml-3 text-ink-soft text-sm">Loading admin users...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <p className="text-ink-soft text-[13px] mt-0.5">
            Manage who has access to the Athma admin console.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh list"
            className="w-9 h-9 rounded-[9px] flex items-center justify-center text-ink-soft hover:bg-[#F2F4F1] border border-line disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => {
              setRegisterError("");
              setAddUserOpen(true);
            }}
            className="flex items-center gap-2 bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13.5px] px-4 py-2.5 rounded-[9px] transition-colors"
          >
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-[320px] mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-9 pr-3 py-2.5 rounded-[9px] bg-[#F5F6F4] border border-transparent text-[13px] text-ink placeholder:text-ink-soft focus:outline-none focus:border-teal-400 focus:bg-white transition-colors"
        />
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-line rounded-2xl p-5">
          <span className="w-10 h-10 rounded-[10px] bg-fuchsia-500 flex items-center justify-center mb-3">
            <Users size={17} className="text-white" />
          </span>
          <p className="text-[12px] text-ink-soft">Total Users</p>
          <p className="text-[22px] font-bold text-teal-900 mt-0.5">{users.length}</p>
        </div>
        <div className="bg-white border border-line rounded-2xl p-5">
          <span className="w-10 h-10 rounded-[10px] bg-emerald-500 flex items-center justify-center mb-3">
            <CheckCircle2 size={17} className="text-white" />
          </span>
          <p className="text-[12px] text-ink-soft">Active</p>
          <p className="text-[22px] font-bold text-teal-900 mt-0.5">
            {users.filter((u) => u.is_active || u.is_active === 1).length}
          </p>
        </div>
        <div className="bg-white border border-line rounded-2xl p-5 hidden md:block">
          <span className="w-10 h-10 rounded-[10px] bg-indigo-500 flex items-center justify-center mb-3">
            <ShieldCheck size={17} className="text-white" />
          </span>
          <p className="text-[12px] text-ink-soft">Admin role</p>
          <p className="text-[22px] font-bold text-teal-900 mt-0.5">
            {users.filter((u) => u.role === "admin").length}
          </p>
        </div>
      </div>

      {/* Users list */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl px-6 py-16 text-center">
          <span className="w-14 h-14 rounded-full bg-fuchsia-50 flex items-center justify-center mx-auto mb-3">
            <UserPlus size={22} className="text-fuchsia-500" />
          </span>
          <p className="text-ink font-semibold text-[14px] mb-1">
            {users.length === 0 ? "No admin users yet" : "No users match your search"}
          </p>
          <p className="text-ink-soft text-[13px]">
            {users.length === 0
              ? 'Click "Add User" to create the first admin account.'
              : "Try a different name, email, or username."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((u) => (
            <div
              key={u.id ?? u.email}
              className="bg-white border border-line rounded-2xl p-5 hover:shadow-[0_4px_20px_rgba(43,62,99,0.08)] transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white flex items-center justify-center font-bold text-[15px] shrink-0">
                  {u.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink text-[14px] truncate">{u.name}</p>
                  <p className="text-[12px] text-ink-soft truncate">{u.email}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-[12.5px] text-ink-soft mb-4">
                <span className="flex items-center gap-1.5">
                  <AtSign size={12} className="text-teal-600" /> {u.username}
                </span>
                {u.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={12} className="text-teal-600" /> {u.phone}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-[11px] font-semibold capitalize">
                  {u.role || "admin"}
                </span>
                <span
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    u.is_active || u.is_active === 1
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {(u.is_active || u.is_active === 1) ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                  {(u.is_active || u.is_active === 1) ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      {addUserOpen && (
        <AddUserModal
          onSubmit={handleRegisterUser}
          onClose={() => setAddUserOpen(false)}
          submitting={registeringUser}
          apiError={registerError}
        />
      )}

      {/* Response Modal */}
      {lastResponse && (
        <UserResponseModal response={lastResponse} onClose={() => setLastResponse(null)} />
      )}
    </>
  );
}