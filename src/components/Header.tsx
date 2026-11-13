import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWdsData } from '../context/WdsDataContext';
import { Menu, Search, Pin, FolderUp, ShieldCheck, PenLine } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onOpenSearch: () => void;
  onOpenUpload: () => void;
  onOpenVisitorPrefs: () => void;
  onNavigateAdmin: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenSearch,
  onOpenUpload,
  onOpenVisitorPrefs,
  onNavigateAdmin,
  setMobileOpen,
}) => {
  const { isAdmin, adminRecord, visitorPrefs } = useAuth();
  const { settings, news, announcements } = useWdsData();

  const urgentAnnouncement = announcements.find((a) => a.priority === 'urgent' || a.priority === 'important');
  const pinnedUrgentNews = news.find((n) => n.isPinned && (n.priority === 'urgent' || n.isOfficial));
  const tickerText = urgentAnnouncement
    ? `${urgentAnnouncement.title} — ${urgentAnnouncement.message}`
    : pinnedUrgentNews?.title;

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Society Home & Overview';
      case 'news':
        return 'OLAG Gazette & Bulletins';
      case 'debates':
        return `Debators Arena • ${settings.debateCycleDays}-Day Motions`;
      case 'writters':
        return "Writers' Corner • Literary Journal";
      case 'documents':
        return 'Document Repository • Research & Briefs';
      case 'leaderboard':
        return 'Leaderboard & Monthly Honors';
      case 'events':
        return 'Assembly Meets & Calendar';
      case 'society':
        return 'Society Charter & Contact';
      case 'admin':
        return 'Admin Moderation & Governance Suite';
      default:
        return 'Writers and Debators Society';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Urgent Notice / Pinned Gazette Ticker */}
      {tickerText && (
        <div className="bg-slate-900 text-amber-200 px-4 py-1.5 text-xs font-medium flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 truncate max-w-6xl mx-auto">
            <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider shrink-0">
              <Pin className="w-2.5 h-2.5" /> Official Notice
            </span>
            <span className="truncate text-slate-200">{tickerText}</span>
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Mobile menu & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer shrink-0"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                {settings.schoolShortName} • WDS
              </span>
              <span className="text-slate-300">/</span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 font-crest truncate">
                {getTabTitle(currentTab)}
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block truncate">
              {settings.schoolName} • {settings.currentTerm}
            </p>
          </div>
        </div>

        {/* Right: Contribute (No login), Search, Optional Byline / Admin Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer border border-slate-700"
            title="Contribute articles, poems, essays, or documents without signing in"
          >
            <FolderUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Contribute / Upload</span>
            <span className="sm:hidden">Contribute</span>
          </button>

          <button
            onClick={onOpenSearch}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            title="Search WDS (⌘K)"
            aria-label="Search WDS"
          >
            <Search className="w-4 h-4" />
          </button>

          {isAdmin && adminRecord ? (
            <button
              onClick={onNavigateAdmin}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold cursor-pointer hover:bg-amber-100 transition-colors"
              title="Open Admin Dashboard"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>{adminRecord.displayName.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={onOpenVisitorPrefs}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-amber-300 bg-slate-50 hover:bg-amber-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Set optional contributor name & class (no account required)"
            >
              <PenLine className="w-3.5 h-3.5 text-amber-600" />
              <span>{visitorPrefs.displayName ? visitorPrefs.displayName.split(' ')[0] : 'Set Byline'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
