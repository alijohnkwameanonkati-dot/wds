import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWdsData } from '../context/WdsDataContext';
import { generateInitialsAvatar } from '../utils/validation';
import {
  BookOpen,
  Trophy,
  ArrowRight,
  Pin,
  Clock,
  ThumbsUp,
  Award,
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
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Academic Masthead */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-300 text-xs font-mono font-medium">
              <span>
                {settings.schoolName} ({settings.schoolShortName})
              </span>
              <span>•</span>
              <span>{settings.currentTerm}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-crest">
              {greeting},{' '}
              {isAdmin && adminRecord
                ? adminRecord.displayName
                : visitorPrefs.displayName || 'OLAG Scholar'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-serif-literary leading-relaxed">
              Official digital hub of the {settings.societyName}. Follow scheduled{' '}
              {settings.debateCycleDays}-day debate motions, contribute poetry and prose to the Writers' Corner, or upload academic briefs without an account.
            </p>
          </div>

          {isAdmin && adminRecord ? (
            <button
              onClick={() => onNavigate('admin')}
              className="flex items-center gap-3.5 bg-slate-950/70 hover:bg-slate-950 px-5 py-3.5 rounded-2xl border border-amber-500/40 shrink-0 cursor-pointer transition-colors text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-400 font-mono uppercase">
                  {adminRecord.role.replace('_', ' ')}
                </p>
                <p className="text-sm font-bold text-white">{adminRecord.displayName}</p>
                <p className="text-[10px] text-slate-400">Open Admin Dashboard →</p>
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenVisitorPrefs}
              className="flex items-center gap-3.5 bg-slate-950/70 hover:bg-slate-950 px-5 py-3.5 rounded-2xl border border-amber-500/40 shrink-0 cursor-pointer transition-colors text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <PenLine className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-400 font-mono">Open Contribution Mode</p>
                <p className="text-sm font-bold text-white">
                  {visitorPrefs.displayName || 'Set Optional Byline'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {visitorPrefs.authorClass || 'No student account or login needed'}
                </p>
              </div>
            </button>
          )}
        </div>

        {/* 4 Highlight Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800 text-center">
          <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Active Motion</span>
            <span className="text-sm font-bold text-amber-400 truncate block mt-0.5">
              {activeDebate ? activeDebate.topic : 'Awaiting Next Motion'}
            </span>
          </div>
          <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Floor Arguments</span>
            <span className="text-xl font-bold text-white font-mono">{totalStances}</span>
          </div>
          <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Literary Works</span>
            <span className="text-xl font-bold text-slate-200 font-mono">{writings.length}</span>
          </div>
          <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Approved Briefs</span>
            <span className="text-xl font-bold text-slate-200 font-mono">{documents.length}</span>
          </div>
        </div>
      </div>

      {/* Live Announcements Strip */}
      {announcements.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-200/80 text-amber-950">
                  {announcements[0].priority} announcement
                </span>
                <span className="text-[11px] text-amber-800 font-mono">
                  {new Date(announcements[0].publishedAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 mt-1">{announcements[0].title}</h3>
              <p className="text-xs text-slate-700 mt-0.5">{announcements[0].message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Official School Announcements Banner */}
      {officialNews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Official OLAG &amp; WDS Gazettes
              </h2>
            </div>
            <button
              onClick={() => onNavigate('news')}
              className="text-xs text-slate-700 hover:text-slate-950 font-semibold flex items-center gap-1 cursor-pointer"
            >
              All Bulletins <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {officialNews.map((item) => (
              <div
                key={item.id}
                onClick={() => onOpenArticle(item)}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                      <ShieldCheck className="w-3 h-3" /> Official Gazette
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-800 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{item.excerpt}</p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <img
                      src={generateInitialsAvatar(item.authorDisplayName)}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="font-medium text-slate-700">{item.authorDisplayName}</span>
                  </div>
                  <span className="text-amber-800 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Read Bulletin <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-Column Core Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Active Debate + Gazette */}
        <div className="lg:col-span-2 space-y-6">
          {activeDebate ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    {activeDebate.status === 'active' && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        activeDebate.status === 'active' ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                    />
                  </span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                    {activeDebate.status === 'active'
                      ? `Active ${settings.debateCycleDays}-Day Debate Motion`
                      : 'Recent Debate Motion'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Closes {new Date(activeDebate.closingDate).toLocaleDateString()}
                </span>
              </div>

              <h2
                onClick={() => onNavigate('debates', activeDebate.id)}
                className="text-lg sm:text-xl font-bold text-slate-900 hover:text-amber-800 cursor-pointer transition-colors"
              >
                {activeDebate.topic}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                {activeDebate.description}
              </p>

              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">
                    FOR: {activeDebate.proLabel} ({proPercent}%)
                  </span>
                  <span className="text-slate-600">
                    AGAINST: {activeDebate.conLabel} ({conPercent}%)
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${proPercent}%` }}
                    className="bg-slate-900 transition-all duration-500 rounded-l-full"
                  />
                  <div
                    style={{ width: `${conPercent}%` }}
                    className="bg-amber-600 transition-all duration-500 rounded-r-full"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{proArgCount} FOR Arguments</span>
                  <span>{totalStances} Total Approved Arguments</span>
                  <span>{conArgCount} AGAINST Arguments</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500 font-serif-literary">
                  Motion presided by{' '}
                  <span className="font-semibold text-slate-800">
                    {activeDebate.createdByName}
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('debates', activeDebate.id)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Enter Debators Arena
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-600" /> Debators Arena
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Cycle: {settings.debateCycleDays} Days
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">No debate motion open yet</p>
              <p className="text-xs text-slate-500 mt-1 font-serif-literary">
                Authorized WDS Editors and Super Admins schedule new parliamentary motions on a {settings.debateCycleDays}-day cycle.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => onNavigate('debates')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
                >
                  Visit Debators Arena <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Gazette Publications */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">OLAG Gazette Publications</h2>
                <p className="text-xs text-slate-500">
                  Official notices, academic news, club reports, and approved student journalism
                </p>
              </div>
              <button
                onClick={() => onNavigate('news')}
                className="text-xs text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Gazette Archive <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentArticles.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
                <p className="text-xs text-slate-500">
                  No published gazette articles yet. Submit news for editorial review in the OLAG Gazette.
                </p>
                <button
                  onClick={() => onNavigate('news')}
                  className="px-3.5 py-1.5 bg-slate-900 text-amber-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Go to Gazette
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentArticles.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => onOpenArticle(article)}
                    className="py-4 first:pt-0 last:pb-0 hover:bg-slate-50/70 rounded-xl p-2 transition-colors cursor-pointer group"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {article.imageUrl && (
                        <img
                          src={article.imageUrl}
                          alt=""
                          className="w-full sm:w-32 h-24 object-cover rounded-xl shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase tracking-wider font-mono">
                            {article.category}
                          </span>
                          {article.isOfficial && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                              Official
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 ml-auto font-mono">
                            {new Date(article.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-amber-800 transition-colors line-clamp-1">
                          {article.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{article.excerpt}</p>
                        <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
                          <span>By {article.authorDisplayName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3 text-slate-400" />{' '}
                            {getLikeCount('news', article.id, article.likesCount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Featured Literary Work, Top Rankings, Upcoming Events */}
        <div className="space-y-6">
          {featuredWriting ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 uppercase tracking-wider font-mono">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" /> Literary Highlight
                </span>
                <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono uppercase">
                  {featuredWriting.writingType.replace('_', ' ')}
                </span>
              </div>

              {featuredWriting.imageUrl && (
                <div className="mb-3 rounded-xl overflow-hidden aspect-video">
                  <img
                    src={featuredWriting.imageUrl}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}

              <h3
                onClick={() => onOpenWriting(featuredWriting)}
                className="font-serif-literary text-lg font-bold text-slate-900 hover:text-amber-800 transition-colors cursor-pointer"
              >
                "{featuredWriting.title}"
              </h3>
              {featuredWriting.subtitle && (
                <p className="text-xs text-slate-500 italic mt-0.5 font-serif-literary">
                  {featuredWriting.subtitle}
                </p>
              )}

              <p className="text-xs font-serif-literary text-slate-700 line-clamp-3 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 italic leading-relaxed">
                {featuredWriting.content.slice(0, 160)}...
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={generateInitialsAvatar(featuredWriting.authorDisplayName)}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {featuredWriting.authorDisplayName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {featuredWriting.authorClass || 'OLAG Writer'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onOpenWriting(featuredWriting)}
                  className="text-xs font-bold text-slate-900 hover:text-amber-700 flex items-center gap-1 cursor-pointer font-serif-literary"
                >
                  Read Work <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 uppercase tracking-wider font-mono">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" /> Literary Highlight
                </span>
                <button
                  onClick={() => onNavigate('writters')}
                  className="text-xs text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Writers' Corner
                </button>
              </div>
              <p className="text-xs text-slate-500 font-serif-literary">
                Submit original poems, short stories, essays, or reflections to the Writers' Corner editorial queue.
              </p>
            </div>
          )}

          {/* Top Contributions Standings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Weekly Popular Works</h3>
              </div>
              <button
                onClick={() => onNavigate('leaderboard')}
                className="text-xs text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
              >
                Full Board
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mb-3 font-serif-literary">
              Ranked by approved contributions and peer endorsements this week.
            </p>

            {liveWeeklyRankings.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Rankings update as approved contributions receive reader endorsements.
              </div>
            ) : (
              <div className="space-y-2.5">
                {liveWeeklyRankings.slice(0, 4).map((entry) => (
                  <div
                    key={entry.contributionId}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                      entry.rank === 1
                        ? 'bg-amber-50/60 border-amber-300'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                          entry.rank === 1
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {entry.rank}
                      </span>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {entry.title}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {entry.authorDisplayName} • {entry.authorClass}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-mono shrink-0 ml-2">
                      {entry.score} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Assembly &amp; Meets</h3>
              </div>
              <button
                onClick={() => onNavigate('events')}
                className="text-xs text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
              >
                Calendar
              </button>
            </div>

            {events.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No upcoming society assemblies or debate meets scheduled.
              </div>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 3).map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => onNavigate('events')}
                    className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-300 flex flex-col items-center justify-center shrink-0 font-mono text-[10px] font-bold">
                        <span>{new Date(evt.date).toLocaleDateString([], { month: 'short' })}</span>
                        <span className="text-xs leading-none">{new Date(evt.date).getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-amber-800">
                          {evt.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {evt.time} • {evt.location}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
