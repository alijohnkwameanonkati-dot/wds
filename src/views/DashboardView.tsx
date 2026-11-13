import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWdsData } from '../context/WdsDataContext';
import { generateInitialsAvatar } from '../utils/validation';
import { EDITORIAL_VISUALS } from '../assets/editorialVisuals';
import {
  BookOpen,
  Trophy,
  ArrowRight,
  Pin,
  Clock,
  ThumbsUp,
  ChevronRight,
  Send,
  Calendar,
  ShieldCheck,
  PenLine,
  MessageSquare,
  Bell,
} from 'lucide-react';
import { NewsArticle, WritingPublication } from '../types';

interface DashboardViewProps {
  onNavigate: (tab: string, targetId?: string) => void;
  onOpenArticle: (article: NewsArticle) => void;
  onOpenWriting: (writing: WritingPublication) => void;
  onOpenVisitorPrefs: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenArticle,
  onOpenWriting,
  onOpenVisitorPrefs,
}) => {
  const { visitorPrefs, isAdmin, adminRecord } = useAuth();
  const {
    settings,
    news,
    debates,
    debateArguments,
    writings,
    documents,
    events,
    announcements,
    liveWeeklyRankings,
    getLikeCount,
  } = useWdsData();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const activeDebate = debates.find((d) => d.status === 'active') || debates[0];
  const officialNews = news.filter((n) => n.isOfficial || n.isPinned).slice(0, 2);
  const recentArticles = news.slice(0, 4);
  const featuredWriting = writings.find((w) => w.featured) || writings[0];

  const activeArgs = activeDebate
    ? debateArguments.filter((a) => a.debateId === activeDebate.id)
    : [];
  const proArgCount = activeDebate
    ? Math.max(activeDebate.proCount, activeArgs.filter((a) => a.side === 'FOR').length)
    : 0;
  const conArgCount = activeDebate
    ? Math.max(activeDebate.conCount, activeArgs.filter((a) => a.side === 'AGAINST').length)
    : 0;
  const totalStances = proArgCount + conArgCount;
  const proPercent = totalStances > 0 ? Math.round((proArgCount / totalStances) * 100) : 50;
  const conPercent = totalStances > 0 ? 100 - proPercent : 50;

  return (
    <div className="space-y-7 pb-12">
      {/* Archival Campus Library Hero Masthead */}
      <section className="rounded-2xl bg-[#111622] text-white border border-stone-800 relative overflow-hidden shadow-lg">
        <img
          src={EDITORIAL_VISUALS.libraryHero}
          alt="Our Lady of Grace Senior High School library reading hall"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E17]/95 via-[#0B0E17]/82 to-[#0B0E17]/60" />

        <div className="relative z-10 p-6 sm:p-9 space-y-7">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-amber-300/95">
                {settings.schoolName} ({settings.schoolShortName}) · {settings.currentTerm}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-crest leading-[1.1]">
                {greeting},{' '}
                {isAdmin && adminRecord
                  ? adminRecord.displayName
                  : visitorPrefs.displayName || 'OLAG Scholar'}
              </h1>
              <p className="text-sm sm:text-base text-stone-200/95 font-serif-literary leading-relaxed">
                Official digital press &amp; forensics house of the {settings.societyName}. Follow{' '}
                {settings.debateCycleDays}-day parliamentary motions, contribute poetry and prose to the Writers&apos; Corner, or submit academic briefs without signing in.
              </p>
            </div>

            {isAdmin && adminRecord ? (
              <button
                onClick={() => onNavigate('admin')}
                className="flex items-center gap-3.5 bg-[#0D111A]/90 hover:bg-[#171E2E] px-5 py-3.5 rounded-xl border border-amber-500/40 shrink-0 cursor-pointer transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-[0.14em] block">
                    {adminRecord.role.replace('_', ' ')}
                  </span>
                  <p className="text-sm font-semibold text-white">{adminRecord.displayName}</p>
                  <p className="text-[11px] text-stone-400">Open Moderation &amp; Admin Desk →</p>
                </div>
              </button>
            ) : (
              <button
                onClick={onOpenVisitorPrefs}
                className="flex items-center gap-3.5 bg-[#0D111A]/90 hover:bg-[#171E2E] px-5 py-3.5 rounded-xl border border-amber-500/40 shrink-0 cursor-pointer transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <PenLine className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-[0.14em] block">
                    Open Contribution Mode
                  </span>
                  <p className="text-sm font-semibold text-white">
                    {visitorPrefs.displayName || 'Set Optional Byline'}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {visitorPrefs.authorClass || 'No student account or login needed'}
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* 4 Institutional Press Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-white/15">
            <div className="bg-[#0B0E17]/75 rounded-lg p-3.5 border border-white/10">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.14em] block">
                Active Motion
              </span>
              <span className="text-sm font-semibold text-amber-300 truncate block mt-1">
                {activeDebate ? activeDebate.topic : 'Awaiting Next Motion'}
              </span>
            </div>
            <div className="bg-[#0B0E17]/75 rounded-lg p-3.5 border border-white/10">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.14em] block">
                Floor Arguments
              </span>
              <span className="text-2xl font-bold text-white font-mono tabular-nums mt-0.5 block">
                {totalStances}
              </span>
            </div>
            <div className="bg-[#0B0E17]/75 rounded-lg p-3.5 border border-white/10">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.14em] block">
                Literary Folios
              </span>
              <span className="text-2xl font-bold text-stone-100 font-mono tabular-nums mt-0.5 block">
                {writings.length}
              </span>
            </div>
            <div className="bg-[#0B0E17]/75 rounded-lg p-3.5 border border-white/10">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.14em] block">
                Approved Briefs
              </span>
              <span className="text-2xl font-bold text-stone-100 font-mono tabular-nums mt-0.5 block">
                {documents.length}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Priority Campus Announcement */}
      {announcements.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-300/70 rounded-xl p-4 sm:p-5 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[#111622] text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-amber-900">
              {announcements[0].priority} announcement ·{' '}
              {new Date(announcements[0].publishedAt).toLocaleDateString()}
            </p>
            <h3 className="font-crest font-bold text-lg text-[#111622] mt-0.5 leading-snug">
              {announcements[0].title}
            </h3>
            <p className="text-xs text-stone-700 mt-1 leading-relaxed">
              {announcements[0].message}
            </p>
          </div>
        </div>
      )}

      {/* Official OLAG & WDS Gazettes */}
      {officialNews.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-amber-700" />
              <h2 className="text-xs font-mono font-semibold text-stone-700 uppercase tracking-[0.15em]">
                Official OLAG &amp; WDS Gazettes
              </h2>
            </div>
            <button
              onClick={() => onNavigate('news')}
              className="text-xs text-amber-800 hover:text-[#111622] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              All Bulletins <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {officialNews.map((item) => (
              <article
                key={item.id}
                onClick={() => onOpenArticle(item)}
                className="bg-white rounded-xl border border-stone-200 p-5 hover:border-amber-600/45 transition-colors cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.12em] text-stone-500 mb-2">
                    <span className="text-amber-800 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Official Gazette
                    </span>
                    <span className="tabular-nums">
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-crest font-bold text-[#111622] text-xl leading-snug group-hover:text-amber-800 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                    {item.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                    <img
                      src={generateInitialsAvatar(item.authorDisplayName)}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="font-medium text-stone-700">{item.authorDisplayName}</span>
                  </div>
                  <span className="text-amber-800 font-semibold inline-flex items-center gap-1">
                    Read Bulletin <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Main Two-Column Broadsheet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Active Parliamentary Motion + Gazette */}
        <div className="lg:col-span-2 space-y-6">
          {activeDebate ? (
            <section className="bg-white rounded-xl border border-stone-200 p-6 hover:border-stone-300 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-mono font-semibold text-amber-800 uppercase tracking-[0.14em] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {activeDebate.status === 'active'
                    ? `Live ${settings.debateCycleDays}-Day Parliamentary Motion`
                    : 'Recent Debate Motion'}
                </span>
                <span className="text-xs text-stone-500 flex items-center gap-1.5 font-mono tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  Closes {new Date(activeDebate.closingDate).toLocaleDateString()}
                </span>
              </div>

              <h2
                onClick={() => onNavigate('debates', activeDebate.id)}
                className="text-2xl font-bold font-crest text-[#111622] hover:text-amber-800 cursor-pointer transition-colors leading-tight"
              >
                {activeDebate.topic}
              </h2>
              <p className="text-sm text-stone-600 mt-2 line-clamp-3 leading-relaxed">
                {activeDebate.description}
              </p>

              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-800 tabular-nums">
                    FOR: {activeDebate.proLabel} ({proPercent}%)
                  </span>
                  <span className="text-amber-800 tabular-nums">
                    AGAINST: {activeDebate.conLabel} ({conPercent}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-stone-200 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${proPercent}%` }}
                    className="bg-emerald-700 transition-all duration-300"
                  />
                  <div
                    style={{ width: `${conPercent}%` }}
                    className="bg-amber-600 transition-all duration-300"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-stone-500 font-mono tabular-nums">
                  <span>{proArgCount} FOR Briefs</span>
                  <span>{totalStances} Total Approved</span>
                  <span>{conArgCount} AGAINST Briefs</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-100">
                <p className="text-xs text-stone-500 font-serif-literary italic">
                  Motion presided by{' '}
                  <span className="font-semibold text-[#111622] not-italic">
                    {activeDebate.createdByName}
                  </span>
                </p>
                <button
                  onClick={() => onNavigate('debates', activeDebate.id)}
                  className="px-4 py-2 bg-[#111622] hover:bg-[#1E273B] text-amber-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Enter Debators Arena
                </button>
              </div>
            </section>
          ) : (
            <section className="bg-white rounded-xl border border-stone-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-semibold text-amber-800 uppercase tracking-[0.14em] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Debators Arena
                </span>
                <span className="text-xs text-stone-400 font-mono tabular-nums">
                  Cycle: {settings.debateCycleDays} Days
                </span>
              </div>
              <p className="text-lg font-bold font-crest text-[#111622]">
                No debate motion open yet
              </p>
              <p className="text-sm text-stone-600 mt-1 font-serif-literary">
                Authorized WDS Editors and Super Admins schedule new parliamentary motions on a{' '}
                {settings.debateCycleDays}-day cycle.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => onNavigate('debates')}
                  className="px-4 py-2 bg-[#111622] hover:bg-[#1E273B] text-amber-300 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
                >
                  Visit Debators Arena <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>
          )}

          {/* Gazette Recent Publications */}
          <section className="bg-white rounded-xl border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-xl font-bold font-crest text-[#111622]">
                  OLAG Gazette Publications
                </h2>
                <p className="text-xs text-stone-500">
                  Official directives, academic dispatches, and approved student journalism
                </p>
              </div>
              <button
                onClick={() => onNavigate('news')}
                className="text-xs text-amber-800 hover:text-[#111622] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
              >
                Gazette Archive <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentArticles.length === 0 ? (
              <div className="p-8 rounded-lg border border-dashed border-stone-200 text-center space-y-3">
                <p className="text-xs text-stone-500">
                  No published gazette articles yet. Submit news for editorial review in the OLAG Gazette.
                </p>
                <button
                  onClick={() => onNavigate('news')}
                  className="px-4 py-2 bg-[#111622] text-amber-300 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Go to Gazette
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {recentArticles.map((article) => (
                  <article
                    key={article.id}
                    onClick={() => onOpenArticle(article)}
                    className="py-4 first:pt-1 last:pb-1 hover:bg-[#FAF8F3] -mx-2 px-2 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {article.imageUrl && (
                        <img
                          src={article.imageUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full sm:w-32 h-24 object-cover rounded-lg border border-stone-200 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-[0.12em] text-stone-500 mb-1">
                          <span className="truncate">
                            {article.category}
                            {article.isOfficial ? ' · Official' : ''}
                          </span>
                          <span className="shrink-0 tabular-nums">
                            {new Date(article.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-crest font-bold text-[#111622] text-lg leading-snug group-hover:text-amber-800 transition-colors line-clamp-1">
                          {article.title}
                        </h3>
                        <p className="text-xs text-stone-600 line-clamp-2 mt-1 leading-relaxed">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-500 font-mono">
                          <span>By {article.authorDisplayName}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1 tabular-nums">
                            <ThumbsUp className="w-3 h-3 text-stone-400" />
                            {getLikeCount('news', article.id, article.likesCount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Rail: Literary Highlight, Weekly Standings, Calendar */}
        <div className="space-y-6">
          {featuredWriting ? (
            <section className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="aspect-[16/9] w-full overflow-hidden bg-stone-900 relative">
                <img
                  src={featuredWriting.imageUrl || EDITORIAL_VISUALS.literaryPress}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-amber-800 mb-2">
                  <span className="flex items-center gap-1 font-semibold">
                    <BookOpen className="w-3.5 h-3.5" /> Literary Spotlight
                  </span>
                  <span className="text-stone-500">
                    {featuredWriting.writingType.replace('_', ' ')}
                  </span>
                </div>

                <h3
                  onClick={() => onOpenWriting(featuredWriting)}
                  className="font-serif-literary text-xl font-bold text-[#111622] hover:text-amber-800 transition-colors cursor-pointer leading-snug"
                >
                  "{featuredWriting.title}"
                </h3>
                {featuredWriting.subtitle && (
                  <p className="text-xs text-stone-500 italic mt-0.5 font-serif-literary">
                    {featuredWriting.subtitle}
                  </p>
                )}

                <p className="text-sm font-serif-literary text-stone-700 line-clamp-3 mt-3 bg-[#FAF8F3] p-3.5 rounded-lg border border-stone-200/80 italic leading-relaxed">
                  {featuredWriting.content.slice(0, 160)}...
                </p>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={generateInitialsAvatar(featuredWriting.authorDisplayName)}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#111622] truncate">
                        {featuredWriting.authorDisplayName}
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono truncate">
                        {featuredWriting.authorClass || 'OLAG Writer'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenWriting(featuredWriting)}
                    className="text-xs font-semibold text-amber-800 hover:text-[#111622] flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    Read <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 uppercase tracking-[0.14em] font-mono">
                  <BookOpen className="w-3.5 h-3.5" /> Literary Spotlight
                </span>
                <button
                  onClick={() => onNavigate('writters')}
                  className="text-xs text-stone-700 hover:text-[#111622] font-semibold cursor-pointer"
                >
                  Writers&apos; Corner →
                </button>
              </div>
              <p className="text-sm text-stone-600 font-serif-literary">
                Submit original poems, short stories, essays, or reflections to the Writers&apos; Corner editorial queue.
              </p>
            </section>
          )}

          {/* Weekly Standings */}
          <section className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-700" />
                <h3 className="text-base font-bold font-crest text-[#111622]">
                  Weekly Popular Works
                </h3>
              </div>
              <button
                onClick={() => onNavigate('leaderboard')}
                className="text-xs text-amber-800 hover:text-[#111622] font-semibold cursor-pointer"
              >
                Full Board
              </button>
            </div>

            <p className="text-[11px] text-stone-500 mb-3">
              Ranked by approved contributions and peer endorsements this week.
            </p>

            {liveWeeklyRankings.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-stone-200 text-center text-xs text-stone-400">
                Rankings update as approved works earn reader support.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {liveWeeklyRankings.slice(0, 4).map((entry) => (
                  <div
                    key={entry.contributionId}
                    className={`flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg transition-colors ${
                      entry.rank === 1 ? 'bg-amber-50/60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-mono tabular-nums shrink-0 ${
                          entry.rank === 1
                            ? 'bg-[#111622] text-amber-300'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {entry.rank}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#111622] truncate">
                          {entry.title}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {entry.authorDisplayName} · {entry.authorClass}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#111622] font-mono tabular-nums shrink-0 ml-2">
                      {entry.score} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Assembly & Meets */}
          <section className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-700" />
                <h3 className="text-base font-bold font-crest text-[#111622]">
                  Assembly &amp; Meets
                </h3>
              </div>
              <button
                onClick={() => onNavigate('events')}
                className="text-xs text-amber-800 hover:text-[#111622] font-semibold cursor-pointer"
              >
                Calendar
              </button>
            </div>

            {events.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-stone-200 text-center text-xs text-stone-400">
                No upcoming society assemblies or debate meets scheduled.
              </div>
            ) : (
              <div className="space-y-2.5">
                {events.slice(0, 3).map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => onNavigate('events')}
                    className="p-2.5 rounded-lg border border-stone-200/80 hover:bg-[#FAF8F3] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#111622] text-amber-300 flex flex-col items-center justify-center shrink-0 font-mono text-[10px] font-bold tabular-nums">
                        <span className="uppercase">
                          {new Date(evt.date).toLocaleDateString([], { month: 'short' })}
                        </span>
                        <span className="text-xs leading-none">{new Date(evt.date).getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#111622] truncate group-hover:text-amber-800">
                          {evt.title}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate mt-0.5">
                          {evt.time} · {evt.location}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
