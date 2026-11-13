import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWdsData } from '../context/WdsDataContext';
import {
  OLAG_CLASSES,
  generateInitialsAvatar,
  isValidHttpUrl,
  validateUploadFile,
} from '../utils/validation';
import { EDITORIAL_VISUALS } from '../assets/editorialVisuals';
import { uploadSubmissionMedia, wdsService } from '../services/wdsService';
import { HumanVerification } from '../components/HumanVerification';
import { WritingPublication, WritingCategory } from '../types';
import {
  Feather,
  MessageSquare,
  Search,
  Award,
  X,
  Send,
  Heart,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Share2,
  Trash2,
  Clock,
} from 'lucide-react';

interface WrittersViewProps {
  initialWritingId?: string;
}

const CATEGORIES: ('All' | WritingCategory)[] = [
  'All',
  'poem',
  'short_story',
  'essay',
  'reflection',
  'creative_writing',
];

export const WrittersView: React.FC<WrittersViewProps> = ({ initialWritingId }) => {
  const { isModerator, adminRecord, sessionToken, visitorPrefs, saveVisitorPrefs } = useAuth();
  const { writings, settings, hasSessionLiked, getLikeCount, getApprovedComments } = useWdsData();

  const [selectedCat, setSelectedCat] = useState<'All' | WritingCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'most_liked'>('featured');

  const [activeReading, setActiveReading] = useState<WritingPublication | null>(null);
  const [readingFontSize, setReadingFontSize] = useState<'normal' | 'large' | 'huge'>('normal');
  const [readingProgress, setReadingProgress] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Public Manuscript Submission Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [authorName, setAuthorName] = useState(visitorPrefs.displayName || '');
  const [authorClass, setAuthorClass] = useState(visitorPrefs.authorClass || OLAG_CLASSES[0]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<WritingCategory>('poem');
  const [content, setContent] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [humanVerified, setHumanVerified] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Comment state
  const [commenterName, setCommenterName] = useState(visitorPrefs.displayName || '');
  const [commentText, setCommentText] = useState('');
  const [commentVerified, setCommentVerified] = useState(false);
  const [commentHoneypot, setCommentHoneypot] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState('');
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    if (initialWritingId) {
      const match = writings.find((w) => w.id === initialWritingId);
      if (match) setActiveReading(match);
    }
  }, [initialWritingId, writings]);

  useEffect(() => {
    if (activeReading) {
      const latest = writings.find((w) => w.id === activeReading.id);
      if (latest) setActiveReading(latest);
    }
  }, [writings, activeReading]);

  useEffect(() => {
    if (visitorPrefs.displayName) {
      setAuthorName(visitorPrefs.displayName);
      setCommenterName(visitorPrefs.displayName);
    }
    if (visitorPrefs.authorClass) setAuthorClass(visitorPrefs.authorClass);
  }, [visitorPrefs]);

  const filtered = writings
    .filter((w) => {
      const matchesCat = selectedCat === 'All' || w.writingType === selectedCat;
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        w.title.toLowerCase().includes(q) ||
        w.authorDisplayName.toLowerCase().includes(q) ||
        w.content.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    })
    .sort((a, b) => {
      if (sortBy === 'featured' && a.featured !== b.featured) return a.featured ? -1 : 1;
      if (sortBy === 'most_liked') {
        return getLikeCount('writing', b.id, b.likesCount) - getLikeCount('writing', a.id, a.likesCount);
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

  const featuredWritings = writings.filter((w) => w.featured);

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateUploadFile(file, 'image');
    if (err) {
      setFormError(err);
      return;
    }
    setCoverFile(file);
  };

  const handleSubmitWriting = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!settings.allowPublicSubmissions) {
      setFormError('Public submissions are temporarily paused by school administrators.');
      return;
    }

    if (!isAnonymous && authorName.trim().length < 2) {
      setFormError('Please enter your display name or select Anonymous Submission.');
      return;
    }

    if (title.trim().length < 2 || content.trim().length < 20) {
      setFormError('Please provide a title and manuscript text (minimum 20 characters).');
      return;
    }

    if (coverUrl.trim() && !isValidHttpUrl(coverUrl)) {
      setFormError('Cover URL must start with http:// or https://.');
      return;
    }

    setSubmitting(true);
    try {
      if (!isAnonymous && authorName.trim()) {
        saveVisitorPrefs(authorName.trim(), authorClass);
      }

      let finalImageUrl = coverUrl.trim();
      let finalStoragePath = '';
      if (coverFile) {
        const up = await uploadSubmissionMedia(coverFile, 'image', sessionToken);
        finalImageUrl = up.url;
        finalStoragePath = up.storagePath;
      }

      await wdsService.submitPublicContribution({
        submissionType: category as 'poem' | 'short_story' | 'essay' | 'reflection' | 'creative_writing',
        title: title.trim(),
        excerpt: subtitle.trim() || undefined,
        content: content.trim(),
        category,
        displayName: authorName.trim(),
        authorClass,
        isAnonymous,
        imageUrl: finalImageUrl || undefined,
        storagePath: finalStoragePath || undefined,
        sessionToken,
        botChallengeVerified: humanVerified,
        honeypot,
      });

      setTitle('');
      setSubtitle('');
      setContent('');
      setCoverUrl('');
      setCoverFile(null);
      setHoneypot('');
      setFormSuccess(
        "Submitted for editorial review! Your piece is in the WDS moderation queue and will be published to the Writers' Corner upon approval."
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to submit manuscript.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (writingId: string) => {
    if (hasSessionLiked('writing', writingId)) return;
    await wdsService.castLike('writing', writingId, sessionToken);
  };

  const handleCopyShareLink = (id: string) => {
    const shareUrl = `${window.location.origin}/?tab=writters&id=${encodeURIComponent(id)}`;
    void navigator.clipboard?.writeText(shareUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReading) return;
    setCommentError('');
    setCommentFeedback('');

    const cleanName = (isModerator && adminRecord ? adminRecord.displayName : commenterName).trim();
    if (cleanName.length < 2 || commentText.trim().length < 2) {
      setCommentError('Please enter both your display name and literary impression.');
      return;
    }

    setCommentSubmitting(true);
    try {
      if (!isModerator && cleanName) {
        saveVisitorPrefs(cleanName, visitorPrefs.authorClass || OLAG_CLASSES[0]);
      }
      await wdsService.submitPublicContribution({
        submissionType: 'comment',
        title: `Impression on ${activeReading.title.slice(0, 80)}`,
        content: commentText.trim(),
        displayName: cleanName,
        isAnonymous: false,
        targetType: 'writing',
        targetId: activeReading.id,
        sessionToken,
        botChallengeVerified: commentVerified,
        honeypot: commentHoneypot,
      });
      setCommentText('');
      setCommentHoneypot('');
      setCommentFeedback('Reader impression submitted for moderation!');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Failed to submit impression.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Literary Press Masthead */}
      <div className="bg-[#111622] text-white rounded-2xl p-6 sm:p-9 border border-stone-800 relative overflow-hidden shadow-lg">
        <img
          src={EDITORIAL_VISUALS.literaryPress}
          alt="Fountain pen and cream cotton literary anthology"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E17]/95 via-[#0B0E17]/82 to-[#0B0E17]/50" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-amber-300 flex items-center gap-1.5">
              <Feather className="w-3.5 h-3.5" /> {settings.schoolShortName} WDS Literary Press
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold font-crest text-white leading-tight">
              The Writers&apos; Corner
            </h1>
            <p className="text-sm text-stone-200 font-serif-literary leading-relaxed">
              Student poetry, short stories, analytical essays, and creative reflections published at {settings.schoolName}.
            </p>
          </div>

          <button
            onClick={() => {
              setFormError('');
              setFormSuccess('');
              setIsSubmitModalOpen(true);
            }}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Feather className="w-4 h-4" /> Submit Original Work
          </button>
        </div>
      </div>

      {/* Laureate Featured Selections */}
      {featuredWritings.length > 0 && selectedCat === 'All' && !searchQuery && (
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
            <Award className="w-4 h-4 text-amber-700" />
            <h2 className="text-xs font-semibold text-stone-700 uppercase tracking-[0.15em] font-mono">
              Laureate Selections · Editor&apos;s Pick
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredWritings.slice(0, 2).map((piece) => (
              <article
                key={piece.id}
                onClick={() => {
                  setReadingProgress(0);
                  setConfirmDeleteId(null);
                  setActiveReading(piece);
                }}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:border-amber-600/45 transition-colors cursor-pointer group flex flex-col justify-between"
              >
                <div className="h-44 w-full overflow-hidden bg-stone-100">
                  <img
                    src={piece.imageUrl || EDITORIAL_VISUALS.literaryPress}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <div className="p-6">
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-amber-800 font-semibold mb-1.5">
                    Editor&apos;s Pick · {piece.writingType.replace('_', ' ')}
                  </p>
                  <h3 className="font-serif-literary text-2xl font-bold text-[#111622] group-hover:text-amber-800 transition-colors leading-snug">
                    "{piece.title}"
                  </h3>
                  {piece.subtitle && (
                    <p className="text-xs text-stone-500 italic mt-1 font-serif-literary">
                      {piece.subtitle}
                    </p>
                  )}
                  <p className="text-sm font-serif-literary text-stone-600 line-clamp-3 mt-3 italic leading-relaxed">
                    {piece.content.slice(0, 180)}...
                  </p>
                </div>

                <div className="px-6 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                    <img
                      src={generateInitialsAvatar(piece.authorDisplayName)}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="font-semibold text-[#111622]">
                      {piece.authorDisplayName}
                      {piece.authorClass ? ` (${piece.authorClass})` : ''}
                    </span>
                  </div>
                  <span className="text-amber-800 font-semibold">
                    Read Piece ({piece.readingTime}) →
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Search & Genre Filters */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search poems, stories, essays, or student authors..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-200 bg-[#FAF8F3]/60 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-stone-500 font-mono uppercase">Order:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'featured' | 'newest' | 'most_liked')}
              className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-[#FAF8F3] text-[#111622] font-medium"
            >
              <option value="featured">Featured First</option>
              <option value="newest">Newest First</option>
              <option value="most_liked">Most Applauded</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer capitalize font-mono ${
                selectedCat === cat
                  ? 'bg-[#111622] text-amber-300'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat === 'All' ? 'All Genres' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Works Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <Feather className="w-9 h-9 text-stone-300 mx-auto" />
          <p className="text-base font-bold font-crest text-[#111622]">
            {writings.length === 0
              ? 'No literary works published yet'
              : 'No literary works match your search'}
          </p>
          <p className="text-xs text-stone-500 max-w-md mx-auto font-serif-literary">
            Submit an original poem, short story, essay, or reflection to our editorial moderation queue without signing in.
          </p>
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-4 py-2 bg-[#111622] hover:bg-[#1E273B] text-amber-300 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
          >
            <Feather className="w-3.5 h-3.5" /> Submit Original Work
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((piece) => {
            const liked = hasSessionLiked('writing', piece.id);
            const likeTotal = getLikeCount('writing', piece.id, piece.likesCount);
            const commentsCount = getApprovedComments('writing', piece.id).length;

            return (
              <article
                key={piece.id}
                onClick={() => {
                  setReadingProgress(0);
                  setConfirmDeleteId(null);
                  setActiveReading(piece);
                }}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:border-amber-600/45 transition-colors cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {piece.imageUrl && (
                    <div className="h-40 w-full overflow-hidden bg-stone-100">
                      <img
                        src={piece.imageUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.12em] text-stone-500 mb-2">
                      <span className="font-semibold text-amber-800 truncate">
                        {piece.writingType.replace('_', ' ')}
                        {piece.featured ? " · Editor's Pick" : ''}
                      </span>
                      <span className="shrink-0 tabular-nums ml-2">{piece.readingTime}</span>
                    </div>

                    <h3 className="font-serif-literary text-xl font-bold text-[#111622] group-hover:text-amber-800 transition-colors line-clamp-2 leading-snug">
                      {piece.title}
                    </h3>
                    {piece.subtitle && (
                      <p className="text-xs text-stone-500 italic mt-0.5 font-serif-literary line-clamp-1">
                        {piece.subtitle}
                      </p>
                    )}
                    <p className="text-sm font-serif-literary text-stone-600 line-clamp-3 mt-2.5 italic leading-relaxed">
                      {piece.content.slice(0, 150)}...
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <img
                      src={generateInitialsAvatar(piece.authorDisplayName)}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                    <span className="font-semibold text-stone-800 truncate">
                      {piece.authorDisplayName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleLike(piece.id);
                      }}
                      className={`flex items-center gap-1 cursor-pointer ${
                        liked ? 'text-amber-700 font-bold' : 'hover:text-[#111622]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-amber-700' : ''}`} />
                      <span>{likeTotal}</span>
                    </button>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{Math.max(commentsCount, piece.commentsCount)}</span>
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* LITERARY FOLIO READER MODAL */}
      {activeReading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0D14]/75 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-[#FAF8F3] rounded-2xl shadow-2xl border border-stone-300 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Reading Progress Hairline */}
            <div className="h-1 w-full bg-stone-200 shrink-0">
              <div
                style={{ width: `${readingProgress}%` }}
                className="h-full bg-amber-700 transition-all duration-100"
              />
            </div>

            <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono font-semibold text-amber-900 uppercase tracking-[0.14em]">
                  {activeReading.writingType.replace('_', ' ')}
                </span>
                <span className="text-stone-300">|</span>
                <div className="flex items-center gap-1 bg-[#FAF8F3] rounded-lg p-0.5 border border-stone-200 text-xs">
                  {(['normal', 'large', 'huge'] as const).map((sz, idx) => (
                    <button
                      key={sz}
                      onClick={() => setReadingFontSize(sz)}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        readingFontSize === sz
                          ? 'bg-[#111622] font-semibold text-amber-300'
                          : 'text-stone-600'
                      }`}
                    >
                      {idx === 0 ? 'A' : idx === 1 ? 'A+' : 'A++'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyShareLink(activeReading.id)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedId === activeReading.id ? 'Copied' : 'Share'}</span>
                </button>
                {isModerator && adminRecord && (
                  <>
                    <button
                      onClick={() =>
                        void wdsService.toggleFeatureWriting(
                          activeReading.id,
                          !activeReading.featured,
                          adminRecord
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg text-xs border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 cursor-pointer"
                    >
                      {activeReading.featured ? 'Unfeature' : 'Feature'}
                    </button>
                    {confirmDeleteId === activeReading.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            void wdsService.deleteWriting(activeReading.id, adminRecord);
                            setActiveReading(null);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1.5 rounded-lg bg-stone-100 text-stone-600 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(activeReading.id)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete publication"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => {
                    setActiveReading(null);
                    setConfirmDeleteId(null);
                    setCommentFeedback('');
                    setCommentError('');
                  }}
                  className="p-1.5 text-stone-400 hover:text-[#111622] rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div
              onScroll={(e) => {
                const el = e.currentTarget;
                const max = el.scrollHeight - el.clientHeight;
                setReadingProgress(max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 100);
              }}
              className="overflow-y-auto p-6 sm:p-12 space-y-6 flex-1"
            >
              <div className="text-center max-w-xl mx-auto space-y-2 pb-4 border-b border-stone-200">
                <h1 className="text-3xl sm:text-4xl font-serif-literary font-bold text-[#111622] leading-tight">
                  {activeReading.title}
                </h1>
                {activeReading.subtitle && (
                  <p className="text-base font-serif-literary italic text-stone-600">
                    {activeReading.subtitle}
                  </p>
                )}
                <div className="pt-2 flex items-center justify-center gap-2 text-xs text-stone-500 font-mono">
                  <span className="font-semibold text-[#111622]">
                    {activeReading.authorDisplayName}
                  </span>
                  {activeReading.authorClass && (
                    <>
                      <span>·</span>
                      <span>{activeReading.authorClass}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{activeReading.readingTime}</span>
                </div>
              </div>

              <div
                className={`editorial-dropcap font-serif-literary max-w-xl mx-auto leading-[1.85] whitespace-pre-line text-stone-800 pt-2 ${
                  readingFontSize === 'normal'
                    ? 'text-lg sm:text-xl'
                    : readingFontSize === 'large'
                    ? 'text-xl sm:text-2xl'
                    : 'text-2xl sm:text-[26px]'
                }`}
              >
                {activeReading.content}
              </div>

              <div className="pt-8 border-t border-stone-200 flex items-center justify-between max-w-xl mx-auto">
                <button
                  onClick={() => void handleLike(activeReading.id)}
                  disabled={hasSessionLiked('writing', activeReading.id)}
                  className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors tabular-nums ${
                    hasSessionLiked('writing', activeReading.id)
                      ? 'bg-amber-700 text-white'
                      : 'bg-white border border-stone-300 hover:bg-stone-100 text-[#111622]'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>
                    {hasSessionLiked('writing', activeReading.id) ? 'Applauded' : 'Applaud Work'} (
                    {getLikeCount('writing', activeReading.id, activeReading.likesCount)})
                  </span>
                </button>
                <span className="text-xs text-stone-500 font-serif-literary italic">
                  {settings.schoolShortName} WDS Literary Journal
                </span>
              </div>

              {/* Moderated Impressions */}
              <div className="pt-6 max-w-xl mx-auto space-y-3">
                <h3 className="font-crest font-bold text-[#111622] text-lg">
                  Reader Impressions
                </h3>

                {commentError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    {commentError}
                  </div>
                )}
                {commentFeedback && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
                    {commentFeedback}
                  </div>
                )}

                <form
                  onSubmit={handleSubmitComment}
                  className="space-y-3 p-4 rounded-xl bg-white border border-stone-200"
                >
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      value={isModerator && adminRecord ? adminRecord.displayName : commenterName}
                      onChange={(e) => setCommenterName(e.target.value)}
                      disabled={Boolean(isModerator && adminRecord)}
                      placeholder="Your Display Name *"
                      className="sm:w-40 px-3 py-2 rounded-lg border border-stone-200 bg-[#FAF8F3] text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your impression (reviewed before publishing)..."
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-200 bg-[#FAF8F3] text-xs"
                    />
                  </div>
                  <HumanVerification
                    onVerifyChange={setCommentVerified}
                    honeypotValue={commentHoneypot}
                    onHoneypotChange={setCommentHoneypot}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={commentSubmitting || !commentVerified}
                      className="px-4 py-2 bg-[#111622] hover:bg-[#1E273B] disabled:opacity-50 text-amber-300 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{commentSubmitting ? 'Sending...' : 'Submit Impression'}</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-2 pt-2">
                  {getApprovedComments('writing', activeReading.id).map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-white border border-stone-200 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#111622]">{c.displayName}</span>
                        <span className="text-[10px] text-stone-400 font-mono tabular-nums">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-stone-700 font-serif-literary mt-1 italic text-sm">
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PUBLIC SUBMISSION MODAL */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0D14]/75 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-[#111622] text-white shrink-0">
              <h3 className="font-crest font-bold text-lg">Submit Creative Manuscript</h3>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitWriting} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Manuscripts enter the WDS editorial moderation queue and are published after approval.
                </span>
              </div>

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
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-700">Writer Attribution (No Login Needed)</span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-stone-600">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-stone-300 text-amber-700"
                    />
                    <span>Submit Anonymously</span>
                  </label>
                </div>

                {!isAnonymous && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required={!isAnonymous}
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Your Display Name *"
                      className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                    />
                    <select
                      value={authorClass}
                      onChange={(e) => setAuthorClass(e.target.value)}
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
                <label className="block text-xs font-semibold text-stone-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter manuscript title"
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm font-serif-literary focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Genre</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as WritingCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  >
                    <option value="poem">Original Poem</option>
                    <option value="short_story">Short Story</option>
                    <option value="essay">Literary / Analytical Essay</option>
                    <option value="reflection">Creative Reflection</option>
                    <option value="creative_writing">Creative Writing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Subtitle / Theme (Optional)
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Short thematic line"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Cover Artwork (Optional · Max 3 MB)
                </label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-[#FAF8F3] hover:bg-stone-100 text-xs font-semibold text-stone-700 cursor-pointer shrink-0">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{coverFile ? coverFile.name : 'Upload Artwork'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleSelectImage}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="Or paste https:// image URL"
                    className="flex-1 px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Creative Manuscript Text *
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Compose your verses, story, or essay (minimum 20 characters)..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm font-serif-literary focus:ring-2 focus:ring-amber-600 focus:outline-none leading-relaxed"
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
    </div>
  );
};
