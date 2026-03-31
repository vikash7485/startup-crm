import React, { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { dealsApi, leadsApi } from "../services/api.js";
import { Plus, X, GripVertical, DollarSign, Calendar, Loader2, Briefcase, MoreVertical, Edit2, Trash2 } from "lucide-react";

const statusColumns = [
  { id: "to-do", label: "To Do", color: "border-gray-500", bg: "bg-gray-500/10", accent: "text-gray-400" },
  { id: "in-progress", label: "In Progress", color: "border-blue-500", bg: "bg-blue-500/10", accent: "text-blue-400" },
  { id: "negotiation", label: "Negotiation", color: "border-amber-500", bg: "bg-amber-500/10", accent: "text-amber-400" },
  { id: "closed", label: "Closed", color: "border-emerald-500", bg: "bg-emerald-500/10", accent: "text-emerald-400" },
];

const dealTypeBadge = {
  won: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  lost: "bg-red-500/20 text-red-400 border-red-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

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

const DealForm = ({ deal, leads, onSave, onCancel, saving }) => {
  const [form, setForm] = useState({
    lead_id: deal?.lead_id?._id || deal?.lead_id || "",
    title: deal?.title || "", value: deal?.value || "",
    status: deal?.status || "to-do", deal_type: deal?.deal_type || "pending",
    probability: deal?.probability ?? 50,
    expected_close_date: deal?.expected_close_date ? deal.expected_close_date.slice(0, 10) : "",
    notes: deal?.notes || ""
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.title || form.title.length < 3) errs.title = "Title must be at least 3 chars";
    if (form.value === "" || Number(form.value) < 0) errs.value = "Value must be >= 0";
    if (!form.lead_id) errs.lead_id = "Lead is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSave({ ...form, value: Number(form.value), probability: Number(form.probability) });
  };

  const inputCls = "w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Lead *</label>
        <select className={inputCls} value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}>
          <option value="">Select a lead...</option>
          {leads.map(l => <option key={l._id} value={l._id}>{l.name} ({l.email})</option>)}
        </select>
        {errors.lead_id && <p className="text-red-400 text-xs mt-1">{errors.lead_id}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Deal Title *</label>
        <input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Deal title" />
        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Value ($) *</label>
          <input type="number" min="0" step="0.01" className={inputCls} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="10000" />
          {errors.value && <p className="text-red-400 text-xs mt-1">{errors.value}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
          <select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {statusColumns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Deal Type</label>
          <select className={inputCls} value={form.deal_type} onChange={e => setForm({ ...form, deal_type: e.target.value })}>
            <option value="pending">Pending</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Probability (%)</label>
          <input type="range" min="0" max="100" className="w-full accent-indigo-500 mt-2" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} />
          <p className="text-xs text-gray-400 text-center mt-1">{form.probability}%</p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Expected Close Date</label>
        <input type="date" className={inputCls} value={form.expected_close_date} onChange={e => setForm({ ...form, expected_close_date: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes</label>
        <textarea className={`${inputCls} resize-none`} rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes..." />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 font-medium text-sm transition-all">Cancel</button>
        <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {deal ? "Update" : "Create"} Deal
        </button>
      </div>
    </form>
  );
};

const DealCard = ({ deal, index, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isOverdue = deal.expected_close_date && new Date(deal.expected_close_date) < new Date();

  return (
    <Draggable draggableId={deal._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef} {...provided.draggableProps}
          className={`bg-gray-850 border border-gray-700/50 rounded-xl p-4 mb-2.5
            ${snapshot.isDragging ? "shadow-2xl shadow-indigo-500/20 ring-2 ring-indigo-500/30 rotate-1" : "hover:border-gray-600"}
            transition-all duration-200 group relative`}
          style={{ ...provided.draggableProps.style, backgroundColor: "#111827" }}
        >
          <div className="flex items-start gap-2">
            <div {...provided.dragHandleProps} className="mt-0.5 text-gray-600 group-hover:text-gray-400 transition-colors cursor-grab">
              <GripVertical size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{deal.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{deal.lead_id?.name || "Unknown Lead"}</p>
            </div>
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors">
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-36 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-20 py-1">
                    <button onClick={() => { setMenuOpen(false); onEdit(deal); }} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2">
                      <Edit2 size={14} /> Edit
                    </button>
                    <button onClick={() => { setMenuOpen(false); onDelete(deal); }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1 text-emerald-400">
              <DollarSign size={14} />
              <span className="text-sm font-bold">{Number(deal.value).toLocaleString()}</span>
            </div>
            {deal.status === "closed" && (
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${dealTypeBadge[deal.deal_type] || dealTypeBadge.pending}`}>
                {deal.deal_type?.toUpperCase()}
              </span>
            )}
          </div>

          {/* Probability bar */}
          <div className="mt-3">
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${deal.probability || 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-gray-500">{deal.probability || 0}% probability</span>
              {deal.expected_close_date && (
                <span className={`text-[10px] flex items-center gap-0.5 ${isOverdue ? "text-red-400" : "text-gray-500"}`}>
                  <Calendar size={10} />
                  {new Date(deal.expected_close_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

const Deals = () => {
  const [kanban, setKanban] = useState({ "to-do": [], "in-progress": [], "negotiation": [], "closed": [] });
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [deletingDeal, setDeletingDeal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("to-do"); // mobile tab

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [kanbanRes, leadsRes] = await Promise.all([
        dealsApi.getKanban(),
        leadsApi.getAll({ limit: 100 })
      ]);
      setKanban(kanbanRes.data.data);
      setLeads(leadsRes.data.data.items);
    } catch (err) {
      console.error("Failed to load deals", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const srcCol = [...kanban[source.droppableId]];
    const destCol = source.droppableId === destination.droppableId ? srcCol : [...kanban[destination.droppableId]];
    const [moved] = srcCol.splice(source.index, 1);
    destCol.splice(destination.index, 0, { ...moved, status: destination.droppableId });

    setKanban(prev => ({
      ...prev,
      [source.droppableId]: srcCol,
      ...(source.droppableId !== destination.droppableId ? { [destination.droppableId]: destCol } : {})
    }));

    if (source.droppableId !== destination.droppableId) {
      try {
        await dealsApi.updateStatus(draggableId, destination.droppableId);
      } catch {
        fetchData(); // revert on error
      }
    }
  };

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await dealsApi.create(data);
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to create deal");
    } finally { setSaving(false); }
  };

  const handleUpdate = async (data) => {
    setSaving(true);
    try {
      await dealsApi.update(editingDeal._id, data);
      setEditingDeal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to update deal");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await dealsApi.delete(deletingDeal._id);
      setDeletingDeal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to delete deal");
    } finally { setSaving(false); }
  };

  const totalPipeline = Object.values(kanban).flat().reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Deals Pipeline</h1>
          <p className="text-gray-400 text-sm mt-1">Total Pipeline: <span className="text-emerald-400 font-semibold">${totalPipeline.toLocaleString()}</span></p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus size={18} /> Add Deal
        </button>
      </div>

      {/* Mobile tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 lg:hidden">
        {statusColumns.map(col => (
          <button
            key={col.id} onClick={() => setActiveTab(col.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === col.id ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            {col.label} ({kanban[col.id]?.length || 0})
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {statusColumns.map(col => (
            <div
              key={col.id}
              className={`${activeTab !== col.id ? "hidden lg:block" : ""}`}
            >
              <div className={`bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden`}>
                {/* Column Header */}
                <div className={`px-4 py-3.5 border-b-2 ${col.color} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color.replace("border-", "bg-")}`} />
                    <h3 className={`text-sm font-semibold ${col.accent}`}>{col.label}</h3>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{kanban[col.id]?.length || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    ${kanban[col.id]?.reduce((s, d) => s + (Number(d.value) || 0), 0).toLocaleString()}
                  </p>
                </div>

                {/* Column Body */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef} {...provided.droppableProps}
                      className={`p-2.5 min-h-[200px] transition-colors duration-200 ${snapshot.isDraggingOver ? "bg-indigo-500/5" : ""}`}
                    >
                      {loading ? (
                        [...Array(2)].map((_, i) => (
                          <div key={i} className="bg-gray-800/50 rounded-xl p-4 mb-2.5 animate-pulse space-y-3">
                            <div className="h-4 w-3/4 skeleton rounded" />
                            <div className="h-3 w-1/2 skeleton rounded" />
                            <div className="h-5 w-16 skeleton rounded" />
                            <div className="h-1.5 skeleton rounded-full" />
                          </div>
                        ))
                      ) : kanban[col.id]?.length === 0 ? (
                        <div className="text-center py-8">
                          <Briefcase size={24} className="mx-auto text-gray-700 mb-2" />
                          <p className="text-xs text-gray-600">No deals</p>
                        </div>
                      ) : (
                        kanban[col.id].map((deal, index) => (
                          <DealCard key={deal._id} deal={deal} index={index} onEdit={setEditingDeal} onDelete={setDeletingDeal} />
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Add Deal Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create New Deal">
        <DealForm leads={leads} onSave={handleCreate} onCancel={() => setShowAddModal(false)} saving={saving} />
      </Modal>

      {/* Edit Deal Modal */}
      <Modal isOpen={!!editingDeal} onClose={() => setEditingDeal(null)} title="Edit Deal">
        <DealForm deal={editingDeal} leads={leads} onSave={handleUpdate} onCancel={() => setEditingDeal(null)} saving={saving} />
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deletingDeal} onClose={() => setDeletingDeal(null)} title="Delete Deal">
        <p className="text-gray-300 mb-6">Are you sure you want to delete <strong className="text-white">{deletingDeal?.title}</strong>?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeletingDeal(null)} className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 font-medium text-sm transition-all">Cancel</button>
          <button onClick={handleDelete} disabled={saving} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />} Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Deals;
