import React, { useState, useEffect } from "react";
import { analyticsApi } from "../services/api.js";
import { useNavigate } from "react-router-dom";
import {
  Users, Briefcase, Trophy, DollarSign, TrendingUp, TrendingDown, Target, RefreshCw
} from "lucide-react";

const KPICard = ({ title, value, icon: Icon, color, trend }) => {
  const colorMap = {
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
    orange: "from-amber-500/20 to-amber-600/5 border-amber-500/20",
    green: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    purple: "from-purple-500/20 to-purple-600/5 border-purple-500/20",
    pink: "from-pink-500/20 to-pink-600/5 border-pink-500/20",
  };
  const iconBg = {
    blue: "bg-blue-500/20 text-blue-400",
    orange: "bg-amber-500/20 text-amber-400",
    green: "bg-emerald-500/20 text-emerald-400",
    purple: "bg-purple-500/20 text-purple-400",
    pink: "bg-pink-500/20 text-pink-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{title}</p>
          <p className="text-xl lg:text-2xl font-bold text-white mt-1">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(30);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const overviewRes = await analyticsApi.getOverview({ date_range: dateRange });
      setOverview(overviewRes.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dateRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">Performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {[{ label: "30 days", value: 30 }, { label: "90 days", value: 90 }, { label: "Year", value: 365 }].map(opt => (
              <button
                key={opt.value} onClick={() => setDateRange(opt.value)}
                className={`px-3 py-2 text-xs font-medium transition-all ${dateRange === opt.value ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="p-2.5 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded-xl transition-all">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4">
          {error} <button onClick={fetchData} className="ml-2 underline">Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-800/50 border border-gray-700/30 rounded-2xl p-5 animate-pulse">
              <div className="space-y-3">
                <div className="h-3 w-20 skeleton rounded" />
                <div className="h-7 w-14 skeleton rounded" />
                <div className="h-3 w-12 skeleton rounded" />
              </div>
            </div>
          ))
        ) : overview && (
          <>
            <KPICard title="Total Leads" value={overview.total_leads} icon={Users} color="blue" trend={10} />
            <KPICard title="Total Deals" value={overview.total_deals} icon={Briefcase} color="orange" trend={8} />
            <KPICard title="Won Deals" value={overview.won_deals} icon={Trophy} color="green" trend={15} />
            <KPICard title="Revenue" value={`$${(overview.total_revenue || 0).toLocaleString()}`} icon={DollarSign} color="purple" trend={22} />
            <KPICard title="Conversion Rate" value={`${overview.conversion_rate || 0}%`} icon={Target} color="pink" trend={5} />
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
