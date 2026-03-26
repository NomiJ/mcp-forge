'use client';

import { Dispatch } from 'react';
import { ToolCard as ToolCardType } from '@/types';
import { AppAction } from '@/state/reducer';

interface Props {
  card: ToolCardType;
  sessionToken: string | null;
  dispatch: Dispatch<AppAction>;
}

// TODO: implement full card UI
// - Inline-editable tool name (dispatches UPDATE_TOOL_NAME)
// - Inline-editable description (dispatches UPDATE_DESCRIPTION)
// - Quality indicator badge (green/yellow/red)
// - Parameters list with types and required markers
// - LLM preview panel (shows card.llmPreview)
// - Toggle switch (dispatches TOGGLE_CARD)
// - AI rewrite button: calls POST /api/v1/rewrite, dispatches REWRITE_SUCCESS on accept
export default function ToolCard({ card, sessionToken: _sessionToken, dispatch: _dispatch }: Props) {
  return (
    <div>
      <span>{card.qualityScore}</span>
      <strong>{card.toolName}</strong>
      <span>{card.method} {card.path}</span>
      <p>{card.description}</p>
    </div>
  );
}
