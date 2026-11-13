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
import { uploadEditorialMedia, uploadSubmissionMedia, wdsService } from '../services/wdsService';
import { HumanVerification } from '../components/HumanVerification';
import { NewsArticle, NewsCategory } from '../types';
import {
  Search,
  Plus,
  Pin,
  ShieldCheck,
  ThumbsUp,
  MessageSquare,
  Filter,
  Trash2,
  Send,
  X,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  Share2,
  Clock,
} from 'lucide-react';

interface NewsViewProps {
  initialArticleId?: string;
}

const CATEGORIES: ('All' | NewsCategory)[] = [
  'All',
  'School announcements',
  'Academic news',
  'Sports',
  'Clubs and societies',
  'Events',
  'General student news',
];

export const NewsView: React.FC<NewsViewProps> = ({ initialArticleId }) => {
  const { isEditor, adminRecord, sessionToken, visitorPrefs, saveVisitorPrefs } = useAuth();
  const { news, hasSessionLiked, getLikeCount, getApprovedComments, settings } = useWdsData();

  const [selectedCategory, setSelectedCategory] = useState<'All' | NewsCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'most_liked'>('newest');

  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [confirmDeleteArticleId, setConfirmDeleteArticleId] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Submission / Editorial Creation state
  const [authorNameInput, setAuthorNameInput] = useState(
    isEditor && adminRecord ? adminRecord.displayName : visitorPrefs.displayName || ''
  );
  const [authorClassInput, setAuthorClassInput] = useState(
    visitorPrefs.authorClass || OLAG_CLASSES[0]
  );
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<NewsCategory>('General student news');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);

  // Editor-only controls
  const [newPriority, setNewPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [newIsOfficial, setNewIsOfficial] = useState(true);
  const [newStatus, setNewStatus] = useState<'published' | 'draft' | 'scheduled'>('published');
  const [scheduledDate, setScheduledDate] = useState('');

  // Public anti-bot & feedback
  const [humanVerified, setHumanVerified] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Comment moderation submission state
  const [commenterName, setCommenterName] = useState(visitorPrefs.displayName || '');
  const [commentText, setCommentText] = useState('');
  const [commentHumanVerified, setCommentHumanVerified] = useState(false);
  const [commentHoneypot, setCommentHoneypot] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState('');
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    if (initialArticleId) {
      const match = news.find((n) => n.id === initialArticleId);
      if (match) setActiveArticle(match);
    }
  }, [initialArticleId, news]);

  useEffect(() => {
    if (isEditor && adminRecord) {
      setAuthorNameInput(adminRecord.displayName);
    } else if (visitorPrefs.displayName) {
      setAuthorNameInput(visitorPrefs.displayName);
      setCommenterName(visitorPrefs.displayName);
    }
    if (visitorPrefs.authorClass) {
      setAuthorClassInput(visitorPrefs.authorClass);
    }
  }, [isEditor, adminRecord, visitorPrefs]);

  useEffect(() => {
    if (activeArticle) {
      const latest = news.find((n) => n.id === activeArticle.id);
      if (latest) setActiveArticle(latest);
    }
  }, [news, activeArticle]);

  const filtered = news.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.excerpt.toLowerCase().includes(q) ||
      item.authorDisplayName.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  filtered.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (sortBy === 'most_liked') {
      return getLikeCount('news', b.id, b.likesCount) - getLikeCount('news', a.id, a.likesCount);
    }
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const featuredStory = news.find((n) => n.isPinned) || news[0];

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateUploadFile(file, 'image');
    if (err) {
      setFormError(err);
      return;
    }
    setNewCoverFile(file);
  };

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!isEditor && !settings.allowPublicSubmissions) {
      setFormError('Public submissions are temporarily paused by administrators.');
      return;
    }

    if (newTitle.trim().length < 3 || newExcerpt.trim().length < 10 || newContent.trim().length < 20) {
      setFormError(
        'Please provide headline (min 3 chars), excerpt (min 10 chars), and article text (min 20 chars).'
      );
      return;
    }

    if (newCoverUrl.trim() && !isValidHttpUrl(newCoverUrl)) {
      setFormError('Cover photo URL must start with http:// or https://.');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = newCoverUrl.trim();
      let storagePath = '';

      if (newCoverFile) {
        if (isEditor) {
          const up = await uploadEditorialMedia(newCoverFile, 'image', 'news');
          imageUrl = up.url;
        } else {
          const up = await uploadSubmissionMedia(newCoverFile, 'image', sessionToken);
          imageUrl = up.url;
          storagePath = up.storagePath;
        }
      }

      if (isEditor && adminRecord) {
        await wdsService.createNewsArticle(
          {
            title: newTitle.trim(),
            excerpt: newExcerpt.trim(),
            content: newContent.trim(),
            category: newCategory,
            authorDisplayName: authorNameInput.trim() || adminRecord.displayName,
            authorClass: adminRecord.title || 'Editorial Council',
            imageUrl: imageUrl || undefined,
            isOfficial: newIsOfficial,
            isPinned: newIsPinned,
            priority: newPriority,
            status: newStatus,
            scheduledPublishDate: scheduledDate || undefined,
          },
          adminRecord
        );
        setFormSuccess(
          newStatus === 'published'
            ? 'Official bulletin published immediately!'
            : `Article saved with status "${newStatus}".`
        );
      } else {
        if (!isAnonymous && authorNameInput.trim().length < 2) {
          throw new Error('Please enter your display name or select Anonymous Submission.');
        }
        if (!isAnonymous && authorNameInput.trim()) {
          saveVisitorPrefs(authorNameInput.trim(), authorClassInput);
        }

        await wdsService.submitPublicContribution({
          submissionType: 'news',
          title: newTitle.trim(),
          excerpt: newExcerpt.trim(),
          content: newContent.trim(),
          category: newCategory,
          displayName: authorNameInput.trim(),
          authorClass: authorClassInput,
          isAnonymous,
          imageUrl: imageUrl || undefined,
          storagePath: storagePath || undefined,
          sessionToken,
          botChallengeVerified: humanVerified,
          honeypot,
        });
        setFormSuccess(
          'Article submitted for moderation. Once verified by an Editor or Moderator, it will appear in the OLAG Gazette.'
        );
      }

      setNewTitle('');
      setNewExcerpt('');
      setNewContent('');
      setNewCoverUrl('');
      setNewCoverFile(null);
      setHoneypot('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to submit article.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (articleId: string) => {
    if (hasSessionLiked('news', articleId)) return;
    try {
      await wdsService.castLike('news', articleId, sessionToken);
    } catch {
      // handled cleanly by wdsService / UI
    }
  };

  const handleCopyShareLink = (articleId: string) => {
    const shareUrl = `${window.location.origin}/?tab=news&id=${encodeURIComponent(articleId)}`;
    void navigator.clipboard?.writeText(shareUrl);
    setCopiedId(articleId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeArticle) return;
    setCommentError('');
    setCommentFeedback('');

    const finalName = (isEditor && adminRecord ? adminRecord.displayName : commenterName).trim();
    if (finalName.length < 2 || commentText.trim().length < 2) {
      setCommentError('Please enter both your display name and a comment.');
      return;
    }

    setCommentSubmitting(true);
    try {
      if (!isEditor && finalName) {
        saveVisitorPrefs(finalName, visitorPrefs.authorClass || OLAG_CLASSES[0]);
      }
      await wdsService.submitPublicContribution({
        submissionType: 'comment',
        title: `Comment on ${activeArticle.title.slice(0, 80)}`,
        content: commentText.trim(),
        displayName: finalName,
        isAnonymous: false,
        targetType: 'news',
        targetId: activeArticle.id,
        sessionToken,
        botChallengeVerified: commentHumanVerified,
        honeypot: commentHoneypot,
      });
      setCommentText('');
      setCommentHoneypot('');
      setCommentFeedback('Comment submitted for moderation! It will appear here once approved.');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Failed to submit comment.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Masthead */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-amber-800 font-semibold">
            {settings.schoolShortName} Senior High School · Official Press
          </p>
          <h1 className="text-3xl font-bold text-[#111622] font-crest mt-0.5 leading-tight">
            The OLAG Gazette &amp; Bulletins
          </h1>
          <p className="text-sm text-stone-600 font-serif-literary mt-1">
            Official school notices, academic news, inter-house fixtures, and moderated student journalism.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setFormSuccess('');
            setIsPublishModalOpen(true);
          }}
          className="px-4 py-2.5 bg-[#111622] hover:bg-[#1E273B] text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isEditor ? 'Publish Official Bulletin' : 'Submit Student Article'}</span>
        </button>
      </div>

      {/* Lead Broadsheet Hero */}
      {!searchQuery && selectedCategory === 'All' && featuredStory && (
        <article
          onClick={() => {
            setReadingProgress(0);
            setConfirmDeleteArticleId(null);
            setActiveArticle(featuredStory);
          }}
          className="relative rounded-2xl overflow-hidden bg-[#111622] text-white shadow-lg cursor-pointer group border border-stone-800"
        >
          <img
            src={featuredStory.imageUrl || EDITORIAL_VISUALS.editorialDesk}
            alt=""
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-42 transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E17]/95 via-[#0B0E17]/75 to-[#0B0E17]/35" />

          <div className="relative p-6 sm:p-10 space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-amber-300">
              {featuredStory.isOfficial ? (
                <span className="inline-flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Official Gazette
                </span>
              ) : (
                <span className="font-semibold">Student Dispatch</span>
              )}
              {featuredStory.isPinned && (
                <>
                  <span className="text-stone-500">·</span>
                  <span className="inline-flex items-center gap-1 text-stone-200">
                    <Pin className="w-3 h-3 text-amber-400" /> Pinned
                  </span>
                </>
              )}
              <span className="text-stone-500">·</span>
              <span className="text-stone-300 tabular-nums">
                {new Date(featuredStory.publishedAt).toLocaleDateString([], {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-crest tracking-tight text-white group-hover:text-amber-300 transition-colors leading-tight">
              {featuredStory.title}
            </h2>
            <p className="text-sm text-stone-200 line-clamp-2 font-serif-literary leading-relaxed">
              {featuredStory.excerpt}
            </p>

            <div className="flex items-center gap-4 pt-2 text-xs text-stone-300">
              <div className="flex items-center gap-2">
                <img
                  src={generateInitialsAvatar(featuredStory.authorDisplayName)}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-white/25"
                />
                <span className="font-semibold text-white">{featuredStory.authorDisplayName}</span>
              </div>
              <span className="text-stone-500">·</span>
              <span className="flex items-center gap-1.5 font-mono tabular-nums">
                <ThumbsUp className="w-3.5 h-3.5 text-amber-400" />
                {getLikeCount('news', featuredStory.id, featuredStory.likesCount)}
              </span>
            </div>
          </div>
        </article>
      )}

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bulletins, headlines, or contributors..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-200 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none bg-[#FAF8F3]/60"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-stone-500 flex items-center gap-1 font-mono uppercase">
              <Filter className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'most_liked')}
              className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-[#FAF8F3] text-[#111622] font-medium"
            >
              <option value="newest">Newest Publications</option>
              <option value="most_liked">Most Supported</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#111622] text-amber-300'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <p className="text-base font-bold font-crest text-[#111622]">
            {news.length === 0 ? 'No Gazette articles published yet' : 'No articles match your filter'}
          </p>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Students and club correspondents can submit campus reports to the editorial queue without signing in.
          </p>
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="px-4 py-2 bg-[#111622] hover:bg-[#1E273B] text-amber-300 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Submit Article
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const liked = hasSessionLiked('news', item.id);
            const likeTotal = getLikeCount('news', item.id, item.likesCount);
            const commentsCount = getApprovedComments('news', item.id).length;

            return (
              <article
                key={item.id}
                onClick={() => {
                  setReadingProgress(0);
                  setConfirmDeleteArticleId(null);
                  setActiveArticle(item);
                }}
                className={`rounded-xl border transition-colors cursor-pointer flex flex-col justify-between overflow-hidden group ${
                  item.isOfficial
                    ? 'bg-white border-amber-500/40 hover:border-amber-600'
                    : 'bg-white border-stone-200 hover:border-stone-400'
                }`}
              >
                <div>
                  {item.imageUrl && (
                    <div className="h-44 w-full overflow-hidden bg-stone-100">
                      <img
                        src={item.imageUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.12em] text-stone-500 mb-2">
                      <span className="truncate font-semibold text-amber-800">
                        {item.category}
                        {item.isOfficial ? ' · Official' : ''}
                        {item.isPinned ? ' · Pinned' : ''}
                      </span>
                      <span className="shrink-0 tabular-nums ml-2">
                        {new Date(item.publishedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-crest font-bold text-[#111622] text-xl leading-snug group-hover:text-amber-800 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-stone-600 line-clamp-3 mt-2 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <img
                      src={generateInitialsAvatar(item.authorDisplayName)}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                    <span className="font-semibold text-stone-700 truncate">
                      {item.authorDisplayName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleLike(item.id);
                      }}
                      className={`flex items-center gap-1 text-xs cursor-pointer ${
                        liked ? 'text-amber-700 font-bold' : 'hover:text-[#111622]'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${liked ? 'fill-amber-700' : ''}`} />
                      <span>{likeTotal}</span>
                    </button>
                    <span className="flex items-center gap-1 text-xs">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{Math.max(commentsCount, item.commentsCount)}</span>
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ARTICLE READER MODAL */}
      {activeArticle && (
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
              <div className="text-[11px] font-mono font-semibold text-stone-600 uppercase tracking-[0.14em] truncate">
                {activeArticle.category}
                {activeArticle.isOfficial ? ' · Official Notice' : ''}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopyShareLink(activeArticle.id)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedId === activeArticle.id ? 'Copied Link' : 'Share'}</span>
                </button>
                <button
                  onClick={() => {
                    setActiveArticle(null);
                    setConfirmDeleteArticleId(null);
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
              className="overflow-y-auto p-6 sm:p-10 space-y-6 flex-1"
            >
              {activeArticle.imageUrl && (
                <div className="rounded-xl overflow-hidden aspect-video w-full max-h-72 border border-stone-200">
                  <img
                    src={activeArticle.imageUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#111622] font-crest leading-tight">
                  {activeArticle.title}
                </h1>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 mt-4 pb-4 border-b border-stone-200">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={generateInitialsAvatar(activeArticle.authorDisplayName)}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-[#111622]">
                        {activeArticle.authorDisplayName}
                        {activeArticle.authorClass ? ` (${activeArticle.authorClass})` : ''}
                      </p>
                      <p className="text-[11px] text-stone-400 font-mono tabular-nums">
                        Published on {new Date(activeArticle.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {isEditor && adminRecord && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          void wdsService.updateNewsArticle(
                            activeArticle.id,
                            { isPinned: !activeArticle.isPinned },
                            adminRecord
                          )
                        }
                        className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer ${
                          activeArticle.isPinned
                            ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                        <span>{activeArticle.isPinned ? 'Unpin' : 'Pin'}</span>
                      </button>

                      {confirmDeleteArticleId === activeArticle.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              void wdsService.deleteNewsArticle(activeArticle.id, adminRecord);
                              setActiveArticle(null);
                              setConfirmDeleteArticleId(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteArticleId(null)}
                            className="px-2 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-600 text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteArticleId(activeArticle.id)}
                          className="p-1.5 rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 cursor-pointer text-xs"
                          title="Delete article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="editorial-dropcap font-serif-literary text-base sm:text-lg text-stone-800 leading-[1.8] whitespace-pre-line">
                {activeArticle.content}
              </div>

              {/* Support Bar */}
              <div className="py-4 border-y border-stone-200 flex items-center justify-between">
                <button
                  onClick={() => void handleLike(activeArticle.id)}
                  disabled={hasSessionLiked('news', activeArticle.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors tabular-nums ${
                    hasSessionLiked('news', activeArticle.id)
                      ? 'bg-[#111622] text-amber-300'
                      : 'bg-white border border-stone-200 text-[#111622] hover:bg-stone-100'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>
                    {hasSessionLiked('news', activeArticle.id) ? 'Supported' : 'Support Bulletin'} (
                    {getLikeCount('news', activeArticle.id, activeArticle.likesCount)})
                  </span>
                </button>
                <span className="text-[11px] text-stone-500 font-mono">
                  One support vote per session
                </span>
              </div>

              {/* Moderated Comments */}
              <div className="space-y-4">
                <h3 className="font-crest font-bold text-[#111622] text-lg">
                  Community Reflections
                </h3>

                {commentError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{commentError}</span>
                  </div>
                )}
                {commentFeedback && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{commentFeedback}</span>
                  </div>
                )}

                <form
                  onSubmit={handleSubmitComment}
                  className="space-y-3 bg-white p-4 rounded-xl border border-stone-200"
                >
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      value={isEditor && adminRecord ? adminRecord.displayName : commenterName}
                      onChange={(e) => setCommenterName(e.target.value)}
                      disabled={Boolean(isEditor && adminRecord)}
                      placeholder="Your Name *"
                      className="sm:w-44 px-3 py-2 rounded-lg border border-stone-200 bg-[#FAF8F3] text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a constructive reflection (moderated before appearing)..."
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-200 bg-[#FAF8F3] text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                    />
                  </div>
                  <HumanVerification
                    onVerifyChange={setCommentHumanVerified}
                    honeypotValue={commentHoneypot}
                    onHoneypotChange={setCommentHoneypot}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={commentSubmitting || !commentHumanVerified}
                      className="px-4 py-2 bg-[#111622] hover:bg-[#1E273B] disabled:opacity-50 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{commentSubmitting ? 'Sending...' : 'Submit Comment for Review'}</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-2.5 pt-2">
                  {getApprovedComments('news', activeArticle.id).map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-white border border-stone-200 flex gap-3 text-xs"
                    >
                      <img
                        src={generateInitialsAvatar(c.displayName)}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#111622]">{c.displayName}</span>
                          <span className="text-[10px] text-stone-400 font-mono tabular-nums">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-stone-600 mt-1 leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH / SUBMIT ARTICLE MODAL */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0D14]/75 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-[#111622] text-white shrink-0">
              <h3 className="font-crest font-bold text-lg">
                {isEditor ? 'Publish Official School Bulletin' : 'Submit Student Article for Moderation'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitArticle} className="p-6 space-y-4 overflow-y-auto flex-1">
              {!isEditor && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    No login required. Submitted articles are placed in the WDS Moderation Queue before appearing publicly.
                  </span>
                </div>
              )}

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#FAF8F3] border border-stone-200 space-y-2">
                {!isEditor && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-700">Author Details</span>
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
                )}

                {(!isAnonymous || isEditor) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Author Display Name *
                      </label>
                      <input
                        type="text"
                        required={!isAnonymous}
                        value={authorNameInput}
                        onChange={(e) => setAuthorNameInput(e.target.value)}
                        placeholder="Enter author display name"
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        OLAG Class / Office
                      </label>
                      <select
                        value={authorClassInput}
                        onChange={(e) => setAuthorClassInput(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                      >
                        {OLAG_CLASSES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Headline *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter your headline"
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as NewsCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Cover Photo (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-stone-300 bg-[#FAF8F3] hover:bg-stone-100 text-xs font-semibold text-stone-700 cursor-pointer shrink-0">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{newCoverFile ? newCoverFile.name : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleSelectImage}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      value={newCoverUrl}
                      onChange={(e) => setNewCoverUrl(e.target.value)}
                      placeholder="Or paste https:// URL"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Brief Summary Excerpt *
                </label>
                <input
                  type="text"
                  required
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  placeholder="Concise overview (minimum 10 characters)"
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Article Content *
                </label>
                <textarea
                  required
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write full text (minimum 20 characters)..."
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-amber-600 focus:outline-none leading-relaxed font-serif-literary"
                />
              </div>

              {isEditor ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5 text-xs">
                  <p className="font-bold text-amber-950">Editorial Controls:</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-900">
                      <input
                        type="checkbox"
                        checked={newIsOfficial}
                        onChange={(e) => setNewIsOfficial(e.target.checked)}
                        className="rounded border-amber-300 text-amber-700"
                      />
                      <span>Official School Notice</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-900">
                      <input
                        type="checkbox"
                        checked={newIsPinned}
                        onChange={(e) => setNewIsPinned(e.target.checked)}
                        className="rounded border-amber-300 text-amber-700"
                      />
                      <span>Pin to Top</span>
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) =>
                        setNewPriority(e.target.value as 'normal' | 'important' | 'urgent')
                      }
                      className="rounded-lg border border-amber-300 bg-white px-2 py-1 text-xs"
                    >
                      <option value="normal">Normal Priority</option>
                      <option value="important">Important</option>
                      <option value="urgent">Urgent Alert</option>
                    </select>
                    <select
                      value={newStatus}
                      onChange={(e) =>
                        setNewStatus(e.target.value as 'published' | 'draft' | 'scheduled')
                      }
                      className="rounded-lg border border-amber-300 bg-white px-2 py-1 text-xs"
                    >
                      <option value="published">Publish Now</option>
                      <option value="draft">Save as Draft</option>
                      <option value="scheduled">Schedule Date</option>
                    </select>
                  </div>
                  {newStatus === 'scheduled' && (
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs"
                    />
                  )}
                </div>
              ) : (
                <HumanVerification
                  onVerifyChange={setHumanVerified}
                  honeypotValue={honeypot}
                  onHoneypotChange={setHoneypot}
                />
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting || (!isEditor && !humanVerified)}
                  className="px-5 py-2 bg-[#111622] hover:bg-[#1E273B] disabled:opacity-50 text-amber-300 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  {submitting
                    ? 'Saving...'
                    : isEditor
                    ? 'Save Official Bulletin'
                    : 'Submit for Moderation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
