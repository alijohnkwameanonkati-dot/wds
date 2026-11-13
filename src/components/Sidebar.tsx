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
  PenLine,
  X,
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
    { id: 'leaderboard', label: 'Rankings & Honors', icon: Trophy },
    { id: 'events', label: 'Calendar & Assemblies', icon: Calendar },
    { id: 'society', label: 'Society Charter', icon: Landmark },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-[#0A0D14]/70 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#111622] border-r border-[#1F2738] text-stone-300 flex flex-col justify-between transition-transform duration-200 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto flex-1">
          {/* Editorial Crest Header */}
          <div className="px-5 py-5 border-b border-[#1F2738] flex items-start justify-between gap-2">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-lg bg-[#1A2233] border border-amber-500/40 flex items-center justify-center text-amber-400 font-crest text-lg font-bold tracking-wider shrink-0">
                WDS
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-400/90 truncate">
                  {settings.schoolShortName} · SHS
                </p>
                <h1 className="font-crest font-bold text-white text-lg leading-tight truncate mt-0.5">
                  Writers &amp; Debators
                </h1>
                <p className="text-[11px] text-stone-400 truncate mt-0.5">
                  {settings.schoolName}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-2 -mr-1 text-stone-400 hover:text-white rounded-lg cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="p-3.5 space-y-1">
            <div className="px-3 pt-1 pb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-stone-500">
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 min-h-[42px] rounded-lg text-[13px] transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1B2335] text-white font-semibold border border-amber-500/35'
                      : 'text-stone-300/90 hover:bg-[#171E2E] hover:text-white font-medium border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-amber-400' : 'text-stone-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  )}
                </button>
              );
            })}

            {isAdmin && adminRecord && (
              <div className="pt-3 mt-3 border-t border-[#1F2738]">
                <div className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-amber-400/75">
                  Executive Desk
                </div>
                <button
                  onClick={() => {
                    setCurrentTab('admin');
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 min-h-[42px] rounded-lg text-[13px] font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                    currentTab === 'admin'
                      ? 'bg-amber-600 text-white'
                      : 'bg-[#171E2E] text-amber-300 hover:bg-[#1E273B] border border-[#2A344B]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck
                      className={`w-4 h-4 shrink-0 ${
                        currentTab === 'admin' ? 'text-white' : 'text-amber-400'
                      }`}
                    />
                    <span>Admin Suite</span>
                  </div>
                  {pendingCount > 0 && (
                    <span
                      className={`text-[11px] font-mono font-bold tabular-nums px-2 py-0.5 rounded ${
                        currentTab === 'admin'
                          ? 'bg-[#111622] text-amber-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom Byline & Authorized Admin Gateway */}
        <div className="p-3.5 border-t border-[#1F2738] bg-[#0D111A] space-y-2 shrink-0">
          <button
            onClick={onOpenVisitorPrefs}
            className="w-full bg-[#151C2B] hover:bg-[#1B2335] px-3 py-2.5 rounded-lg border border-[#242E42] hover:border-amber-500/35 flex items-center gap-3 cursor-pointer transition-colors text-left"
            title="Set optional contributor display name for submissions (no account needed)"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <PenLine className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-stone-100 truncate">
                {visitorPrefs.displayName ? visitorPrefs.displayName : 'Contributor Byline'}
              </p>
              <p className="text-[11px] text-stone-400 truncate">
                {visitorPrefs.displayName
                  ? visitorPrefs.authorClass || 'Saved for this session'
                  : 'Optional autofill · No login'}
              </p>
            </div>
          </button>

          {isAdmin && adminRecord ? (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#151C2B] border border-amber-500/30 text-xs">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] uppercase font-mono text-amber-400 block tracking-wider">
                  {adminRecord.role.replace('_', ' ')}
                </span>
                <span className="font-semibold text-white truncate text-xs block">
                  {adminRecord.displayName}
                </span>
                <span className="text-[11px] text-stone-400 truncate block">
                  {adminRecord.title || adminRecord.email}
                </span>
              </div>
              <button
                onClick={() => void logoutAdmin()}
                className="p-2 text-stone-400 hover:text-rose-400 hover:bg-[#1F293D] rounded-lg cursor-pointer transition-colors shrink-0"
                title="Sign Out Administrator"
                aria-label="Sign Out Administrator"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-[#242E42] hover:border-amber-500/40 bg-[#151C2B] hover:bg-[#1B2335] text-stone-200 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Sign In</span>
            </button>
          )}

          <div className="text-center pt-0.5">
            <span className="text-[10px] text-stone-500 font-mono tracking-wider block">
              {settings.schoolShortName} · {settings.academicYear}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
