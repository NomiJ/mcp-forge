'use client';

import { Dispatch, useState } from 'react';
import { ToolCard, SpecMetadata } from '@/types';
import { AppAction } from '@/state/reducer';

interface Props {
  toolCards: ToolCard[];
  metadata: SpecMetadata;
  dispatch: Dispatch<AppAction>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export default function DownloadBar({ toolCards, metadata, dispatch }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const enabledCount = toolCards.filter((c) => c.enabled).length;

  async function handleDownload() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolCards,
          metadata,
          options: { framework: 'fastmcp' },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? 'Code generation failed.');
      }

      // Derive filename from Content-Disposition or fallback
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : 'mcp_server.py';

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      dispatch({ type: 'PROCEED_TO_DOWNLOAD' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-4 py-4">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-white font-medium">
            {enabledCount} tool{enabledCount !== 1 ? 's' : ''} selected
          </p>
          <p className="text-xs text-gray-500">FastMCP · Python</p>
        </div>

        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-400">{error}</span>}
          <button
            onClick={handleDownload}
            disabled={loading || enabledCount === 0}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Generating…' : 'Download MCP Server'}
          </button>
          <button
            onClick={() => dispatch({ type: 'RESET' })}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}
