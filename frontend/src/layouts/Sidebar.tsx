import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Mic, FileText, BookOpen,
  Sparkles, Bot, Download, Settings,
  ChevronLeft, ChevronRight, Activity, HardDrive
} from 'lucide-react';
import { cn } from '@/utils';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/upload', icon: Mic, label: 'Upload' },
  { to: '/transcript', icon: FileText, label: 'Transcript' },
  { to: '/chapters', icon: BookOpen, label: 'Chapters' },
  { to: '/summary', icon: Sparkles, label: 'AI Summary' },
  { to: '/chat', icon: Bot, label: 'Ask AI' },
  { to: '/downloads', icon: Download, label: 'Export' },
];

const bottomItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const renderNavItem = ({ to, icon: Icon, label }: typeof navItems[0]) => {
    const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
    return (
      <NavLink key={to} to={to} className="block relative group outline-none mb-1">
        {/* Purple Active indicator dot/bar */}
        {active && (
          <motion.div
            layoutId="active-nav-indicator"
            className="absolute left-1 top-1/2 -translate-y-1/2 w-[4px] h-[16px] bg-[var(--color-primary)] rounded-r-full z-10"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <div
          className={cn(
            'flex items-center gap-[14px] px-4 py-3 mx-3 rounded-lg transition-all duration-200 cursor-pointer text-sm font-medium',
            active 
              ? 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-sm' 
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] border border-transparent',
            collapsed && 'justify-center mx-2 px-0'
          )}
        >
          <Icon className={cn(
            'w-5 h-5 shrink-0 transition-transform duration-200',
            active ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-text-secondary)] group-hover:scale-105'
          )} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="truncate"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </NavLink>
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col h-screen bg-[var(--color-sidebar)] border-r border-[var(--color-border)] overflow-hidden shrink-0 z-30"
    >
      {/* Header */}
      <div className={cn(
        'flex items-center px-6 h-16 shrink-0 border-b border-[var(--color-border)]',
        collapsed ? 'justify-center px-0' : 'justify-between'
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center shrink-0">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0"
              >
                <h2 className="text-lg font-bold tracking-tight text-[var(--color-text)] font-heading">Podcast AI</h2>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] border border-transparent hover:border-[var(--color-border)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-4 w-10 h-10 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-1">
        {navItems.map(renderNavItem)}
      </nav>

      {/* Footer Nav & Status */}
      <div className="pt-2 pb-6 border-t border-[var(--color-border)] bg-[var(--color-sidebar)] space-y-1">
        {bottomItems.map(renderNavItem)}
        
        <AnimatePresence>
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 pt-4 pb-2 space-y-4 text-[13px]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[14px] text-[var(--color-muted)]">
                  <HardDrive className="w-4 h-4" />
                  <span>Storage</span>
                </div>
                <span className="text-[var(--color-text-secondary)] font-semibold font-mono">1.2 GB</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[14px] text-[var(--color-muted)]">
                  <Activity className="w-4 h-4" />
                  <span>Backend</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--color-success)] font-semibold">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                  Online
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)] pt-3 border-t border-[var(--color-border)]">
                <span>Version</span>
                <span className="font-mono">v1.2.0</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
