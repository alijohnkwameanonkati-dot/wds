import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWdsData } from '../context/WdsDataContext';
import { OLAG_CLASSES, generateInitialsAvatar } from '../utils/validation';
import { EDITORIAL_VISUALS } from '../assets/editorialVisuals';
import { wdsService } from '../services/wdsService';
import { HumanVerification } from '../components/HumanVerification';
import { DebateArgument, DebateSide } from '../types';
import {
  Plus,
  Send,
  ThumbsUp,
  Clock,
  Archive,
  CornerDownRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Vote,
  Lock,
  Trash2,
} from 'lucide-react';

interface DebatesViewProps {
  initialDebateId?: string;
}

export const DebatesView: React.FC<DebatesViewProps> = ({ initialDebateId }) => {
  const { isEditor, isModerator, adminRecord, sessionToken, visitorPrefs, saveVisitorPrefs } = useAuth();
  const {
    settings,
    debates,
    debateArguments,
    hasSessionLiked,
    getLikeCount,
    getApprovedReplies,
  } = useWdsData();

  const [selectedDebateId, setSelectedDebateId] = useState<string>(initialDebateId || '');
  const [activeTab, setActiveTab] = useState<'arena' | 'archive'>('arena');
  const [sideFilter, setSideFilter] = useState<'ALL' | DebateSide>('ALL');
  const [sortArgsBy, setSortArgsBy] = useState<'top_supported' | 'newest'>('top_supported');

  // Inline delete confirm ID
  const [confirmDeleteArgId, setConfirmDeleteArgId] = useState<string | null>(null);

  // Public Argument Submission Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [speakerName, setSpeakerName] = useState(visitorPrefs.displayName || '');
  const [speakerClass, setSpeakerClass] = useState(visitorPrefs.authorClass || OLAG_CLASSES[0]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [argSide, setArgSide] = useState<DebateSide>('FOR');
  const [argTitle, setArgTitle] = useState('');
  const [argBody, setArgBody] = useState('');
  const [humanVerified, setHumanVerified] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Create Debate Modal (Editor / Super Admin)
  const [isCreateDebateModalOpen, setIsCreateDebateModalOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('Education & Society');
  const [newProLabel, setNewProLabel] = useState('FOR the Motion');
  const [newConLabel, setNewConLabel] = useState('AGAINST the Motion');
  const [newCycleDays, setNewCycleDays] = useState<number>(settings.debateCycleDays || 3);
  const [creatingDebate, setCreatingDebate] = useState(false);

  // Reply state (public -> moderation queue)
  const [replyingArgId, setReplyingArgId] = useState<string | null>(null);
  const [replyAuthorName, setReplyAuthorName] = useState(visitorPrefs.displayName || '');
  const [replyText, setReplyText] = useState('');
  const [replyVerified, setReplyVerified] = useState(false);
  const [replyHoneypot, setReplyHoneypot] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyNotice, setReplyNotice] = useState('');

  useEffect(() => {
    if (initialDebateId && debates.some((d) => d.id === initialDebateId)) {
      setSelectedDebateId(initialDebateId);
    } else if (!selectedDebateId || !debates.some((d) => d.id === selectedDebateId)) {
      const active = debates.find((d) => d.status === 'active');
      if (active) setSelectedDebateId(active.id);
      else if (debates[0]) setSelectedDebateId(debates[0].id);
    }
  }, [initialDebateId, debates, selectedDebateId]);

  useEffect(() => {
    if (visitorPrefs.displayName) {
      setSpeakerName(visitorPrefs.displayName);
      setReplyAuthorName(visitorPrefs.displayName);
    }
    if (visitorPrefs.authorClass) {
      setSpeakerClass(visitorPrefs.authorClass);
    }
  }, [visitorPrefs]);

  useEffect(() => {
    setNewCycleDays(settings.debateCycleDays || 3);
  }, [settings.debateCycleDays]);

  const currentDebate = debates.find((d) => d.id === selectedDebateId) || debates[0];
  const currentArgs = currentDebate
    ? debateArguments.filter((a) => a.debateId === currentDebate.id)
    : [];

  const filteredArgs = currentArgs
    .filter((arg) => (sideFilter === 'ALL' ? true : arg.side === sideFilter))
    .sort((a, b) => {
      if (sortArgsBy === 'top_supported') {
        return (
          getLikeCount('debateArgument', b.id, b.likesCount) -
          getLikeCount('debateArgument', a.id, a.likesCount)
        );
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const forArgs = currentArgs.filter((a) => a.side === 'FOR');
  const againstArgs = currentArgs.filter((a) => a.side === 'AGAINST');

  const proCountDisplay = currentDebate ? Math.max(currentDebate.proCount, forArgs.length) : 0;
  const conCountDisplay = currentDebate ? Math.max(currentDebate.conCount, againstArgs.length) : 0;
  const totalStances = proCountDisplay + conCountDisplay;
  const proPercent = totalStances > 0 ? Math.round((proCountDisplay / totalStances) * 100) : 50;
  const conPercent = totalStances > 0 ? 100 - proPercent : 50;

  const archivedDebates = debates.filter((d) => d.status === 'closed' || d.status === 'archived');
  const isDebateOpenForArguments = Boolean(
    currentDebate &&
      currentDebate.status === 'active' &&
      new Date(currentDebate.closingDate).getTime() >= Date.now()
  );

  const handleSubmitArgument = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!currentDebate || !isDebateOpenForArguments) {
      setFormError('This debate motion is closed and no longer accepting new arguments.');
      return;
    }

    if (!isAnonymous && speakerName.trim().length < 2) {
      setFormError('Please enter your display name or select Anonymous Submission.');
      return;
    }

    if (argTitle.trim().length < 3 || argBody.trim().length < 15) {
      setFormError('Please provide a thesis headline and at least 15 characters of reasoned argument.');
      return;
    }

    setSubmitting(true);
    try {
      if (!isAnonymous && speakerName.trim()) {
        saveVisitorPrefs(speakerName.trim(), speakerClass);
      }
      await wdsService.submitPublicContribution({
        submissionType: 'debate_argument',
        title: argTitle.trim(),
        content: argBody.trim(),
        displayName: speakerName.trim(),
        authorClass: speakerClass,
        isAnonymous,
        debateId: currentDebate.id,
        side: argSide,
        sessionToken,
        botChallengeVerified: humanVerified,
        honeypot,
      });

      setArgTitle('');
      setArgBody('');
      setHoneypot('');
      setFormSuccess(
        'Argument submitted for moderation. Once reviewed by a WDS Moderator, it will appear on the floor.'
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit debate argument.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDebate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminRecord || !newTopicTitle.trim() || !newTopicDesc.trim()) return;
    setCreatingDebate(true);
    try {
      const id = await wdsService.createDebateTopic(
        {
          topic: newTopicTitle.trim(),
          description: newTopicDesc.trim(),
          category: newTopicCategory.trim() || 'General Motion',
          proLabel: newProLabel.trim() || 'FOR the Motion',
          conLabel: newConLabel.trim() || 'AGAINST the Motion',
          cycleDays: Math.max(1, Number(newCycleDays) || settings.debateCycleDays || 3),
        },
        adminRecord
      );
      setIsCreateDebateModalOpen(false);
      setSelectedDebateId(id);
      setActiveTab('arena');
      setNewTopicTitle('');
      setNewTopicDesc('');
    } finally {
      setCreatingDebate(false);
    }
  };

  const handleLikeArgument = async (argId: string) => {
    if (hasSessionLiked('debateArgument', argId)) return;
    await wdsService.castLike('debateArgument', argId, sessionToken);
  };

  const handleSendReply = async (e: React.FormEvent, argId: string) => {
    e.preventDefault();
    if (!currentDebate || !isDebateOpenForArguments) return;
    const cleanName = replyAuthorName.trim();
    if (cleanName.length < 2 || replyText.trim().length < 5) return;

    setReplySubmitting(true);
    setReplyNotice('');
    try {
      saveVisitorPrefs(cleanName, speakerClass);
      await wdsService.submitPublicContribution({
        submissionType: 'debate_reply',
        title: `Counter-reply on debate ${currentDebate.topic.slice(0, 60)}`,
        content: replyText.trim(),
        displayName: cleanName,
        isAnonymous: false,
        debateId: currentDebate.id,
        argumentId: argId,
        sessionToken,
        botChallengeVerified: replyVerified,
        honeypot: replyHoneypot,
      });
      setReplyText('');
      setReplyHoneypot('');
      setReplyingArgId(null);
      setReplyNotice('Counter-reply submitted to moderation queue!');
      setTimeout(() => setReplyNotice(''), 3500);
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-amber-800 font-semibold">
            WDS Forensics &amp; Parliamentary House
          </p>
          <h1 className="text-3xl font-bold text-[#111622] font-crest mt-0.5 leading-tight">
            Debators Floor &amp; Parliamentary Motions
          </h1>
          <p className="text-sm text-stone-600 font-serif-literary mt-1">
            Scheduled {settings.debateCycleDays}-day motions. Contribute FOR or AGAINST contentions for moderation review without signing in.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {isEditor && (
            <button
              onClick={() => setIsCreateDebateModalOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-stone-50 text-[#111622] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-stone-300"
            >
              <Plus className="w-4 h-4 text-amber-700" /> Schedule Motion
            </button>
          )}

          {currentDebate && isDebateOpenForArguments && (
            <button
              onClick={() => {
                setFormError('');
                setFormSuccess('');
                setIsSubmitModalOpen(true);
              }}
              className="px-4 py-2 bg-[#111622] hover:bg-[#1E273B] text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Vote className="w-4 h-4" /> Submit Argument
            </button>
          )}
        </div>
      </div>

      {replyNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{replyNotice}</span>
        </div>
      )}

      {/* Hairline Arena vs Archive Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('arena')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'arena'
                ? 'bg-[#111622] text-amber-300'
                : 'text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <Vote className="w-3.5 h-3.5" /> Motion Floor
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
              activeTab === 'archive'
                ? 'bg-[#111622] text-amber-300'
                : 'text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <Archive className="w-3.5 h-3.5" /> Closed &amp; Archived ({archivedDebates.length})
          </button>
        </div>

        {debates.length > 1 && activeTab === 'arena' && (
          <select
            value={selectedDebateId}
            onChange={(e) => setSelectedDebateId(e.target.value)}
            className="text-xs border border-stone-300 rounded-lg px-3 py-2 bg-white font-medium max-w-xs text-[#111622]"
          >
            {debates.map((d) => (
              <option key={d.id} value={d.id}>
                [{d.status.toUpperCase()}] {d.topic.slice(0, 55)}
              </option>
            ))}
          </select>
        )}
      </div>

      {activeTab === 'arena' ? (
        currentDebate ? (
          <div className="space-y-6">
            {/* Parliamentary Debate Chamber Banner */}
            <div className="bg-[#111622] text-white rounded-2xl p-6 sm:p-9 border border-stone-800 relative overflow-hidden shadow-lg">
              <img
                src={EDITORIAL_VISUALS.debateArena}
                alt="Parliamentary debate chamber"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E17]/95 via-[#0B0E17]/80 to-[#0B0E17]/55" />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono uppercase tracking-[0.14em] mb-3">
                  <span className="text-amber-300 font-semibold flex items-center gap-2">
                    {isDebateOpenForArguments ? (
                      <>
                        Active Motion · Closes{' '}
                        {new Date(currentDebate.closingDate).toLocaleDateString()}
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-stone-400" />
                        {currentDebate.status} · Submissions Closed
                      </>
                    )}
                  </span>
                  <span className="text-stone-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Presided by{' '}
                    {currentDebate.createdByName}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold font-crest tracking-tight text-white max-w-4xl leading-snug">
                  {currentDebate.topic}
                </h2>
                <p className="text-sm text-stone-200 mt-2.5 max-w-3xl leading-relaxed font-serif-literary">
                  {currentDebate.description}
                </p>

                {/* Parliamentary Balance Meter */}
                <div className="mt-6 pt-6 border-t border-white/15 space-y-2.5">
                  <div className="flex justify-between text-xs sm:text-sm font-semibold tabular-nums">
                    <span className="text-emerald-300">
                      FOR: {currentDebate.proLabel} ({proPercent}%)
                    </span>
                    <span className="text-amber-300">
                      AGAINST: {currentDebate.conLabel} ({conPercent}%)
                    </span>
                  </div>

                  <div className="h-3 w-full bg-stone-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${proPercent}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                    />
                    <div
                      style={{ width: `${conPercent}%` }}
                      className="bg-amber-500 transition-all duration-500"
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-stone-300 font-mono tabular-nums">
                    <span>{forArgs.length} FOR Approved</span>
                    <span>{currentArgs.length} Approved Floor Contributions</span>
                    <span>{againstArgs.length} AGAINST Approved</span>
                  </div>
                </div>
              </div>
            </div>

            {!isDebateOpenForArguments && (
              <div className="p-4 rounded-xl bg-stone-100 border border-stone-300 text-xs text-stone-700 flex items-center gap-2 font-medium">
                <Lock className="w-4 h-4 text-stone-500 shrink-0" />
                <span>
                  This debate cycle has concluded and is locked in read-only archival mode.
                </span>
              </div>
            )}

            {/* Floor Controls */}
            <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 mr-2 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Floor:
                </span>
                <button
                  onClick={() => setSideFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer tabular-nums ${
                    sideFilter === 'ALL'
                      ? 'bg-[#111622] text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Both Sides ({currentArgs.length})
                </button>
                <button
                  onClick={() => setSideFilter('FOR')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer tabular-nums ${
                    sideFilter === 'FOR'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  FOR Only ({forArgs.length})
                </button>
                <button
                  onClick={() => setSideFilter('AGAINST')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer tabular-nums ${
                    sideFilter === 'AGAINST'
                      ? 'bg-amber-700 text-white'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  AGAINST Only ({againstArgs.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-stone-500 font-mono uppercase">Order:</span>
                <select
                  value={sortArgsBy}
                  onChange={(e) => setSortArgsBy(e.target.value as 'top_supported' | 'newest')}
                  className="text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 bg-[#FAF8F3] text-[#111622] font-medium"
                >
                  <option value="top_supported">Most Supported First</option>
                  <option value="newest">Chronological (Newest)</option>
                </select>
              </div>
            </div>

            {/* Arguments Floor */}
            {sideFilter === 'ALL' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div className="border-b-2 border-emerald-700 pb-2 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#111622] uppercase tracking-[0.14em] font-mono">
                      Affirmative Bench · FOR
                    </h3>
                    <span className="text-xs font-bold text-emerald-800 font-mono tabular-nums">
                      {forArgs.length}
                    </span>
                  </div>
                  {forArgs.length === 0 ? (
                    <div className="bg-white rounded-xl border border-dashed border-stone-300 p-8 text-center text-xs text-stone-400">
                      No approved FOR arguments yet.
                    </div>
                  ) : (
                    forArgs.map((arg) => renderArgumentCard(arg))
                  )}
                </div>

                <div className="space-y-4">
                  <div className="border-b-2 border-amber-700 pb-2 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#111622] uppercase tracking-[0.14em] font-mono">
                      Opposition Bench · AGAINST
                    </h3>
                    <span className="text-xs font-bold text-amber-800 font-mono tabular-nums">
                      {againstArgs.length}
                    </span>
                  </div>
                  {againstArgs.length === 0 ? (
                    <div className="bg-white rounded-xl border border-dashed border-stone-300 p-8 text-center text-xs text-stone-400">
                      No approved AGAINST arguments yet.
                    </div>
                  ) : (
                    againstArgs.map((arg) => renderArgumentCard(arg))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {filteredArgs.length === 0 ? (
                  <div className="bg-white rounded-xl border border-dashed border-stone-300 p-8 text-center text-xs text-stone-400">
                    No approved {sideFilter} arguments yet.
                  </div>
                ) : (
                  filteredArgs.map((arg) => renderArgumentCard(arg))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
            <Vote className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-lg font-bold text-[#111622] font-crest">
              No Debate Motions Published Yet
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Authorized WDS Editors and Super Admins schedule new parliamentary motions every{' '}
              {settings.debateCycleDays} days.
            </p>
            {isEditor && (
              <button
                onClick={() => setIsCreateDebateModalOpen(true)}
                className="px-4 py-2 bg-[#111622] hover:bg-[#1E273B] text-amber-300 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Schedule First Motion
              </button>
            )}
          </div>
        )
      ) : (
        <div className="space-y-4">
          {archivedDebates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-xs text-stone-400">
              No closed or archived debates yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {archivedDebates.map((deb) => (
                <div
                  key={deb.id}
                  onClick={() => {
                    setSelectedDebateId(deb.id);
                    setActiveTab('arena');
                  }}
                  className="bg-white rounded-xl border border-stone-200 p-5 hover:border-amber-600/45 transition-colors cursor-pointer group space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.12em] text-stone-500">
                    <span>{deb.category}</span>
                    <span>{deb.status}</span>
                  </div>
                  <h4 className="font-bold font-crest text-[#111622] text-lg group-hover:text-amber-800 transition-colors">
                    {deb.topic}
                  </h4>
                  <p className="text-xs text-stone-600 line-clamp-2">{deb.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBMIT ARGUMENT MODAL */}
      {isSubmitModalOpen && currentDebate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0D14]/75 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-[#111622] text-white shrink-0">
              <h3 className="font-crest font-bold text-lg">Submit Debate Floor Argument</h3>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitArgument} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="p-3 bg-[#FAF8F3] rounded-xl border border-stone-200 text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
                  <span>Speaker Attribution (Reviewed Before Publishing)</span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-stone-600">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-stone-300 text-amber-700"
                    />
                    <span>Anonymous</span>
                  </label>
                </div>

                {!isAnonymous && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required={!isAnonymous}
                      value={speakerName}
                      onChange={(e) => setSpeakerName(e.target.value)}
                      placeholder="Your Display Name *"
                      className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                    />
                    <select
                      value={speakerClass}
                      onChange={(e) => setSpeakerClass(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                    >
                      {OLAG_CLASSES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Select Position *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setArgSide('FOR')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                      argSide === 'FOR'
                        ? 'bg-[#111622] border-[#111622] text-white font-semibold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span className="block text-[11px] uppercase font-bold text-emerald-400 mb-1 font-mono">
                      FOR (Affirmative)
                    </span>
                    <span className="text-xs line-clamp-2">{currentDebate.proLabel}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setArgSide('AGAINST')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                      argSide === 'AGAINST'
                        ? 'bg-amber-700 border-amber-700 text-white font-semibold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span
                      className={`block text-[11px] uppercase font-bold mb-1 font-mono ${
                        argSide === 'AGAINST' ? 'text-amber-200' : 'text-amber-800'
                      }`}
                    >
                      AGAINST (Negative)
                    </span>
                    <span className="text-xs line-clamp-2">{currentDebate.conLabel}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Thesis Headline *
                </label>
                <input
                  type="text"
                  required
                  value={argTitle}
                  onChange={(e) => setArgTitle(e.target.value)}
                  placeholder="Enter your main contention"
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Reasoned Argument &amp; Evidence *
                </label>
                <textarea
                  required
                  rows={5}
                  value={argBody}
                  onChange={(e) => setArgBody(e.target.value)}
                  placeholder="Articulate your warrants and evidence (minimum 15 characters)..."
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-amber-600 focus:outline-none leading-relaxed font-serif-literary"
                />
              </div>

              <HumanVerification
                onVerifyChange={setHumanVerified}
                honeypotValue={honeypot}
                onHoneypotChange={setHoneypot}
              />

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting || !humanVerified}
                  className="px-5 py-2 bg-[#111622] hover:bg-[#1E273B] disabled:opacity-50 text-amber-300 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit for Moderation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW MOTION MODAL */}
      {isCreateDebateModalOpen && isEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0D14]/75 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-[#111622] text-white">
              <h3 className="font-crest font-bold text-lg">Schedule Parliamentary Motion</h3>
              <button
                type="button"
                onClick={() => setIsCreateDebateModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDebate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Motion Resolution *
                </label>
                <input
                  type="text"
                  required
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="This House Believes That..."
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Topic Category
                  </label>
                  <input
                    type="text"
                    value={newTopicCategory}
                    onChange={(e) => setNewTopicCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newCycleDays}
                    onChange={(e) => setNewCycleDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-xs font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Contextual Background &amp; Scope *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newTopicDesc}
                  onChange={(e) => setNewTopicDesc(e.target.value)}
                  placeholder="Provide motion framing for student speakers..."
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    FOR Stance Label
                  </label>
                  <input
                    type="text"
                    value={newProLabel}
                    onChange={(e) => setNewProLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    AGAINST Stance Label
                  </label>
                  <input
                    type="text"
                    value={newConLabel}
                    onChange={(e) => setNewConLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateDebateModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDebate}
                  className="px-5 py-2 bg-[#111622] text-amber-300 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  {creatingDebate ? 'Opening...' : 'Open Motion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  function renderArgumentCard(arg: DebateArgument) {
    const liked = hasSessionLiked('debateArgument', arg.id);
    const likeTotal = getLikeCount('debateArgument', arg.id, arg.likesCount);
    const replies = getApprovedReplies(arg.id);
    const isFor = arg.side === 'FOR';

    return (
      <article
        key={arg.id}
        className={`bg-white rounded-xl border p-5 transition-colors space-y-3 ${
          isFor ? 'border-stone-200 hover:border-emerald-700/40' : 'border-stone-200 hover:border-amber-700/40'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={generateInitialsAvatar(arg.displayName)}
              alt=""
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#111622] truncate">{arg.displayName}</span>
                {arg.authorClass && (
                  <span className="text-[10px] text-stone-400 font-mono">{arg.authorClass}</span>
                )}
              </div>
              <span
                className={`text-[10px] font-mono font-semibold uppercase tracking-[0.12em] ${
                  isFor ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                {arg.side} Stance
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-stone-400 font-mono tabular-nums">
              {new Date(arg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
            {isModerator && adminRecord && (
              confirmDeleteArgId === arg.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      void wdsService.deleteDebateArgument(arg.id, adminRecord);
                      setConfirmDeleteArgId(null);
                    }}
                    className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-semibold cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDeleteArgId(null)}
                    className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteArgId(arg.id)}
                  className="p-1 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                  title="Remove Argument"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </div>
        </div>

        <div>
          <h4 className="text-base font-bold font-crest text-[#111622] leading-snug">{arg.title}</h4>
          <p className="text-sm text-stone-700 mt-1.5 leading-relaxed whitespace-pre-line font-serif-literary">
            {arg.argument}
          </p>
        </div>

        <div className="pt-3 border-t border-stone-100 flex items-center gap-4 text-xs text-stone-500 font-mono tabular-nums">
          <button
            onClick={() => void handleLikeArgument(arg.id)}
            disabled={liked}
            className={`flex items-center gap-1.5 cursor-pointer ${
              liked ? 'text-amber-700 font-bold' : 'hover:text-[#111622]'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${liked ? 'fill-amber-700' : ''}`} />
            <span>{likeTotal} Support</span>
          </button>

          {isDebateOpenForArguments && (
            <button
              onClick={() => setReplyingArgId(replyingArgId === arg.id ? null : arg.id)}
              className="flex items-center gap-1 hover:text-[#111622] cursor-pointer"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              <span>{replies.length} Replies</span>
            </button>
          )}
        </div>

        {replies.length > 0 && (
          <div className="pt-2 space-y-2">
            {replies.map((rep) => (
              <div
                key={rep.id}
                className="p-3 rounded-lg bg-[#FAF8F3] border border-stone-200/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#111622]">{rep.displayName}</span>
                  <span className="text-[10px] text-stone-400 font-mono tabular-nums">
                    {new Date(rep.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed">{rep.content}</p>
              </div>
            ))}
          </div>
        )}

        {replyingArgId === arg.id && isDebateOpenForArguments && (
          <form
            onSubmit={(e) => void handleSendReply(e, arg.id)}
            className="p-3.5 rounded-xl bg-[#FAF8F3] border border-stone-300 space-y-2.5"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={replyAuthorName}
                onChange={(e) => setReplyAuthorName(e.target.value)}
                placeholder="Your Display Name *"
                className="sm:w-40 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs"
              />
              <input
                type="text"
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Counter-reply (moderated before appearing)..."
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs"
              />
            </div>
            <HumanVerification
              onVerifyChange={setReplyVerified}
              honeypotValue={replyHoneypot}
              onHoneypotChange={setReplyHoneypot}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={replySubmitting || !replyVerified}
                className="px-3.5 py-1.5 bg-[#111622] hover:bg-[#1E273B] disabled:opacity-50 text-amber-300 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>{replySubmitting ? 'Sending...' : 'Submit Reply'}</span>
              </button>
            </div>
          </form>
        )}
      </article>
    );
  }
};
