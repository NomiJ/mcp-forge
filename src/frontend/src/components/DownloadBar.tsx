'use client';

import { Dispatch } from 'react';
import { ToolCard, SpecMetadata } from '@/types';
import { AppAction } from '@/state/reducer';

interface Props {
  toolCards: ToolCard[];
  metadata: SpecMetadata;
  dispatch: Dispatch<AppAction>;
}

// TODO: implement download bar
// - Framework selector (FastMCP only in MVP)
// - Download button: calls POST /api/v1/generate, triggers file download
// - Show count of enabled tools included in output
export default function DownloadBar({ toolCards, metadata: _metadata, dispatch: _dispatch }: Props) {
  const enabledCount = toolCards.filter((c) => c.enabled).length;

  return (
    <div>
      <span>{enabledCount} tools selected</span>
      <button disabled>Download MCP Server (not yet implemented)</button>
    </div>
  );
}
