import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { OLAG_CLASSES } from '../utils/validation';
import { X, PenLine, CheckCircle2, Trash2 } from 'lucide-react';

interface VisitorInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VisitorInfoModal: React.FC<VisitorInfoModalProps> = ({ isOpen, onClose }) => {
  const { visitorPrefs, saveVisitorPrefs, clearVisitorPrefs } = useAuth();
  const [name, setName] = useState(visitorPrefs.displayName || '');
  const [classGroup, setClassGroup] = useState(visitorPrefs.authorClass || OLAG_CLASSES[0]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(visitorPrefs.displayName || '');
      setClassGroup(visitorPrefs.authorClass || OLAG_CLASSES[0]);
      setSaved(false);
    }
  }, [isOpen, visitorPrefs]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveVisitorPrefs(name, classGroup);
    setSaved(true);
    setTimeout(() => onClose(), 650);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <PenLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-crest font-bold text-base">Optional Contributor Byline</h3>
              <p className="text-[11px] text-slate-300">No account or login required</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Set an optional display name and OLAG class so forms pre-fill automatically in this browser tab. This creates <strong>no user account</strong> — you can still submit anonymously anytime.
          </p>

          {saved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Byline preference saved for this session.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Preferred Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ama Serwaa"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">OLAG Class</label>
            <select
              value={classGroup}
              onChange={(e) => setClassGroup(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
            >
              {OLAG_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            {visitorPrefs.displayName ? (
              <button
                type="button"
                onClick={() => {
                  clearVisitorPrefs();
                  onClose();
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Byline
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs cursor-pointer"
              >
                Save Byline
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
