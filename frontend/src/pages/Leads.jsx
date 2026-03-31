import React, { useState, useEffect, useCallback } from "react";
import { leadsApi } from "../services/api.js";
import { Plus, Search, Filter, Edit2, Trash2, X, ChevronLeft, ChevronRight, Users, Loader2 } from "lucide-react";

const statusColors = {
  new: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  contacted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  qualified: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  lost: "bg-red-500/20 text-red-400 border-red-500/30",
};

const StatusBadge = ({ status }) => (
  <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${statusColors[status] || statusColors.new}`}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

// Modal component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const LeadForm = ({ lead, onSave, onCancel, saving }) => {
  const [form, setForm] = useState({
    name: lead?.name || "", email: lead?.email || "", phone: lead?.phone || "",
    company: lead?.company || "", status: lead?.status || "new",
    source: lead?.source || "other", notes: lead?.notes || ""
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.length < 3) errs.name = "Name must be at least 3 characters";
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Valid email is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  const inputCls = "w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Name *</label>
        <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email *</label>
        <input type="email" className={inputCls} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone</label>
          <input type="tel" className={inputCls} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Company</label>
          <input className={inputCls} value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Source</label>
          <select className={inputCls} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="event">Event</option>
            <option value="cold_call">Cold Call</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
          <select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes</label>
        <textarea className={`${inputCls} resize-none`} rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 font-medium text-sm transition-all">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {lead ? "Update" : "Create"} Lead
        </button>
      </div>
    </form>
  );
};

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await leadsApi.getAll(params);
      setLeads(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchLeads(1), 300);
    return () => clearTimeout(timer);
  }, [fetchLeads]);

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await leadsApi.create(data);
      setShowAddModal(false);
      fetchLeads(pagination.page);
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to create lead");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data) => {
    setSaving(true);
    try {
      await leadsApi.update(editingLead._id, data);
      setEditingLead(null);
      fetchLeads(pagination.page);
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to update lead");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await leadsApi.delete(deletingLead._id);
      setDeletingLead(null);
      fetchLeads(pagination.page);
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to delete lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Leads</h1>
          <p className="text-gray-400 text-sm mt-1">{pagination.total} Total Leads</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-600/20"
        >
          <Plus size={18} /> Add Lead
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, company..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-800 transition-all"
          >
            <Filter size={16} />
            Filter
            {statusFilter !== "all" && <span className="w-2 h-2 bg-indigo-500 rounded-full" />}
          </button>
          {showFilters && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-20 p-2">
              {["all", "new", "contacted", "qualified", "lost"].map(s => (
                <button
                  key={s} onClick={() => { setStatusFilter(s); setShowFilters(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${statusFilter === s ? "bg-indigo-500/20 text-indigo-400" : "text-gray-300 hover:bg-gray-800"}`}
                >
                  {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4">
          {error} <button onClick={() => fetchLeads(1)} className="ml-2 underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="h-5 w-32 skeleton rounded" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><div className="h-5 w-40 skeleton rounded" /></td>
                    <td className="px-5 py-4"><div className="h-6 w-20 skeleton rounded-lg" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-16 skeleton rounded ml-auto" /></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16">
                    <Users size={40} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 font-medium">{search || statusFilter !== "all" ? "No leads match your search" : "No leads found. Create your first lead!"}</p>
                    {!search && statusFilter === "all" && (
                      <button onClick={() => setShowAddModal(true)} className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1 mx-auto">
                        <Plus size={16} /> Add Lead
                      </button>
                    )}
                  </td>
                </tr>
              ) : leads.map(lead => (
                <tr key={lead._id} className="hover:bg-gray-800/30 transition-colors cursor-pointer group">
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-white">{lead.name}</p>
                      <p className="text-xs text-gray-500 md:hidden">{lead.email}</p>
                      {lead.company && <p className="text-xs text-gray-500">{lead.company}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-sm text-gray-300">{lead.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingLead(lead); }}
                        className="p-2 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingLead(lead); }}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800">
            <p className="text-sm text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchLeads(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p} onClick={() => fetchLeads(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${pagination.page === p ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => fetchLeads(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Lead">
        <LeadForm onSave={handleCreate} onCancel={() => setShowAddModal(false)} saving={saving} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingLead} onClose={() => setEditingLead(null)} title="Edit Lead">
        <LeadForm lead={editingLead} onSave={handleUpdate} onCancel={() => setEditingLead(null)} saving={saving} />
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deletingLead} onClose={() => setDeletingLead(null)} title="Delete Lead">
        <p className="text-gray-300 mb-6">Are you sure you want to delete <strong className="text-white">{deletingLead?.name}</strong>? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeletingLead(null)} className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 font-medium text-sm transition-all">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={saving} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />} Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Leads;
