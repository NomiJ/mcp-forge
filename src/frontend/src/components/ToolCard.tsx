'use client';

import { Dispatch, useState } from 'react';
import { ToolCard as ToolCardType, QualityScore } from '@/types';
import { AppAction } from '@/state/reducer';

interface Props {
  card: ToolCardType;
  sessionToken: string | null;
  dispatch: Dispatch<AppAction>;
}

const qualityConfig: Record<QualityScore, { dot: string }> = {
  green:  { dot: 'bg-green-400' },
  yellow: { dot: 'bg-yellow-400' },
  red:    { dot: 'bg-red-400' },
};

const methodStyle: Record<string, string> = {
  GET:    'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
  POST:   'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  PUT:    'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  PATCH:  'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30',
  DELETE: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
};

export default function ToolCard({ card, dispatch }: Omit<Props, 'sessionToken'> & { sessionToken?: string | null }) {
  const [showPreview, setShowPreview] = useState(false);
  const quality = qualityConfig[card.qualityScore];

  return (
    <div className={`group relative bg-gray-900 border rounded-2xl overflow-hidden transition-all duration-200 ${
      card.enabled
        ? 'border-gray-800 hover:border-gray-700'
        : 'border-gray-800/50 opacity-50'
    }`}>
      {/* Left accent bar by quality */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${
        card.qualityScore === 'green' ? 'bg-green-500' :
        card.qualityScore === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
      }`} />

      <div className="p-5 pl-6">
        {/* Top row: method + path + quality + toggle */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`shrink-0 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg ${methodStyle[card.method] ?? 'bg-gray-700 text-gray-300'}`}>
              {card.method}
            </span>
            <span className="text-xs font-mono text-gray-500 truncate">{card.path}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Quality dot */}
            <span className={`hidden sm:block w-2 h-2 rounded-full ${quality.dot}`} />

            {/* Toggle */}
            <button
              onClick={() => dispatch({ type: 'TOGGLE_CARD', id: card.id })}
              aria-label={card.enabled ? 'Disable' : 'Enable'}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                card.enabled ? 'bg-indigo-600' : 'bg-gray-700'
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                card.enabled ? 'translate-x-4' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* Tool name */}
        <input
          type="text"
          value={card.toolName}
          onChange={(e) => dispatch({ type: 'UPDATE_TOOL_NAME', id: card.id, toolName: e.target.value })}
          disabled={!card.enabled}
          className="w-full bg-transparent text-sm font-semibold text-white font-mono placeholder-gray-600 border-b border-transparent hover:border-gray-700 focus:border-indigo-500 focus:outline-none py-0.5 mb-3 transition-colors disabled:cursor-not-allowed"
        />

        {/* Description */}
        <textarea
          value={card.description}
          onChange={(e) => dispatch({ type: 'UPDATE_DESCRIPTION', id: card.id, description: e.target.value })}
          disabled={!card.enabled}
          rows={2}
          className="w-full bg-gray-800/50 border border-gray-700/50 hover:border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none rounded-xl px-3 py-2 text-xs text-gray-400 resize-none transition-all disabled:cursor-not-allowed mb-3"
        />

        {/* Parameters */}
        {card.parameters.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {card.parameters.map((p) => (
              <span
                key={p.name}
                className="inline-flex items-center gap-1 text-xs bg-gray-800 border border-gray-700/60 text-gray-400 px-2 py-0.5 rounded-lg font-mono"
              >
                {p.required && <span className="text-red-400 text-xs">*</span>}
                <span className="text-gray-300">{p.name}</span>
                <span className="text-gray-600">:{p.type}</span>
              </span>
            ))}
          </div>
        )}

        {/* Footer: LLM preview */}
        <div className="pt-3 border-t border-gray-800">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1"
          >
            <span>{showPreview ? '▲' : '▼'}</span>
            LLM preview
          </button>
        </div>

        {/* LLM preview panel */}
        {showPreview && (
          <pre className="mt-3 bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-gray-500 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
            {card.llmPreview}
          </pre>
        )}
      </div>
    </div>
  );
}
