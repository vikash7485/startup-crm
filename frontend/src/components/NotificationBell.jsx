import React, { useState, useEffect, useRef } from "react";
import { notificationsApi } from "../services/api.js";
import { Bell, Check, Clock } from "lucide-react";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifs = async () => {
    try {
      const res = await notificationsApi.getAll({ limit: 10 });
      setNotifications(res.data.data.items);
      setUnreadCount(res.data.data.unreadCount);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifs();
    // Use interval to poll since user didn't request full socket setup explicitly, but mentioned "trigger"
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800 focus:outline-none"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-gray-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 max-h-[28rem] bg-gray-900 border border-gray-700/50 rounded-2xl shadow-xl shadow-black/80 flex flex-col z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-800/20">
            <h3 className="font-semibold text-gray-100 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs">{unreadCount} new</span>}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                <Bell size={24} className="mx-auto mb-2 opacity-20" />
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-gray-800/60">
                {notifications.map(notif => (
                  <div key={notif._id} className={`p-4 hover:bg-gray-800/40 transition-colors ${!notif.read ? 'bg-indigo-500/5' : ''}`}>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <p className={`text-sm leading-snug ${!notif.read ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                          <Clock size={12} /> {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!notif.read && (
                        <button 
                          onClick={(e) => handleMarkRead(notif._id, e)}
                          className="h-7 w-7 rounded-full flex items-center justify-center text-indigo-400 hover:bg-indigo-500/20 transition-colors shrink-0"
                          title="Mark as read"
                        >
                          <Check size={14} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
