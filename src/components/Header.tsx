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

  const urgentAnnouncement = announcements.find(
    (a) => a.priority === 'urgent' || a.priority === 'important'
  );
  const pinnedUrgentNews = news.find(
    (n) => n.isPinned && (n.priority === 'urgent' || n.isOfficial)
  );
  const tickerText = urgentAnnouncement
    ? `${urgentAnnouncement.title} — ${urgentAnnouncement.message}`
    : pinnedUrgentNews?.title;

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Society Home & Dispatch';
      case 'news':
        return 'OLAG Gazette & Bulletins';
      case 'debates':
        return `Debators Arena · ${settings.debateCycleDays}-Day Motions`;
      case 'writters':
        return "Writers' Corner · Literary Journal";
      case 'documents':
        return 'Document Repository';
      case 'leaderboard':
        return 'Rankings & Monthly Honors';
      case 'events':
        return 'Assemblies & Calendar';
      case 'society':
        return 'Society Charter & Contact';
      case 'admin':
        return 'Administration & Moderation';
      default:
        return 'Writers and Debators Society';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F3]/95 backdrop-blur-md border-b border-stone-200">
      {tickerText && (
        <div className="bg-[#111622] text-stone-200 px-4 py-1.5 text-[11px] border-b border-[#1F2738]">
          <div className="flex items-center gap-2.5 max-w-7xl mx-auto truncate">
            <span className="inline-flex items-center gap-1.5 text-amber-400 font-mono font-semibold uppercase tracking-[0.14em] shrink-0 text-[10px]">
              <Pin className="w-3 h-3" /> Official Notice
            </span>
            <span className="text-stone-600 shrink-0">·</span>
            <span className="truncate text-stone-200 font-medium">{tickerText}</span>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2.5 -ml-1 text-stone-700 hover:bg-stone-200/70 rounded-lg cursor-pointer shrink-0 min-h-[42px] min-w-[42px] flex items-center justify-center"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold text-amber-800 uppercase tracking-[0.14em] shrink-0">
                {settings.schoolShortName} · WDS
              </span>
              <span className="text-stone-300">/</span>
              <h2 className="text-base sm:text-lg font-bold text-[#111622] font-crest truncate">
                {getTabTitle(currentTab)}
              </h2>
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block truncate">
              {settings.schoolName} · {settings.currentTerm}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#111622] hover:bg-[#1E273B] text-amber-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap min-h-[38px]"
            title="Contribute articles, poems, essays, or documents without signing in"
          >
            <FolderUp className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Contribute / Upload</span>
            <span className="sm:hidden">Contribute</span>
          </button>

          <button
            onClick={onOpenSearch}
            className="px-2.5 py-2 text-stone-600 hover:text-[#111622] hover:bg-stone-200/70 border border-stone-200 bg-white rounded-lg transition-colors cursor-pointer flex items-center gap-2 min-h-[38px]"
            title="Search WDS (⌘K)"
            aria-label="Search WDS"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline text-[11px] font-mono text-stone-400">⌘K</span>
          </button>

          {isAdmin && adminRecord ? (
            <button
              onClick={onNavigateAdmin}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-300/80 text-amber-950 text-xs font-semibold cursor-pointer hover:bg-amber-100 transition-colors whitespace-nowrap min-h-[38px]"
              title="Open Admin Dashboard"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>{adminRecord.displayName.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={onOpenVisitorPrefs}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 hover:border-amber-600/40 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap min-h-[38px]"
              title="Set optional contributor name & class (no account required)"
            >
              <PenLine className="w-3.5 h-3.5 text-amber-700" />
              <span>
                {visitorPrefs.displayName ? visitorPrefs.displayName.split(' ')[0] : 'Set Byline'}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
