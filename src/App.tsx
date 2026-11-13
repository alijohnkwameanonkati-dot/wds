import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WdsDataProvider, useWdsData } from './context/WdsDataContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SearchModal } from './components/SearchModal';
import { ExecutiveLoginModal } from './components/ExecutiveLoginModal';
import { VisitorInfoModal } from './components/VisitorInfoModal';
import { UploadModal } from './components/UploadModal';
import { DashboardView } from './views/DashboardView';
import { NewsView } from './views/NewsView';
import { DebatesView } from './views/DebatesView';
import { WrittersView } from './views/WrittersView';
import { DocumentsView } from './views/DocumentsView';
import { LeaderboardView } from './views/LeaderboardView';
import { EventsView } from './views/EventsView';
import { SocietyContactView } from './views/SocietyContactView';
import { AdminView } from './views/AdminView';
import { NewsArticle, WritingPublication } from './types';
import { ShieldCheck } from 'lucide-react';

const ALLOWED_TABS = new Set([
  'dashboard',
  'news',
  'debates',
  'writters',
  'documents',
  'leaderboard',
  'events',
  'society',
  'admin',
]);

const AppContent: React.FC = () => {
  const { isAdmin } = useAuth();
  const { settings } = useWdsData();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Deep linking to items
  const [initialNewsId, setInitialNewsId] = useState<string | undefined>(undefined);
  const [initialDebateId, setInitialDebateId] = useState<string | undefined>(undefined);
  const [initialWritingId, setInitialWritingId] = useState<string | undefined>(undefined);

  // Parse deep-link query params on initial mount (?tab=news&id=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const idParam = params.get('id') || undefined;
      if (tabParam && ALLOWED_TABS.has(tabParam)) {
        if (tabParam === 'news') setInitialNewsId(idParam);
        if (tabParam === 'debates') setInitialDebateId(idParam);
        if (tabParam === 'writters') setInitialWritingId(idParam);
        setCurrentTab(tabParam);
      }
    } catch {
      // ignore URL parsing errors
    }
  }, []);

  const handleNavigate = (tab: string, targetId?: string) => {
    if (tab === 'news') setInitialNewsId(targetId);
    if (tab === 'debates') setInitialDebateId(targetId);
    if (tab === 'writters') setInitialWritingId(targetId);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenArticle = (article: NewsArticle) => {
    setInitialNewsId(article.id);
    setCurrentTab('news');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenWriting = (writing: WritingPublication) => {
    setInitialWritingId(writing.id);
    setCurrentTab('writters');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#111622] flex flex-col selection:bg-amber-600 selection:text-white">
      {/* Vertical Navigation Sidebar on the Left */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setInitialNewsId(undefined);
          setInitialDebateId(undefined);
          setInitialWritingId(undefined);
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onOpenVisitorPrefs={() => setIsVisitorModalOpen(true)}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area (Offset by Sidebar on Desktop) */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Sleek Top Header Bar */}
        <Header
          currentTab={currentTab}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenVisitorPrefs={() => setIsVisitorModalOpen(true)}
          onNavigateAdmin={() => handleNavigate('admin')}
          setMobileOpen={setMobileOpen}
        />

        {/* View Switcher Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              onOpenArticle={handleOpenArticle}
              onOpenWriting={handleOpenWriting}
              onOpenVisitorPrefs={() => setIsVisitorModalOpen(true)}
            />
          )}

          {currentTab === 'news' && <NewsView initialArticleId={initialNewsId} />}

          {currentTab === 'debates' && <DebatesView initialDebateId={initialDebateId} />}

          {currentTab === 'writters' && <WrittersView initialWritingId={initialWritingId} />}

          {currentTab === 'documents' && (
            <DocumentsView onOpenUpload={() => setIsUploadOpen(true)} />
          )}

          {currentTab === 'leaderboard' && <LeaderboardView />}

          {currentTab === 'events' && <EventsView />}

          {currentTab === 'society' && (
            <SocietyContactView
              onNavigate={(tab) => handleNavigate(tab)}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {currentTab === 'admin' && (
            <AdminView
              onOpenAdminLogin={() => {
                if (!isAdmin) setIsAdminLoginOpen(true);
              }}
            />
          )}
        </main>

        {/* Academic Dignified Footer */}
        <footer className="mt-auto border-t border-stone-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#111622] border border-amber-500/40 flex items-center justify-center text-amber-400 font-crest font-bold text-base">
                  WDS
                </div>
                <div>
                  <p className="font-crest font-bold text-[#111622] text-base leading-tight">
                    {settings.societyName}
                  </p>
                  <p className="text-xs text-stone-500 font-medium">
                    {settings.schoolName} ({settings.schoolShortName})
                  </p>
                </div>
              </div>

              <div className="text-center md:text-right">
                <p className="text-sm text-stone-700 font-serif-literary italic">
                  "{settings.societyMotto}"
                </p>
                <p className="text-[11px] text-stone-400 font-mono mt-1">
                  Academic Session {settings.academicYear} · Mamponteng, Ghana
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
              <p>© {new Date().getFullYear()} {settings.schoolName}. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-stone-600 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Open Student Contribution &amp; Moderated Governance
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      <ExecutiveLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          setIsAdminLoginOpen(false);
          setCurrentTab('admin');
        }}
      />

      <VisitorInfoModal
        isOpen={isVisitorModalOpen}
        onClose={() => setIsVisitorModalOpen(false)}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSubmitted={(tab) => {
          setIsUploadOpen(false);
          setCurrentTab(tab);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WdsDataProvider>
        <AppContent />
      </WdsDataProvider>
    </AuthProvider>
  );
}
