'use client';

import { Dispatch, useState } from 'react';
import { ToolCard as ToolCardType, QualityScore } from '@/types';
import { AppAction } from '@/state/reducer';

interface Props {
  card: ToolCardType;
  sessionToken: string | null;
  dispatch: Dispatch<AppAction>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const qualityStyles: Record<QualityScore, { badge: string; border: string }> = {
  green:  { badge: 'bg-green-500/20 text-green-400',  border: 'border-green-500/30' },
  yellow: { badge: 'bg-yellow-500/20 text-yellow-400', border: 'border-yellow-500/30' },
  red:    { badge: 'bg-red-500/20 text-red-400',       border: 'border-red-500/30' },
};

const methodColors: Record<string, string> = {
  GET:    'bg-blue-500/20 text-blue-400',
  POST:   'bg-green-500/20 text-green-400',
  PUT:    'bg-yellow-500/20 text-yellow-400',
  PATCH:  'bg-orange-500/20 text-orange-400',
  DELETE: 'bg-red-500/20 text-red-400',
};

export default function ToolCard({ card, sessionToken, dispatch }: Props) {
  const [rewriting, setRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const styles = qualityStyles[card.qualityScore];

  async function handleRewrite() {
    setRewriteError('');
    setRewriting(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          toolCardId: card.id,
          currentToolName: card.toolName,
          currentDescription: card.description,
          method: card.method,
          path: card.path,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? 'Rewrite failed.');
      }
      const data = await res.json();
      dispatch({ type: 'REWRITE_SUCCESS', id: card.id, toolName: data.toolName, description: data.description });
    } catch (err) {
      setRewriteError(err instanceof Error ? err.message : 'Rewrite failed.');
    } finally {
      setRewriting(false);
    }
  }

  return (
    <div className={`bg-gray-900 border rounded-xl p-5 flex flex-col gap-4 ${styles.border} ${!card.enabled ? 'opacity-50' : ''}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${methodColors[card.method] ?? 'bg-gray-700 text-gray-300'}`}>
            {card.method}
          </span>
          <span className="text-xs font-mono text-gray-500 truncate">{card.path}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles.badge}`}>
            {card.qualityScore}
          </span>
        </div>

        {/* Toggle */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_CARD', id: card.id })}
          className={`shrink-0 w-10 h-5 rounded-full transition-colors ${card.enabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
          aria-label={card.enabled ? 'Disable tool' : 'Enable tool'}
        >
          <span className={`block w-4 h-4 bg-white rounded-full mx-0.5 transition-transform ${card.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Editable tool name */}
      <input
        type="text"
        value={card.toolName}
        onChange={(e) => dispatch({ type: 'UPDATE_TOOL_NAME', id: card.id, toolName: e.target.value })}
        className="bg-transparent border-b border-gray-700 focus:border-indigo-500 outline-none text-sm font-semibold text-white py-0.5 w-full"
        disabled={!card.enabled}
      />

      {/* Editable description */}
      <textarea
        value={card.description}
        onChange={(e) => dispatch({ type: 'UPDATE_DESCRIPTION', id: card.id, description: e.target.value })}
        rows={2}
        className="bg-transparent border border-gray-800 focus:border-indigo-500 outline-none text-sm text-gray-300 rounded-lg p-2 w-full resize-none"
        disabled={!card.enabled}
      />

      {/* Parameters */}
      {card.parameters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {card.parameters.map((p) => (
            <span key={p.name} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono">
              {p.name}
              {p.required && <span className="text-red-400 ml-0.5">*</span>}
              <span className="text-gray-600 ml-1">{p.type}</span>
            </span>
          ))}
        </div>
      )}

      {/* LLM preview + AI rewrite */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setShowPreview((v) => !v)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {showPreview ? 'Hide' : 'Show'} LLM preview
        </button>

        <div className="flex items-center gap-2">
          {rewriteError && <span className="text-xs text-red-400">{rewriteError}</span>}
          <button
            onClick={handleRewrite}
            disabled={rewriting || !card.enabled || !sessionToken}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-3 py-1 rounded-lg transition-colors"
          >
            {rewriting ? 'Rewriting…' : 'AI Rewrite'}
          </button>
        </div>
      </div>

      {showPreview && (
        <pre className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-400 whitespace-pre-wrap font-mono">
          {card.llmPreview}
        </pre>
      )}
    </div>
  );
}
