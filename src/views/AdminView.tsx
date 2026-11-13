import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWdsData } from '../context/WdsDataContext';
import { wdsService, uploadEditorialMedia } from '../services/wdsService';
import {
  AchievementCategory,
  AdminRole,
  Announcement,
  ContentStatus,
  NewsCategory,
  PlatformSettings,
  PublicSubmission,
  SubmissionStatus,
} from '../types';
import { OLAG_CLASSES } from '../utils/validation';
import {
  ShieldCheck,
  Lock,
  Pin,
  Trash2,
  Settings,
  History,
  Activity,
  FileText,
  MessageSquare,
  LogOut,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserPlus,
  Users,
  Trophy,
  Award,
  Megaphone,
  BookOpen,
  Star,
  Clock,
  ExternalLink,
  Edit3,
  Plus,
} from 'lucide-react';

interface AdminViewProps {
  onOpenAdminLogin?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onOpenAdminLogin }) => {
  const {
    adminRecord,
    isAdmin,
    isSuperAdmin,
    isEditor,
    isModerator,
    logoutAdmin,
  } = useAuth();
  const {
    settings,
    submissions,
    allNewsAdmin,
    debates,
    writings,
    documents,
    allAnnouncementsAdmin,
    allAchievementsAdmin,
    allEventsAdmin,
    likes,
    liveWeeklyRankings,
    weeklyRankingsSnapshots,
    adminsList,
    adminInvites,
    auditLogs,
  } = useWdsData();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'moderation' | 'content' | 'rankings' | 'access_settings'
  >('overview');

  // Action feedback banners
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Moderation state
  const [modFilter, setModFilter] = useState<
    'pending' | 'changes_requested' | 'approved' | 'rejected' | 'all'
  >('pending');
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [modNotesMap, setModNotesMap] = useState<Record<string, string>>({});
  const [busySubId, setBusySubId] = useState<string | null>(null);

  // Content management sub-section
  const [contentSection, setContentSection] = useState<
    'news' | 'debates' | 'announcements' | 'achievements' | 'literary'
  >('news');

  // Create Official News form
  const [newsTitle, setNewsTitle] = useState('');
  const [newsExcerpt, setNewsExcerpt] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCategory, setNewsCategory] = useState<NewsCategory>('School announcements');
  const [newsPriority, setNewsPriority] = useState<'normal' | 'important' | 'urgent'>('important');
  const [newsStatus, setNewsStatus] = useState<ContentStatus>('published');
  const [newsIsOfficial, setNewsIsOfficial] = useState(true);
  const [newsIsPinned, setNewsIsPinned] = useState(true);
  const [newsImageFile, setNewsImageFile] = useState<File | null>(null);

  // Create Debate form
  const [debateTopic, setDebateTopic] = useState('');
  const [debateDesc, setDebateDesc] = useState('');
  const [debateCategory, setDebateCategory] = useState('Campus Policy');
  const [debateProLabel, setDebateProLabel] = useState('FOR the Motion');
  const [debateConLabel, setDebateConLabel] = useState('AGAINST the Motion');
  const [debateDays, setDebateDays] = useState<number>(settings.debateCycleDays || 3);

  // Create Announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annPriority, setAnnPriority] = useState<Announcement['priority']>('urgent');

  // Create Achievement form
  const [achTitle, setAchTitle] = useState('');
  const [achRecipient, setAchRecipient] = useState('');
  const [achClass, setAchClass] = useState<string>(OLAG_CLASSES[0]);
  const [achCategory, setAchCategory] = useState<AchievementCategory>('Monthly Laureate');
  const [achMonth, setAchMonth] = useState(() =>
    new Date().toLocaleDateString([], { month: 'long' })
  );
  const [achYear, setAchYear] = useState<number>(() => new Date().getFullYear());
  const [achDesc, setAchDesc] = useState('');

  // Invite Admin form (Super Admin only)
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteTitle, setInviteTitle] = useState('Society Editor');
  const [inviteRole, setInviteRole] = useState<AdminRole>('editor');

  // Settings form (Super Admin only)
  const [settingsForm, setSettingsForm] = useState<PlatformSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);

  // Two-step delete confirmation IDs (no window.confirm)
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  useEffect(() => {
    setSettingsForm(settings);
    setDebateDays(settings.debateCycleDays || 3);
  }, [settings]);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setActionSuccess('');
    } else {
      setActionSuccess(msg);
      setActionError('');
      setTimeout(() => setActionSuccess(''), 3500);
    }
  };

  // Protected Admin Gate
  if (!isAdmin || !adminRecord) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-10 sm:p-12 text-center max-w-lg mx-auto my-8 space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-xl bg-[#111622] text-amber-300 flex items-center justify-center mx-auto border border-stone-800">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-700 font-bold">
            Restricted Editorial Office
          </p>
          <h2 className="text-xl font-bold text-[#111622] font-crest">
            Administrator Access Restricted
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed font-serif-literary">
            This suite is strictly protected for verified WDS Super Admins, Editors, and Moderators via Firebase Authentication. Students contribute openly across all public sections without signing in.
          </p>
        </div>
        {onOpenAdminLogin && (
          <button
            onClick={onOpenAdminLogin}
            className="px-5 py-2.5 bg-[#111622] hover:bg-[#1a2234] text-amber-300 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" /> Sign In as Authorized Admin
          </button>
        )}
      </div>
    );
  }

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  const filteredSubmissions = submissions.filter((s) => {
    if (modFilter === 'all') return true;
    return s.status === modFilter;
  });

  const startEditingSubmission = (sub: PublicSubmission) => {
    setEditingSubId(sub.id);
    setEditTitle(sub.title);
    setEditExcerpt(sub.excerpt || '');
    setEditContent(sub.content);
    setEditCategory(sub.category || '');
  };

  const handleApproveSubmission = async (sub: PublicSubmission) => {
    if (!isModerator) return;
    setBusySubId(sub.id);
    try {
      const overrides =
        editingSubId === sub.id
          ? {
              title: editTitle,
              excerpt: editExcerpt,
              content: editContent,
              category: editCategory,
              moderationNotes: modNotesMap[sub.id],
            }
          : modNotesMap[sub.id]
          ? { moderationNotes: modNotesMap[sub.id] }
          : undefined;

      await wdsService.approveSubmission(sub, adminRecord, overrides);
      setEditingSubId(null);
      showToast(`Approved and published "${overrides?.title || sub.title}".`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to approve submission.', true);
    } finally {
      setBusySubId(null);
    }
  };

  const handleRejectOrRequestChanges = async (
    sub: PublicSubmission,
    status: Extract<SubmissionStatus, 'rejected' | 'changes_requested'>
  ) => {
    if (!isModerator) return;
    setBusySubId(sub.id);
    try {
      const notes =
        modNotesMap[sub.id]?.trim() ||
        (status === 'rejected'
          ? 'Does not meet WDS publication standards.'
          : 'Please refine and resubmit.');
      await wdsService.updateSubmissionStatus(sub.id, status, notes, adminRecord);
      showToast(
        status === 'rejected'
          ? `Submission "${sub.title}" rejected.`
          : `Requested changes for "${sub.title}".`
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Moderation update failed.', true);
    } finally {
      setBusySubId(null);
    }
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditor) return;
    try {
      let imageUrl = '';
      if (newsImageFile) {
        const up = await uploadEditorialMedia(newsImageFile, 'image', 'news');
        imageUrl = up.url;
      }
      await wdsService.createNewsArticle(
        {
          title: newsTitle,
          excerpt: newsExcerpt,
          content: newsContent,
          category: newsCategory,
          authorDisplayName: adminRecord.displayName,
          imageUrl: imageUrl || undefined,
          isOfficial: newsIsOfficial,
          isPinned: newsIsPinned,
          priority: newsPriority,
          status: newsStatus,
        },
        adminRecord
      );
      setNewsTitle('');
      setNewsExcerpt('');
      setNewsContent('');
      setNewsImageFile(null);
      showToast('Gazette publication saved.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to create news article.', true);
    }
  };

  const handleCreateDebate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditor) return;
    try {
      await wdsService.createDebateTopic(
        {
          topic: debateTopic,
          description: debateDesc,
          category: debateCategory,
          proLabel: debateProLabel,
          conLabel: debateConLabel,
          cycleDays: debateDays,
        },
        adminRecord
      );
      setDebateTopic('');
      setDebateDesc('');
      showToast('Debate motion scheduled and opened.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to schedule debate.', true);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditor) return;
    try {
      await wdsService.createAnnouncement(
        {
          title: annTitle,
          message: annMessage,
          priority: annPriority,
          status: 'published',
        },
        adminRecord
      );
      setAnnTitle('');
      setAnnMessage('');
      showToast('School announcement published.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to publish announcement.', true);
    }
  };

  const handleCreateAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditor) return;
    try {
      await wdsService.createAchievement(
        {
          title: achTitle,
          description: achDesc,
          recipientDisplayName: achRecipient,
          recipientClass: achClass,
          date: new Date().toISOString().split('T')[0],
          month: achMonth,
          year: achYear,
          category: achCategory,
          status: 'published',
        },
        adminRecord
      );
      setAchTitle('');
      setAchRecipient('');
      setAchDesc('');
      showToast('Monthly Hall of Fame distinction published.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to create distinction.', true);
    }
  };

  const handlePublishSnapshot = async () => {
    try {
      await wdsService.publishWeeklySnapshot(adminRecord, liveWeeklyRankings, likes.length);
      showToast('Weekly ranking snapshot recorded to Firestore.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save weekly snapshot.', true);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    try {
      await wdsService.inviteAdmin(adminRecord, inviteEmail, inviteName, inviteTitle, inviteRole);
      setInviteEmail('');
      setInviteName('');
      showToast(`Administrator invitation created for ${inviteEmail.trim().toLowerCase()}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to invite administrator.', true);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setSavingSettings(true);
    try {
      await wdsService.updateSettings(adminRecord, settingsForm);
      showToast('Platform charter & schedule settings saved.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save platform settings.', true);
    } finally {
      setSavingSettings(false);
    }
  };

  const renderConfirmDelete = (
    key: string,
    onConfirm: () => Promise<void> | void,
    label = 'Confirm'
  ) => {
    if (confirmDeleteKey === key) {
      return (
        <div className="inline-flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              void onConfirm();
              setConfirmDeleteKey(null);
            }}
            className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-[10px] font-bold cursor-pointer"
          >
            {label}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeleteKey(null)}
            className="px-2 py-1 rounded-lg border border-stone-300 bg-white text-stone-700 text-[10px] font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setConfirmDeleteKey(key)}
        className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer shrink-0"
        title="Delete record"
        aria-label="Delete record"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    );
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Masthead Banner */}
      <div className="bg-[#111622] text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-amber-300 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>
              Verified Firebase RBAC • Role: {adminRecord.role.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-crest tracking-tight">
            WDS Administration &amp; Moderation Suite
          </h1>
          <p className="text-xs text-stone-300">
            Signed in as: <strong className="text-white">{adminRecord.displayName}</strong>{' '}
            {adminRecord.title ? `(${adminRecord.title})` : ''} •{' '}
            <span className="font-mono text-stone-400">{adminRecord.email}</span>
          </p>
        </div>

        <button
          onClick={() => void logoutAdmin()}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-white/10 cursor-pointer shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out Admin
        </button>
      </div>

      {/* Feedback Notifications */}
      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-amber-50/80 rounded-2xl border border-amber-200 p-4 shadow-xs">
          <span className="text-[10px] font-mono text-amber-800 uppercase tracking-wider block font-bold">
            Pending Review
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-950 mt-1">
            {pendingCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">
            Gazette Posts
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#111622] mt-1">
            {allNewsAdmin.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">
            Debate Motions
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#111622] mt-1">
            {debates.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">
            Writings &amp; Docs
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#111622] mt-1">
            {writings.length + documents.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">
            Events &amp; Honors
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#111622] mt-1">
            {allEventsAdmin.length + allAchievementsAdmin.length}
          </p>
        </div>
      </div>

      {/* Primary Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-stone-200 pb-2.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'overview'
              ? 'bg-[#111622] text-amber-300 shadow-xs'
              : 'text-stone-600 hover:bg-stone-100 hover:text-[#111622]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Overview &amp; Audit Log</span>
        </button>

        {isModerator && (
          <button
            onClick={() => setActiveTab('moderation')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'moderation'
                ? 'bg-[#111622] text-amber-300 shadow-xs'
                : 'text-stone-600 hover:bg-stone-100 hover:text-[#111622]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Moderation Queue</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-[#111622] text-[10px] font-mono tabular-nums font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        )}

        {isEditor && (
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'content'
                ? 'bg-[#111622] text-amber-300 shadow-xs'
                : 'text-stone-600 hover:bg-stone-100 hover:text-[#111622]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Publish &amp; Manage Content</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('rankings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'rankings'
              ? 'bg-[#111622] text-amber-300 shadow-xs'
              : 'text-stone-600 hover:bg-stone-100 hover:text-[#111622]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Rankings &amp; Snapshots</span>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('access_settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'access_settings'
                ? 'bg-[#111622] text-amber-300 shadow-xs'
                : 'text-stone-600 hover:bg-stone-100 hover:text-[#111622]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Roles &amp; Charter Settings</span>
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW & AUDIT LOG */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3 shadow-xs">
              <h3 className="text-base font-bold text-[#111622] font-crest">
                Your Role Capabilities ({adminRecord.role.replace('_', ' ').toUpperCase()})
              </h3>
              <ul className="text-xs text-stone-600 space-y-2.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      isModerator ? 'text-emerald-700' : 'text-stone-300'
                    }`}
                  />
                  <span>Review, edit, approve, or reject public submissions &amp; comments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      isEditor ? 'text-emerald-700' : 'text-stone-300'
                    }`}
                  />
                  <span>
                    Publish official Gazette bulletins, schedule debates, post events &amp; honors
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      isSuperAdmin ? 'text-emerald-700' : 'text-stone-300'
                    }`}
                  />
                  <span>
                    Invite administrators, assign RBAC roles, configure school charter settings
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3 shadow-xs">
              <h3 className="text-base font-bold text-[#111622] font-crest">
                Moderation Queue Summary
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="text-amber-800 font-semibold block">Pending Review</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-amber-950">
                    {pendingCount}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-emerald-800 font-semibold block">Approved Total</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-emerald-950">
                    {submissions.filter((s) => s.status === 'approved').length}
                  </span>
                </div>
              </div>
              {isModerator && pendingCount > 0 && (
                <button
                  onClick={() => setActiveTab('moderation')}
                  className="w-full py-2.5 bg-[#111622] hover:bg-[#1a2234] text-amber-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Open Moderation Queue ({pendingCount} waiting)
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
              <History className="w-4 h-4 text-amber-700" />
              <h3 className="text-base font-bold text-[#111622] font-crest">
                Administrator Audit Trail ({auditLogs.length})
              </h3>
            </div>

            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl bg-[#FAF8F3]">
                No administrative audit events recorded yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {auditLogs.slice(0, 60).map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-[#FAF8F3] border border-stone-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#111622]">{log.actorName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 uppercase">
                          {log.actorRole}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                          {log.action}
                        </span>
                      </div>
                      <p className="text-stone-600 mt-1">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-stone-500 font-mono tabular-nums shrink-0">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MODERATION QUEUE */}
      {activeTab === 'moderation' && isModerator && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: 'pending', label: `Pending (${pendingCount})` },
                  {
                    id: 'changes_requested',
                    label: `Changes Req (${
                      submissions.filter((s) => s.status === 'changes_requested').length
                    })`,
                  },
                  {
                    id: 'approved',
                    label: `Approved (${submissions.filter((s) => s.status === 'approved').length})`,
                  },
                  {
                    id: 'rejected',
                    label: `Rejected (${submissions.filter((s) => s.status === 'rejected').length})`,
                  },
                  { id: 'all', label: `All (${submissions.length})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setModFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    modFilter === f.id
                      ? 'bg-[#111622] text-amber-300'
                      : 'bg-[#FAF8F3] text-stone-600 hover:bg-stone-200 hover:text-[#111622]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-xs text-stone-500">
              No submissions in the &ldquo;{modFilter.replace('_', ' ')}&rdquo; filter.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((sub) => {
                const isEditing = editingSubId === sub.id;
                const isBusy = busySubId === sub.id;

                return (
                  <div
                    key={sub.id}
                    className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-[#111622] text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                            {sub.submissionType.replace('_', ' ')}
                          </span>
                          {sub.side && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                sub.side === 'FOR'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {sub.side}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              sub.status === 'pending'
                                ? 'bg-amber-100 text-amber-900'
                                : sub.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.status === 'changes_requested'
                                ? 'bg-stone-200 text-[#111622]'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sub.status.replace('_', ' ')}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-[#111622] font-crest">
                          {sub.title}
                        </h3>
                        <p className="text-xs text-stone-500">
                          Submitted by <strong className="text-[#111622]">{sub.displayName}</strong>
                          {sub.authorClass ? ` • ${sub.authorClass}` : ''} •{' '}
                          <span className="font-mono tabular-nums">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </span>
                        </p>
                      </div>

                      {sub.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() =>
                            isEditing ? setEditingSubId(null) : startEditingSubmission(sub)
                          }
                          className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-[#FAF8F3] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isEditing ? 'Cancel Edit' : 'Edit Before Approving'}</span>
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-3 bg-[#FAF8F3] p-4 rounded-xl border border-stone-200">
                        <div>
                          <label className="block text-[11px] font-bold text-[#111622] mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-amber-600 focus:outline-none"
                          />
                        </div>
                        {editExcerpt !== undefined && (
                          <div>
                            <label className="block text-[11px] font-bold text-[#111622] mb-1">
                              Excerpt / Subtitle
                            </label>
                            <input
                              type="text"
                              value={editExcerpt}
                              onChange={(e) => setEditExcerpt(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-amber-600 focus:outline-none"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-[11px] font-bold text-[#111622] mb-1">
                            Content
                          </label>
                          <textarea
                            rows={5}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white font-serif-literary focus:ring-2 focus:ring-amber-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sub.excerpt && (
                          <p className="text-xs italic text-stone-600 font-serif-literary">
                            &ldquo;{sub.excerpt}&rdquo;
                          </p>
                        )}
                        <div className="p-4 rounded-xl bg-[#FAF8F3] border border-stone-200 text-xs text-stone-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                          {sub.content}
                        </div>
                      </div>
                    )}

                    {/* Attached media */}
                    {(sub.imageUrl || sub.fileUrl) && (
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {sub.imageUrl && (
                          <a
                            href={sub.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F3] border border-stone-200 hover:bg-stone-100 text-[#111622] font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Inspect Attached Image
                          </a>
                        )}
                        {sub.fileUrl && (
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Inspect Attached File (
                            {sub.fileName || sub.fileFormat})
                          </a>
                        )}
                      </div>
                    )}

                    {/* Moderation actions */}
                    {sub.status === 'pending' || sub.status === 'changes_requested' ? (
                      <div className="pt-3 border-t border-stone-100 space-y-3">
                        <input
                          type="text"
                          value={modNotesMap[sub.id] || ''}
                          onChange={(e) =>
                            setModNotesMap((prev) => ({ ...prev, [sub.id]: e.target.value }))
                          }
                          placeholder="Optional moderation note (reason for approval, changes requested, or rejection)..."
                          className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleApproveSubmission(sub)}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isBusy ? 'Processing...' : 'Approve & Publish'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void handleRejectOrRequestChanges(sub, 'changes_requested')
                            }
                            className="px-4 py-2 bg-amber-100 hover:bg-amber-200 disabled:opacity-50 text-amber-950 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Request Changes
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleRejectOrRequestChanges(sub, 'rejected')}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      sub.moderationNotes && (
                        <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                          Reviewed by <strong className="text-[#111622]">{sub.reviewedByName || 'Moderator'}</strong>:{' '}
                          {sub.moderationNotes}
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONTENT MANAGEMENT */}
      {activeTab === 'content' && isEditor && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            {(
              [
                { id: 'news', label: 'Gazette Bulletins', icon: FileText },
                { id: 'debates', label: 'Debates & Motions', icon: MessageSquare },
                { id: 'announcements', label: 'Urgent Notices', icon: Megaphone },
                { id: 'achievements', label: 'Monthly Honors', icon: Award },
                { id: 'literary', label: 'Writings & Docs', icon: BookOpen },
              ] as const
            ).map((sec) => {
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  onClick={() => setContentSection(sec.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    contentSection === sec.id
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-[#FAF8F3]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Gazette News Manager */}
          {contentSection === 'news' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form
                onSubmit={handleCreateNews}
                className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3.5 shadow-xs"
              >
                <h3 className="text-base font-bold text-[#111622] font-crest flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-700" /> Publish Official Gazette Notice
                </h3>
                <input
                  type="text"
                  required
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  placeholder="Headline *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
                <input
                  type="text"
                  required
                  value={newsExcerpt}
                  onChange={(e) => setNewsExcerpt(e.target.value)}
                  placeholder="Short summary excerpt (min 10 chars) *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={newsCategory}
                    onChange={(e) => setNewsCategory(e.target.value as NewsCategory)}
                    className="px-2.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-white"
                  >
                    <option value="School announcements">School announcements</option>
                    <option value="Academic news">Academic news</option>
                    <option value="Sports">Sports</option>
                    <option value="Clubs and societies">Clubs and societies</option>
                    <option value="Events">Events</option>
                    <option value="General student news">General student news</option>
                  </select>
                  <select
                    value={newsPriority}
                    onChange={(e) =>
                      setNewsPriority(e.target.value as 'normal' | 'important' | 'urgent')
                    }
                    className="px-2.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-white"
                  >
                    <option value="normal">Normal Priority</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent Notice</option>
                  </select>
                  <select
                    value={newsStatus}
                    onChange={(e) => setNewsStatus(e.target.value as ContentStatus)}
                    className="px-2.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-white"
                  >
                    <option value="published">Publish Now</option>
                    <option value="draft">Save Draft</option>
                  </select>
                </div>
                <textarea
                  required
                  rows={4}
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  placeholder="Full bulletin text (min 20 chars) *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-700">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newsIsOfficial}
                      onChange={(e) => setNewsIsOfficial(e.target.checked)}
                    />
                    <span>Official Badge</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newsIsPinned}
                      onChange={(e) => setNewsIsPinned(e.target.checked)}
                    />
                    <span>Pin to Top</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewsImageFile(e.target.files?.[0] || null)}
                    className="text-[11px] text-stone-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#111622] hover:bg-[#1a2234] text-amber-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Save Bulletin
                </button>
              </form>

              <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3 shadow-xs">
                <h3 className="text-base font-bold text-[#111622] font-crest">
                  All Gazette Articles ({allNewsAdmin.length})
                </h3>
                <div className="divide-y divide-stone-100 max-h-[420px] overflow-y-auto">
                  {allNewsAdmin.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono uppercase text-stone-500">
                            {item.status} • {item.category}
                          </span>
                          {item.isPinned && (
                            <span className="bg-amber-100 text-amber-900 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                              Pinned
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-[#111622] text-xs truncate mt-0.5">
                          {item.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() =>
                            void wdsService.updateNewsArticle(
                              item.id,
                              { isPinned: !item.isPinned },
                              adminRecord
                            )
                          }
                          className={`p-1.5 rounded-lg border cursor-pointer ${
                            item.isPinned
                              ? 'border-amber-300 bg-amber-50 text-amber-800'
                              : 'border-stone-200 hover:bg-[#FAF8F3] text-stone-600'
                          }`}
                          title="Toggle Pin"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        {item.status !== 'published' && (
                          <button
                            onClick={() =>
                              void wdsService.updateNewsArticle(
                                item.id,
                                { status: 'published' },
                                adminRecord
                              )
                            }
                            className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold cursor-pointer"
                          >
                            Publish
                          </button>
                        )}
                        {renderConfirmDelete(`news:${item.id}`, () =>
                          wdsService.deleteNewsArticle(item.id, adminRecord)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Debates Manager */}
          {contentSection === 'debates' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form
                onSubmit={handleCreateDebate}
                className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3.5 shadow-xs"
              >
                <h3 className="text-base font-bold text-[#111622] font-crest">
                  Schedule New Debate Motion
                </h3>
                <input
                  type="text"
                  required
                  value={debateTopic}
                  onChange={(e) => setDebateTopic(e.target.value)}
                  placeholder="Formal Debate Motion (e.g. 'This House Would...') *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
                <textarea
                  required
                  rows={3}
                  value={debateDesc}
                  onChange={(e) => setDebateDesc(e.target.value)}
                  placeholder="Context and framing notes *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={debateCategory}
                    onChange={(e) => setDebateCategory(e.target.value)}
                    placeholder="Category"
                    className="px-3 py-2.5 rounded-xl border border-stone-300 text-xs"
                  />
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={debateDays}
                    onChange={(e) => setDebateDays(Number(e.target.value) || 3)}
                    placeholder="Cycle days"
                    className="px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-mono tabular-nums"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={debateProLabel}
                    onChange={(e) => setDebateProLabel(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-stone-300 text-xs"
                  />
                  <input
                    type="text"
                    value={debateConLabel}
                    onChange={(e) => setDebateConLabel(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#111622] hover:bg-[#1a2234] text-amber-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Open {debateDays}-Day Debate Motion
                </button>
              </form>

              <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3 shadow-xs">
                <h3 className="text-base font-bold text-[#111622] font-crest">
                  Scheduled Motions ({debates.length})
                </h3>
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
                  {debates.map((d) => (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-xl border border-stone-200 bg-[#FAF8F3] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-mono font-bold uppercase text-amber-700 text-[10px]">
                          {d.status} • Closes{' '}
                          <span className="tabular-nums">
                            {new Date(d.closingDate).toLocaleDateString()}
                          </span>
                        </span>
                        <p className="font-bold text-[#111622] truncate mt-0.5">{d.topic}</p>
                        <p className="text-[11px] text-stone-500 font-mono tabular-nums">
                          {d.proCount} FOR • {d.conCount} AGAINST
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {d.status === 'active' ? (
                          <button
                            onClick={() =>
                              void wdsService.updateDebateStatus(d.id, 'closed', adminRecord)
                            }
                            className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-[#111622] rounded-lg font-bold cursor-pointer"
                          >
                            Close
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              void wdsService.updateDebateStatus(d.id, 'active', adminRecord)
                            }
                            className="px-2.5 py-1 bg-[#111622] text-amber-300 rounded-lg font-bold cursor-pointer"
                          >
                            Reopen
                          </button>
                        )}
                        {d.status !== 'archived' && (
                          <button
                            onClick={() =>
                              void wdsService.updateDebateStatus(d.id, 'archived', adminRecord)
                            }
                            className="px-2.5 py-1 border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 rounded-lg font-semibold cursor-pointer"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Announcements Manager */}
          {contentSection === 'announcements' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form
                onSubmit={handleCreateAnnouncement}
                className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3.5 shadow-xs"
              >
                <h3 className="text-base font-bold text-[#111622] font-crest">
                  Broadcast Urgent Campus Notice
                </h3>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Notice Title *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
                <select
                  value={annPriority}
                  onChange={(e) => setAnnPriority(e.target.value as Announcement['priority'])}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-white"
                >
                  <option value="urgent">Urgent (Top Ticker Banner)</option>
                  <option value="important">Important</option>
                  <option value="normal">Normal</option>
                </select>
                <textarea
                  required
                  rows={3}
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  placeholder="Notice message details *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#111622] hover:bg-[#1a2234] text-amber-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Publish Notice
                </button>
              </form>

              <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3 shadow-xs">
                <h3 className="text-base font-bold text-[#111622] font-crest">
                  Active Announcements ({allAnnouncementsAdmin.length})
                </h3>
                <div className="space-y-2.5">
                  {allAnnouncementsAdmin.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-3.5 rounded-xl border border-stone-200 bg-[#FAF8F3] flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-amber-700">
                          {ann.priority}
                        </span>
                        <p className="font-bold text-[#111622]">{ann.title}</p>
                        <p className="text-stone-600 mt-0.5">{ann.message}</p>
                      </div>
                      {renderConfirmDelete(`ann:${ann.id}`, () =>
                        wdsService.deleteAnnouncement(ann.id)
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Achievements Manager */}
          {contentSection === 'achievements' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form
                onSubmit={handleCreateAchievement}
                className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3.5 shadow-xs"
              >
                <h3 className="text-base font-bold text-[#111622] font-crest">
                  Award Monthly Honor / Distinction
                </h3>
                <input
                  type="text"
                  required
                  value={achTitle}
                  onChange={(e) => setAchTitle(e.target.value)}
                  placeholder="Award Title (e.g. Laureate Poet of the Month) *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={achRecipient}
                    onChange={(e) => setAchRecipient(e.target.value)}
                    placeholder="Recipient Name *"
                    className="px-3 py-2.5 rounded-xl border border-stone-300 text-xs"
                  />
                  <select
                    value={achClass}
                    onChange={(e) => setAchClass(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-white"
                  >
                    {OLAG_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={achCategory}
                    onChange={(e) => setAchCategory(e.target.value as AchievementCategory)}
                    className="px-2.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-white"
                  >
                    <option value="Monthly Laureate">Monthly Laureate</option>
                    <option value="Debate Honor">Debate Honor</option>
                    <option value="Literary Distinction">Literary Distinction</option>
                    <option value="Inter-School Award">Inter-School Award</option>
                    <option value="Service">Service</option>
                  </select>
                  <input
                    type="text"
                    value={achMonth}
                    onChange={(e) => setAchMonth(e.target.value)}
                    placeholder="Month"
                    className="px-2.5 py-2.5 rounded-xl border border-stone-300 text-xs"
                  />
                  <input
                    type="number"
                    value={achYear}
                    onChange={(e) => setAchYear(Number(e.target.value) || new Date().getFullYear())}
                    className="px-2.5 py-2.5 rounded-xl border border-stone-300 text-xs font-mono tabular-nums"
                  />
                </div>
                <textarea
                  required
                  rows={3}
                  value={achDesc}
                  onChange={(e) => setAchDesc(e.target.value)}
                  placeholder="Citation / achievement summary *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#111622] hover:bg-[#1a2234] text-amber-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Publish Honor to Hall of Fame
                </button>
              </form>

              <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3 shadow-xs">
                <h3 className="text-base font-bold text-[#111622] font-crest">
                  Published Honors ({allAchievementsAdmin.length})
                </h3>
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
                  {allAchievementsAdmin.map((ach) => (
                    <div
                      key={ach.id}
                      className="p-3.5 rounded-xl border border-stone-200 bg-[#FAF8F3] flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="text-[10px] font-mono text-amber-700 font-bold">
                          {ach.category} • {ach.month} {ach.year}
                        </span>
                        <p className="font-bold text-[#111622]">
                          {ach.recipientDisplayName} — {ach.title}
                        </p>
                        <p className="text-stone-600 mt-0.5">{ach.description}</p>
                      </div>
                      {renderConfirmDelete(`ach:${ach.id}`, () =>
                        wdsService.deleteAchievement(ach.id)
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Literary & Document Manager */}
          {contentSection === 'literary' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3 shadow-xs">
                <h3 className="text-base font-bold text-[#111622] font-crest">
                  Published Literary Pieces ({writings.length})
                </h3>
                <div className="divide-y divide-stone-100 max-h-[420px] overflow-y-auto">
                  {writings.map((w) => (
                    <div key={w.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-[#111622] truncate">{w.title}</p>
                        <p className="text-stone-500">
                          {w.authorDisplayName} • {w.writingType}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() =>
                            void wdsService.toggleFeatureWriting(w.id, !w.featured, adminRecord)
                          }
                          className={`p-1.5 rounded-lg border cursor-pointer ${
                            w.featured
                              ? 'bg-amber-100 border-amber-300 text-amber-800'
                              : 'border-stone-200 text-stone-400 hover:text-[#111622]'
                          }`}
                          title="Feature in Spotlight"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        {renderConfirmDelete(`writing:${w.id}`, () =>
                          wdsService.deleteWriting(w.id, adminRecord)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3 shadow-xs">
                <h3 className="text-base font-bold text-[#111622] font-crest">
                  Repository Documents ({documents.length})
                </h3>
                <div className="divide-y divide-stone-100 max-h-[420px] overflow-y-auto">
                  {documents.map((d) => (
                    <div key={d.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-[#111622] truncate">{d.title}</p>
                        <p className="text-stone-500">
                          {d.authorDisplayName} • {d.category} • {d.fileFormat}
                        </p>
                      </div>
                      {renderConfirmDelete(`doc:${d.id}`, () => wdsService.deleteDocument(d.id))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RANKINGS & SNAPSHOTS */}
      {activeTab === 'rankings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#111622] font-crest">
                Weekly Ranking Computation &amp; Snapshots
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Archive the live top 50 weekly standings into Firestore (weeklyRankings) for permanent historical recognition.
              </p>
            </div>
            <button
              onClick={() => void handlePublishSnapshot()}
              className="px-4 py-2.5 bg-[#111622] hover:bg-[#1a2234] text-amber-300 rounded-xl text-xs font-bold cursor-pointer shrink-0"
            >
              Publish This Week&apos;s Snapshot
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3">
            <h4 className="text-base font-bold text-[#111622] font-crest">
              Saved Snapshots ({weeklyRankingsSnapshots.length})
            </h4>
            {weeklyRankingsSnapshots.length === 0 ? (
              <p className="text-xs text-stone-400">No weekly snapshots published yet.</p>
            ) : (
              <div className="space-y-2">
                {weeklyRankingsSnapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3.5 rounded-xl bg-[#FAF8F3] border border-stone-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold font-mono text-[#111622]">{snap.weekLabel}</span>
                      <span className="text-stone-500 ml-3 font-mono tabular-nums">
                        {snap.entries.length} ranked works • {snap.totalLikes} likes
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500 font-mono tabular-nums">
                      {new Date(snap.computedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SUPER ADMIN ROLES & SETTINGS */}
      {activeTab === 'access_settings' && isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invite + Manage Admins */}
          <div className="space-y-6">
            <form
              onSubmit={handleInviteAdmin}
              className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3.5 shadow-xs"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-700" />
                <h3 className="text-base font-bold text-[#111622] font-crest">
                  Authorize New Administrator / Moderator
                </h3>
              </div>
              <p className="text-[11px] text-stone-500">
                When the invited user signs in via Google or Email/Password in Firebase Auth, they automatically claim this RBAC role.
              </p>

              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Authorized Google or School Email *"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Full Display Name *"
                  className="px-3 py-2.5 rounded-xl border border-stone-300 text-xs"
                />
                <input
                  type="text"
                  value={inviteTitle}
                  onChange={(e) => setInviteTitle(e.target.value)}
                  placeholder="Office Title (e.g. Patron)"
                  className="px-3 py-2.5 rounded-xl border border-stone-300 text-xs"
                />
              </div>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-white"
              >
                <option value="moderator">Moderator (Review &amp; Approve Queue)</option>
                <option value="editor">Editor (Moderate + Publish Gazette/Debates/Events)</option>
                <option value="super_admin">Super Admin (Full Control &amp; Role Management)</option>
              </select>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#111622] hover:bg-[#1a2234] text-amber-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Create RBAC Invitation
              </button>
            </form>

            {/* Active Administrators List */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-700" />
                <h3 className="text-base font-bold text-[#111622] font-crest">
                  Authorized Administrators ({adminsList.length})
                </h3>
              </div>
              <div className="space-y-2.5">
                {adminsList.map((adm) => {
                  const isSelf = adm.uid === adminRecord.uid;
                  return (
                    <div
                      key={adm.uid}
                      className="p-3.5 rounded-xl border border-stone-200 bg-[#FAF8F3] flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#111622]">
                          {adm.displayName} {isSelf && '(You)'}
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono truncate">{adm.email}</p>
                        <p className="text-[10px] text-amber-800 font-semibold">{adm.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          disabled={isSelf}
                          value={adm.role}
                          onChange={(e) =>
                            void wdsService.updateAdminAccess(adminRecord, adm.uid, {
                              role: e.target.value as AdminRole,
                            })
                          }
                          className="px-2 py-1 rounded-lg border border-stone-300 text-[11px] bg-white disabled:opacity-60"
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="editor">Editor</option>
                          <option value="moderator">Moderator</option>
                        </select>
                        {!isSelf && (
                          <button
                            onClick={() =>
                              void wdsService.updateAdminAccess(adminRecord, adm.uid, {
                                status: adm.status === 'active' ? 'disabled' : 'active',
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                              adm.status === 'active'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {adm.status === 'active' ? 'Disable' : 'Restore'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {adminInvites.length > 0 && (
                <div className="pt-3 border-t border-stone-200 space-y-2">
                  <h4 className="text-xs font-bold text-[#111622]">Invitations</h4>
                  {adminInvites.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-2.5 rounded-xl bg-[#FAF8F3] border border-stone-200 flex items-center justify-between gap-2 text-[11px]"
                    >
                      <div className="truncate">
                        <span className="font-mono font-bold text-[#111622]">{inv.email}</span>{' '}
                        <span className="text-stone-500">
                          ({inv.role} • {inv.status})
                        </span>
                      </div>
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => void wdsService.revokeAdminInvite(inv.id)}
                          className="text-rose-700 font-bold hover:underline cursor-pointer shrink-0"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Platform Settings Form */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4 h-fit">
            <div>
              <h3 className="text-lg font-bold text-[#111622] font-crest">
                WDS Charter &amp; Platform Configuration
              </h3>
              <p className="text-xs text-stone-500">
                Persisted in Firestore (settings/platform).
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#111622] mb-1">School Name</label>
                <input
                  type="text"
                  required
                  value={settingsForm.schoolName}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, schoolName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111622] mb-1">Acronym</label>
                  <input
                    type="text"
                    value={settingsForm.schoolShortName}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, schoolShortName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111622] mb-1">Society Name</label>
                  <input
                    type="text"
                    value={settingsForm.societyName}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, societyName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111622] mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={settingsForm.academicYear}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, academicYear: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111622] mb-1">Current Term</label>
                  <input
                    type="text"
                    value={settingsForm.currentTerm}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, currentTerm: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111622] mb-1">
                    Debate Cycle Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={settingsForm.debateCycleDays}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        debateCycleDays: Number(e.target.value) || 3,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111622] mb-1">Society Motto</label>
                <input
                  type="text"
                  value={settingsForm.societyMotto}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, societyMotto: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-serif-literary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111622] mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={settingsForm.contactEmail || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, contactEmail: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111622] mb-1">
                    Meeting Schedule
                  </label>
                  <input
                    type="text"
                    value={settingsForm.meetingSchedule || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, meetingSchedule: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111622] mb-1">
                  Campus Location
                </label>
                <input
                  type="text"
                  value={settingsForm.contactLocation || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, contactLocation: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={settingsForm.allowPublicSubmissions}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      allowPublicSubmissions: e.target.checked,
                    })
                  }
                />
                <span>Allow public student submissions into moderation queue</span>
              </label>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 bg-[#111622] hover:bg-[#1a2234] disabled:opacity-50 text-amber-300 font-bold rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingSettings ? 'Saving...' : 'Save Charter Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
