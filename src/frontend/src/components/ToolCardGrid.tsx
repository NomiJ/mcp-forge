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

// TODO: render one ToolCard per endpoint
// Show count of enabled vs total cards
export default function ToolCardGrid({ toolCards, sessionToken, dispatch }: Props) {
  return (
    <div>
      {toolCards.map((card) => (
        <ToolCard
          key={card.id}
          card={card}
          sessionToken={sessionToken}
          dispatch={dispatch}
        />
      ))}
    </div>
  );
}
