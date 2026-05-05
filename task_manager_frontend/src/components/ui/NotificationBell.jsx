import { useState, useRef, useEffect } from 'react'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/useNotifications'

function timeAgo(dateString) {
  const date = new Date(dateString)
  const seconds = Math.floor((new Date() - date) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + " years ago"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + " months ago"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + " days ago"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + " hours ago"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + " minutes ago"
  return Math.floor(seconds) + " seconds ago"
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  const { data, isLoading } = useNotifications()
  const { mutate: markRead } = useMarkNotificationRead()
  const { mutate: markAllRead } = useMarkAllNotificationsRead()

  const unreadCount = data?.unread_count || 0
  const notifications = data?.results || []

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-10 bottom-10 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[400px]">
          <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllRead()}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-4 text-center text-slate-400 text-sm">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">No notifications yet.</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`p-3 transition-colors ${notif.is_read ? 'opacity-60' : 'bg-slate-800 hover:bg-slate-700/80'}`}
                  >
                    <div className="flex gap-3">
                      {!notif.is_read && (
                        <div className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm ${notif.is_read ? 'text-slate-400' : 'text-slate-200'}`}>
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {timeAgo(notif.created_at)}
                        </span>
                        {!notif.is_read && (
                          <button 
                            onClick={() => markRead(notif.id)}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 mt-1.5 font-medium"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
