"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MoreVertical,
  Eye,
  Trash2,
  Power,
  X,
  Loader2,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  CreditCard,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";

const API_BASE = "https://api.crazystory.in/api/admin/patients";

function getAuthHeaders() {
  const token = localStorage.getItem("athma_admin_token");
  const tokenType = localStorage.getItem("athma_admin_token_type") || "Bearer";
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `${tokenType} ${token}`,
  };
}

function clearSessionAndRedirect(router) {
  localStorage.removeItem("athma_admin_token");
  localStorage.removeItem("athma_admin_token_type");
  localStorage.removeItem("athma_admin_user");
  router.replace("/admin/login");
}

/* ---------------------------------------------------------
   Small UI helpers
--------------------------------------------------------- */

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium ${
        active
          ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
          : "bg-rose-50 text-rose-600 ring-1 ring-rose-200"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-rose-500"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function AssessmentBadge({ completed }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium ${
        completed
          ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200"
          : "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
      }`}
    >
      {completed ? "Completed" : "Pending"}
    </span>
  );
}

function Avatar({ name }) {
  const initials = name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "?";

  const palette = [
    "bg-teal-500", "bg-indigo-500", "bg-coral-500", "bg-violet-500",
    "bg-amber-500", "bg-sky-500", "bg-fuchsia-500", "bg-emerald-500",
  ];
  const idx = (name?.charCodeAt(0) || 0) % palette.length;

  return (
    <div className={`w-9 h-9 rounded-full ${palette[idx]} flex items-center justify-center text-white text-[12px] font-semibold shrink-0`}>
      {initials}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ---------------------------------------------------------
   Row action dropdown
--------------------------------------------------------- */

function RowActions({ patient, onView, onToggleStatus, onDelete, togglingId, deletingId }) {
  const [open, setOpen] = useState(false);
  const isToggling = togglingId === patient.id;
  const isDeleting = deletingId === patient.id;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg ring-1 ring-slate-200 py-1.5 z-20 overflow-hidden">
            <button
              onClick={() => { setOpen(false); onView(patient); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Eye size={14} /> View details
            </button>
            <button
              disabled={isToggling}
              onClick={() => { setOpen(false); onToggleStatus(patient); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {isToggling ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
              {patient.is_active ? "Deactivate" : "Activate"}
            </button>
            <div className="h-px bg-slate-100 my-1" />
            <button
              disabled={isDeleting}
              onClick={() => { setOpen(false); onDelete(patient); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Delete confirmation modal
--------------------------------------------------------- */

function DeleteConfirmModal({ patient, onCancel, onConfirm, deleting }) {
  if (!patient) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center mb-4">
          <AlertTriangle size={20} className="text-rose-500" />
        </div>
        <h3 className="text-[16px] font-semibold text-slate-900 mb-1.5">Delete patient?</h3>
        <p className="text-[13.5px] text-slate-500 leading-relaxed mb-6">
          This will permanently delete <span className="font-medium text-slate-700">{patient.name}</span>'s
          record, including their payment and assessment history. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-[13.5px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:opacity-50"
          >
            {deleting && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Patient detail drawer
--------------------------------------------------------- */

function PatientDetailDrawer({ patientId, onClose, router }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;

    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/${patientId}`, {
          headers: getAuthHeaders(),
        });
        if (res.status === 401) {
          clearSessionAndRedirect(router);
          return;
        }
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = await res.json();
        if (!cancelled) setDetail(json.data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load patient");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDetail();
    return () => { cancelled = true; };
  }, [patientId, router]);

  if (!patientId) return null;

  const p = detail?.patient;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-[15px] font-semibold text-slate-900">Patient details</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={17} />
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-[13px]">Loading patient…</span>
          </div>
        )}

        {error && !loading && (
          <div className="px-6 py-10 text-center">
            <p className="text-[13.5px] text-rose-500">{error}</p>
          </div>
        )}

        {!loading && !error && p && (
          <div className="px-6 py-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-teal-500 flex items-center justify-center text-white text-[18px] font-semibold">
                {p.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-[16px] font-semibold text-slate-900">{p.name}</h4>
                <div className="mt-1"><StatusBadge active={p.is_active} /></div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <InfoRow icon={Mail} label="Email" value={p.email} />
              <InfoRow icon={Phone} label="Phone" value={p.phone} />
              <InfoRow icon={MapPin} label="Location" value={p.location || p.address} />
              <InfoRow icon={CalendarDays} label="Registered" value={formatDateTime(p.created_at)} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={14} className="text-slate-400" />
                <h5 className="text-[12.5px] font-semibold text-slate-500 uppercase tracking-wide">
                  Payments ({detail.payments?.total ?? 0})
                </h5>
              </div>
              {detail.payments?.list?.length ? (
                <div className="space-y-2">
                  {detail.payments.list.map((pay) => (
                    <div key={pay.id} className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-[13px] font-medium text-slate-800">{pay.package_name}</p>
                        <p className="text-[11.5px] text-slate-400 mt-0.5">{formatDate(pay.paid_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-semibold text-slate-900">₹{pay.amount}</p>
                        <span className={`text-[10.5px] font-medium ${pay.status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                          {pay.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-slate-400">No payments yet.</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck size={14} className="text-slate-400" />
                <h5 className="text-[12.5px] font-semibold text-slate-500 uppercase tracking-wide">
                  Assessments ({detail.assessments?.completed ?? 0}/{detail.assessments?.total ?? 0})
                </h5>
              </div>
              {detail.assessments?.list?.length ? (
                <div className="space-y-2">
                  {detail.assessments.list.map((a, i) => (
                    <div key={i} className="px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-100 text-[13px] text-slate-700">
                      {a.personality_type || "Assessment"} — {formatDate(a.completed_at)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-slate-400">No assessments completed.</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck size={14} className="text-slate-400" />
                <h5 className="text-[12.5px] font-semibold text-slate-500 uppercase tracking-wide">
                  Answers
                </h5>
              </div>
              <div className="flex items-center gap-4 px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-100 text-[13px] text-slate-700">
                <span>Total: <b>{detail.answers?.total ?? 0}</b></span>
                <span className="text-emerald-600">Correct: <b>{detail.answers?.correct ?? 0}</b></span>
                <span className="text-rose-500">Wrong: <b>{detail.answers?.wrong ?? 0}</b></span>
                <span>Accuracy: <b>{detail.answers?.accuracy ?? 0}%</b></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
      <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 text-slate-400 ring-1 ring-slate-100">
        <Icon size={14} />
      </span>
      <div className="min-w-0">
        <p className="text-[10.5px] text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-[13px] text-slate-800 font-medium truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Main Patients Page
--------------------------------------------------------- */

export default function PatientsPage() {
  const router = useRouter();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  const [viewingId, setViewingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchPatients = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}?page=${pageNum}`, {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        clearSessionAndRedirect(router);
        return;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json();
      setPatients(json.data?.data || []);
      setMeta(json.data);
    } catch (err) {
      setError(err.message || "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchPatients(page);
  }, [fetchPatients, page]);

  async function handleToggleStatus(patient) {
    setTogglingId(patient.id);
    try {
      const res = await fetch(`${API_BASE}/${patient.id}/toggle-status`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        clearSessionAndRedirect(router);
        return;
      }
      if (!res.ok) throw new Error("Failed to update status");
      const json = await res.json();
      setPatients((prev) =>
        prev.map((p) => (p.id === patient.id ? { ...p, is_active: json.data.is_active } : p))
      );
    } catch (err) {
      alert(err.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(`${API_BASE}/${deleteTarget.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        clearSessionAndRedirect(router);
        return;
      }
      if (!res.ok) throw new Error("Failed to delete patient");
      setPatients((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || "Failed to delete patient");
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = patients.filter((p) => {
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.is_active) ||
      (statusFilter === "inactive" && !p.is_active);
    return matchesSearch && matchesStatus;
  });

  return (
<div className="p-2 lg:p-4 bg-slate-50 min-h-full">    
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900">Patients</h1>
          <p className="text-[13.5px] text-slate-500 mt-0.5">
            {meta?.total ?? 0} total patients registered
          </p>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Patients" value={meta?.total ?? 0} accent="bg-teal-500" />
        <StatCard label="Active" value={patients.filter((p) => p.is_active).length} accent="bg-emerald-500" />
        <StatCard label="Inactive" value={patients.filter((p) => !p.is_active).length} accent="bg-rose-500" />
        <StatCard
          label="Assessments Done"
          value={patients.filter((p) => p.assessment?.completed).length}
          accent="bg-indigo-500"
        />
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[13.5px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "active", "inactive"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3.5 py-2 rounded-lg text-[12.5px] font-medium capitalize transition-colors ${
                statusFilter === f
                  ? "bg-teal-900 text-white"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-[13px]">Loading patients…</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-[13.5px] text-rose-500">{error}</p>
            <button
              onClick={() => fetchPatients(page)}
              className="text-[12.5px] text-teal-600 font-medium hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <p className="text-[13.5px]">No patients found.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Patient</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Contact</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Location</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Payments</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Assessment</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Registered</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} />
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-medium text-slate-800 truncate">{p.name}</p>
                          <p className="text-[11.5px] text-slate-400">#{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[12.5px] text-slate-600">{p.email}</p>
                      <p className="text-[11.5px] text-slate-400">{p.phone}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12.5px] text-slate-600">{p.location || "—"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-medium text-slate-800">₹{p.payments?.total_amount ?? "0.00"}</p>
                      <p className="text-[11.5px] text-slate-400">{p.payments?.total_paid ?? 0} payment(s)</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <AssessmentBadge completed={p.assessment?.completed} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge active={p.is_active} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12.5px] text-slate-500">{formatDate(p.registered_at)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <RowActions
                        patient={p}
                        onView={(pt) => setViewingId(pt.id)}
                        onToggleStatus={handleToggleStatus}
                        onDelete={(pt) => setDeleteTarget(pt)}
                        togglingId={togglingId}
                        deletingId={deletingId}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
            <p className="text-[12px] text-slate-400">
              Showing {meta.from}-{meta.to} of {meta.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg text-[12.5px] font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="text-[12.5px] text-slate-500">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <button
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg text-[12.5px] font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      <PatientDetailDrawer patientId={viewingId} onClose={() => setViewingId(null)} router={router} />

      {/* Delete confirmation */}
      <DeleteConfirmModal
        patient={deleteTarget}
        deleting={deletingId === deleteTarget?.id}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5">
      <span className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center shrink-0`}>
        <Users4 />
      </span>
      <div>
        <p className="text-[19px] font-semibold text-slate-900 leading-none">{value}</p>
        <p className="text-[11.5px] text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

function Users4() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}