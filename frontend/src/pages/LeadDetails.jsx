import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { leadsApi, dealsApi, notesApi, remindersApi } from "../services/api.js";
import { ArrowLeft, User, Phone, Mail, Building, Briefcase, Plus, Edit2, Loader2, Calendar, FileText, Bell, Check, Trash2 } from "lucide-react";

const statusColors = {
  new: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  contacted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  qualified: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  lost: "bg-red-500/20 text-red-400 border-red-500/30",
};

const dealStatusColors = {
  "to-do": "bg-gray-500/20 text-gray-300 border-gray-500/30",
  "in-progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  negotiation: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  closed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const StatusBadge = ({ status, isDeal }) => {
  const colors = isDeal ? dealStatusColors : statusColors;
  const defaultColor = colors[status] || colors["new"] || colors["to-do"];
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${defaultColor}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
    </span>
  );
};

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // State
  const [lead, setLead] = useState(null);
  const [deals, setDeals] = useState([]);
  const [notes, setNotes] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Note form
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Reminder form
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: "", description: "", reminderDate: "" });
  const [addingReminder, setAddingReminder] = useState(false);

  const fetchLeadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadRes, dealsRes, notesRes, remRes] = await Promise.all([
        leadsApi.getById(id),
        dealsApi.getAll({ lead_id: id }),
        notesApi.getByLead(id).catch(() => ({ data: { data: [] } })),
        remindersApi.getByLead(id).catch(() => ({ data: { data: [] } }))
      ]);
      setLead(leadRes.data.data);
      setDeals(dealsRes.data.data.deals || []);
      setNotes(notesRes.data?.data || []);
      setReminders(remRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load lead data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeadData();
  }, [fetchLeadData]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await notesApi.create({ leadId: id, content: newNote });
      setNotes([res.data.data, ...notes]);
      setNewNote("");
    } catch (err) {
      console.error(err);
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await notesApi.delete(noteId);
      setNotes(notes.filter(n => n._id !== noteId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    setAddingReminder(true);
    try {
      const res = await remindersApi.create({ leadId: id, ...newReminder });
      setReminders([...reminders, res.data.data].sort((a,b) => new Date(a.reminderDate) - new Date(b.reminderDate)));
      setNewReminder({ title: "", description: "", reminderDate: "" });
      setShowReminderForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingReminder(false);
    }
  };

  const handleCompleteReminder = async (remId) => {
    try {
      await remindersApi.complete(remId);
      setReminders(reminders.map(r => r._id === remId ? { ...r, completed: true } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReminder = async (remId) => {
    try {
      await remindersApi.delete(remId);
      setReminders(reminders.filter(r => r._id !== remId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 size={40} className="text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-6 text-center">
        <p className="text-lg font-medium mb-3">{error || "Lead not found"}</p>
        <button onClick={() => navigate("/leads")} className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors">
          Back to Leads
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate("/leads")}
          className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
            {lead.name} <StatusBadge status={lead.status} />
          </h1>
          <p className="text-gray-400 text-sm mt-1">Customer Profile & Interactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Lead Info & Reminders */}
        <div className="space-y-6 self-start">
          
          {/* Contact Details */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800 bg-gray-800/30 flex justify-between items-center">
              <h3 className="font-semibold text-white">Contact Information</h3>
              <button className="text-gray-400 hover:text-indigo-400 transition-colors">
                <Edit2 size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="text-gray-500 mt-0.5" size={18} />
                <div>
                  <p className="text-gray-400 text-xs">Email</p>
                  <p className="text-white text-sm font-medium">{lead.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="text-gray-500 mt-0.5" size={18} />
                <div>
                  <p className="text-gray-400 text-xs">Phone</p>
                  <p className="text-white text-sm font-medium">{lead.phone || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building className="text-gray-500 mt-0.5" size={18} />
                <div>
                  <p className="text-gray-400 text-xs">Company</p>
                  <p className="text-white text-sm font-medium">{lead.company || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="text-gray-500 mt-0.5" size={18} />
                <div>
                  <p className="text-gray-400 text-xs">Source</p>
                  <p className="text-white text-sm font-medium capitalize">{lead.source}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reminders System */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800 bg-gray-800/30 flex justify-between items-center">
              <h3 className="font-semibold text-white flex items-center gap-2"><Bell size={18} className="text-amber-400" /> Reminders</h3>
              <button onClick={() => setShowReminderForm(!showReminderForm)} className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium flex items-center gap-1">
                <Plus size={16} /> Add
              </button>
            </div>
            
            {showReminderForm && (
              <form onSubmit={handleAddReminder} className="p-4 bg-gray-800/40 border-b border-gray-800 space-y-3">
                <input required type="text" placeholder="Title..." value={newReminder.title} onChange={e => setNewReminder({...newReminder, title: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                <input type="datetime-local" required value={newReminder.reminderDate} onChange={e => setNewReminder({...newReminder, reminderDate: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowReminderForm(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white">Cancel</button>
                  <button type="submit" disabled={addingReminder} className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg">{addingReminder ? "Adding..." : "Schedule"}</button>
                </div>
              </form>
            )}

            <div className="divide-y divide-gray-800/50">
              {reminders.length === 0 ? (
                <div className="p-5 text-center text-gray-500 text-sm">No scheduled reminders</div>
              ) : (
                reminders.map(rem => (
                  <div key={rem._id} className={`p-4 flex items-start gap-3 group ${rem.completed ? 'opacity-50' : ''}`}>
                    <button 
                      onClick={() => !rem.completed && handleCompleteReminder(rem._id)}
                      disabled={rem.completed}
                      className={`mt-1 h-5 w-5 shrink-0 rounded-full border flex items-center justify-center transition-colors 
                        ${rem.completed ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'border-gray-500 text-transparent hover:border-indigo-400'}`}
                    >
                      {rem.completed && <Check size={12} strokeWidth={3} />}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${rem.completed ? 'line-through text-gray-400' : 'text-gray-200'}`}>{rem.title}</p>
                      <p className="text-xs flex items-center gap-1.5 text-amber-400/80 mt-1">
                        <Calendar size={12} /> {new Date(rem.reminderDate).toLocaleString()}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteReminder(rem._id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Deals & Notes */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Deals Pipeline */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
              <div>
                <h3 className="font-semibold text-white">Deals Pipeline</h3>
                <p className="text-xs text-gray-400 mt-1">{deals.length} associated {deals.length === 1 ? 'deal' : 'deals'}</p>
              </div>
              <button onClick={() => navigate('/deals')} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-sm font-medium transition-all">
                <Plus size={16} /> New Deal
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Title</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Value</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Probability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {deals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500 text-sm">No deals found for this lead</td>
                    </tr>
                  ) : deals.map(deal => (
                    <tr key={deal._id} className="hover:bg-gray-800/20 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-white">{deal.title}</td>
                      <td className="px-5 py-3 text-sm text-gray-300">${deal.value.toLocaleString()}</td>
                      <td className="px-5 py-3"><StatusBadge status={deal.status} isDeal={true} /></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full ${deal.status === 'closed' && deal.deal_type === 'won' ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${deal.probability}%` }}/>
                          </div>
                          <span className="text-xs text-gray-400">{deal.probability}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes System */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
              <h3 className="font-semibold text-white flex items-center gap-2"><FileText size={18} className="text-blue-400" /> Interaction Notes</h3>
            </div>
            
            <div className="p-5 border-b border-gray-800 bg-gray-800/10">
              <form onSubmit={handleAddNote}>
                <textarea 
                  value={newNote} onChange={e => setNewNote(e.target.value)}
                  placeholder="Record a call, meeting, or observation..." 
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none h-20"
                />
                <div className="mt-3 flex justify-end">
                  <button type="submit" disabled={!newNote.trim() || addingNote} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                    {addingNote ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Post Note
                  </button>
                </div>
              </form>
            </div>

            <div className="p-5">
              {notes.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">No notes added yet</div>
              ) : (
                <div className="relative border-l border-gray-800 ml-3 space-y-6">
                  {notes.map(note => (
                    <div key={note._id} className="relative pl-6 group">
                      <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-gray-900" />
                      <div className="bg-gray-800/30 hover:bg-gray-800/50 transition-colors border border-gray-800/60 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-200">{note.userId?.name || "System"}</span>
                            <span className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString()}</span>
                          </div>
                          <button onClick={() => handleDeleteNote(note._id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default LeadDetails;
