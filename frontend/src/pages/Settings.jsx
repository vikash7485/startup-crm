import React, { useState, useEffect } from "react";
import { authApi } from "../services/api";
import { User, Shield, Palette, Save, Loader2, Moon, Sun, CheckCircle } from "lucide-react";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [theme, setTheme] = useState(localStorage.getItem("crm-theme") || "dark");

  useEffect(() => {
    fetchProfile();
    // Apply theme on mount
    document.documentElement.classList.toggle("light", theme === "light");
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await authApi.getMe();
      setUser({ name: res.data.data.user.name, email: res.data.data.user.email });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await authApi.updateProfile({ name: user.name, email: user.email });
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error?.message || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setMessage({ type: "error", text: "New passwords do not match" });
    }
    setSaving(true);
    setMessage(null);
    try {
      await authApi.changePassword({ 
        currentPassword: passwords.currentPassword, 
        newPassword: passwords.newPassword 
      });
      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error?.message || "Failed to change password" });
    } finally {
      setSaving(false);
    }
  };

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("crm-theme", newTheme);
    document.documentElement.classList.toggle("light", newTheme === "light");
  };

  const inputCls = "w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm";
  const tabCls = (id) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === id ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account preferences and app appearance</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {message.type === 'success' && <CheckCircle size={18} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-2">
        <button onClick={() => setActiveTab("profile")} className={tabCls("profile")}>
          <User size={18} /> Profile
        </button>
        <button onClick={() => setActiveTab("appearance")} className={tabCls("appearance")}>
          <Palette size={18} /> Appearance
        </button>
        <button onClick={() => setActiveTab("security")} className={tabCls("security")}>
          <Shield size={18} /> Security
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        {activeTab === "profile" && (
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Display Name</label>
                <input 
                  className={inputCls} 
                  value={user.name} 
                  onChange={e => setUser({...user, name: e.target.value})}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Email Address</label>
                <input 
                  type="email" 
                  className={inputCls} 
                  value={user.email} 
                  onChange={e => setUser({...user, email: e.target.value})}
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
          </form>
        )}

        {activeTab === "appearance" && (
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Interface Theme</h3>
              <p className="text-sm text-gray-400">Choose how the StartupCRM interface looks for you.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => toggleTheme("dark")}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 ${theme === 'dark' ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-800 hover:border-gray-700 bg-gray-900/50'}`}
                >
                  <div className="w-full aspect-video bg-gray-950 rounded-lg flex items-center justify-center border border-gray-800">
                    <Moon className="text-indigo-400" size={32} />
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-white">Dark Mode</span>
                    {theme === 'dark' && <div className="w-2 h-2 bg-indigo-500 rounded-full" />}
                  </div>
                </button>

                <button 
                  onClick={() => toggleTheme("light")}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 ${theme === 'light' ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-800 hover:border-gray-700 bg-gray-900/50'}`}
                >
                  <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300">
                    <Sun className="text-amber-500" size={32} />
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-white">White Mode</span>
                    {theme === 'light' && <div className="w-2 h-2 bg-indigo-500 rounded-full" />}
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-800 space-y-4">
              <h3 className="text-lg font-semibold text-white">Accent Color</h3>
              <div className="flex gap-4">
                {['indigo', 'emerald', 'rose', 'amber'].map(color => (
                   <div key={color} className={`w-8 h-8 rounded-full cursor-pointer border-2 ${color === 'indigo' ? 'border-white bg-indigo-500' : 'border-transparent bg-' + color + '-500 hover:scale-110 transition-transform'}`} />
                ))}
              </div>
              <p className="text-xs text-gray-500 italic">* Accent color customization coming soon.</p>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <form onSubmit={handleChangePassword} className="p-6 space-y-6">
            <div className="max-w-md space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Current Password</label>
                <input 
                  type="password" 
                  className={inputCls} 
                  value={passwords.currentPassword}
                  onChange={e => setPasswords({...passwords, currentPassword: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">New Password</label>
                <input 
                  type="password" 
                  className={inputCls}
                  value={passwords.newPassword}
                  onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Confirm New Password</label>
                <input 
                  type="password" 
                  className={inputCls}
                  value={passwords.confirmPassword}
                  onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                />
              </div>
              <button 
                type="submit" 
                disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Settings;
