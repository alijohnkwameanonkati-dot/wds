import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWdsData } from '../context/WdsDataContext';
import { EDITORIAL_VISUALS } from '../assets/editorialVisuals';
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
    <div className="space-y-6 pb-16">
      {/* Masthead */}
      <div className="bg-[#111622] text-white rounded-2xl p-6 sm:p-9 border border-stone-800 relative overflow-hidden shadow-lg">
        <img
          src={EDITORIAL_VISUALS.libraryHero}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-22"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E17]/95 via-[#0B0E17]/85 to-[#0B0E17]/60" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-amber-300 font-semibold flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> {settings.schoolShortName} Popular Works &amp; Academic Honors
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold font-crest tracking-tight text-white leading-tight">
              Weekly Rankings &amp; Hall of Fame
            </h1>
            <p className="text-sm text-stone-200 leading-relaxed font-serif-literary">
              Highlighting the most engaging poems, essays, debate motions, study briefs, and gazette reports approved by WDS moderators, alongside official Monthly Laureate honors.
            </p>
          </div>

          <div className="bg-[#0B0E17]/80 px-5 py-3.5 rounded-xl border border-white/15 text-center shrink-0">
            <span className="text-[10px] uppercase font-semibold text-amber-400 tracking-[0.14em] block font-mono">
              Active Session
            </span>
            <span className="text-base font-bold font-mono text-white block mt-0.5 tabular-nums">
              {settings.academicYear}
            </span>
            <span className="text-[11px] text-stone-400 block mt-0.5">{settings.currentTerm}</span>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
            activeTab === 'weekly'
              ? 'bg-[#111622] text-amber-300'
              : 'text-stone-600 hover:bg-stone-200/70'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" /> Weekly Popular Works ({liveWeeklyRankings.length})
        </button>
        <button
          onClick={() => setActiveTab('monthly_hall_of_fame')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
            activeTab === 'monthly_hall_of_fame'
              ? 'bg-[#111622] text-amber-300'
              : 'text-stone-600 hover:bg-stone-200/70'
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Monthly Hall of Fame ({achievements.length})
        </button>
        <button
          onClick={() => setActiveTab('calculation_rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'calculation_rules'
              ? 'bg-[#111622] text-amber-300'
              : 'text-stone-600 hover:bg-stone-200/70'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" /> Ranking Criteria
        </button>
      </div>

      {activeTab === 'weekly' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-4 py-3.5 rounded-xl border border-stone-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="text-xs font-semibold text-[#111622]">
                Live Weekly Merit Standings · {settings.currentTerm}
              </span>
            </div>
            <span className="text-[11px] text-stone-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              Ranked per approved publication · Contributor names are self-reported
            </span>
          </div>

          {liveWeeklyRankings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-2">
              <Trophy className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-lg font-bold text-[#111622] font-crest">
                No Ranked Contributions Yet
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Standings populate automatically as approved literary manuscripts, debate arguments, uploaded documents, and community articles earn peer endorsements.
              </p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-3">
                {/* Rank 2 */}
                {topThree[1] && (
                  <div className="bg-white rounded-xl border border-stone-300 p-6 text-center space-y-3 order-2 md:order-1">
                    <div className="w-9 h-9 rounded-lg bg-stone-200 text-[#111622] font-bold font-mono text-sm flex items-center justify-center mx-auto tabular-nums">
                      02
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-stone-500 font-semibold block">
                        {formatTypeLabel(topThree[1].contributionType)}
                      </span>
                      <h3 className="font-bold text-[#111622] text-base line-clamp-2 font-crest">
                        {topThree[1].title}
                      </h3>
                      <p className="text-xs text-stone-600 font-medium">
                        by {topThree[1].authorDisplayName}
                      </p>
                      <p className="text-[11px] text-stone-400">{topThree[1].authorClass}</p>
                    </div>
                    <div className="bg-[#FAF8F3] border border-stone-200 rounded-lg py-2.5 px-3">
                      <span className="text-lg font-bold font-mono text-[#111622] tabular-nums">
                        {topThree[1].score} pts
                      </span>
                      <div className="text-[10px] text-stone-500 mt-1 flex justify-center gap-2 font-mono tabular-nums">
                        <span>{topThree[1].weeklyLikes} this week</span>
                        <span>·</span>
                        <span>{topThree[1].totalLikes} total</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rank 1 */}
                {topThree[0] && (
                  <div className="bg-[#111622] text-white rounded-xl border border-amber-500/50 p-7 text-center space-y-3.5 shadow-lg order-1 md:order-2 md:-mt-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-600 text-white font-bold font-mono text-base flex items-center justify-center mx-auto tabular-nums">
                      01
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-amber-300 font-semibold block">
                        Top Featured Work · {formatTypeLabel(topThree[0].contributionType)}
                      </span>
                      <h3 className="font-bold text-white text-xl line-clamp-2 font-crest mt-1">
                        {topThree[0].title}
                      </h3>
                      <p className="text-xs text-stone-300 font-medium">
                        by {topThree[0].authorDisplayName}
                      </p>
                      <p className="text-[11px] text-stone-400">{topThree[0].authorClass}</p>
                    </div>
                    <div className="bg-[#0B0E17] rounded-lg py-3 px-4 border border-white/10">
                      <span className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
                        {topThree[0].score} pts
                      </span>
                      <div className="text-[11px] text-stone-300 mt-1 flex justify-center gap-2 font-mono tabular-nums">
                        <span>{topThree[0].weeklyLikes} weekly</span>
                        <span>·</span>
                        <span>{topThree[0].totalLikes} likes</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rank 3 */}
                {topThree[2] && (
                  <div className="bg-white rounded-xl border border-stone-300 p-6 text-center space-y-3 order-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-900 font-bold font-mono text-sm flex items-center justify-center mx-auto tabular-nums">
                      03
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-amber-800 font-semibold block">
                        {formatTypeLabel(topThree[2].contributionType)}
                      </span>
                      <h3 className="font-bold text-[#111622] text-base line-clamp-2 font-crest">
                        {topThree[2].title}
                      </h3>
                      <p className="text-xs text-stone-600 font-medium">
                        by {topThree[2].authorDisplayName}
                      </p>
                      <p className="text-[11px] text-stone-400">{topThree[2].authorClass}</p>
                    </div>
                    <div className="bg-[#FAF8F3] border border-stone-200 rounded-lg py-2.5 px-3">
                      <span className="text-lg font-bold font-mono text-[#111622] tabular-nums">
                        {topThree[2].score} pts
                      </span>
                      <div className="text-[10px] text-stone-500 mt-1 flex justify-center gap-2 font-mono tabular-nums">
                        <span>{topThree[2].weeklyLikes} this week</span>
                        <span>·</span>
                        <span>{topThree[2].totalLikes} total</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Full Table */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
                  <h3 className="font-bold font-crest text-[#111622] text-lg">
                    All Ranked Contributions
                  </h3>
                  <span className="text-xs text-stone-500 font-mono">
                    Live Firestore engagement score
                  </span>
                </div>

                <div className="divide-y divide-stone-100">
                  {liveWeeklyRankings.map((entry) => {
                    const matchesVisitor =
                      Boolean(visitorPrefs.displayName) &&
                      entry.authorDisplayName.toLowerCase() ===
                        visitorPrefs.displayName.trim().toLowerCase();

                    return (
                      <div
                        key={entry.contributionId}
                        className={`px-6 py-4 flex items-center justify-between gap-4 transition-colors ${
                          matchesVisitor ? 'bg-amber-50/70' : 'hover:bg-[#FAF8F3]'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="w-8 text-center font-bold text-sm text-stone-500 font-mono tabular-nums shrink-0">
                            #{entry.rank}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[#111622] text-sm truncate">
                                {entry.title}
                              </span>
                              <span className="text-[11px] font-mono text-amber-800 uppercase shrink-0">
                                · {formatTypeLabel(entry.contributionType)}
                              </span>
                              {matchesVisitor && (
                                <span className="text-[10px] font-mono font-bold uppercase text-[#111622] bg-amber-200/80 px-1.5 py-0.5 rounded shrink-0">
                                  Your Byline
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5">
                              {entry.authorDisplayName} · {entry.authorClass}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 shrink-0 font-mono tabular-nums">
                          <div className="hidden sm:flex items-center gap-4 text-xs text-stone-500">
                            <span>{entry.weeklyLikes} weekly</span>
                            <span>{entry.totalLikes} total</span>
                          </div>
                          <span className="text-base font-bold text-[#111622]">
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
            <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-700" />
                <h3 className="text-base font-bold text-[#111622] font-crest">
                  Archived Weekly Snapshots ({weeklyRankingsSnapshots.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weeklyRankingsSnapshots.slice(0, 6).map((snap) => (
                  <div
                    key={snap.id}
                    className="p-4 rounded-xl bg-[#FAF8F3] border border-stone-200 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="font-bold text-[#111622]">{snap.weekLabel}</span>
                      <span className="text-[11px] text-stone-500">
                        {snap.totalLikes} recorded likes
                      </span>
                    </div>
                    {snap.entries.slice(0, 3).map((e) => (
                      <div
                        key={e.contributionId}
                        className="flex items-center justify-between text-xs text-stone-700"
                      >
                        <span className="truncate pr-2">
                          #{e.rank} {e.title} ({e.authorDisplayName})
                        </span>
                        <span className="font-mono font-bold text-[#111622] tabular-nums shrink-0">
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
          <div className="bg-amber-50/70 border border-amber-300/70 rounded-xl p-6">
            <h3 className="font-bold text-[#111622] text-lg font-crest">
              Monthly Laureate &amp; Society Honors
            </h3>
            <p className="text-xs text-stone-700 mt-1 max-w-2xl leading-relaxed">
              Certified distinctions awarded by WDS Editors and School Administration to OLAG contributors demonstrating exemplary intellectual rigor, eloquence, and literary craft.
            </p>
          </div>

          {achievements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-xs text-stone-400">
              No monthly Hall of Fame laureates have been published yet for this academic session.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((award) => (
                <div
                  key={award.id}
                  className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 hover:border-amber-600/45 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-amber-800">
                    <span className="font-semibold">
                      {award.month && award.year
                        ? `${award.month} ${award.year}`
                        : award.date || award.category}
                    </span>
                    <Award className="w-5 h-5 text-amber-700 shrink-0" />
                  </div>

                  <div className="text-center pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-stone-500 font-semibold">
                      {award.category}
                    </span>
                    <h4 className="font-bold text-[#111622] text-xl mt-1 font-crest">
                      {award.recipientDisplayName}
                    </h4>
                    {award.recipientClass && (
                      <p className="text-xs text-stone-500">{award.recipientClass}</p>
                    )}
                    <p className="text-xs font-bold text-[#111622] mt-2 uppercase tracking-wide">
                      {award.title}
                    </p>
                  </div>

                  <p className="text-sm text-stone-700 bg-[#FAF8F3] p-4 rounded-lg italic leading-relaxed border border-stone-200 font-serif-literary">
                    "{award.description}"
                  </p>

                  <div className="pt-1 text-center">
                    <span className="text-[11px] text-emerald-800 font-semibold flex items-center justify-center gap-1.5">
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
        <div className="bg-white rounded-xl border border-stone-200 p-8 space-y-6 max-w-3xl mx-auto">
          <div>
            <h2 className="text-2xl font-bold text-[#111622] font-crest">
              Transparent Engagement Architecture
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Standings are computed directly from approved Firestore publications and verified session likes:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#FAF8F3] border border-stone-200 space-y-1">
              <div className="flex items-center gap-2 text-[#111622] font-bold text-sm">
                <BookOpen className="w-4 h-4 text-amber-700" />
                <span>Approved Literary Work: +25 Base</span>
              </div>
              <p className="text-xs text-stone-600">
                Awarded when an original poem, short story, essay, or reflection is approved into the Writers&apos; Corner.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F3] border border-stone-200 space-y-1">
              <div className="flex items-center gap-2 text-[#111622] font-bold text-sm">
                <MessageSquare className="w-4 h-4 text-amber-700" />
                <span>Approved Debate Thesis: +15 Base</span>
              </div>
              <p className="text-xs text-stone-600">
                Awarded for an approved FOR or AGAINST motion thesis in the Debators Arena.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F3] border border-stone-200 space-y-1">
              <div className="flex items-center gap-2 text-[#111622] font-bold text-sm">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Approved Brief or Article: +10 Base</span>
              </div>
              <p className="text-xs text-stone-600">
                Awarded for approved student-contributed Gazette dispatches or repository briefs.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F3] border border-stone-200 space-y-1">
              <div className="flex items-center gap-2 text-[#111622] font-bold text-sm">
                <ThumbsUp className="w-4 h-4 text-amber-700" />
                <span>Peer Likes: +5 Weekly / +2 Total</span>
              </div>
              <p className="text-xs text-stone-600">
                Each session-guarded peer endorsement boosts a work in the current ISO week and cumulative score.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-stone-200 text-xs text-stone-600 space-y-2">
            <p className="font-bold text-[#111622] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" /> Anti-Manipulation Safeguards
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
