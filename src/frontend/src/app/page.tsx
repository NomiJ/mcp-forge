'use client';

import { useReducer } from 'react';
import { reducer, initialState } from '@/state/reducer';
import SpecInputPage from '@/components/SpecInputPage';
import ToolCardGrid from '@/components/ToolCardGrid';
import DownloadBar from '@/components/DownloadBar';

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <main>
      {state.step === 'input' && (
        <SpecInputPage dispatch={dispatch} />
      )}

      {state.step !== 'input' && state.metadata && (
        <>
          <ToolCardGrid
            toolCards={state.toolCards}
            dispatch={dispatch}
          />
          <DownloadBar
            toolCards={state.toolCards}
            metadata={state.metadata}
            dispatch={dispatch}
          />
        </>
      )}
    </main>
  );
}
