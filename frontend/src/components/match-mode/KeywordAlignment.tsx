import React, { useState } from 'react';
import { Key, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { KeywordAlignmentItem } from './types';

interface KeywordAlignmentProps {
  keywords: KeywordAlignmentItem[];
}

export const KeywordAlignment: React.FC<KeywordAlignmentProps> = ({ keywords }) => {
  const [filter, setFilter] = useState<'all' | 'found' | 'weak' | 'missing'>('all');

  const filtered = keywords.filter((k) => {
    if (filter === 'all') return true;
    return k.status === filter;
  });

  return (
    <div className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            Keyword Alignment & ATS Scanning
          </h3>
          <p className="text-xs text-[#8A8A8A] mt-0.5">
            Applicant Tracking Systems (ATS) scan for these exact phrases and terminology frequency
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-[#141414] border border-white/5 rounded-xl self-start sm:self-auto text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filter === 'all' ? 'bg-white/15 text-white' : 'text-[#888888] hover:text-white'
            }`}
          >
            All ({keywords.length})
          </button>
          <button
            onClick={() => setFilter('missing')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              filter === 'missing'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-[#888888] hover:text-rose-400'
            }`}
          >
            <XCircle className="w-3 h-3" />
            Missing
          </button>
          <button
            onClick={() => setFilter('weak')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              filter === 'weak'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-[#888888] hover:text-amber-400'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            Low / Weak
          </button>
          <button
            onClick={() => setFilter('found')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              filter === 'found'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-[#888888] hover:text-emerald-400'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            Found
          </button>
        </div>
      </div>

      {/* Table-like responsive list */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-mono uppercase tracking-wider text-[#777777]">
              <th className="pb-3 font-semibold">Target Keyword</th>
              <th className="pb-3 font-semibold text-center">JD Count</th>
              <th className="pb-3 font-semibold text-center">Resume Status</th>
              <th className="pb-3 font-semibold">Why It Matters</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {filtered.map((item) => {
              return (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{item.keyword}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/5 text-[#B0B0B0] border border-white/5">
                      {item.jdFrequency}x
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.status === 'found' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" />
                        Found ({item.resumeFrequency}x)
                      </span>
                    )}
                    {item.status === 'weak' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        <AlertCircle className="w-3 h-3" />
                        Low ({item.resumeFrequency}x)
                      </span>
                    )}
                    {item.status === 'missing' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                        <XCircle className="w-3 h-3" />
                        Missing (0x)
                      </span>
                    )}
                  </td>
                  <td className="py-3 pl-4 text-xs text-[#9E9E9E] max-w-md">
                    {item.whyItMatters}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
