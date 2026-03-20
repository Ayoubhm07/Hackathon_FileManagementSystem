import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Upload, FileText, Users, Settings,
  ChevronLeft, ChevronRight, Bell, Search, LogOut,
} from 'lucide-react';
import keycloak from '../keycloak';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationPanel } from './NotificationPanel';
import { ToastNotification } from './ToastNotification';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/upload',    icon: Upload,          label: 'Déposer' },
  { to: '/documents', icon: FileText,        label: 'Documents' },
  { to: '/suppliers/new', icon: Users,       label: 'Fournisseurs' },
  { to: '/settings',  icon: Settings,        label: 'Paramètres' },
];

// Per-route transitions
const ROUTE_TRANSITIONS: Record<string, object> = {
  '/dashboard':    { initial: { opacity: 0, scale: 0.98 },      animate: { opacity: 1, scale: 1 },      exit: { opacity: 0, scale: 1.01 } },
  '/upload':       { initial: { opacity: 0, y: 20 },            animate: { opacity: 1, y: 0 },           exit: { opacity: 0, y: -20 } },
  '/documents':    { initial: { opacity: 0, x: 20 },            animate: { opacity: 1, x: 0 },           exit: { opacity: 0, x: -20 } },
  '/suppliers/new':{ initial: { opacity: 0, x: -20 },           animate: { opacity: 1, x: 0 },           exit: { opacity: 0, x: 20 } },
  '/settings':     { initial: { opacity: 0, filter: 'blur(4px)'},animate: { opacity: 1, filter: 'blur(0px)'},exit: { opacity: 0 } },
};

const DEFAULT_TRANSITION = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

function getTransition(pathname: string) {
  return ROUTE_TRANSITIONS[pathname] ?? DEFAULT_TRANSITION;
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const location = useLocation();
  const username = keycloak.tokenParsed?.preferred_username ?? 'Utilisateur';
  const initials = username.slice(0, 2).toUpperCase();
  const trans = getTransition(location.pathname);
  const { notifications, unreadCount, pendingToast, markAsRead, markAllAsRead, clearToast } = useNotifications();

  return (
    <div className="flex h-screen overflow-hidden bg-navy">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-shrink-0 flex flex-col bg-slate border-r border-border relative z-20"
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border overflow-hidden">
          <motion.div
            whileHover={{ rotate: [0, -5, 5, 0], boxShadow: '0 0 16px rgba(59,130,246,0.5)' }}
            transition={{ duration: 0.4 }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple flex items-center justify-center flex-shrink-0 cursor-pointer"
          >
            <span className="text-white font-bold text-sm">D</span>
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: -10, width: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-3 font-bold text-textprimary text-lg whitespace-nowrap overflow-hidden"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                DocFlow
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-hidden">
          {NAV_ITEMS.map(({ to, icon: Icon, label }, idx) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer relative overflow-hidden ${
                    isActive
                      ? 'bg-primary/15 text-primary border border-primary/25'
                      : 'text-textsecondary hover:text-textprimary hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={18} className="flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          whileHover={{ scale: 1.15, borderColor: 'rgba(59,130,246,0.5)' }}
          whileTap={{ scale: 0.9 }}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate border border-border rounded-full flex items-center justify-center text-textsecondary hover:text-primary transition-colors z-30"
        >
          <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.3 }}>
            <ChevronRight size={12} />
          </motion.div>
        </motion.button>

        {/* User */}
        <div className="border-t border-border p-3 overflow-hidden">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
            >
              {initials}
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-medium text-textprimary truncate">{username}</p>
                  <p className="text-xs text-textsecondary">Opérateur</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && (
              <motion.button
                onClick={() => keycloak.logout()}
                whileHover={{ scale: 1.2, color: '#EF4444' }}
                whileTap={{ scale: 0.9 }}
                className="text-textsecondary ml-auto flex-shrink-0 transition-colors"
              >
                <LogOut size={14} />
              </motion.button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex items-center gap-4 px-6 bg-slate/50 border-b border-border backdrop-blur-sm flex-shrink-0 z-30 relative">
          <div className="flex-1 relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textsecondary pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un document..."
              className="w-full pl-9 pr-4 py-2 bg-navy/60 border border-border rounded-lg text-sm text-textprimary placeholder-textsecondary focus:outline-none focus:border-primary/50 focus:bg-primary/5 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] transition-all duration-200"
            />
          </div>
          <div className="relative z-[200]">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setPanelOpen(o => !o)}
              className="relative p-2 text-textsecondary hover:text-textprimary transition-colors"
            >
              <motion.div
                animate={unreadCount > 0 ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 4 }}
              >
                <Bell size={18} />
              </motion.div>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </motion.button>
            <AnimatePresence>
              {panelOpen && (
                <NotificationPanel
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onClose={() => setPanelOpen(false)}
                />
              )}
            </AnimatePresence>
          </div>
          <ToastNotification notification={pendingToast} onDismiss={clearToast} />
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center text-white text-xs font-bold cursor-pointer"
          >
            {initials}
          </motion.div>
        </header>

        {/* Page content with per-route transitions */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              {...trans}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
