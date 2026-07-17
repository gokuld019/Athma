"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CreditCard,
  User,
  Package,
  ShoppingCart,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  IndianRupee,
  Filter,
  X,
} from "lucide-react";

const API_BASE_URL = "https://api.crazystory.in/api/admin";

// ---- Brand tokens ---------------------------------------------------------------
const BRAND = {
  navy: "#2F4479",
  orange: "#E85720",
  forest: "#1F6D48",
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("athma_admin_token");
  const tokenType = localStorage.getItem("athma_admin_token_type") || "Bearer";
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `${tokenType} ${token}`,
  };
};

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "paid_at", direction: "desc" });
  const [showFilters, setShowFilters] = useState(false);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 20,
    total: 0,
    from: 0,
    to: 0,
  });

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
  });

  const fetchPayments = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        let url = `${API_BASE_URL}/payments`;
        const params = new URLSearchParams();
        params.append("page", page);
        if (statusFilter !== "all") params.append("status", statusFilter);
        if (dateRange.from) params.append("from_date", dateRange.from);
        if (dateRange.to) params.append("to_date", dateRange.to);
        if (searchTerm) params.append("search", searchTerm);

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        const response = await fetch(url, { method: "GET", headers: getAuthHeaders() });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("athma_admin_token");
            localStorage.removeItem("athma_admin_token_type");
            localStorage.removeItem("athma_admin_user");
            window.location.href = "/admin/login";
            return;
          }
          throw new Error("Failed to fetch payments");
        }

        const result = await response.json();
        if (result.status === "success") {
          const responseData = result.data;

          if (responseData.data && Array.isArray(responseData.data)) {
            setPayments(responseData.data);
            setPagination({
              currentPage: responseData.current_page || 1,
              lastPage: responseData.last_page || 1,
              perPage: responseData.per_page || 20,
              total: responseData.total || 0,
              from: responseData.from || 0,
              to: responseData.to || 0,
            });

            const currentPagePayments = responseData.data;
            const totalRev = currentPagePayments.reduce(
              (sum, p) => sum + parseFloat(p.amount || 0),
              0
            );

            setStats({
              totalRevenue: totalRev,
              totalPayments: responseData.total || currentPagePayments.length,
              successfulPayments: currentPagePayments.filter((p) => p.status === "paid").length,
              failedPayments: currentPagePayments.filter((p) => p.status === "failed").length,
              pendingPayments: currentPagePayments.filter((p) => p.status === "pending").length,
            });
          } else if (Array.isArray(responseData)) {
            setPayments(responseData);
            setPagination({
              currentPage: 1,
              lastPage: 1,
              perPage: responseData.length,
              total: responseData.length,
              from: 1,
              to: responseData.length,
            });

            const totalRev = responseData.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            setStats({
              totalRevenue: totalRev,
              totalPayments: responseData.length,
              successfulPayments: responseData.filter((p) => p.status === "paid").length,
              failedPayments: responseData.filter((p) => p.status === "failed").length,
              pendingPayments: responseData.filter((p) => p.status === "pending").length,
            });
          }
        } else {
          throw new Error(result.message || "Failed to load payments");
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching payments:", err);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, dateRange, searchTerm]
  );

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

  const fetchPaymentDetails = async (paymentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("athma_admin_token");
          localStorage.removeItem("athma_admin_token_type");
          localStorage.removeItem("athma_admin_user");
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to fetch payment details");
      }

      const result = await response.json();
      if (result.status === "success") {
        setSelectedPayment(result.data);
        setShowDetailModal(true);
      } else {
        throw new Error(result.message || "Failed to load payment details");
      }
    } catch (err) {
      console.error("Error fetching payment details:", err);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.lastPage) {
      fetchPayments(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedPayments = [...payments].sort((a, b) => {
    if (sortConfig.key === "amount") {
      return sortConfig.direction === "asc"
        ? parseFloat(a.amount) - parseFloat(b.amount)
        : parseFloat(b.amount) - parseFloat(a.amount);
    }
    if (sortConfig.key === "paid_at" || sortConfig.key === "created_at") {
      return sortConfig.direction === "asc"
        ? new Date(a[sortConfig.key]) - new Date(b[sortConfig.key])
        : new Date(b[sortConfig.key]) - new Date(a[sortConfig.key]);
    }
    const aVal = (a[sortConfig.key] || "").toLowerCase();
    const bVal = (b[sortConfig.key] || "").toLowerCase();
    return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: {
        icon: CheckCircle,
        class: "bg-[#1F6D48]/10 text-[#1F6D48] border-[#1F6D48]/20",
        dot: "bg-[#1F6D48]",
      },
      failed: {
        icon: XCircle,
        class: "bg-rose-50 text-rose-700 border-rose-200",
        dot: "bg-rose-500",
      },
      pending: {
        icon: Clock,
        class: "bg-[#E85720]/10 text-[#E85720] border-[#E85720]/20",
        dot: "bg-[#E85720]",
      },
      refunded: {
        icon: AlertCircle,
        class: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
      },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    const StatusIcon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] md:text-xs font-medium border whitespace-nowrap ${config.class}`}
      >
        <span className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${config.dot}`} />
        <StatusIcon size={11} className="sm:w-[12px] sm:h-[12px]" />
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown"}
      </span>
    );
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(pagination.lastPage, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  // Mobile Payment Card Component
  const MobilePaymentCard = ({ payment }) => (
    <div className="bg-white rounded-xl border border-slate-100 p-3 sm:p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2F4479] flex items-center justify-center shrink-0">
            <User size={13} className="sm:w-[14px] sm:h-[14px] text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] sm:text-[13px] font-medium text-slate-800 truncate">
              {payment.user_name || "Unknown"}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">#{payment.id}</p>
          </div>
        </div>
        {getStatusBadge(payment.status)}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-[12px]">
        <div>
          <p className="text-slate-400 text-[10px] sm:text-[10.5px]">Package</p>
          <p className="text-slate-700 font-medium truncate">{payment.package_name || "N/A"}</p>
        </div>
        <div>
          <p className="text-slate-400 text-[10px] sm:text-[10.5px]">Amount</p>
          <p className="text-slate-800 font-semibold">{formatCurrency(payment.amount)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-slate-400 text-[10px] sm:text-[10.5px]">Date</p>
          <p className="text-slate-600">{formatDate(payment.paid_at || payment.created_at)}</p>
        </div>
      </div>

      <button
        onClick={() => fetchPaymentDetails(payment.id)}
        className="w-full py-2 rounded-lg bg-[#2F4479]/5 text-[#2F4479] text-[11px] sm:text-[12px] font-medium hover:bg-[#2F4479]/10 transition-colors"
      >
        View Details
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F7FA]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/70">
        <div className="mx-auto px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 md:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#2F4479] flex items-center justify-center shrink-0">
                <IndianRupee size={16} className="sm:w-[18px] sm:h-[18px] text-white" strokeWidth={2.25} />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-[22px] font-semibold text-[#1E2A47] tracking-tight">
                  Payments
                </h1>
                <p className="text-slate-500 text-[11px] sm:text-[12px] md:text-[13px] mt-0.5">
                  All transactions, in one place
                  {pagination.total > 0 && (
                    <span className="text-slate-400"> · {pagination.total} total</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                onClick={() => fetchPayments(pagination.currentPage)}
                className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-200 hover:border-[#2F4479]/30 hover:bg-[#2F4479]/5 transition-colors group"
                title="Refresh payments"
              >
                <RefreshCw
                  size={15}
                  className={`sm:w-[17px] sm:h-[17px] text-slate-500 group-hover:text-[#2F4479] transition-colors ${
                    loading ? "animate-spin" : ""
                  }`}
                />
              </button>
              <button
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#2F4479] hover:bg-[#263a68] rounded-lg sm:rounded-xl transition-colors text-[11px] sm:text-[12px] md:text-[13px] font-medium text-white shadow-sm shadow-[#2F4479]/20"
                title="Export payments data"
              >
                <Download size={14} className="sm:w-[15px] sm:h-[15px]" />
                <span className="hidden xs:inline">Export</span>
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Filter size={15} className="sm:w-[17px] sm:h-[17px] text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-9xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-6 md:py-8">
        {/* Stats - 2 cols mobile, 3 cols tablet, 5 cols desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-7">
          <StatCard
            icon={<IndianRupee size={15} className="sm:w-[17px] sm:h-[17px] text-white" strokeWidth={2.25} />}
            iconBg="bg-[#2F4479]"
            value={formatCurrency(stats.totalRevenue)}
            label="Total Revenue"
            badge={
              stats.totalRevenue > 0 && (
                <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-[#1F6D48] bg-[#1F6D48]/10 px-1.5 sm:px-2 py-0.5 rounded-md">
                  <ArrowUpRight size={10} className="sm:w-[11px] sm:h-[11px]" />
                  Total
                </span>
              )
            }
          />
          <StatCard
            icon={<ShoppingCart size={15} className="sm:w-[17px] sm:h-[17px] text-white" strokeWidth={2.25} />}
            iconBg="bg-[#3E5490]"
            value={pagination.total || stats.totalPayments}
            label="Transactions"
          />
          <StatCard
            icon={<CheckCircle size={15} className="sm:w-[17px] sm:h-[17px] text-white" strokeWidth={2.25} />}
            iconBg="bg-[#1F6D48]"
            value={stats.successfulPayments}
            valueClass="text-[#1F6D48]"
            label="Successful"
          />
          <StatCard
            icon={<Clock size={15} className="sm:w-[17px] sm:h-[17px] text-white" strokeWidth={2.25} />}
            iconBg="bg-[#E85720]"
            value={stats.pendingPayments || 0}
            valueClass="text-[#E85720]"
            label="Pending"
          />
          <StatCard
            icon={<XCircle size={15} className="sm:w-[17px] sm:h-[17px] text-white" strokeWidth={2.25} />}
            iconBg="bg-rose-500"
            value={stats.failedPayments}
            valueClass="text-rose-600"
            label="Failed"
          />
        </div>

        {/* Filters - collapsible on mobile */}
        <div className={`bg-white rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-sm p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="flex flex-col lg:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} className="sm:w-[17px] sm:h-[17px]" />
              <input
                type="text"
                placeholder="Search by user name or payment ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 focus:border-[#2F4479] focus:ring-2 focus:ring-[#2F4479]/10 outline-none transition-all text-[12px] sm:text-[13px] md:text-[13.5px] placeholder:text-slate-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 focus:border-[#2F4479] focus:ring-2 focus:ring-[#2F4479]/10 outline-none text-[12px] sm:text-[13px] md:text-[13.5px] font-medium text-slate-700 bg-white min-w-[120px] sm:min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Calendar size={14} className="sm:w-[15px] sm:h-[15px] text-slate-400 shrink-0" />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                className="flex-1 sm:flex-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 focus:border-[#2F4479] focus:ring-2 focus:ring-[#2F4479]/10 outline-none text-[12px] sm:text-[13px] md:text-[13.5px]"
                title="From date"
              />
              <span className="text-slate-400 text-[12px] sm:text-[13px]">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                className="flex-1 sm:flex-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 focus:border-[#2F4479] focus:ring-2 focus:ring-[#2F4479]/10 outline-none text-[12px] sm:text-[13px] md:text-[13.5px]"
                title="To date"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 sm:py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 border-[3px] border-[#2F4479]/15 border-t-[#2F4479] rounded-full animate-spin" />
                <p className="text-slate-500 text-[12px] sm:text-[13px] font-medium">Loading payments...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 sm:py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 sm:p-3.5 rounded-full bg-rose-50">
                  <XCircle size={24} className="sm:w-[28px] sm:h-[28px] text-rose-500" />
                </div>
                <p className="text-slate-700 font-medium text-[13px] sm:text-[14px]">Failed to load payments</p>
                <p className="text-slate-500 text-[12px] sm:text-[13px]">{error}</p>
                <button
                  onClick={() => fetchPayments(pagination.currentPage)}
                  className="mt-1 px-3 sm:px-4 py-2 bg-[#2F4479] text-white rounded-lg sm:rounded-xl hover:bg-[#263a68] transition-colors text-[12px] sm:text-[13px] font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : sortedPayments.length === 0 ? (
            <div className="flex items-center justify-center py-16 sm:py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 sm:p-3.5 rounded-full bg-slate-50">
                  <CreditCard size={24} className="sm:w-[28px] sm:h-[28px] text-slate-400" />
                </div>
                <p className="text-slate-700 font-medium text-[13px] sm:text-[14px]">No payments found</p>
                <p className="text-slate-500 text-[12px] sm:text-[13px]">Try adjusting your filters or search terms</p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table - hidden on mobile */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <Th>Payment ID</Th>
                      <Th sortable sortKey="user_name" sortConfig={sortConfig} onSort={handleSort}>
                        Customer
                      </Th>
                      <Th className="hidden lg:table-cell">Package</Th>
                      <Th sortable sortKey="amount" sortConfig={sortConfig} onSort={handleSort}>
                        Amount
                      </Th>
                      <Th>Status</Th>
                      <Th sortable sortKey="paid_at" sortConfig={sortConfig} onSort={handleSort}>
                        Date
                      </Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPayments.map((payment, index) => (
                      <tr
                        key={payment.id}
                        className={`border-b border-slate-50 hover:bg-[#2F4479]/[0.03] transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                        }`}
                      >
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 lg:px-6">
                          <span className="text-[11px] sm:text-[12px] md:text-[13px] font-mono text-slate-500">#{payment.id}</span>
                        </td>
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 lg:px-6">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2F4479] flex items-center justify-center shrink-0">
                              <User size={12} className="sm:w-[13px] sm:h-[13px] text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12px] sm:text-[13px] md:text-[13.5px] font-medium text-slate-800 truncate max-w-[120px] lg:max-w-[150px]">
                                {payment.user_name || "Unknown"}
                              </p>
                              {payment.user_email && (
                                <p className="text-[10px] sm:text-[11px] md:text-[11.5px] text-slate-500 truncate max-w-[120px] lg:max-w-[150px]">{payment.user_email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 lg:px-6 hidden lg:table-cell">
                          <span className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] text-slate-700">
                            <Package size={12} className="sm:w-[13px] sm:h-[13px] text-slate-400" />
                            {payment.package_name || payment.package?.name || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 lg:px-6">
                          <span className="text-[12px] sm:text-[13px] md:text-[13.5px] font-semibold text-slate-800">
                            {formatCurrency(payment.amount)}
                          </span>
                        </td>
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 lg:px-6">{getStatusBadge(payment.status)}</td>
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 lg:px-6">
                          <p className="text-[11px] sm:text-[12px] md:text-[13px] text-slate-600 whitespace-nowrap">
                            {formatDate(payment.paid_at || payment.created_at)}
                          </p>
                        </td>
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 lg:px-6">
                          <button
                            onClick={() => fetchPaymentDetails(payment.id)}
                            className="text-[12px] sm:text-[13px] font-medium text-[#2F4479] hover:text-[#E85720] transition-colors whitespace-nowrap"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards - visible only on mobile */}
              <div className="md:hidden p-2 sm:p-3 space-y-2 sm:space-y-3">
                {sortedPayments.map((payment) => (
                  <MobilePaymentCard key={payment.id} payment={payment} />
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {!loading && !error && pagination.lastPage > 1 && (
            <div className="border-t border-slate-100 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] sm:text-[12px] md:text-[13px] text-slate-500 text-center sm:text-left">
                  Showing {pagination.from} to {pagination.to} of {pagination.total} results
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="p-1.5 sm:p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={14} className="sm:w-[15px] sm:h-[15px] text-slate-600" />
                  </button>

                  {/* Page numbers - hidden on very small screens */}
                  <div className="hidden sm:flex items-center gap-1">
                    {getPageNumbers().map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[12px] sm:text-[13px] font-medium transition-colors ${
                          page === pagination.currentPage
                            ? "bg-[#2F4479] text-white shadow-sm shadow-[#2F4479]/30"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {/* Mobile page indicator */}
                  <span className="sm:hidden text-[12px] font-medium text-slate-600 px-2">
                    {pagination.currentPage} / {pagination.lastPage}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.lastPage}
                    className="p-1.5 sm:p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={14} className="sm:w-[15px] sm:h-[15px] text-slate-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1E2A47]/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-[95%] sm:max-w-lg md:max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[#1E2A47]">Payment Details</h2>
                <p className="text-[11px] sm:text-[13px] text-slate-500">Transaction #{selectedPayment.id}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedPayment(null);
                }}
                className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors"
              >
                <XCircle size={18} className="sm:w-[19px] sm:h-[19px] text-slate-500" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div
                className={`p-3 sm:p-4 rounded-xl border ${
                  selectedPayment.status === "paid"
                    ? "bg-[#1F6D48]/[0.06] border-[#1F6D48]/15"
                    : selectedPayment.status === "failed"
                    ? "bg-rose-50 border-rose-200"
                    : "bg-[#E85720]/[0.06] border-[#E85720]/15"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {getStatusBadge(selectedPayment.status)}
                    <span className="text-[12px] sm:text-[13px] text-slate-600">
                      {selectedPayment.status === "paid"
                        ? "Payment completed successfully"
                        : selectedPayment.status === "failed"
                        ? "Payment failed"
                        : "Payment pending"}
                    </span>
                  </div>
                  <span className="text-lg sm:text-xl font-semibold text-[#1E2A47]">
                    {formatCurrency(selectedPayment.amount)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <User size={14} className="sm:w-[15px] sm:h-[15px] text-[#2F4479]" />
                    <h3 className="text-[12px] sm:text-[13px] font-semibold text-slate-700">Customer</h3>
                  </div>
                  <p className="text-[12px] sm:text-[13.5px] font-medium text-slate-800">
                    {selectedPayment.user?.name || selectedPayment.user_name || "N/A"}
                  </p>
                  <p className="text-[11px] sm:text-[12px] text-slate-500 mt-1">
                    {selectedPayment.user?.email || selectedPayment.user_email || "N/A"}
                  </p>
                </div>

                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <Package size={14} className="sm:w-[15px] sm:h-[15px] text-[#2F4479]" />
                    <h3 className="text-[12px] sm:text-[13px] font-semibold text-slate-700">Package</h3>
                  </div>
                  <p className="text-[12px] sm:text-[13.5px] font-medium text-slate-800">
                    {selectedPayment.package?.name || selectedPayment.package_name || "N/A"}
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <CreditCard size={14} className="sm:w-[15px] sm:h-[15px] text-[#2F4479]" />
                  <h3 className="text-[12px] sm:text-[13px] font-semibold text-slate-700">Razorpay Details</h3>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  {selectedPayment.razorpay_order_id && (
                    <div className="flex flex-col sm:flex-row sm:justify-between text-[12px] sm:text-[13px] gap-0.5">
                      <span className="text-slate-500">Order ID</span>
                      <span className="font-mono text-slate-700 text-[10px] sm:text-[11.5px] break-all">
                        {selectedPayment.razorpay_order_id}
                      </span>
                    </div>
                  )}
                  {selectedPayment.razorpay_payment_id && (
                    <div className="flex flex-col sm:flex-row sm:justify-between text-[12px] sm:text-[13px] gap-0.5">
                      <span className="text-slate-500">Payment ID</span>
                      <span className="font-mono text-slate-700 text-[10px] sm:text-[11.5px] break-all">
                        {selectedPayment.razorpay_payment_id}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <Clock size={14} className="sm:w-[15px] sm:h-[15px] text-[#2F4479]" />
                    <h3 className="text-[11px] sm:text-[12px] font-semibold text-slate-700">Created At</h3>
                  </div>
                  <p className="text-[12px] sm:text-[13px] text-slate-600">{formatDate(selectedPayment.created_at)}</p>
                </div>
                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <CheckCircle size={14} className="sm:w-[15px] sm:h-[15px] text-[#1F6D48]" />
                    <h3 className="text-[11px] sm:text-[12px] font-semibold text-slate-700">Paid At</h3>
                  </div>
                  <p className="text-[12px] sm:text-[13px] text-slate-600">
                    {selectedPayment.paid_at ? formatDate(selectedPayment.paid_at) : "Not paid yet"}
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-4 sm:px-6 py-3 sm:py-4 rounded-b-xl sm:rounded-b-2xl">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedPayment(null);
                }}
                className="w-full py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl font-medium text-[12px] sm:text-[13.5px] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, iconBg, value, label, valueClass = "text-slate-800", badge }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-[18px] border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${iconBg}`}>{icon}</div>
        {badge}
      </div>
      <p className={`text-base sm:text-lg md:text-[22px] font-semibold leading-tight ${valueClass} truncate`}>{value}</p>
      <p className="text-[11px] sm:text-[12px] md:text-[13px] text-slate-500 mt-0.5 sm:mt-1">{label}</p>
    </div>
  );
}

function Th({ children, sortable, sortKey, sortConfig, onSort, className = "" }) {
  if (!sortable) {
    return (
      <th className={`text-left py-3 sm:py-3.5 px-3 sm:px-4 lg:px-6 text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider ${className}`}>
        {children}
      </th>
    );
  }
  return (
    <th
      className={`text-left py-3 sm:py-3.5 px-3 sm:px-4 lg:px-6 text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-[#2F4479] transition-colors select-none ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortConfig.key === sortKey &&
          (sortConfig.direction === "asc" ? <ChevronUp size={12} className="sm:w-[13px] sm:h-[13px]" /> : <ChevronDown size={12} className="sm:w-[13px] sm:h-[13px]" />)}
      </div>
    </th>
  );
}