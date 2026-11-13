import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWdsData } from '../context/WdsDataContext';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  BookOpen,
  FolderDown,
  Trophy,
  Calendar,
  Landmark,
  ShieldCheck,
  Lock,
  LogOut,
  ChevronRight,
  PenLine,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAdminLogin: () => void;
  onOpenVisitorPrefs: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAdminLogin,
  onOpenVisitorPrefs,
  mobileOpen,
  setMobileOpen,
}) => {
  const { adminRecord, isAdmin, logoutAdmin, visitorPrefs } = useAuth();
  const { settings, submissions } = useWdsData();

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  const navItems = [
    { id: 'dashboard', label: 'Society Home', icon: LayoutDashboard },
    { id: 'news', label: 'OLAG Gazette & News', icon: FileText },
    { id: 'debates', label: 'Debators Arena', icon: MessageSquare },
    { id: 'writters', label: "Writers' Corner", icon: BookOpen },
    { id: 'documents', label: 'Document Repository', icon: FolderDown },
    { id: 'leaderboard', label: 'Leaderboard & Honors', icon: Trophy },
    { id: 'events', label: 'Calendar & Assemblies', icon: Calendar },
    { id: 'society', label: 'Society & Contact', icon: Landmark },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Left Vertical Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Brand & Navigation */}
        <div className="overflow-y-auto flex-1">
          <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-slate-800 flex items-center justify-center text-amber-100 font-crest text-xl font-bold shadow-md shadow-amber-900/30 border border-amber-500/30 shrink-0">
                WDS
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-crest font-bold text-white text-base tracking-tight truncate">
                    {settings.schoolShortName} • WDS
                  </h1>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                    SHS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  Writers &amp; Debators Society
                </p>
                <p className="text-[10px] text-amber-400/80 italic font-serif-literary truncate">
                  {settings.schoolName}
                </p>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
              Society Sections
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 shadow-xs'
                      : 'hover:bg-slate-800/60 hover:text-white text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              );
            })}

            {/* Protected Admin Dashboard Tab */}
            {isAdmin && adminRecord && (
              <div className="pt-2 mt-2 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setCurrentTab('admin');
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentTab === 'admin'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-800/70 text-amber-300 hover:bg-slate-800 border border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck
                      className={`w-4 h-4 ${currentTab === 'admin' ? 'text-slate-950' : 'text-amber-400'}`}
                    />
                    <span>Admin Suite</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {pendingCount > 0 && (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                          currentTab === 'admin'
                            ? 'bg-slate-950 text-amber-300'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {pendingCount}
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom Area: Optional Visitor Byline & Admin Auth Gateway */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2 shrink-0">
          {/* Optional Display Name helper (NOT a user account or login) */}
          <button
            onClick={onOpenVisitorPrefs}
            className="w-full bg-slate-900 hover:bg-slate-800/80 p-2.5 rounded-xl border border-slate-800 hover:border-amber-500/30 flex items-center justify-between cursor-pointer transition-colors text-left"
            title="Set optional contributor display name for submissions (no account needed)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <PenLine className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-100 truncate">
                  {visitorPrefs.displayName ? visitorPrefs.displayName : 'Contributor Byline'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {visitorPrefs.displayName
                    ? visitorPrefs.authorClass || 'Optional display name set'
                    : 'Optional autofill • Zero login'}
                </p>
              </div>
            </div>
          </button>

          {/* Admin Sign-In / Signed-In State */}
          {isAdmin && adminRecord ? (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/30 text-xs">
              <div className="truncate pr-2">
                <span className="text-[9px] uppercase font-bold text-amber-400 block tracking-wider font-mono">
                  {adminRecord.role.replace('_', ' ')}
                </span>
                <span className="font-semibold text-white truncate text-[11px] block">
                  {adminRecord.displayName}
                </span>
                <span className="text-[10px] text-slate-400 truncate block">
                  {adminRecord.title || adminRecord.email}
                </span>
              </div>
              <button
                onClick={() => void logoutAdmin()}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                title="Sign Out Administrator"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Sign In</span>
            </button>
          )}

          <div className="text-center pt-0.5">
            <span className="text-[10px] text-slate-600 font-mono block">
              {settings.schoolShortName} • {settings.academicYear}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
