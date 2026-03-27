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

      const parseBody: Record<string, string> =
        mode === 'file'
          ? {
              specContent: fileContent,
              specFormat: fileName.endsWith('.json') ? 'json' : 'yaml',
            }
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

  const tabs = [
    { id: 'url' as const, label: 'Spec URL' },
    { id: 'base' as const, label: 'Server URL' },
    { id: 'file' as const, label: 'Upload File' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-800/60 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-white tracking-tight">MCPForge</span>
          <span className="ml-2 text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-medium">beta</span>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs bg-gray-800 border border-gray-700 text-gray-400 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
              OpenAPI 3.x · Swagger 2.x · JSON · YAML
            </span>
          </div>

          <h1 className="text-4xl font-bold text-center text-white mb-3 tracking-tight">
            API spec to MCP server<br />
            <span className="text-indigo-400">in seconds</span>
          </h1>
          <p className="text-center text-gray-500 mb-10 text-sm leading-relaxed">
            Paste your OpenAPI spec, customize the generated tools, and download a<br />
            production-ready Python MCP server.
          </p>

          {/* Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl shadow-black/40">
            {/* Mode tabs */}
            <div className="flex gap-1 mb-6 bg-gray-800/60 p-1 rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setMode(tab.id); setError(''); }}
                  className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${
                    mode === tab.id
                      ? 'bg-gray-700 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === 'url' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Spec URL
                  </label>
                  <input
                    type="url"
                    value={specUrl}
                    onChange={(e) => setSpecUrl(e.target.value)}
                    placeholder="https://api.example.com/openapi.json"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
              )}

              {mode === 'base' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Base Server URL
                  </label>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.example.com"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  />
                  <p className="text-xs text-gray-600">We&apos;ll probe standard paths to find your spec automatically.</p>
                </div>
              )}

              {mode === 'file' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    JSON or YAML File
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`w-full bg-gray-800 border-2 border-dashed rounded-xl px-4 py-10 text-sm text-center cursor-pointer transition-all ${
                      fileName
                        ? 'border-indigo-500/50 text-indigo-400'
                        : 'border-gray-700 text-gray-600 hover:border-gray-600 hover:text-gray-400'
                    }`}
                  >
                    {fileName ? (
                      <span className="flex flex-col items-center gap-1">
                        <span className="text-2xl">📄</span>
                        <span className="font-medium">{fileName}</span>
                        <span className="text-xs text-gray-500">Click to change</span>
                      </span>
                    ) : (
                      <span className="flex flex-col items-center gap-2">
                        <span className="text-2xl">⬆️</span>
                        <span>Click to choose a file</span>
                        <span className="text-xs text-gray-700">.json, .yaml, .yml</span>
                      </span>
                    )}
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
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  <span>⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-lg shadow-indigo-600/20 disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Parsing spec…
                  </span>
                ) : (
                  'Generate MCP Server →'
                )}
              </button>
            </form>
          </div>

          {/* Footer hint */}
          <p className="text-center text-xs text-gray-700 mt-6">
            Generated code runs with FastMCP · Python 3.10+
          </p>
        </div>
      </div>
    </div>
  );
}
