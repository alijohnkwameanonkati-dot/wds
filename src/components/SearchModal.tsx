import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  BookOpen,
  MessageSquare,
  FileText,
  Calendar,
  ArrowRight,
  FolderDown,
} from 'lucide-react';
import { useWdsData } from '../context/WdsDataContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, targetId?: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { news, debates, writings, events, documents } = useWdsData();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredNews = q
    ? news.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.excerpt.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q) ||
          n.authorDisplayName.toLowerCase().includes(q)
      )
    : [];

  const filteredDebates = q
    ? debates.filter(
        (d) =>
          d.topic.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      )
    : [];

  const filteredWritings = q
    ? writings.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.authorDisplayName.toLowerCase().includes(q) ||
          w.content.toLowerCase().includes(q) ||
          w.writingType.toLowerCase().includes(q)
      )
    : [];

  const filteredEvents = q
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q)
      )
    : [];

  const filteredDocs = q
    ? documents.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.authorDisplayName.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      )
    : [];

  const hasResults =
    filteredNews.length > 0 ||
    filteredDebates.length > 0 ||
    filteredWritings.length > 0 ||
    filteredEvents.length > 0 ||
    filteredDocs.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#111622]/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        <div className="flex items-center px-4 border-b border-stone-200 bg-[#FAF8F3]">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search approved OLAG news, debates, poems, documents, and events..."
            className="w-full px-3.5 py-4 bg-transparent text-sm text-[#111622] placeholder:text-stone-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 text-stone-400 hover:text-[#111622] rounded-md cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-mono ml-2">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!q ? (
            <div className="py-10 text-center">
              <p className="font-crest text-base font-bold text-[#111622]">
                Quick Search Across WDS Archive
              </p>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto font-serif-literary">
                Search published gazette bulletins, debate motions, literary manuscripts, or uploaded briefs.
              </p>
            </div>
          ) : !hasResults ? (
            <div className="py-12 text-center text-stone-500 text-sm">
              No published records found matching &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNews.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest mb-2">
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    <span>News &amp; Announcements ({filteredNews.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredNews.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate('news', item.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF8F3] text-left transition-colors cursor-pointer group border border-transparent hover:border-stone-200"
                      >
                        <div className="truncate pr-4">
                          <p className="text-sm font-semibold text-[#111622] truncate group-hover:text-amber-700">
                            {item.title}
                          </p>
                          <p className="text-xs text-stone-500 truncate">{item.excerpt}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-amber-700 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredDebates.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest mb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                    <span>Debate Motions ({filteredDebates.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredDebates.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate('debates', item.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF8F3] text-left transition-colors cursor-pointer group border border-transparent hover:border-stone-200"
                      >
                        <div className="truncate pr-4">
                          <p className="text-sm font-semibold text-[#111622] truncate group-hover:text-amber-700">
                            {item.topic}
                          </p>
                          <p className="text-xs text-stone-500 truncate">{item.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-amber-700 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredWritings.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest mb-2">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Literary Works ({filteredWritings.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredWritings.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate('writters', item.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF8F3] text-left transition-colors cursor-pointer group border border-transparent hover:border-stone-200"
                      >
                        <div className="truncate pr-4">
                          <p className="text-sm font-semibold text-[#111622] truncate group-hover:text-emerald-700">
                            {item.title}
                          </p>
                          <p className="text-xs text-stone-500 truncate">
                            By {item.authorDisplayName} • {item.writingType.replace('_', ' ').toUpperCase()}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-emerald-700 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredEvents.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest mb-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>School Events ({filteredEvents.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredEvents.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate('events', item.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF8F3] text-left transition-colors cursor-pointer group border border-transparent hover:border-stone-200"
                      >
                        <div className="truncate pr-4">
                          <p className="text-sm font-semibold text-[#111622] truncate group-hover:text-amber-700">
                            {item.title}
                          </p>
                          <p className="text-xs text-stone-500 truncate">
                            {item.date} • {item.location}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-amber-700 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredDocs.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest mb-2">
                    <FolderDown className="w-3.5 h-3.5 text-amber-700" />
                    <span>Repository Documents ({filteredDocs.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredDocs.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate('documents', item.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF8F3] text-left transition-colors cursor-pointer group border border-transparent hover:border-stone-200"
                      >
                        <div className="truncate pr-4">
                          <p className="text-sm font-semibold text-[#111622] truncate group-hover:text-amber-700">
                            {item.title}
                          </p>
                          <p className="text-xs text-stone-500 truncate">
                            {item.fileFormat} • By {item.authorDisplayName}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-amber-700 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
