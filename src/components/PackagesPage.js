"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  ChevronRight,
  ChevronLeft,
  FileQuestion,
  Clock,
  IndianRupee,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Eye,
  X,
} from "lucide-react";

const API_BASE_URL = "https://api.crazystory.in/api/admin";

const QUESTIONS_PER_PAGE = 6;

// ============================================================
// View Details Modal
// ============================================================
function ViewDetailsModal({ title, data, onClose }) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-5">
      <div className="bg-white rounded-2xl w-full max-w-[420px] p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-brand text-lg font-semibold text-teal-900">{title}</h3>
          <button onClick={onClose} className="text-ink-soft hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {Object.entries(data).map(([key, value]) => {
            // Skip internal/technical fields
            if (['id', 'package_id', 'subheading_id', 'category_id', 'slug', 'created_at', 'updated_at'].includes(key)) {
              return null;
            }
            
            return (
              <div key={key} className="bg-[#F7F8F6] rounded-[10px] px-4 py-3">
                <p className="text-[11px] text-ink-soft uppercase tracking-wider font-medium mb-1">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="text-[14px] font-medium text-ink">
                  {typeof value === "boolean" || value === 1 || value === 0 ? (
                    value ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 size={14} /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-500">
                        <XCircle size={14} /> Inactive
                      </span>
                    )
                  ) : value ? (
                    value
                  ) : (
                    <span className="text-ink-soft italic">Not set</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-2.5 rounded-[9px] bg-teal-900 hover:bg-teal-800 text-white font-semibold text-[13.5px] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Questions Management Component (View Only)
// ============================================================
function QuestionsPanel({ packageId, subheadingId, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDetailsModal, setViewDetailsModal] = useState(null);
  const [qSearch, setQSearch] = useState("");
  const [answerFilter, setAnswerFilter] = useState("all");
  const [qPage, setQPage] = useState(1);

  useEffect(() => {
    fetchQuestions();
  }, [subheadingId]);

  const getToken = () => {
    const token = localStorage.getItem("athma_admin_token");
    const tokenType = localStorage.getItem("athma_admin_token_type") || "Bearer";
    return { token, tokenType };
  };

  const fetchQuestions = async () => {
    try {
      const { token, tokenType } = getToken();
      const res = await fetch(`${API_BASE_URL}/questions?subheading_id=${subheadingId}`, {
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
          setQuestions(data);
        } else if (data && typeof data === 'object') {
          const arrayData = data.data || data.questions || [];
          setQuestions(Array.isArray(arrayData) ? arrayData : []);
        } else {
          setQuestions([]);
        }
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error("Failed to fetch questions:", err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.question_text.toLowerCase().includes(qSearch.toLowerCase());
    const matchesAnswer = answerFilter === "all" || 
      (answerFilter === "yes" && q.correct_answer === "YES") ||
      (answerFilter === "no" && q.correct_answer === "NO") ||
      (answerFilter === "text" && q.question_type === "text");
    return matchesSearch && matchesAnswer;
  });

  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);
  const paginatedQuestions = filteredQuestions.slice(
    (qPage - 1) * QUESTIONS_PER_PAGE,
    qPage * QUESTIONS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-teal-600" />
        <span className="ml-3 text-ink-soft text-sm">Loading questions...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-teal-700 hover:text-teal-900 font-medium text-[13px] mb-2"
          >
            <ChevronLeft size={16} /> Back to Subheadings
          </button>
          <h2 className="font-brand text-lg font-bold text-teal-900">Questions</h2>
          <p className="text-ink-soft text-[13px] mt-0.5">
            Total: {filteredQuestions.length} questions
          </p>
        </div>
      </div>

      {/* Search and filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            placeholder="Search questions..."
            value={qSearch}
            onChange={(e) => { setQSearch(e.target.value); setQPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-line rounded-[9px] text-[13px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500"
          />
        </div>
        <select
          value={answerFilter}
          onChange={(e) => { setAnswerFilter(e.target.value); setQPage(1); }}
          className="px-3 py-2.5 border border-line rounded-[9px] text-[13px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500"
        >
          <option value="all">All Types</option>
          <option value="yes">Yes/No - Yes</option>
          <option value="no">Yes/No - No</option>
          <option value="text">Text Questions</option>
        </select>
      </div>

      {/* Questions list */}
      {paginatedQuestions.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl px-6 py-16 text-center">
          <FileQuestion size={32} className="text-teal-400 mx-auto mb-3" />
          <p className="text-ink-soft text-[13.5px]">
            {questions.length === 0 ? "No questions found." : "No questions match your filters."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {paginatedQuestions.map((q, index) => {
            const questionNumber = (qPage - 1) * QUESTIONS_PER_PAGE + index + 1;
            
            return (
              <div
                key={q.id}
                className={`bg-white border rounded-[14px] px-5 py-4 hover:border-teal-500 transition-colors ${
                  !q.is_active ? "border-rose-200 bg-rose-50/30" : "border-line"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        q.question_type === "yes_no" 
                          ? "bg-blue-50 text-blue-700" 
                          : "bg-purple-50 text-purple-700"
                      }`}>
                        {q.question_type === "yes_no" ? "Yes/No" : "Text"}
                      </span>
                      {q.correct_answer && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          q.correct_answer === "YES" 
                            ? "bg-green-50 text-green-700" 
                            : "bg-red-50 text-red-700"
                        }`}>
                          Answer: {q.correct_answer}
                        </span>
                      )}
                      <span className="text-[10px] text-ink-soft">Order: {q.display_order}</span>
                      {!q.is_active && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-ink text-[14px]">
                      <span className="text-teal-700 font-semibold">{questionNumber}.</span> {q.question_text}
                    </p>
                    {q.question_type === "text" && q.sample_answer && (
                      <p className="text-[12px] text-ink-soft mt-1">
                        Sample: {q.sample_answer}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setViewDetailsModal({ title: "Question Details", data: q })}
                      className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center hover:bg-teal-100"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setQPage((p) => Math.max(1, p - 1))}
            disabled={qPage === 1}
            className="w-9 h-9 rounded-lg border border-line flex items-center justify-center hover:bg-teal-50 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setQPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-[13px] font-medium ${
                qPage === i + 1
                  ? "bg-teal-900 text-white"
                  : "border border-line hover:bg-teal-50"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setQPage((p) => Math.min(totalPages, p + 1))}
            disabled={qPage === totalPages}
            className="w-9 h-9 rounded-lg border border-line flex items-center justify-center hover:bg-teal-50 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* View Details Modal */}
      {viewDetailsModal && (
        <ViewDetailsModal
          title={viewDetailsModal.title}
          data={viewDetailsModal.data}
          onClose={() => setViewDetailsModal(null)}
        />
      )}
    </>
  );
}

// ============================================================
// Main PackagesPage Component (View Only)
// ============================================================
export default function PackagesPage({ search }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize view from localStorage, default to "packages"
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('packages_view_state');
      if (savedView) {
        try {
          return JSON.parse(savedView);
        } catch (e) {
          return { level: "packages", packageId: null, categoryId: null };
        }
      }
    }
    return { level: "packages", packageId: null, categoryId: null };
  });
  
  const [viewDetailsModal, setViewDetailsModal] = useState(null);
  const [subheadings, setSubheadings] = useState([]);
  const [loadingSubheadings, setLoadingSubheadings] = useState(false);

  // Persist view state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('packages_view_state', JSON.stringify(view));
    }
  }, [view]);

  useEffect(() => {
    fetchPackages();
  }, []);

  // Load data based on persisted view
  useEffect(() => {
    if (view.level === "categories" && view.packageId) {
      fetchSubheadings(view.packageId);
    }
  }, [view.level, view.packageId]);

  const getToken = () => {
    const token = localStorage.getItem("athma_admin_token");
    const tokenType = localStorage.getItem("athma_admin_token_type") || "Bearer";
    return { token, tokenType };
  };

  const fetchPackages = async () => {
    try {
      const { token, tokenType } = getToken();
      
      const res = await fetch(`${API_BASE_URL}/packages`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType} ${token}`,
        },
      });
      
      const result = await res.json();
      if (result.status === "success") {
        const data = Array.isArray(result.data) ? result.data : [];
        setPackages(data.map(pkg => ({
          id: pkg.id,
          name: pkg.name,
          slug: pkg.slug,
          description: pkg.description || "",
          age: pkg.age_group || "",
          price: parseFloat(pkg.price) || 0,
          duration: "15 - 20 mins",
          is_active: pkg.is_active,
        })));
      } else {
        setPackages([]);
      }
    } catch (err) {
      console.error("Failed to fetch packages:", err);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubheadings = async (packageId) => {
    setLoadingSubheadings(true);
    setSubheadings([]);
    try {
      const { token, tokenType } = getToken();
      
      const res = await fetch(`${API_BASE_URL}/subheadings/package/${packageId}`, {
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
          setSubheadings(data);
        } else if (data && typeof data === 'object') {
          const arrayData = data.data || data.subheadings || [];
          setSubheadings(Array.isArray(arrayData) ? arrayData : [data]);
        } else {
          setSubheadings([]);
        }
      } else {
        setSubheadings([]);
      }
    } catch (err) {
      console.error("Failed to fetch subheadings:", err);
      setSubheadings([]);
    } finally {
      setLoadingSubheadings(false);
    }
  };

  const activePackage = packages.find((p) => p.id === view.packageId);

  const filteredPackages = packages.filter((p) =>
    p.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const goToPackages = () => {
    setView({ level: "packages", packageId: null, categoryId: null });
    setSubheadings([]);
  };

  const handleViewSubheadings = (pkg) => {
    setView({ level: "categories", packageId: pkg.id, categoryId: null });
    fetchSubheadings(pkg.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-teal-600" />
        <span className="ml-3 text-ink-soft text-sm">Loading packages...</span>
      </div>
    );
  }

  return (
    <>
      {/* LEVEL 1: PACKAGES */}
      {view.level === "packages" && (
        <>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-brand text-lg font-bold text-teal-900">Care Packages</h2>
              <p className="text-ink-soft text-[13px] mt-0.5">
                View packages, subheadings, and questions.
              </p>
            </div>
          </div>

          {filteredPackages.length === 0 ? (
            <p className="text-ink-soft text-[13.5px] text-center py-16">
              {search ? `No packages match "${search}".` : "No packages found."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`bg-white border rounded-2xl p-5 hover:shadow-[0_4px_20px_rgba(43,62,99,0.08)] transition-shadow ${
                    !pkg.is_active ? "border-rose-200 bg-rose-50/30" : "border-line"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-teal-900 text-[16px]">{pkg.name}</h3>
                      <p className="text-[12px] text-ink-soft mt-0.5">{pkg.age}</p>
                      {!pkg.is_active && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold">
                          <XCircle size={10} /> Inactive
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setViewDetailsModal({ title: "Package Details", data: pkg })}
                      className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center hover:bg-teal-100"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                  </div>

                  {pkg.description && (
                    <p className="text-[12px] text-ink-soft mb-3 line-clamp-2">{pkg.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-[12.5px] text-ink-soft mb-4">
                    <span className="flex items-center gap-1 font-semibold text-gray-800">
                      <IndianRupee size={12} /> {pkg.price}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-teal-600" /> {pkg.duration}
                    </span>
                  </div>

                  <button
                    onClick={() => handleViewSubheadings(pkg)}
                    className="w-full py-2.5 rounded-[9px] border border-line hover:border-teal-500 hover:bg-teal-50 text-teal-800 font-semibold text-[13px] transition-colors flex items-center justify-center gap-1.5"
                  >
                    View Subheadings
                    <ChevronRight size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* LEVEL 2: SUBHEADINGS (CATEGORIES) */}
      {view.level === "categories" && activePackage && (
        <>
          <div className="flex items-center justify-between mb-5">
            <div>
              <button
                onClick={goToPackages}
                className="flex items-center gap-1 text-teal-700 hover:text-teal-900 font-medium text-[13px] mb-2"
              >
                <ChevronLeft size={16} /> Back to Packages
              </button>
              <h2 className="font-brand text-lg font-bold text-teal-900">
                {activePackage.name} — Subheadings
              </h2>
              <p className="text-ink-soft text-[13px] mt-0.5">
                View subheadings for this package.
              </p>
            </div>
          </div>

          {loadingSubheadings ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin text-teal-600" />
              <span className="ml-3 text-ink-soft text-sm">Loading subheadings...</span>
            </div>
          ) : Array.isArray(subheadings) && subheadings.length > 0 ? (
            <div className="flex flex-col gap-3">
              {subheadings.map((sub) => (
                <div
                  key={sub.id}
                  className={`bg-white border rounded-[14px] px-5 py-4 flex items-center justify-between hover:border-teal-500 transition-colors ${
                    !sub.is_active ? "border-rose-200 bg-rose-50/30" : "border-line"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-ink text-[15px]">{sub.name}</p>
                    <p className="text-[12.5px] text-ink-soft mt-0.5">
                      {sub.question_count || 0} questions
                      {sub.description && ` · ${sub.description}`}
                    </p>
                    {!sub.is_active && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold">
                        <XCircle size={10} /> Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewDetailsModal({ title: "Subheading Details", data: sub })}
                      className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center hover:bg-teal-100"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => setView({ 
                        level: "questions", 
                        packageId: activePackage.id, 
                        categoryId: sub.id 
                      })}
                      className="ml-1 px-3.5 py-2 rounded-[9px] bg-teal-50 text-teal-800 font-semibold text-[12.5px] hover:bg-teal-100 transition-colors flex items-center gap-1"
                    >
                      View Questions <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ink-soft text-[13.5px] text-center py-10">
              No subheadings found.
            </p>
          )}
        </>
      )}

      {/* LEVEL 3: QUESTIONS */}
      {view.level === "questions" && (
        <QuestionsPanel
          packageId={view.packageId}
          subheadingId={view.categoryId}
          onBack={() => setView({ 
            level: "categories", 
            packageId: view.packageId, 
            categoryId: null 
          })}
        />
      )}

      {/* View Details Modal */}
      {viewDetailsModal && (
        <ViewDetailsModal
          title={viewDetailsModal.title}
          data={viewDetailsModal.data}
          onClose={() => setViewDetailsModal(null)}
        />
      )}
    </>
  );
}