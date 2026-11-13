import React from 'react';
import { useWdsData } from '../context/WdsDataContext';
import { OLAG_CLASSES } from '../utils/validation';
import { EDITORIAL_VISUALS } from '../assets/editorialVisuals';
import {
  Landmark,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  BookOpen,
  MessageSquare,
  FileText,
  Award,
  FolderUp,
  GraduationCap,
} from 'lucide-react';

interface SocietyContactViewProps {
  onNavigate: (tab: string) => void;
  onOpenUpload: () => void;
}

export const SocietyContactView: React.FC<SocietyContactViewProps> = ({
  onNavigate,
  onOpenUpload,
}) => {
  const { settings, achievements } = useWdsData();

  return (
    <div className="space-y-6 pb-16">
      {/* Institutional Charter Masthead */}
      <div className="bg-[#111622] text-white rounded-2xl p-6 sm:p-10 border border-stone-800 relative overflow-hidden shadow-lg">
        <img
          src={EDITORIAL_VISUALS.libraryHero}
          alt="OLAG Campus Library"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E17]/95 via-[#0B0E17]/85 to-[#0B0E17]/60" />

        <div className="relative z-10 space-y-3 max-w-3xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-amber-300 font-semibold flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5" /> Official Charter &amp; Campus Contact
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold font-crest tracking-tight text-white leading-tight">
            {settings.societyName}
          </h1>
          <p className="text-base text-amber-200/95 font-serif-literary italic">
            "{settings.societyMotto}"
          </p>
          <p className="text-sm text-stone-200 leading-relaxed">
            Established at {settings.schoolName} ({settings.schoolShortName}) to nurture articulated debate, journalistic integrity, and original literary craftsmanship across all academic programmes.
          </p>
        </div>
      </div>

      {/* Three Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#111622] text-amber-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#111622] font-crest">The OLAG Gazette</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            School announcements, official directives, academic dispatches, sports updates, and student journalism vetted by the editorial desk.
          </p>
          <button
            onClick={() => onNavigate('news')}
            className="text-xs font-semibold text-amber-800 hover:text-[#111622] cursor-pointer"
          >
            Read Gazette →
          </button>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#111622] text-amber-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#111622] font-crest">Debators Arena</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Formal {settings.debateCycleDays}-day structured motions where OLAG students submit FOR and AGAINST arguments and scholarly rebuttals.
          </p>
          <button
            onClick={() => onNavigate('debates')}
            className="text-xs font-semibold text-amber-800 hover:text-[#111622] cursor-pointer"
          >
            Enter Arena →
          </button>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#111622] text-amber-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#111622] font-crest">Writers&apos; Corner</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            A literary journal publishing moderated poems, short stories, essays, creative reflections, and academic study briefs.
          </p>
          <button
            onClick={() => onNavigate('writters')}
            className="text-xs font-semibold text-amber-800 hover:text-[#111622] cursor-pointer"
          >
            Browse Journal →
          </button>
        </div>
      </div>

      {/* Contact Details + Governance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
          <h2 className="text-xl font-bold text-[#111622] font-crest">
            Campus Location &amp; Contact
          </h2>

          <div className="space-y-3 text-xs text-stone-700">
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#FAF8F3] border border-stone-200">
              <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#111622]">Campus Address</p>
                <p className="text-stone-600 mt-0.5">
                  {settings.contactLocation ||
                    'Our Lady of Grace Senior High School, Mamponteng, Ashanti Region, Ghana'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#FAF8F3] border border-stone-200">
              <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#111622]">Society Meeting Schedule</p>
                <p className="text-stone-600 mt-0.5">
                  {settings.meetingSchedule ||
                    'Wednesdays & Fridays · 4:00 PM at the School Assembly Hall'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#FAF8F3] border border-stone-200">
              <Mail className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#111622]">Editorial &amp; Patron Desk</p>
                <p className="text-stone-600 font-mono mt-0.5">
                  {settings.contactEmail || 'wds@olag.edu.gh'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenUpload}
              className="w-full py-2.5 px-4 bg-[#111622] hover:bg-[#1E273B] text-amber-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <FolderUp className="w-4 h-4" /> Submit a Manuscript, Report, or Brief (No Login Needed)
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-700" />
            <h2 className="text-xl font-bold text-[#111622] font-crest">
              Editorial Governance &amp; Privacy Model
            </h2>
          </div>

          <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
            <div className="p-3.5 rounded-lg bg-[#FAF8F3] border border-stone-200">
              <p className="font-bold text-[#111622]">Open Public Contribution</p>
              <p className="mt-1">
                No student registration or account creation is required. OLAG students can submit articles, poems, essays, documents, comments, and debate arguments publicly or anonymously.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#FAF8F3] border border-stone-200">
              <p className="font-bold text-[#111622]">Pre-Publication Moderation Queue</p>
              <p className="mt-1">
                Every public submission enters a private moderation queue reviewed by verified WDS Moderators, Editors, and Patrons before appearing on public pages.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#FAF8F3] border border-stone-200">
              <p className="font-bold text-[#111622]">Verified Executive Oversight</p>
              <p className="mt-1">
                Administration roles are strictly separated into Super Admin (Patron / School Administration), Editor (Society President / Chief Editor), and Moderator.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* OLAG Academic Programmes & Recent Honors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-700" />
            <h2 className="text-lg font-bold text-[#111622] font-crest">
              Participating OLAG Classes
            </h2>
          </div>
          <p className="text-xs text-stone-500">
            Official academic tracks represented across WDS publications and debate halls:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {OLAG_CLASSES.map((cls) => (
              <span
                key={cls}
                className="px-3 py-2 rounded-lg bg-[#FAF8F3] border border-stone-200 text-xs font-semibold text-stone-700 text-center"
              >
                {cls}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-700" />
              <h2 className="text-lg font-bold text-[#111622] font-crest">
                Recent Society Honors
              </h2>
            </div>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
            >
              View Hall of Fame →
            </button>
          </div>
          {achievements.length === 0 ? (
            <p className="text-xs text-stone-400 py-4">
              Honors will appear here once published by WDS Editors.
            </p>
          ) : (
            <div className="space-y-2.5">
              {achievements.slice(0, 3).map((ach) => (
                <div
                  key={ach.id}
                  className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-200/80 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#111622]">{ach.title}</span>
                    <span className="text-[10px] font-mono text-amber-800 uppercase">
                      {ach.category}
                    </span>
                  </div>
                  <p className="text-stone-600 mt-1">
                    Recipient: <strong>{ach.recipientDisplayName}</strong>
                    {ach.recipientClass ? ` (${ach.recipientClass})` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
