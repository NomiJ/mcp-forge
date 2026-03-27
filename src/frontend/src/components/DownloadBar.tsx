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

async function fetchGeneratedSource(
  toolCards: ToolCard[],
  metadata: SpecMetadata,
): Promise<{ text: string; filename: string }> {
  const res = await fetch(`${API_URL}/api/v1/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolCards, metadata, options: { framework: 'fastmcp' } }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? 'Code generation failed.');
  }
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match ? match[1] : 'mcp_server.py';
  const text = await res.text();
  return { text, filename };
}

export default function DownloadBar({ toolCards, metadata, dispatch }: Props) {
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState('');
  const [downloaded, setDownloaded] = useState(false);
  const [previewSource, setPreviewSource] = useState('');
  const [previewFilename, setPreviewFilename] = useState('');

  const enabledCount = toolCards.filter((c) => c.enabled).length;

  async function handleDownload() {
    setError('');
    setLoading(true);
    try {
      const { text, filename } = await fetchGeneratedSource(toolCards, metadata);
      const blob = new Blob([text], { type: 'text/x-python' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      dispatch({ type: 'PROCEED_TO_DOWNLOAD' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePreview() {
    setError('');
    setPreviewing(true);
    try {
      const { text, filename } = await fetchGeneratedSource(toolCards, metadata);
      setPreviewSource(text);
      setPreviewFilename(filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setPreviewing(false);
    }
  }

  return (
    <>
      {/* Preview modal */}
      {previewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setPreviewing(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 shrink-0">
              <span className="text-sm font-medium text-gray-300 font-mono">{previewFilename}</span>
              <button
                onClick={() => setPreviewing(false)}
                className="text-gray-500 hover:text-gray-300 text-lg leading-none transition-colors"
              >
                ✕
              </button>
            </div>
            {/* Code */}
            <pre className="overflow-auto flex-1 p-5 text-xs text-gray-300 font-mono leading-relaxed whitespace-pre">
              {previewSource}
            </pre>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-20">
        {/* Gradient fade */}
        <div className="h-8 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none" />

        <div className="bg-gray-900/95 backdrop-blur-md border-t border-gray-800 px-4 py-4">
          <div className="max-w-3xl mx-auto">
            {error && (
              <div className="mb-3 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-4 py-2.5">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              {/* Left: metadata */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-white truncate">{metadata.title}</span>
                  <span className="text-xs text-gray-600 shrink-0">{metadata.version}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                  <span>{enabledCount} tool{enabledCount !== 1 ? 's' : ''} · FastMCP · Python</span>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => dispatch({ type: 'RESET' })}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  Start over
                </button>

                <button
                  onClick={handlePreview}
                  disabled={loading || enabledCount === 0}
                  className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Preview
                </button>

                <button
                  onClick={handleDownload}
                  disabled={loading || enabledCount === 0}
                  className={`inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all ${
                    downloaded
                      ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20'
                      : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-gray-800 disabled:text-gray-600 text-white shadow-lg shadow-indigo-600/20 disabled:shadow-none'
                  }`}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Generating…
                    </>
                  ) : downloaded ? (
                    <>✓ Download again</>
                  ) : (
                    <>⬇ Download MCP Server</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
