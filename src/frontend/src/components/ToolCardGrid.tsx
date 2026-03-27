'use client';

import { Dispatch } from 'react';
import { ToolCard as ToolCardType } from '@/types';
import { AppAction } from '@/state/reducer';
import ToolCard from './ToolCard';

interface Props {
  toolCards: ToolCardType[];
  sessionToken: string | null;
  dispatch: Dispatch<AppAction>;
}

export default function ToolCardGrid({ toolCards, sessionToken, dispatch }: Props) {
  const enabledCount = toolCards.filter((c) => c.enabled).length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 px-4 py-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Review Tools</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {enabledCount} of {toolCards.length} tools enabled
            </p>
          </div>
          <button
            onClick={() => dispatch({ type: 'PROCEED_TO_DOWNLOAD' })}
            disabled={enabledCount === 0}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Continue to Download
          </button>
        </div>

        {/* Cards */}
        {toolCards.map((card) => (
          <ToolCard
            key={card.id}
            card={card}
            sessionToken={sessionToken}
            dispatch={dispatch}
          />
        ))}
      </div>
    </div>
  );
}
