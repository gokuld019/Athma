"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronLeft,
  X,
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
  Download,
  Upload,
  Filter,
  Layers,
} from "lucide-react";

const API_BASE_URL = "https://api.crazystory.in/api/admin";

const ANSWER_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const QUESTIONS_PER_PAGE = 6;

// ============================================================
// Response Modal
// ============================================================
function ResponseModal({ response, onClose }) {
  if (!response) return null;
  const { status, message, data } = response;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-5">
      <div className="bg-white rounded-2xl w-full max-w-[420px] p-6">
        <div className="flex flex-col items-center text-center mb-5">
          {status === "success" ? (
            <span className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <CheckCircle2 size={26} className="text-emerald-500" />
            </span>
          ) : (
            <span className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-3">
              <XCircle size={26} className="text-rose-500" />
            </span>
          )}
          <h3 className="font-brand text-lg font-bold text-teal-900">
            {status === "success" ? "Success" : "Error"}
          </h3>
          <p className="text-[13px] text-ink-soft mt-1">{message || "Operation completed."}</p>
        </div>

        {data && (
          <div className="bg-[#F7F8F6] rounded-[12px] px-4 py-3 mb-5 max-h-[300px] overflow-y-auto">
            {Object.entries(data).map(([key, value]) => {
              if (typeof value === "object" && value !== null) return null;
              return (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-line/50 last:border-0">
                  <span className="text-[12px] text-ink-soft capitalize">{key.replace(/_/g, " ")}</span>
                  <span className="text-[12.5px] font-medium text-ink">
                    {typeof value === "boolean" || value === 1 || value === 0 ? (
                      value ? (
                        <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={12} /> Active</span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-500"><XCircle size={12} /> Inactive</span>
                      )
                    ) : (
                      value ?? "—"
                    )}
                  </span>
                </div>
              );
            })}
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
// Confirm Delete Modal
// ============================================================
function ConfirmDeleteModal({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-5">
      <div className="bg-white rounded-2xl w-full max-w-[400px] p-6">
        <div className="flex flex-col items-center text-center mb-5">
          <span className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-3">
            <AlertCircle size={26} className="text-rose-500" />
          </span>
          <h3 className="font-brand text-lg font-bold text-teal-900">{title || "Confirm Delete"}</h3>
          <p className="text-[13px] text-ink-soft mt-1">{message || "Are you sure you want to delete this item?"}</p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-[9px] border border-line text-ink-soft font-medium text-[13.5px] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[9px] bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[13.5px] transition-colors disabled:opacity-70"
          >
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /> Deleting...</>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Bulk Create Questions Modal
// ============================================================
function BulkCreateModal({ onSave, onClose, loading }) {
  const [bulkQuestions, setBulkQuestions] = useState([
    { question_type: "yes_no", question_text: "", correct_answer: "YES", sample_answer: "", display_order: 1 }
  ]);

  const addBulkQuestion = () => {
    setBulkQuestions([...bulkQuestions, {
      question_type: "yes_no",
      question_text: "",
      correct_answer: "YES",
      sample_answer: "",
      display_order: bulkQuestions.length + 1
    }]);
  };

  const removeBulkQuestion = (index) => {
    if (bulkQuestions.length <= 1) return;
    const updated = bulkQuestions.filter((_, i) => i !== index);
    setBulkQuestions(updated);
  };

  const updateBulkQuestion = (index, field, value) => {
    const updated = [...bulkQuestions];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "question_type") {
      if (value === "yes_no") {
        updated[index].correct_answer = "YES";
        updated[index].sample_answer = "";
      } else {
        updated[index].correct_answer = "";
        updated[index].sample_answer = "";
      }
    }
    setBulkQuestions(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-5">
      <div className="bg-white rounded-2xl w-full max-w-[600px] p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-brand text-lg font-semibold text-teal-900">Bulk Create Questions</h3>
          <button onClick={onClose} className="text-ink-soft hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {bulkQuestions.map((q, index) => (
            <div key={index} className="border border-line rounded-[12px] p-4 bg-[#FCFDFC]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold text-teal-700">Question {index + 1}</span>
                {bulkQuestions.length > 1 && (
                  <button
                    onClick={() => removeBulkQuestion(index)}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-ink mb-1">Type</label>
                  <select
                    value={q.question_type}
                    onChange={(e) => updateBulkQuestion(index, "question_type", e.target.value)}
                    className="w-full px-3 py-2 border border-line rounded-[8px] text-[13px] bg-white"
                  >
                    <option value="yes_no">Yes/No</option>
                    <option value="text">Text</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium text-ink mb-1">Question Text</label>
                  <textarea
                    value={q.question_text}
                    onChange={(e) => updateBulkQuestion(index, "question_text", e.target.value)}
                    placeholder="Enter question..."
                    rows={2}
                    className="w-full px-3 py-2 border border-line rounded-[8px] text-[13px] bg-white resize-none"
                  />
                </div>

                {q.question_type === "yes_no" && (
                  <div>
                    <label className="block text-[11.5px] font-medium text-ink mb-1">Correct Answer</label>
                    <select
                      value={q.correct_answer}
                      onChange={(e) => updateBulkQuestion(index, "correct_answer", e.target.value)}
                      className="w-full px-3 py-2 border border-line rounded-[8px] text-[13px] bg-white"
                    >
                      <option value="YES">Yes</option>
                      <option value="NO">No</option>
                    </select>
                  </div>
                )}

                {q.question_type === "text" && (
                  <div>
                    <label className="block text-[11.5px] font-medium text-ink mb-1">Sample Answer</label>
                    <input
                      type="text"
                      value={q.sample_answer}
                      onChange={(e) => updateBulkQuestion(index, "sample_answer", e.target.value)}
                      placeholder="Sample answer..."
                      className="w-full px-3 py-2 border border-line rounded-[8px] text-[13px] bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11.5px] font-medium text-ink mb-1">Display Order</label>
                  <input
                    type="number"
                    value={q.display_order}
                    onChange={(e) => updateBulkQuestion(index, "display_order", e.target.value)}
                    className="w-full px-3 py-2 border border-line rounded-[8px] text-[13px] bg-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addBulkQuestion}
          className="w-full py-2.5 rounded-[9px] border-2 border-dashed border-teal-300 text-teal-700 font-semibold text-[13.5px] hover:bg-teal-50 transition-colors mb-4 flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add Another Question
        </button>

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-[9px] border border-line text-ink-soft font-medium text-[13.5px] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(bulkQuestions)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[9px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13.5px] transition-colors disabled:opacity-70"
          >
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /> Creating...</>
            ) : (
              `Create ${bulkQuestions.length} Questions`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Reusable Modal Component
// ============================================================
function Modal({ title, fields, initialValues, onSave, onClose, loading }) {
  const [values, setValues] = useState(initialValues || {});

  useEffect(() => {
    const defaults = {};
    fields.forEach((field) => {
      if (field.type === "select" && field.options?.length) {
        defaults[field.key] = field.options[0].value;
      }
    });
    setValues({ ...defaults, ...(initialValues || {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  const handleChange = (key, val) => setValues((v) => ({ ...v, [key]: val }));

  const questionType = values.question_type || initialValues?.question_type || "yes_no";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-5">
      <div className="bg-white rounded-2xl w-full max-w-[420px] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-brand text-lg font-semibold text-teal-900">{title}</h3>
          <button onClick={onClose} className="text-ink-soft hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {fields.map((field) => {
            if (field.condition && !field.condition(questionType)) {
              return null;
            }

            return (
              <div key={field.key}>
                <label className="block text-[12.5px] font-medium text-ink mb-1.5">{field.label}</label>

                {field.type === "select" ? (
                  <select
                    value={values[field.key] ?? field.options?.[0]?.value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-line rounded-[9px] text-[14px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    value={values[field.key] || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-line rounded-[9px] text-[14px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500 resize-none"
                  />
                ) : (
                  <input
                    type={field.type || "text"}
                    value={values[field.key] || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3.5 py-2.5 border border-line rounded-[9px] text-[14px] bg-[#FCFDFC] focus:outline-2 focus:outline-teal-500 focus:border-teal-500"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-[9px] border border-line text-ink-soft font-medium text-[13.5px] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(values)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[9px] bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13.5px] transition-colors disabled:opacity-70"
          >
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /> Saving...</>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Questions Management Component
// ============================================================
function QuestionsPanel({ packageId, subheadingId, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [responseModal, setResponseModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [qSearch, setQSearch] = useState("");
  const [answerFilter, setAnswerFilter] = useState("all");
  const [qPage, setQPage] = useState(1);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

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

  const saveQuestion = async (values) => {
    if (!modal) return;
    setSaving(true);

    try {
      const { token, tokenType } = getToken();
      const isEdit = modal.mode === "edit";
      const url = isEdit ? `${API_BASE_URL}/questions/${modal.data.id}` : `${API_BASE_URL}/questions`;

      const questionType = values.question_type || "yes_no";

      const body = {
        package_id: packageId,
        subheading_id: subheadingId,
        question_type: questionType,
        question_text: values.question_text,
        correct_answer:
          questionType === "yes_no"
            ? (values.correct_answer || "YES").toUpperCase()
            : undefined,
        sample_answer: questionType === "text" ? values.sample_answer || "" : undefined,
        display_order: parseInt(values.display_order) || 1,
        is_active: values.is_active !== undefined ? values.is_active : true,
      };

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType} ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      
      if (result.status === "success") {
        setResponseModal(result);
        fetchQuestions();
      } else {
        setResponseModal({
          status: "error",
          message: result.message || "Operation failed.",
        });
      }
    } catch (err) {
      setResponseModal({
        status: "error",
        message: "Couldn't reach the server. Please try again.",
      });
    } finally {
      setSaving(false);
      setModal(null);
    }
  };

  const saveBulkQuestions = async (bulkQuestions) => {
    setSaving(true);

    try {
      const { token, tokenType } = getToken();
      
      const body = {
        package_id: packageId,
        subheading_id: subheadingId,
        questions: bulkQuestions.map(q => ({
          question_type: q.question_type,
          question_text: q.question_text,
          correct_answer: q.question_type === "yes_no" ? (q.correct_answer || "YES").toUpperCase() : undefined,
          sample_answer: q.question_type === "text" ? q.sample_answer || "" : undefined,
          display_order: parseInt(q.display_order) || 1,
        })),
      };

      const res = await fetch(`${API_BASE_URL}/questions/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType} ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      
      if (result.status === "success") {
        setResponseModal(result);
        fetchQuestions();
      } else {
        setResponseModal({
          status: "error",
          message: result.message || "Operation failed.",
        });
      }
    } catch (err) {
      setResponseModal({
        status: "error",
        message: "Couldn't reach the server. Please try again.",
      });
    } finally {
      setSaving(false);
      setBulkModal(false);
    }
  };

  const confirmDeleteQuestion = (question) => {
    setDeleteModal({
      title: "Delete Question",
      message: `Are you sure you want to delete this question? This action cannot be undone.`,
      onConfirm: () => deleteSingleQuestion(question.id),
    });
  };

  const deleteSingleQuestion = async (id) => {
    try {
      const { token, tokenType } = getToken();
      
      const res = await fetch(`${API_BASE_URL}/questions/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType} ${token}`,
        },
      });

      const result = await res.json();
      setResponseModal(result);
      setDeleteModal(null);
      fetchQuestions();
    } catch (err) {
      setResponseModal({
        status: "error",
        message: "Couldn't reach the server. Please try again.",
      });
      setDeleteModal(null);
    }
  };

  const confirmBulkDelete = () => {
    if (selectedQuestions.length === 0) return;
    setDeleteModal({
      title: "Bulk Delete Questions",
      message: `Are you sure you want to delete ${selectedQuestions.length} selected questions? This action cannot be undone.`,
      onConfirm: () => deleteBulkQuestions(),
    });
  };

  const deleteBulkQuestions = async () => {
    try {
      const { token, tokenType } = getToken();
      
      const res = await fetch(`${API_BASE_URL}/questions/bulk`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType} ${token}`,
        },
        body: JSON.stringify({
          question_ids: selectedQuestions,
        }),
      });

      const result = await res.json();
      setResponseModal(result);
      setDeleteModal(null);
      setSelectedQuestions([]);
      fetchQuestions();
    } catch (err) {
      setResponseModal({
        status: "error",
        message: "Couldn't reach the server. Please try again.",
      });
      setDeleteModal(null);
    }
  };

  const toggleQuestionStatus = async (question) => {
    try {
      const { token, tokenType } = getToken();
      
      const res = await fetch(`${API_BASE_URL}/questions/${question.id}/toggle`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType} ${token}`,
        },
      });

      const result = await res.json();
      setResponseModal(result);
      fetchQuestions();
    } catch (err) {
      setResponseModal({
        status: "error",
        message: "Couldn't reach the server. Please try again.",
      });
    }
  };

  const downloadTemplate = async () => {
    try {
      const { token, tokenType } = getToken();
      const res = await fetch(`${API_BASE_URL}/questions/template`, {
        headers: {
          Authorization: `${tokenType} ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to download template");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "questions_template.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setResponseModal({
        status: "error",
        message: "Failed to download template. Please try again.",
      });
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);

    try {
      const { token, tokenType } = getToken();
      const formData = new FormData();
      formData.append("package_id", packageId);
      formData.append("subheading_id", subheadingId);
      formData.append("file", importFile);

      const res = await fetch(`${API_BASE_URL}/questions/import`, {
        method: "POST",
        headers: {
          Authorization: `${tokenType} ${token}`,
        },
        body: formData,
      });

      const result = await res.json();
      setResponseModal(result);
      
      if (result.status === "success") {
        fetchQuestions();
        setImportFile(null);
      }
    } catch (err) {
      setResponseModal({
        status: "error",
        message: "Failed to import questions. Please try again.",
      });
    } finally {
      setImporting(false);
    }
  };

  const exportQuestions = async () => {
    try {
      const { token, tokenType } = getToken();
      const res = await fetch(`${API_BASE_URL}/questions/export?subheading_id=${subheadingId}`, {
        headers: {
          Authorization: `${tokenType} ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to export questions");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `questions_${subheadingId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setResponseModal({
        status: "error",
        message: "Failed to export questions. Please try again.",
      });
    }
  };

  const toggleSelectQuestion = (id) => {
    setSelectedQuestions(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q.id));
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

  const modalInitialValues = modal && modal.mode === "edit" && modal.data ? modal.data : {};

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
          <h2 className="font-brand text-lg font-bold text-teal-900">Questions Management</h2>
          <p className="text-ink-soft text-[13px] mt-0.5">
            Total: {filteredQuestions.length} questions
            {selectedQuestions.length > 0 && ` · ${selectedQuestions.length} selected`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-[13px] px-4 py-2.5 rounded-[9px] transition-colors"
          >
            <Download size={14} /> Template
          </button>
          <button
            onClick={exportQuestions}
            className="flex items-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-[13px] px-4 py-2.5 rounded-[9px] transition-colors"
          >
            <Download size={14} /> Export
          </button>
          <label className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-[13px] px-4 py-2.5 rounded-[9px] transition-colors cursor-pointer">
            <Upload size={14} /> Import
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => setImportFile(e.target.files[0])}
            />
          </label>
          <button
            onClick={() => setBulkModal(true)}
            className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[13px] px-4 py-2.5 rounded-[9px] transition-colors"
          >
            <Layers size={14} /> Bulk Add
          </button>
          <button
            onClick={() => setModal({ type: "question", mode: "add" })}
            className="flex items-center gap-2 bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13.5px] px-4 py-2.5 rounded-[9px] transition-colors"
          >
            <Plus size={16} /> Add Question
          </button>
        </div>
      </div>

      {/* Import file indicator */}
      {importFile && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-[12px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload size={16} className="text-amber-600" />
            <span className="text-[13px] font-medium text-amber-800">{importFile.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-[7px] text-[12px] font-medium hover:bg-amber-700 disabled:opacity-60"
            >
              {importing ? "Importing..." : "Upload"}
            </button>
            <button
              onClick={() => setImportFile(null)}
              className="p-1.5 text-amber-600 hover:text-amber-800"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Bulk actions bar */}
      {selectedQuestions.length > 0 && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-[12px] flex items-center justify-between">
          <span className="text-[13px] font-medium text-rose-700">
            {selectedQuestions.length} question{selectedQuestions.length > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={confirmBulkDelete}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-[8px] text-[13px] font-semibold hover:bg-rose-700 transition-colors"
          >
            <Trash2 size={14} /> Delete Selected
          </button>
        </div>
      )}

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
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-ink-soft" />
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
      </div>

      {/* Select all checkbox — aligned to the same left guide + vertical center as row checkboxes */}
      {filteredQuestions.length > 0 && (
        <div className="mb-3 pl-[7px] pr-2">
          <label className="flex items-center gap-3 cursor-pointer w-fit">
            <span className="flex items-center justify-center w-4 h-5 -ml-1">
              <input
                type="checkbox"
                checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 ml-6 rounded border-line text-teal-600 focus:ring-teal-500"
              />
            </span>
            <span className="text-[13px] ml-3 text-ink-soft">Select all</span>
          </label>
        </div>
      )}

      {/* Questions list */}
      {paginatedQuestions.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl px-6 py-16 text-center">
          <FileQuestion size={32} className="text-teal-400 mx-auto mb-3" />
          <p className="text-ink-soft text-[13.5px]">
            {questions.length === 0 ? "No questions yet — add one to get started." : "No questions match your filters."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {paginatedQuestions.map((q, index) => {
            // Calculate the actual number based on current page
            const questionNumber = (qPage - 1) * QUESTIONS_PER_PAGE + index + 1;
            
            return (
              <div
                key={q.id}
                className={`bg-white border rounded-[14px] px-5 py-4 hover:border-teal-500 transition-colors ${
                  !q.is_active ? "border-rose-200 bg-rose-50/30" : "border-line"
                } ${selectedQuestions.includes(q.id) ? "border-teal-500 bg-teal-50/20" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox: vertically centered against the badge row (first line), nudged left to sit on the same guide as "Select all" */}
                  <div className="flex items-center h-5 -ml-1 pt-0.5">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(q.id)}
                      onChange={() => toggleSelectQuestion(q.id)}
                      className="w-4 h-4 rounded border-line text-teal-600 focus:ring-teal-500"
                    />
                  </div>
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
                      onClick={() => toggleQuestionStatus(q)}
                      title={q.is_active ? "Deactivate" : "Activate"}
                      className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100"
                    >
                      {q.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    </button>
                    <button
                      onClick={() => setModal({ type: "question", mode: "edit", data: q })}
                      className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center hover:bg-teal-100"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => confirmDeleteQuestion(q)}
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"
                    >
                      <Trash2 size={14} />
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

      {/* Question Add/Edit Modal */}
      {modal?.type === "question" && (
        <Modal
          title={modal.mode === "add" ? "Add Question" : "Edit Question"}
          fields={[
            {
              key: "question_type",
              label: "Question Type",
              type: "select",
              options: [
                { value: "yes_no", label: "Yes/No" },
                { value: "text", label: "Text" },
              ],
            },
            {
              key: "question_text",
              label: "Question Text",
              type: "textarea",
              placeholder: "Enter question text...",
            },
            {
              key: "correct_answer",
              label: "Correct Answer",
              type: "select",
              options: [
                { value: "YES", label: "Yes" },
                { value: "NO", label: "No" },
              ],
              condition: (type) => type === "yes_no",
            },
            {
              key: "sample_answer",
              label: "Sample Answer",
              type: "textarea",
              placeholder: "Enter sample answer...",
              condition: (type) => type === "text",
            },
            {
              key: "display_order",
              label: "Display Order",
              type: "number",
              placeholder: "1",
            },
          ]}
          initialValues={modalInitialValues}
          onSave={saveQuestion}
          onClose={() => setModal(null)}
          loading={saving}
        />
      )}

      {/* Bulk Create Modal */}
      {bulkModal && (
        <BulkCreateModal
          onSave={saveBulkQuestions}
          onClose={() => setBulkModal(false)}
          loading={saving}
        />
      )}

      {/* Response Modal */}
      {responseModal && (
        <ResponseModal
          response={responseModal}
          onClose={() => setResponseModal(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <ConfirmDeleteModal
          title={deleteModal.title}
          message={deleteModal.message}
          onConfirm={deleteModal.onConfirm}
          onCancel={() => setDeleteModal(null)}
          loading={false}
        />
      )}
    </>
  );
}

// ============================================================
// Main PackagesPage Component
// ============================================================
export default function PackagesPage({ search }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState({ level: "packages", packageId: null, categoryId: null });
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [responseModal, setResponseModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [subheadings, setSubheadings] = useState([]);
  const [loadingSubheadings, setLoadingSubheadings] = useState(false);

  // Fetch packages on mount
  useEffect(() => {
    fetchPackages();
  }, []);

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

  // Fetch subheadings for a package
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
          // Handle nested data structures
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

  // ============ PACKAGE CRUD ============
  const savePackage = async (values) => {
    if (!modal) return;
    setSaving(true);

    try {
      const { token, tokenType } = getToken();
      const isEdit = modal.mode === "edit";
      const url = isEdit ? `${API_BASE_URL}/packages/${modal.data.id}` : `${API_BASE_URL}/packages`;
      
      const body = {
        name: values.name,
        description: values.description || "",
        price: parseFloat(values.price) || 0,
        age_group: values.age || "18-60",
        is_active: values.is_active !== undefined ? values.is_active : true,
      };

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType} ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      
      if (result.status === "success") {
        setResponseModal(result);
        fetchPackages();
      } else {
        setResponseModal({
          status: "error",
          message: result.message || "Operation failed.",
        });
      }
    } catch (err) {
      setResponseModal({
        status: "error",
        message: "Couldn't reach the server. Please try again.",
      });
    } finally {
      setSaving(false);
      setModal(null);
    }
  };

  const confirmDeletePackage = (pkg) => {
    setDeleteModal({
      title: "Delete Package",
      message: `Are you sure you want to delete "${pkg.name}"? This will also delete all its subheadings and questions. This action cannot be undone.`,
      onConfirm: () => deletePackage(pkg.id),
    });
  };

  const deletePackage = async (id) => {
    try {
      const { token, tokenType } = getToken();
      
      const res = await fetch(`${API_BASE_URL}/packages/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType} ${token}`,
        },
      });

      const result = await res.json();
      setResponseModal(result);
      setDeleteModal(null);
      fetchPackages();
    } catch (err) {
      setResponseModal({
        status: "error",
        message: "Couldn't reach the server. Please try again.",
      });
      setDeleteModal(null);
    }
  };

  const togglePackageStatus = async (pkg) => {
    try {
      const { token, tokenType } = getToken();
      
      const res = await fetch(`${API_BASE_URL}/packages/${pkg.id}/toggle`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType} ${token}`,
        },
      });

      const result = await res.json();
      setResponseModal(result);
      fetchPackages();
    } catch (err) {
      setResponseModal({
        status: "error",
        message: "Couldn't reach the server. Please try again.",
      });
    }
  };

  // ============ SUBHEADING (CATEGORY) CRUD ============
  const saveSubheading = async (values) => {
    if (!modal || !view.packageId) return;
    setSaving(true);

    try {
      const { token, tokenType } = getToken();
      const isEdit = modal.mode === "edit";
      const url = isEdit ? `${API_BASE_URL}/subheadings/${modal.data.id}` : `${API_BASE_URL}/subheadings`;
      
      const body = {
        package_id: view.packageId,
        name: values.name,
        description: values.description || "",
        question_count: parseInt(values.question_count) || 0,
        is_active: true,
      };

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType} ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      
      if (result.status === "success") {
        setResponseModal(result);
        fetchSubheadings(view.packageId);
      } else {
        setResponseModal({
          status: "error",
          message: result.message || "Operation failed.",
        });
      }
    } catch (err) {
      setResponseModal({
        status: "error",
        message: "Couldn't reach the server. Please try again.",
      });
    } finally {
      setSaving(false);
      setModal(null);
    }
  };

  const confirmDeleteSubheading = (subheading) => {
    setDeleteModal({
      title: "Delete Subheading",
      message: `Are you sure you want to delete "${subheading.name}"? This will also delete all its questions.`,
      onConfirm: () => deleteSubheading(subheading.id),
    });
  };

  const deleteSubheading = async (id) => {
    try {
      const { token, tokenType } = getToken();
      
      const res = await fetch(`${API_BASE_URL}/subheadings/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType} ${token}`,
        },
      });

      const result = await res.json();
      setResponseModal(result);
      setDeleteModal(null);
      if (view.packageId) {
        fetchSubheadings(view.packageId);
      }
    } catch (err) {
      setResponseModal({
        status: "error",
        message: "Couldn't reach the server. Please try again.",
      });
      setDeleteModal(null);
    }
  };

  const toggleSubheadingStatus = async (subheading) => {
    try {
      const { token, tokenType } = getToken();
      
      const res = await fetch(`${API_BASE_URL}/subheadings/${subheading.id}/toggle`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType} ${token}`,
        },
      });

      const result = await res.json();
      setResponseModal(result);
      if (view.packageId) {
        fetchSubheadings(view.packageId);
      }
    } catch (err) {
      setResponseModal({
        status: "error",
        message: "Couldn't reach the server. Please try again.",
      });
    }
  };

  const modalInitialValues = modal && modal.mode === "edit" && modal.data ? modal.data : {};

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
                Manage pricing, subheadings, and questions for each package.
              </p>
            </div>
            <button
              onClick={() => setModal({ type: "package", mode: "add" })}
              className="flex items-center gap-2 bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13.5px] px-4 py-2.5 rounded-[9px] transition-colors"
            >
              <Plus size={16} /> Add Package
            </button>
          </div>

          {filteredPackages.length === 0 ? (
            <p className="text-ink-soft text-[13.5px] text-center py-16">
              {search ? `No packages match "${search}".` : "No packages yet — add one to get started."}
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
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => togglePackageStatus(pkg)}
                        title={pkg.is_active ? "Deactivate" : "Activate"}
                        className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100"
                      >
                        {pkg.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                      <button
                        onClick={() => setModal({ type: "package", mode: "edit", data: pkg })}
                        className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center hover:bg-teal-100"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => confirmDeletePackage(pkg)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
                    Manage Subheadings
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
                Manage subheadings (categories) for this package.
              </p>
            </div>
            <button
              onClick={() => setModal({ type: "subheading", mode: "add" })}
              className="flex items-center gap-2 bg-coral-600 hover:bg-coral-700 text-white font-semibold text-[13.5px] px-4 py-2.5 rounded-[9px] transition-colors"
            >
              <Plus size={16} /> Add Subheading
            </button>
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
                      onClick={() => toggleSubheadingStatus(sub)}
                      title={sub.is_active ? "Deactivate" : "Activate"}
                      className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100"
                    >
                      {sub.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    </button>
                    <button
                      onClick={() => setModal({ type: "subheading", mode: "edit", data: sub })}
                      className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center hover:bg-teal-100"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => confirmDeleteSubheading(sub)}
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => setView({ 
                        level: "questions", 
                        packageId: activePackage.id, 
                        categoryId: sub.id 
                      })}
                      className="ml-1 px-3.5 py-2 rounded-[9px] bg-teal-50 text-teal-800 font-semibold text-[12.5px] hover:bg-teal-100 transition-colors flex items-center gap-1"
                    >
                      Questions <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ink-soft text-[13.5px] text-center py-10">
              No subheadings yet — add one to get started.
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

      {/* Package Add/Edit Modal */}
      {modal?.type === "package" && (
        <Modal
          title={modal.mode === "add" ? "Add Package" : "Edit Package"}
          fields={[
            { key: "name", label: "Package name", placeholder: "e.g. Executive" },
            { key: "description", label: "Description", type: "textarea", placeholder: "Package description..." },
            { key: "age", label: "Age group", placeholder: "e.g. 18 - 60 Years" },
            { key: "price", label: "Price (₹)", type: "number", placeholder: "499" },
          ]}
          initialValues={modalInitialValues}
          onSave={savePackage}
          onClose={() => setModal(null)}
          loading={saving}
        />
      )}

      {/* Subheading Add/Edit Modal */}
      {modal?.type === "subheading" && (
        <Modal
          title={modal.mode === "add" ? "Add Subheading" : "Edit Subheading"}
          fields={[
            { key: "name", label: "Subheading name", placeholder: "e.g. Mood & Emotions" },
            { key: "description", label: "Description", type: "textarea", placeholder: "Subheading description..." },
            { key: "question_count", label: "Question count", type: "number", placeholder: "5" },
          ]}
          initialValues={modalInitialValues}
          onSave={saveSubheading}
          onClose={() => setModal(null)}
          loading={saving}
        />
      )}

      {/* Response Modal */}
      {responseModal && (
        <ResponseModal
          response={responseModal}
          onClose={() => setResponseModal(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <ConfirmDeleteModal
          title={deleteModal.title}
          message={deleteModal.message}
          onConfirm={deleteModal.onConfirm}
          onCancel={() => setDeleteModal(null)}
          loading={false}
        />
      )}
    </>
  );
}