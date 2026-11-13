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

  // Form states
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
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-crest">Campus Calendar</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            School assemblies, inter-house debates, poetry nights, and WDS society meets
          </p>
        </div>

        {canManageEvents && (
          <button
            onClick={() => {
              setFormError('');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Calendar Event
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCat === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-amber-400 shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Event Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">
            {events.length === 0
              ? 'No calendar events scheduled yet'
              : 'No events match this category'}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Authorized WDS Editors and Super Admins can post assemblies, debate meets, and seminars to the calendar.
          </p>
          {canManageEvents && (
            <div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule First Event
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((evt) => (
            <div
              key={evt.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      evt.category === 'Debate Meet'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : evt.category === 'Poetry Night'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        : evt.category === 'Inter-School'
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : evt.category === 'Assembly'
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : 'bg-slate-100 text-slate-900 border border-slate-200'
                    }`}
                  >
                    {evt.category}
                  </span>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-xl">
                      <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {new Date(evt.date).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {canManageEvents &&
                      (confirmDeleteId === evt.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => void handleDeleteEvent(evt.id)}
                            className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(evt.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ))}
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-lg leading-snug font-crest">
                  {evt.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{evt.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {evt.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {evt.location}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  Organized by {evt.organizer}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD EVENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base font-crest">Schedule Campus Event</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter event title"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time Range *</label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 5:00 PM – 7:30 PM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Auditorium / Library"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SchoolEvent['category'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Organizer</label>
                <input
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="Organizing office or club"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details regarding admission, participants, and schedule..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-400 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
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
