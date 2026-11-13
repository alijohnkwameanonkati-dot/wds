import React from 'react';
import { useWdsData } from '../context/WdsDataContext';
import { OLAG_CLASSES } from '../utils/validation';
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
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Masthead */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-300 text-xs font-mono font-semibold">
          <Landmark className="w-3.5 h-3.5 text-amber-400" />
          <span>Official Charter &amp; Campus Contact</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold font-crest tracking-tight text-white">
          {settings.societyName}
        </h1>
        <p className="text-sm text-amber-200/90 font-serif-literary italic">
          "{settings.societyMotto}"
        </p>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Established at {settings.schoolName} ({settings.schoolShortName}) to nurture articulated debate, journalistic integrity, and original literary craftsmanship across all academic programmes.
        </p>
      </div>

      {/* Three Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-crest">The OLAG Gazette</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            School announcements, official directives, academic dispatches, sports updates, and student journalism vetted by the editorial desk.
          </p>
          <button
            onClick={() => onNavigate('news')}
            className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
          >
            Read Gazette →
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-crest">Debators Arena</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Formal {settings.debateCycleDays}-day structured motions where OLAG students submit FOR and AGAINST arguments and scholarly rebuttals.
          </p>
          <button
            onClick={() => onNavigate('debates')}
            className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
          >
            Enter Arena →
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-crest">Writers' Corner</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            A literary journal publishing moderated poems, short stories, essays, creative reflections, and academic study briefs.
          </p>
          <button
            onClick={() => onNavigate('writters')}
            className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
          >
            Browse Journal →
          </button>
        </div>
      </div>

      {/* Contact Details + Governance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 font-crest">
            Campus Location &amp; Contact
          </h2>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">Campus Address</p>
                <p className="text-slate-600 mt-0.5">
                  {settings.contactLocation ||
                    'Our Lady of Grace Senior High School, Mamponteng, Ashanti Region, Ghana'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">Society Meeting Schedule</p>
                <p className="text-slate-600 mt-0.5">
                  {settings.meetingSchedule ||
                    'Wednesdays & Fridays • 4:00 PM at the School Assembly Hall'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">Editorial &amp; Patron Desk</p>
                <p className="text-slate-600 font-mono mt-0.5">
                  {settings.contactEmail || 'wds@olag.edu.gh'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenUpload}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <FolderUp className="w-4 h-4" /> Submit a Manuscript, Report, or Brief (No Login Needed)
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900 font-crest">
              Editorial Governance &amp; Privacy Model
            </h2>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="font-bold text-slate-900">Open Public Contribution</p>
              <p className="mt-1">
                No student registration or account creation is required. OLAG students can submit articles, poems, essays, documents, comments, and debate arguments publicly or anonymously.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="font-bold text-slate-900">Pre-Publication Moderation Queue</p>
              <p className="mt-1">
                Every public submission enters a private moderation queue reviewed by verified WDS Moderators, Editors, and Patrons before appearing on public pages.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="font-bold text-slate-900">Verified Executive Oversight</p>
              <p className="mt-1">
                Administration roles are strictly separated into Super Admin (Patron / School Administration), Editor (Society President / Chief Editor), and Moderator.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* OLAG Academic Programmes & Recent Honors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900 font-crest">
              Participating OLAG Classes
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Official academic tracks represented across WDS publications and debate halls:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {OLAG_CLASSES.map((cls) => (
              <span
                key={cls}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
              >
                {cls}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900 font-crest">
                Recent Society Honors
              </h2>
            </div>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
            >
              View Hall of Fame →
            </button>
          </div>
          {achievements.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">
              Honors will appear here once published by WDS Editors.
            </p>
          ) : (
            <div className="space-y-2.5">
              {achievements.slice(0, 3).map((ach) => (
                <div
                  key={ach.id}
                  className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/70 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{ach.title}</span>
                    <span className="text-[10px] font-mono text-amber-800">{ach.category}</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
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
