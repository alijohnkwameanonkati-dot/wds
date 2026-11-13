import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWdsData } from '../context/WdsDataContext';
import { generateInitialsAvatar } from '../utils/validation';
import { EDITORIAL_VISUALS } from '../assets/editorialVisuals';
import { wdsService } from '../services/wdsService';
import { UploadedDocument } from '../types';
import {
  Download,
  ThumbsUp,
  Search,
  Plus,
  CheckCircle,
  FolderDown,
  Trash2,
} from 'lucide-react';

interface DocumentsViewProps {
  onOpenUpload: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ onOpenUpload }) => {
  const { sessionToken, isModerator } = useAuth();
  const { documents, settings, hasSessionLiked, getLikeCount } = useWdsData();
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const categories = [
    'All',
    'Debate Brief',
    'Essay Manuscript',
    'Poetry Collection',
    'Speech Transcript',
    'Study Paper',
  ];

  const filtered = documents.filter((d) => {
    const matchesCat = selectedCat === 'All' || d.category === selectedCat;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.authorDisplayName.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const handleDownload = (docItem: UploadedDocument) => {
    setDownloadSuccessId(docItem.id);

    if (docItem.fileUrl) {
      const a = document.createElement('a');
      a.href = docItem.fileUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = docItem.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const bodyText = docItem.textContent
        ? docItem.textContent
        : `=== ${docItem.title} ===\nAuthor: ${docItem.authorDisplayName} (${docItem.authorClass || 'OLAG'})\nCategory: ${docItem.category}\nFormat: ${docItem.fileFormat}\nPublished: ${new Date(docItem.publishedAt).toLocaleString()}\nSchool: ${settings.schoolName} (${settings.schoolShortName})\nSociety: ${settings.societyName}\n\nABSTRACT:\n${docItem.description}\n`;
      const blob = new Blob([bodyText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = docItem.fileName || `${docItem.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    setTimeout(() => setDownloadSuccessId(null), 2500);
  };

  const handleLike = async (docId: string) => {
    if (hasSessionLiked('document', docId)) return;
    await wdsService.castLike('document', docId, sessionToken);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Archival Repository Masthead */}
      <div className="bg-[#111622] text-white rounded-2xl p-6 sm:p-9 border border-stone-800 relative overflow-hidden shadow-lg">
        <img
          src={EDITORIAL_VISUALS.editorialDesk}
          alt="Archival documents and press seal"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-28"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E17]/95 via-[#0B0E17]/82 to-[#0B0E17]/55" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-amber-300 font-semibold">
              Approved Academic Archive · {settings.schoolShortName} WDS
            </p>
            <h1 className="text-3xl font-bold font-crest text-white leading-tight">
              Document &amp; Brief Repository
            </h1>
            <p className="text-sm text-stone-200 max-w-xl font-serif-literary leading-relaxed">
              Open-access debate briefs, essays, poetry collections, speech transcripts, and study papers verified by WDS moderators.
            </p>
          </div>

          <button
            onClick={onOpenUpload}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Submit Document
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search approved documents by title, summary, or contributor..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-200 bg-[#FAF8F3]/60 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCat === cat
                  ? 'bg-[#111622] text-amber-300'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <FolderDown className="w-9 h-9 text-stone-300 mx-auto" />
          <p className="text-base font-bold font-crest text-[#111622]">
            {documents.length === 0
              ? 'No approved documents in the repository yet'
              : 'No documents match your filter'}
          </p>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Contribute a PDF, Word file, debate brief, speech transcript, or study notes without signing in.
          </p>
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 bg-[#111622] hover:bg-[#1E273B] text-amber-300 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Submit First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const liked = hasSessionLiked('document', item.id);
            const likeTotal = getLikeCount('document', item.id, item.likesCount);
            const isDownloaded = downloadSuccessId === item.id;

            return (
              <article
                key={item.id}
                className="bg-white rounded-xl border border-stone-200 p-5 hover:border-amber-600/45 transition-colors flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-amber-800 font-semibold">
                      {item.category} · {item.fileFormat} · {item.fileSize}
                    </span>

                    {isModerator &&
                      (confirmDeleteId === item.id ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              void wdsService.deleteDocument(item.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-semibold cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[10px] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded cursor-pointer shrink-0"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ))}
                  </div>

                  <h3 className="font-bold font-crest text-[#111622] text-lg leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-3 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <img
                        src={generateInitialsAvatar(item.authorDisplayName)}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                      />
                      <span className="truncate font-semibold text-stone-800">
                        {item.authorDisplayName}
                        {item.authorClass ? ` (${item.authorClass})` : ''}
                      </span>
                    </div>

                    <button
                      onClick={() => void handleLike(item.id)}
                      disabled={liked}
                      className={`flex items-center gap-1 text-xs cursor-pointer font-mono tabular-nums ${
                        liked ? 'text-amber-700 font-bold' : 'hover:text-[#111622]'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${liked ? 'fill-amber-700' : ''}`} />
                      <span>{likeTotal}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-stone-400 font-mono truncate max-w-[140px]">
                      {item.fileName}
                    </span>

                    <button
                      onClick={() => handleDownload(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isDownloaded
                          ? 'bg-emerald-700 text-white'
                          : 'bg-[#111622] hover:bg-[#1E273B] text-amber-300'
                      }`}
                    >
                      {isDownloaded ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" /> Ready
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
