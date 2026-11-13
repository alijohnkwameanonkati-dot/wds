import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWdsData } from '../context/WdsDataContext';
import { wdsService } from '../services/wdsService';
import { SchoolEvent } from '../types';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  X,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export const EventsView: React.FC = () => {
  const { isEditor, adminRecord } = useAuth();
  const { events } = useWdsData();
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('4:00 PM – 5:30 PM');
  const [location, setLocation] = useState('School Assembly Hall');
  const [category, setCategory] = useState<SchoolEvent['category']>('Debate Meet');
  const [organizer, setOrganizer] = useState('WDS Executive Council');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManageEvents = Boolean(isEditor && adminRecord);

  const filtered = events.filter((e) => {
    if (selectedCat === 'All') return true;
    return e.category === selectedCat;
  });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminRecord || !title.trim() || !description.trim()) return;
    setFormError('');
    setSubmitting(true);

    try {
      await wdsService.createEvent(
        {
          title: title.trim(),
          description: description.trim(),
          date,
          time: time.trim(),
          location: location.trim(),
          category,
          organizer: organizer.trim() || 'WDS Council',
          status: 'published',
        },
        adminRecord
      );

      setIsAddModalOpen(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create calendar event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!canManageEvents) return;
    try {
      await wdsService.deleteEvent(eventId);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const categories = ['All', 'Assembly', 'Debate Meet', 'Poetry Night', 'Inter-School', 'Seminar'];

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-amber-800 font-semibold">
            Academic &amp; Society Fixtures
          </p>
          <h1 className="text-3xl font-bold text-[#111622] font-crest mt-0.5 leading-tight">
            Campus Calendar &amp; Assemblies
          </h1>
          <p className="text-sm text-stone-600 font-serif-literary mt-1">
            School assemblies, inter-house debates, poetry nights, and WDS society meets.
          </p>
        </div>

        {canManageEvents && (
          <button
            onClick={() => {
              setFormError('');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#111622] hover:bg-[#1E273B] text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Calendar Event
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-stone-200">
        {categories.map((cat) => {
          const isSelected = selectedCat === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer mb-2 ${
                isSelected
                  ? 'bg-[#111622] text-amber-300'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Event Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <CalendarIcon className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-base font-bold font-crest text-[#111622]">
            {events.length === 0
              ? 'No calendar events scheduled yet'
              : 'No events match this category'}
          </p>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Authorized WDS Editors and Super Admins can post assemblies, debate meets, and seminars to the calendar.
          </p>
          {canManageEvents && (
            <div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-[#111622] hover:bg-[#1E273B] text-amber-300 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule First Event
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((evt) => (
            <article
              key={evt.id}
              className="bg-white rounded-xl border border-stone-200 p-6 hover:border-amber-600/45 transition-colors flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-amber-800 font-semibold">
                    {evt.category}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#111622] tabular-nums">
                      <CalendarIcon className="w-3.5 h-3.5 text-amber-700" />
                      {new Date(evt.date).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    {canManageEvents &&
                      (confirmDeleteId === evt.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => void handleDeleteEvent(evt.id)}
                            className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-semibold cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded bg-stone-100 text-stone-600 text-[10px] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(evt.id)}
                          className="p-1.5 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ))}
                  </div>
                </div>

                <h3 className="font-bold text-[#111622] text-xl leading-snug font-crest">
                  {evt.title}
                </h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">{evt.description}</p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 font-mono tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-stone-400" /> {evt.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" /> {evt.location}
                  </span>
                </div>
                <span className="text-[11px] text-stone-400">
                  Organized by {evt.organizer}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ADD EVENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0D14]/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-[#111622] text-white">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg font-crest">Schedule Campus Event</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter event title"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Time Range *
                  </label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 5:00 PM – 7:30 PM"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Auditorium / Library"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SchoolEvent['category'])}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  >
                    <option value="Debate Meet">Debate Meet</option>
                    <option value="Poetry Night">Poetry Night</option>
                    <option value="Inter-School">Inter-School</option>
                    <option value="Assembly">Assembly</option>
                    <option value="Seminar">Seminar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Organizer</label>
                <input
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="Organizing office or club"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Event Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details regarding admission, participants, and schedule..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#111622] hover:bg-[#1E273B] disabled:opacity-50 text-amber-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {submitting ? 'Publishing...' : 'Post to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
