'use client';

import { Dispatch } from 'react';
import { ToolCard as ToolCardType } from '@/types';
import { AppAction } from '@/state/reducer';
import ToolCard from './ToolCard';

interface Props {
  toolCards: ToolCardType[];
  dispatch: Dispatch<AppAction>;
}

export default function ToolCardGrid({ toolCards, dispatch }: Props) {
  const enabledCount = toolCards.filter((c) => c.enabled).length;
  const total = toolCards.length;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/60 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">Review Tools</h1>
              <p className="text-xs text-gray-500">
                <span className="text-indigo-400 font-medium">{enabledCount}</span>
                <span className="text-gray-600"> / {total} enabled</span>
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="hidden sm:flex flex-1 max-w-xs items-center gap-2">
            <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${total ? (enabledCount / total) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-gray-600 tabular-nums w-8 text-right">
              {total ? Math.round((enabledCount / total) * 100) : 0}%
            </span>
          </div>

        </div>
      </div>

      {/* Cards */}
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4 pb-32">
        {toolCards.map((card) => (
          <ToolCard
            key={card.id}
            card={card}
            dispatch={dispatch}
          />
        ))}
      </div>
    </div>
  );
}
