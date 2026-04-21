import React, { useState, useEffect } from "react";
import { analyticsApi, dashboardApi } from "../services/api.js";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, FunnelChart, Funnel as RechartsFunnel, LabelList
} from "recharts";
import { 
  Users, Briefcase, Trophy, DollarSign, Target, Activity as ActivityIcon, 
  TrendingUp, TrendingDown, Clock, ArrowRight, UserPlus, FileText 
} from "lucide-react";

// Colors for our charts
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const FUNNEL_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];
const PIE_COLORS = {
  "to-do": "#6b7280",        // Gray
  "in-progress": "#3b82f6",  // Blue
  "negotiation": "#f59e0b",  // Amber
  "closed": "#10b981"        // Emerald
};

// Activity icons mapper
const activityIcons = {
  lead_created: { icon: UserPlus, color: "text-blue-400 bg-blue-500/10" },
  lead_updated: { icon: FileText, color: "text-amber-400 bg-amber-500/10" },
  lead_deleted: { icon: Users, color: "text-red-400 bg-red-500/10" },
  deal_created: { icon: Briefcase, color: "text-emerald-400 bg-emerald-500/10" },
  deal_updated: { icon: FileText, color: "text-amber-400 bg-amber-500/10" },
  deal_status_changed: { icon: ArrowRight, color: "text-purple-400 bg-purple-500/10" },
  deal_closed: { icon: Trophy, color: "text-emerald-400 bg-emerald-500/10" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Custom Tooltip for dark mode
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700/50 p-3 rounded-lg shadow-xl shadow-black/50 backdrop-blur-md">
        <p className="text-gray-300 font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-400 capitalize">{entry.name}:</span>
            <span className="text-white font-semibold">
              {entry.name.toLowerCase().includes('revenue') 
                ? `$${entry.value.toLocaleString()}` 
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const KPICard = ({ title, value, icon: Icon, color }) => {
  const colorMap = {
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
    orange: "from-amber-500/20 to-amber-600/5 border-amber-500/20",
    green: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    purple: "from-purple-500/20 to-purple-600/5 border-purple-500/20",
    pink: "from-pink-500/20 to-pink-600/5 border-pink-500/20",
    indigo: "from-indigo-500/20 to-indigo-600/5 border-indigo-500/20",
  };
  
  const iconBg = {
    blue: "bg-blue-500/20 text-blue-400",
    orange: "bg-amber-500/20 text-amber-400",
    green: "bg-emerald-500/20 text-emerald-400",
    purple: "bg-purple-500/20 text-purple-400",
    pink: "bg-pink-500/20 text-pink-400",
    indigo: "bg-indigo-500/20 text-indigo-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-white mt-1.5">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${iconBg[color]} shadow-inner`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const [data, setData] = useState({
    overview: null,
    salesMetrics: [],
    dealBreakdown: [],
    funnel: [],
    activities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(30);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // For backend compatibility, derive months parameter
      const monthsParam = dateRange === 365 ? 12 : dateRange === 90 ? 3 : 1;
      
      const [overviewRes, metricsRes, breakdownRes, funnelRes, activitiesRes] = await Promise.all([
        analyticsApi.getOverview({ date_range: dateRange }),
        dashboardApi.getSalesMetrics({ months: Math.max(6, monthsParam) }), // ensure at least 6 bars/points for aesthetics on charts if possible
        analyticsApi.getDealStatusBreakdown(),
        analyticsApi.getConversionFunnel(),
        dashboardApi.getActivities({ limit: 8 })
      ]);

      // Format Deal Breakdown Data
      const breakdownObj = breakdownRes.data.data;
      const formattedBreakdown = Object.keys(breakdownObj).map(key => ({
        name: key.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase()),
        value: breakdownObj[key],
        rawKey: key
      })).filter(item => item.value > 0); // only show active stages

      setData({
        overview: overviewRes.data.data,
        salesMetrics: metricsRes.data.data,
        dealBreakdown: formattedBreakdown,
        funnel: funnelRes.data.data.stages,
        activities: activitiesRes.data.data.activities
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dateRange]);

  const { overview, salesMetrics, dealBreakdown, funnel, activities } = data;

  return (
    <div className="space-y-6 pb-10">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Holistic view of your CRM operations</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 p-1 rounded-xl shadow-lg">
          {[{ label: "30 days", value: 30 }, { label: "90 days", value: 90 }, { label: "1 Year", value: 365 }].map(opt => (
            <button
              key={opt.value} 
              onClick={() => setDateRange(opt.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all 
                ${dateRange === opt.value ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "text-gray-400 hover:text-gray-200"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center justify-between">
          <p>{error}</p>
          <button onClick={fetchData} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-all">Retry</button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800/40 border border-gray-700/30 rounded-2xl p-5 animate-pulse h-28" />
          ))
        ) : overview ? (
          <>
            <KPICard title="Total Leads" value={overview.total_leads} icon={Users} color="blue" />
            <KPICard title="Total Deals" value={overview.total_deals} icon={Briefcase} color="orange" />
            <KPICard title="Won Deals" value={overview.won_deals} icon={Trophy} color="green" />
            <KPICard title="Revenue" value={`$${(overview.total_revenue || 0).toLocaleString()}`} icon={DollarSign} color="purple" />
            <KPICard title="Conversion Rate" value={`${overview.conversion_rate || 0}%`} icon={Target} color="pink" />
            <KPICard title="Avg Deal Value" value={`$${(overview.average_deal_value || 0).toLocaleString()}`} icon={ActivityIcon} color="indigo" />
          </>
        ) : null}
      </div>

      {/* Main Charts Layout */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Leads Growth */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
            <h3 className="text-gray-100 font-semibold mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-500 rounded-sm inline-block" /> Leads Growth
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesMetrics} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#4b5563', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Line type="monotone" dataKey="leads_count" name="Leads" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#1f2937" }} activeDot={{ r: 6 }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Revenue Over Time */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
            <h3 className="text-gray-100 font-semibold mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-purple-500 rounded-sm inline-block" /> Monthly Revenue
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesMetrics} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#374151', opacity: 0.4 }} />
                  <Bar dataKey="revenue_value" name="Revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Pipeline Distribution */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <h3 className="text-gray-100 font-semibold mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-teal-500 rounded-sm inline-block" /> Pipeline Distribution
            </h3>
            {dealBreakdown.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-gray-500 italic">No deals in pipeline</div>
            ) : (
              <div className="h-[300px] w-full flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dealBreakdown} cx="50%" cy="50%" innerRadius={70} outerRadius={100}
                      paddingAngle={4} dataKey="value" stroke="none"
                      animationDuration={1500}
                    >
                      {dealBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.rawKey] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 space-y-3">
                  {dealBreakdown.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[entry.rawKey] || COLORS[idx % COLORS.length] }} />
                      <span className="text-gray-300 font-medium">{entry.name} <span className="text-gray-500 ml-1">({entry.value})</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chart 4: Conversion Funnel Layout */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <h3 className="text-gray-100 font-semibold mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-pink-500 rounded-sm inline-block" /> Conversion Funnel
            </h3>
            {funnel.length === 0 || funnel.every(f => f.count === 0) ? (
              <div className="h-[300px] flex items-center justify-center text-gray-500 italic">No funnel data available</div>
            ) : (
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <RechartsFunnel
                      dataKey="count"
                      data={funnel}
                      isAnimationActive
                    >
                      <LabelList position="right" fill="#d1d5db" stroke="none" dataKey="name" fontSize={13} />
                      <LabelList position="inside" fill="#fff" stroke="none" dataKey="count" fontSize={14} fontWeight="bold" />
                      {funnel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                      ))}
                    </RechartsFunnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Bottom Section: Recent Activity Insights */}
      {!loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg mt-6 relative">
          <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Clock size={18} className="text-gray-400" /> Recent Activity Insights
            </h3>
          </div>
          <div className="p-5">
            {activities.length === 0 ? (
              <div className="text-center py-10 text-gray-500 italic">No recent activities on record</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activities.map(activity => {
                  const iconData = activityIcons[activity.activity_type] || activityIcons.lead_created;
                  const IconComp = iconData.icon;
                  return (
                    <div key={activity._id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-800 bg-gray-800/40 hover:bg-gray-800 transition-colors">
                      <div className={`p-2.5 rounded-xl ${iconData.color} shrink-0`}>
                        <IconComp size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{timeAgo(activity.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Analytics;
