import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

interface HumanVerificationProps {
  onVerifyChange: (verified: boolean) => void;
  honeypotValue: string;
  onHoneypotChange: (val: string) => void;
}

export const HumanVerification: React.FC<HumanVerificationProps> = ({
  onVerifyChange,
  honeypotValue,
  onHoneypotChange,
}) => {
  const [challenge, setChallenge] = useState<{ a: number; b: number }>(() => ({
    a: Math.floor(2 + Math.random() * 8),
    b: Math.floor(1 + Math.random() * 9),
  }));
  const [answer, setAnswer] = useState('');

  const regenerate = () => {
    setChallenge({
      a: Math.floor(2 + Math.random() * 8),
      b: Math.floor(1 + Math.random() * 9),
    });
    setAnswer('');
    onVerifyChange(false);
  };

  useEffect(() => {
    const expected = challenge.a + challenge.b;
    const numeric = Number(answer.trim());
    onVerifyChange(answer.trim() !== '' && Number.isFinite(numeric) && numeric === expected);
  }, [answer, challenge, onVerifyChange]);

  const isSolved = answer.trim() !== '' && Number(answer.trim()) === challenge.a + challenge.b;

  return (
    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
      {/* Hidden Honeypot Trap for Automated Bots */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="wds_website_hp">Leave this field blank</label>
        <input
          id="wds_website_hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypotValue}
          onChange={(e) => onHoneypotChange(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
          <ShieldCheck
            className={`w-4 h-4 ${isSolved ? 'text-emerald-600' : 'text-amber-600'}`}
          />
          <span>Human Verification Challenge *</span>
        </span>
        <button
          type="button"
          onClick={regenerate}
          className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          title="Generate new challenge"
        >
          <RefreshCw className="w-3 h-3" /> New Check
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <label className="text-xs text-slate-700 font-medium">
          To prevent spam, what is{' '}
          <strong className="font-mono text-slate-900">
            {challenge.a} + {challenge.b}
          </strong>
          ?
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            required
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Answer"
            className={`w-24 px-3 py-1.5 rounded-xl border text-xs font-mono bg-white focus:outline-none focus:ring-2 ${
              isSolved
                ? 'border-emerald-400 focus:ring-emerald-500 text-emerald-800 font-bold'
                : 'border-slate-300 focus:ring-amber-500'
            }`}
          />
          {isSolved && (
            <span className="text-[11px] font-semibold text-emerald-700">Verified</span>
          )}
        </div>
      </div>
    </div>
  );
};
