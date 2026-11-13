import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWdsData } from '../context/WdsDataContext';
import {
  OLAG_CLASSES,
  generateInitialsAvatar,
  isValidHttpUrl,
  validateUploadFile,
} from '../utils/validation';
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
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Masthead */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-amber-300 text-xs font-mono">
            <Feather className="w-3.5 h-3.5" /> {settings.schoolShortName} WDS Literary Press
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-crest text-white">
            The Writers' Corner
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-serif-literary leading-relaxed">
            Student poetry, short stories, analytical essays, and creative reflections at {settings.schoolName}.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setFormSuccess('');
            setIsSubmitModalOpen(true);
          }}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Feather className="w-4 h-4" /> Submit Original Work
        </button>
      </div>

      {/* Featured Literary Spotlight */}
      {featuredWritings.length > 0 && selectedCat === 'All' && !searchQuery && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Laureate Selections • Editor's Pick
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredWritings.slice(0, 2).map((piece) => (
              <div
                key={piece.id}
                onClick={() => setActiveReading(piece)}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                {piece.imageUrl && (
                  <div className="h-44 w-full overflow-hidden relative">
                    <img
                      src={piece.imageUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                        Editor's Pick
                      </span>
                      <span className="bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded uppercase font-mono">
                        {piece.writingType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <h3 className="font-serif-literary text-xl font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                    "{piece.title}"
                  </h3>
                  {piece.subtitle && (
                    <p className="text-xs text-slate-500 italic mt-1 font-serif-literary">
                      {piece.subtitle}
                    </p>
                  )}
                  <p className="text-xs font-serif-literary text-slate-600 line-clamp-3 mt-3 italic leading-relaxed">
                    {piece.content.slice(0, 180)}...
                  </p>
                </div>

                <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <img
                      src={generateInitialsAvatar(piece.authorDisplayName)}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="font-semibold text-slate-800">
                      {piece.authorDisplayName}
                      {piece.authorClass ? ` (${piece.authorClass})` : ''}
                    </span>
                  </div>
                  <span className="text-amber-800 font-semibold font-serif-literary">
                    Read Piece ({piece.readingTime}) →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Genre Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search poems, stories, essays, or student authors..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-mono">Order:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'featured' | 'newest' | 'most_liked')}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 text-slate-700 font-medium"
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer capitalize font-mono ${
                selectedCat === cat
                  ? 'bg-slate-900 text-amber-300 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'All' ? 'All Genres' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Works Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Feather className="w-9 h-9 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">
            {writings.length === 0
              ? 'No literary works published yet'
              : 'No literary works match your search'}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto font-serif-literary">
            Submit an original poem, short story, essay, or reflection to our editorial moderation queue without signing in.
          </p>
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
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
              <div
                key={piece.id}
                onClick={() => setActiveReading(piece)}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {piece.imageUrl && (
                    <div className="h-40 w-full overflow-hidden relative">
                      <img
                        src={piece.imageUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="bg-slate-900/80 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                          {piece.writingType.replace('_', ' ')}
                        </span>
                        {piece.featured && (
                          <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                            Editor's Pick
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400 font-mono">{piece.readingTime}</span>
                      {!piece.imageUrl && (
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                          {piece.writingType.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif-literary text-lg font-bold text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-2">
                      {piece.title}
                    </h3>
                    {piece.subtitle && (
                      <p className="text-xs text-slate-500 italic mt-0.5 font-serif-literary line-clamp-1">
                        {piece.subtitle}
                      </p>
                    )}
                    <p className="text-xs font-serif-literary text-slate-600 line-clamp-3 mt-3 italic leading-relaxed">
                      {piece.content.slice(0, 150)}...
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <img
                      src={generateInitialsAvatar(piece.authorDisplayName)}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                    <span className="font-semibold text-slate-800 truncate">
                      {piece.authorDisplayName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleLike(piece.id);
                      }}
                      className={`flex items-center gap-1 cursor-pointer ${
                        liked ? 'text-amber-600 font-bold' : 'hover:text-slate-800'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-amber-600' : ''}`} />
                      <span>{likeTotal}</span>
                    </button>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{Math.max(commentsCount, piece.commentsCount)}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* READER MODAL */}
      {activeReading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-[#fdfbf7] rounded-3xl shadow-2xl border border-stone-300 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-100/60">
              <div className="flex items-center gap-3">
                <span className="text-xs font-serif-literary font-bold text-amber-900 uppercase">
                  {activeReading.writingType.replace('_', ' ')}
                </span>
                <span className="text-stone-300">|</span>
                <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-stone-200 text-xs">
                  {(['normal', 'large', 'huge'] as const).map((sz, idx) => (
                    <button
                      key={sz}
                      onClick={() => setReadingFontSize(sz)}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        readingFontSize === sz
                          ? 'bg-amber-100 font-bold text-amber-900'
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
                  className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedId === activeReading.id ? 'Copied!' : 'Share'}</span>
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
                      className="px-2.5 py-1 rounded-lg text-xs font-serif-literary border border-stone-300 bg-white hover:bg-stone-50 cursor-pointer"
                    >
                      {activeReading.featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this literary publication?')) {
                          void wdsService.deleteWriting(activeReading.id, adminRecord);
                          setActiveReading(null);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setActiveReading(null);
                    setCommentFeedback('');
                    setCommentError('');
                  }}
                  className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-6 sm:p-12 space-y-6 flex-1">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h1 className="text-2xl sm:text-4xl font-serif-literary font-bold text-stone-900">
                  {activeReading.title}
                </h1>
                {activeReading.subtitle && (
                  <p className="text-sm font-serif-literary italic text-stone-600">
                    {activeReading.subtitle}
                  </p>
                )}
                <div className="pt-3 flex items-center justify-center gap-2 text-xs text-stone-500 font-mono">
                  <span className="font-semibold text-stone-800">
                    {activeReading.authorDisplayName}
                  </span>
                  {activeReading.authorClass && (
                    <>
                      <span>•</span>
                      <span>{activeReading.authorClass}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{activeReading.readingTime}</span>
                </div>
              </div>

              <div
                className={`font-serif-literary max-w-xl mx-auto leading-relaxed whitespace-pre-line text-stone-800 pt-4 ${
                  readingFontSize === 'normal'
                    ? 'text-base sm:text-lg'
                    : readingFontSize === 'large'
                    ? 'text-lg sm:text-xl'
                    : 'text-xl sm:text-2xl'
                }`}
              >
                {activeReading.content}
              </div>

              <div className="pt-8 border-t border-stone-200 flex items-center justify-between max-w-xl mx-auto">
                <button
                  onClick={() => void handleLike(activeReading.id)}
                  disabled={hasSessionLiked('writing', activeReading.id)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-serif-literary font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                    hasSessionLiked('writing', activeReading.id)
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>
                    {hasSessionLiked('writing', activeReading.id) ? 'Applauded' : 'Applaud Work'} (
                    {getLikeCount('writing', activeReading.id, activeReading.likesCount)})
                  </span>
                </button>
                <span className="text-xs text-stone-500 font-serif-literary">
                  {settings.schoolShortName} WDS Literary Journal
                </span>
              </div>

              {/* Moderated Impressions */}
              <div className="pt-6 max-w-xl mx-auto space-y-3">
                <h3 className="font-serif-literary font-bold text-stone-900 text-sm">
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
                  className="space-y-3 p-4 rounded-2xl bg-stone-100/80 border border-stone-200"
                >
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      value={isModerator && adminRecord ? adminRecord.displayName : commenterName}
                      onChange={(e) => setCommenterName(e.target.value)}
                      disabled={Boolean(isModerator && adminRecord)}
                      placeholder="Your Display Name *"
                      className="sm:w-40 px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your impression (reviewed before publishing)..."
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs"
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
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-300 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
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
                      className="p-3 rounded-xl bg-stone-100/80 border border-stone-200 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-800">{c.displayName}</span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-stone-700 font-serif-literary mt-1 italic">{c.content}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <h3 className="font-crest font-bold text-base">Submit Creative Manuscript</h3>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitWriting} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 flex items-center gap-2">
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

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Writer Attribution (No Login Needed)</span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600"
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
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                    <select
                      value={authorClass}
                      onChange={(e) => setAuthorClass(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter manuscript title"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-serif-literary focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Genre</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as WritingCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-serif-literary"
                  >
                    <option value="poem">Original Poem</option>
                    <option value="short_story">Short Story</option>
                    <option value="essay">Literary / Analytical Essay</option>
                    <option value="reflection">Creative Reflection</option>
                    <option value="creative_writing">Creative Writing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subtitle / Theme (Optional)
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Short thematic line"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cover Artwork (Optional • Max 3 MB)
                </label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer shrink-0">
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
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Creative Manuscript Text *
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Compose your verses, story, or essay (minimum 20 characters)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-serif-literary focus:ring-2 focus:ring-amber-500 leading-relaxed"
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
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting || !humanVerified}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-300 font-bold rounded-xl text-xs shadow-xs cursor-pointer font-serif-literary"
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
