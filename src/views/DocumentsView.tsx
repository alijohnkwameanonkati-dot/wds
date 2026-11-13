import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWdsData } from '../context/WdsDataContext';
import { generateInitialsAvatar } from '../utils/validation';
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
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Masthead */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
              Approved Academic Archive
            </span>
            <span className="text-xs text-slate-400">• {settings.schoolShortName} WDS</span>
          </div>
          <h1 className="text-2xl font-bold font-crest text-white">Document &amp; Brief Repository</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl font-serif-literary">
            Open-access debate briefs, essays, poetry collections, speech transcripts, and study papers verified by WDS moderators.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Submit Document
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search approved documents by title, summary, or contributor..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCat === cat
                  ? 'bg-slate-900 text-amber-400 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <FolderDown className="w-9 h-9 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">
            {documents.length === 0
              ? 'No approved documents in the repository yet'
              : 'No documents match your filter'}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Contribute a PDF, Word file, debate brief, speech transcript, or study notes without signing in.
          </p>
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
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
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase tracking-wider font-mono">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {item.fileFormat} • {item.fileSize}
                      </span>
                      {isModerator && (
                        <button
                          onClick={() => {
                            if (window.confirm('Remove this document from repository?')) {
                              void wdsService.deleteDocument(item.id);
                            }
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <img
                        src={generateInitialsAvatar(item.authorDisplayName)}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                      />
                      <span className="truncate font-semibold text-slate-800">
                        {item.authorDisplayName}
                        {item.authorClass ? ` (${item.authorClass})` : ''}
                      </span>
                    </div>

                    <button
                      onClick={() => void handleLike(item.id)}
                      disabled={liked}
                      className={`flex items-center gap-1 text-xs cursor-pointer ${
                        liked ? 'text-amber-600 font-bold' : 'hover:text-slate-800'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${liked ? 'fill-amber-600' : ''}`} />
                      <span>{likeTotal}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                      {item.fileName}
                    </span>

                    <button
                      onClick={() => handleDownload(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isDownloaded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-amber-300'
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
