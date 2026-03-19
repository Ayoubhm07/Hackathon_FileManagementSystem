import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ShieldCheck, Bell, BarChart3, FileBarChart, ScrollText, ChevronLeft, ChevronRight, Search, LogOut } from 'lucide-react';
import keycloak from '../keycloak';

const NAV_ITEMS = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/validations', icon: ShieldCheck,      label: 'Centre de validation' },
  { to: '/alerts',      icon: Bell,             label: 'Alertes' },
  { to: '/analysis',    icon: BarChart3,         label: 'Analyse croisée' },
  { to: '/reports',     icon: FileBarChart,      label: 'Rapports' },
  { to: '/audit',       icon: ScrollText,        label: 'Journal d\'audit' },
];

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const username = keycloak.tokenParsed?.preferred_username ?? 'Validateur';
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-navy">
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-shrink-0 flex flex-col bg-slate border-r border-border relative z-20"
      >
        <div className="flex items-center h-16 px-4 border-b border-border overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={14} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="ml-3 overflow-hidden">
                <p className="font-bold text-textprimary text-sm whitespace-nowrap">DocFlow</p>
                <p className="text-xs text-primary whitespace-nowrap">Compliance</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-hidden">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <motion.div whileHover={{ x: 2 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isActive ? 'bg-primary/20 text-primary border border-primary/30' : 'text-textsecondary hover:text-textprimary hover:bg-white/5'
                  }`}>
                  <Icon size={18} className="flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                        className="text-sm font-medium whitespace-nowrap">{label}</motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate border border-border rounded-full flex items-center justify-center text-textsecondary hover:text-primary transition-colors">
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        <div className="border-t border-border p-3 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">{initials}</div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-textprimary truncate">{username}</p>
                  <p className="text-xs text-textsecondary">Validateur</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && (
              <button onClick={() => keycloak.logout()} className="text-textsecondary hover:text-danger transition-colors ml-auto flex-shrink-0">
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center gap-4 px-6 bg-slate/50 border-b border-border backdrop-blur-sm flex-shrink-0">
          <div className="flex-1 relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textsecondary" />
            <input type="text" placeholder="Rechercher..." className="w-full pl-9 pr-4 py-2 bg-navy/60 border border-border rounded-lg text-sm text-textprimary placeholder-textsecondary focus:outline-none focus:border-primary/50 transition-colors" />
          </div>
          <button className="relative p-2 text-textsecondary hover:text-textprimary transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full animate-ping-slow" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">{initials}</div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
