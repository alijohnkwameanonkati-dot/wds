import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWdsData } from '../context/WdsDataContext';
import {
  Trophy,
  Award,
  HelpCircle,
  Calendar,
  ShieldCheck,
  CheckCircle,
  BookOpen,
  MessageSquare,
  ThumbsUp,
  FileText,
  History,
  Info,
} from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const { visitorPrefs } = useAuth();
  const { liveWeeklyRankings, weeklyRankingsSnapshots, achievements, settings } = useWdsData();
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly_hall_of_fame' | 'calculation_rules'>(
    'weekly'
  );

  const topThree = liveWeeklyRankings.slice(0, 3);

  const formatTypeLabel = (type: string) => {
    switch (type) {
      case 'debateArgument':
        return 'Debate Argument';
      case 'short_story':
        return 'Short Story';
      case 'creative_writing':
        return 'Creative Writing';
      case 'poem':
        return 'Poem';
      case 'essay':
        return 'Essay';
      case 'reflection':
        return 'Reflection';
      case 'document':
        return 'Document Brief';
      case 'news':
        return 'Gazette Article';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-300 text-xs font-mono font-semibold">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{settings.schoolShortName} Popular Works &amp; Academic Honors</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-crest tracking-tight text-white">
              Weekly Rankings &amp; Hall of Fame
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-serif-literary">
              Highlighting the most engaging poems, essays, debate motions, study briefs, and gazette reports approved by WDS moderators, alongside official Monthly Laureate honors.
            </p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-center shrink-0">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block font-mono">
              Active Session
            </span>
            <span className="text-sm font-bold font-mono text-white block mt-0.5">
              {settings.academicYear}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">{settings.currentTerm}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'weekly'
              ? 'bg-slate-900 text-amber-300 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" /> Weekly Popular Works ({liveWeeklyRankings.length})
        </button>
        <button
          onClick={() => setActiveTab('monthly_hall_of_fame')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'monthly_hall_of_fame'
              ? 'bg-slate-900 text-amber-300 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Monthly Hall of Fame ({achievements.length})
        </button>
        <button
          onClick={() => setActiveTab('calculation_rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'calculation_rules'
              ? 'bg-slate-900 text-amber-300 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" /> Ranking Criteria
        </button>
      </div>

      {activeTab === 'weekly' && (
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700">
                Live Weekly Merit Standings • {settings.currentTerm}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Ranked per approved publication • Contributor names are self-reported
            </span>
          </div>

          {liveWeeklyRankings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
              <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 font-crest">
                No Ranked Contributions Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Standings populate automatically as approved literary manuscripts, debate arguments, uploaded documents, and community articles earn peer likes.
              </p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
                {/* Rank 2 */}
                {topThree[1] && (
                  <div className="bg-gradient-to-t from-slate-100 via-white to-slate-50 rounded-3xl border-2 border-slate-300 p-6 text-center space-y-3 shadow-md order-2 md:order-1 relative">
                    <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-800 font-extrabold text-sm flex items-center justify-center mx-auto shadow-xs">
                      2
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                        {formatTypeLabel(topThree[1].contributionType)}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-2 font-crest">
                        {topThree[1].title}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        by {topThree[1].authorDisplayName}
                      </p>
                      <p className="text-[11px] text-slate-400">{topThree[1].authorClass}</p>
                    </div>
                    <div className="bg-slate-200/60 rounded-xl py-2 px-3">
                      <span className="text-lg font-bold font-mono text-slate-900">
                        {topThree[1].score} pts
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1 flex justify-center gap-2">
                        <span>{topThree[1].weeklyLikes} this week</span>
                        <span>•</span>
                        <span>{topThree[1].totalLikes} total likes</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rank 1 */}
                {topThree[0] && (
                  <div className="bg-gradient-to-t from-amber-100 via-amber-50 to-white rounded-3xl border-2 border-amber-400 p-8 text-center space-y-3 shadow-xl order-1 md:order-2 relative md:-mt-4">
                    <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-extrabold text-base flex items-center justify-center mx-auto shadow-md">
                      1
                    </div>
                    <div className="space-y-1">
                      <span className="bg-amber-400/30 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
                        Top Featured Work
                      </span>
                      <h3 className="font-bold text-slate-900 text-base line-clamp-2 font-crest mt-1">
                        {topThree[0].title}
                      </h3>
                      <p className="text-xs text-slate-700 font-semibold">
                        by {topThree[0].authorDisplayName}
                      </p>
                      <p className="text-[11px] text-slate-500">{topThree[0].authorClass}</p>
                    </div>
                    <div className="bg-amber-200/50 rounded-xl py-2.5 px-4 border border-amber-300/50">
                      <span className="text-2xl font-bold font-mono text-slate-950">
                        {topThree[0].score} pts
                      </span>
                      <div className="text-[11px] text-amber-900 mt-1 flex justify-center gap-2 font-medium">
                        <span>{formatTypeLabel(topThree[0].contributionType)}</span>
                        <span>•</span>
                        <span>{topThree[0].totalLikes} likes</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rank 3 */}
                {topThree[2] && (
                  <div className="bg-gradient-to-t from-orange-50 via-white to-orange-50/50 rounded-3xl border-2 border-orange-300 p-6 text-center space-y-3 shadow-md order-3 relative">
                    <div className="w-8 h-8 rounded-full bg-orange-300 text-orange-950 font-extrabold text-sm flex items-center justify-center mx-auto shadow-xs">
                      3
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-orange-700 font-bold block">
                        {formatTypeLabel(topThree[2].contributionType)}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-2 font-crest">
                        {topThree[2].title}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        by {topThree[2].authorDisplayName}
                      </p>
                      <p className="text-[11px] text-slate-400">{topThree[2].authorClass}</p>
                    </div>
                    <div className="bg-orange-100/60 rounded-xl py-2 px-3">
                      <span className="text-lg font-bold font-mono text-slate-900">
                        {topThree[2].score} pts
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1 flex justify-center gap-2">
                        <span>{topThree[2].weeklyLikes} this week</span>
                        <span>•</span>
                        <span>{topThree[2].totalLikes} total likes</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Full Table */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">All Ranked Contributions</h3>
                  <span className="text-xs text-slate-500">Live Firestore engagement score</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {liveWeeklyRankings.map((entry) => {
                    const matchesVisitor =
                      Boolean(visitorPrefs.displayName) &&
                      entry.authorDisplayName.toLowerCase() ===
                        visitorPrefs.displayName.trim().toLowerCase();

                    return (
                      <div
                        key={entry.contributionId}
                        className={`px-6 py-4 flex items-center justify-between gap-4 transition-colors ${
                          matchesVisitor
                            ? 'bg-amber-50/70 border-l-4 border-amber-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="w-7 text-center font-bold text-sm text-slate-500 font-mono shrink-0">
                            #{entry.rank}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm truncate">
                                {entry.title}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                                {formatTypeLabel(entry.contributionType)}
                              </span>
                              {matchesVisitor && (
                                <span className="bg-slate-900 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
                                  YOUR BYLINE
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {entry.authorDisplayName} • {entry.authorClass}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 shrink-0">
                          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
                            <span>{entry.weeklyLikes} weekly likes</span>
                            <span>{entry.totalLikes} total likes</span>
                          </div>
                          <span className="text-base font-bold font-mono text-slate-900">
                            {entry.score} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Archived Weekly Snapshots */}
          {weeklyRankingsSnapshots.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 font-crest">
                  Archived Weekly Snapshots ({weeklyRankingsSnapshots.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weeklyRankingsSnapshots.slice(0, 6).map((snap) => (
                  <div
                    key={snap.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 font-mono">{snap.weekLabel}</span>
                      <span className="text-[11px] text-slate-500">
                        {snap.totalLikes} recorded likes
                      </span>
                    </div>
                    {snap.entries.slice(0, 3).map((e) => (
                      <div
                        key={e.contributionId}
                        className="flex items-center justify-between text-xs text-slate-700"
                      >
                        <span className="truncate pr-2">
                          #{e.rank} {e.title} ({e.authorDisplayName})
                        </span>
                        <span className="font-mono font-bold text-slate-900 shrink-0">
                          {e.score} pts
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MONTHLY HALL OF FAME TAB */}
      {activeTab === 'monthly_hall_of_fame' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
            <h3 className="font-bold text-amber-950 text-base font-crest">
              Monthly Laureate &amp; Society Honors
            </h3>
            <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
              Certified distinctions awarded by WDS Editors and School Administration to OLAG contributors demonstrating exemplary intellectual rigor, eloquence, and literary craft.
            </p>
          </div>

          {achievements.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
              No monthly Hall of Fame laureates have been published yet for this academic session.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((award) => (
                <div
                  key={award.id}
                  className="bg-white rounded-3xl border-2 border-amber-200/80 p-6 shadow-md hover:shadow-xl transition-all space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {award.month && award.year
                        ? `${award.month} ${award.year}`
                        : award.date || award.category}
                    </span>
                    <Award className="w-6 h-6 text-amber-500 shrink-0" />
                  </div>

                  <div className="text-center pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 font-bold">
                      {award.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-lg mt-1 font-crest">
                      {award.recipientDisplayName}
                    </h4>
                    {award.recipientClass && (
                      <p className="text-xs text-slate-500">{award.recipientClass}</p>
                    )}
                    <p className="text-xs font-bold text-slate-800 mt-2 uppercase tracking-wide">
                      {award.title}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl italic leading-relaxed border border-slate-100 font-serif-literary">
                    "{award.description}"
                  </p>

                  <div className="pt-1 text-center">
                    <span className="text-[11px] text-amber-800 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Certified by WDS Administration
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RANKING CRITERIA TAB */}
      {activeTab === 'calculation_rules' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 max-w-3xl mx-auto shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-crest">
              Transparent Engagement Architecture
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Standings are computed directly from approved Firestore publications and verified session likes:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Approved Literary Work: +25 Base</span>
              </div>
              <p className="text-xs text-slate-600">
                Awarded when an original poem, short story, essay, or reflection is approved into the Writers' Corner.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-1">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <MessageSquare className="w-4 h-4" />
                <span>Approved Debate Thesis: +15 Base</span>
              </div>
              <p className="text-xs text-amber-950">
                Awarded for an approved FOR or AGAINST motion thesis in the Debators Arena.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <FileText className="w-4 h-4" />
                <span>Approved Brief or Article: +10 Base</span>
              </div>
              <p className="text-xs text-emerald-950">
                Awarded for approved student-contributed Gazette dispatches or repository briefs.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 space-y-1">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <ThumbsUp className="w-4 h-4" />
                <span>Peer Likes: +5 Weekly / +2 Total</span>
              </div>
              <p className="text-xs text-rose-950">
                Each session-guarded peer endorsement boosts a work in the current ISO week and cumulative score.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Anti-Manipulation Safeguards
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                All public contributions must pass human verification and moderator approval before appearing or scoring.
              </li>
              <li>
                Deterministic like IDs enforce one endorsement per session per item in Firestore.
              </li>
              <li>
                Weekly ranking snapshots are archived by verified WDS administrators and Cloud Functions.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
