import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardApi, remindersApi } from "../services/api.js";
import { Users, Briefcase, Trophy, DollarSign, TrendingUp, TrendingDown, Clock, RefreshCw, UserPlus, FileText, ArrowRight, Bell, Calendar, Check } from "lucide-react";

const KPICard = ({ title, value, icon: Icon, color, trend, onClick }) => {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400",
    orange: "from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400",
    green: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
    purple: "from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400",
  };
  const iconBg = {
    blue: "bg-blue-500/20 text-blue-400",
    orange: "bg-amber-500/20 text-amber-400",
    green: "bg-emerald-500/20 text-emerald-400",
    purple: "bg-purple-500/20 text-purple-400",
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-5 cursor-pointer
        hover:scale-[1.02] hover:shadow-lg hover:shadow-${color}-500/10 transition-all duration-300 animate-fade-in`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{Math.abs(trend)}% from last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBg[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-gray-800/50 border border-gray-700/30 rounded-2xl p-5 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="space-y-3">
        <div className="h-4 w-24 skeleton rounded" />
        <div className="h-8 w-16 skeleton rounded" />
        <div className="h-3 w-32 skeleton rounded" />
      </div>
      <div className="h-10 w-10 skeleton rounded-xl" />
    </div>
  </div>
);

const activityIcons = {
  lead_created: { icon: UserPlus, color: "text-blue-400 bg-blue-500/10" },
  lead_updated: { icon: FileText, color: "text-amber-400 bg-amber-500/10" },
  lead_deleted: { icon: Users, color: "text-red-400 bg-red-500/10" },
  deal_created: { icon: Briefcase, color: "text-emerald-400 bg-emerald-500/10" },
  deal_updated: { icon: FileText, color: "text-amber-400 bg-amber-500/10" },
  deal_status_changed: { icon: ArrowRight, color: "text-purple-400 bg-purple-500/10" },
  deal_closed: { icon: Trophy, color: "text-emerald-400 bg-emerald-500/10" },
  lead_contacted: { icon: Users, color: "text-blue-400 bg-blue-500/10" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, activitiesRes, remRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getActivities({ limit: 10 }),
        remindersApi.getUpcoming().catch(() => ({ data: { data: [] } }))
      ]);
      setStats(statsRes.data.data);
      setActivities(activitiesRes.data.data.activities);
      setReminders(remRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCompleteReminder = async (remId) => {
    try {
      await remindersApi.complete(remId);
      setReminders(reminders.filter(r => r._id !== remId));
    } catch (err) {
      console.error(err);
    }
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">{dateStr}</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white
            rounded-xl text-sm font-medium border border-gray-700 transition-all"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchData} className="text-sm bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded-lg transition-all">
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : stats && (
          <>
            <KPICard title="Total Leads" value={stats.total_leads} icon={Users} color="blue" onClick={() => navigate("/leads")} />
            <KPICard title="Deals in Pipeline" value={stats.deals_in_pipeline} icon={Briefcase} color="orange" onClick={() => navigate("/deals")} />
            <KPICard title="Won Deals" value={stats.won_deals} icon={Trophy} color="green" onClick={() => navigate("/deals")} />
            <KPICard title="Revenue" value={`$${(stats.revenue || 0).toLocaleString()}`} icon={DollarSign} color="purple" onClick={() => navigate("/analytics")} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activities</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="h-9 w-9 skeleton rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 skeleton rounded" />
                    <div className="h-3 w-20 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={36} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-500">No recent activities</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {activities.slice(0, 5).map((activity) => {
                const iconData = activityIcons[activity.activity_type] || activityIcons.lead_created;
                const IconComp = iconData.icon;
                return (
                  <div key={activity._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/50 transition-colors group">
                    <div className={`p-2 rounded-xl ${iconData.color}`}>
                      <IconComp size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{timeAgo(activity.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Reminders */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-fade-in flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell size={20} className="text-amber-400" /> Upcoming Reminders
          </h2>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-indigo-500" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-8 flex-1 flex flex-col justify-center">
              <Calendar size={36} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {reminders.map(rem => (
                <div key={rem._id} className="flex items-start gap-3 p-3 border border-gray-800 bg-gray-800/30 rounded-xl hover:border-gray-700 transition-colors">
                  <button 
                    onClick={() => handleCompleteReminder(rem._id)}
                    className="mt-1 h-5 w-5 shrink-0 rounded-full border border-gray-500 flex items-center justify-center text-transparent hover:border-indigo-400 transition-colors"
                  >
                    <Check size={12} strokeWidth={3} />
                  </button>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/leads/${rem.leadId?._id}`)}>
                    <p className="text-sm font-medium text-gray-200 truncate">{rem.title}</p>
                    <p className="text-xs text-amber-400/80 mt-1 flex items-center gap-1.5 flex-wrap">
                      <Calendar size={12} /> 
                      {new Date(rem.reminderDate).toLocaleDateString()} {new Date(rem.reminderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {rem.leadId && <span className="ml-2 px-1.5 py-0.5 rounded-md bg-gray-800 text-gray-400">@ {rem.leadId.name}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
