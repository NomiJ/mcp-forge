'use client';

import { Dispatch, useState, useRef } from 'react';
import { AppAction } from '@/state/reducer';

interface Props {
  dispatch: Dispatch<AppAction>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export default function SpecInputPage({ dispatch }: Props) {
  const [mode, setMode] = useState<'url' | 'base' | 'file'>('url');
  const [specUrl, setSpecUrl] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    setFileContent(text);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let resolvedSpecUrl = specUrl.trim();

      // Auto-discover spec URL from base URL
      if (mode === 'base') {
        const discoverRes = await fetch(`${API_URL}/api/v1/discover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseUrl: baseUrl.trim() }),
        });
        if (!discoverRes.ok) {
          const body = await discoverRes.json().catch(() => ({}));
          throw new Error(body.detail ?? 'Could not find a spec at that URL.');
        }
        const discovered = await discoverRes.json();
        resolvedSpecUrl = discovered.specUrl;
      }

      // Build parse request body
      const parseBody: Record<string, string> =
        mode === 'file'
          ? { specContent: fileContent }
          : { specUrl: resolvedSpecUrl };

      const parseRes = await fetch(`${API_URL}/api/v1/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parseBody),
      });

      if (!parseRes.ok) {
        const body = await parseRes.json().catch(() => ({}));
        throw new Error(body.detail ?? 'Failed to parse spec.');
      }

      const data = await parseRes.json();
      dispatch({
        type: 'PARSE_SUCCESS',
        payload: {
          metadata: data.metadata,
          toolCards: data.toolCards,
          sessionToken: data.sessionToken,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    !loading &&
    ((mode === 'url' && specUrl.trim()) ||
      (mode === 'base' && baseUrl.trim()) ||
      (mode === 'file' && fileContent));

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-2 text-white">MCPForge</h1>
        <p className="text-gray-400 mb-8">
          Convert a REST API spec into a production-ready MCP server.
        </p>

        {/* Mode tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-lg">
          {(['url', 'base', 'file'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                mode === m
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {m === 'url' && 'Spec URL'}
              {m === 'base' && 'Server URL'}
              {m === 'file' && 'Upload File'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'url' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                OpenAPI / Swagger spec URL
              </label>
              <input
                type="url"
                value={specUrl}
                onChange={(e) => setSpecUrl(e.target.value)}
                placeholder="https://api.example.com/openapi.json"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {mode === 'base' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Base server URL — we&apos;ll find the spec
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {mode === 'file' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                JSON or YAML spec file
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className="w-full bg-gray-900 border border-dashed border-gray-700 rounded-lg px-4 py-8 text-sm text-gray-500 text-center cursor-pointer hover:border-indigo-500 transition-colors"
              >
                {fileName || 'Click to choose a file'}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Parsing...' : 'Generate MCP Server'}
          </button>
        </form>
      </div>
    </div>
  );
}
